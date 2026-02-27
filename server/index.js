require('dotenv').config();
const express = require('express');
const cors = require('cors');
const SpotifyWebApi = require('spotify-web-api-node');

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  }),
);

const spotifyConfig = {
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
};

function createSpotifyClient(accessToken) {
  const spotifyApi = new SpotifyWebApi(spotifyConfig);
  spotifyApi.setAccessToken(accessToken);
  return spotifyApi;
}

// POST /login – exchange code for tokens
app.post('/login', (req, res) => {
  const code = req.body.code;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  const spotifyApi = new SpotifyWebApi(spotifyConfig);

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data) => {
      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch((err) => {
      console.error('login error', err?.body || err);
      res.sendStatus(400);
    });
});

// POST /refresh – refresh access token
app.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Missing refreshToken' });
  }

  const spotifyApi = new SpotifyWebApi({
    ...spotifyConfig,
    refreshToken,
  });

  spotifyApi
    .refreshAccessToken()
    .then((data) => {
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch((err) => {
      console.error('refresh error', err?.body || err);
      res.sendStatus(400);
    });
});

// GET /taste-profile – build a taste profile from Spotify
app.get('/taste-profile', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const tokenMatch = authHeader.match(/^Bearer (.+)$/);

  if (!tokenMatch) {
    return res
      .status(401)
      .json({ error: 'Missing or invalid Authorization header' });
  }

  const accessToken = tokenMatch[1];
  const spotifyApi = createSpotifyClient(accessToken);

  try {
    const [
      meRes,
      topArtistsRes,
      topTracksRes,
      playlistsRes,
      followedRes,
      recentRes,
    ] = await Promise.all([
      spotifyApi.getMe(),
      spotifyApi.getMyTopArtists({ limit: 20, time_range: 'medium_term' }),
      spotifyApi.getMyTopTracks({ limit: 20, time_range: 'medium_term' }),
      spotifyApi.getUserPlaylists({ limit: 50 }),
      spotifyApi.getFollowedArtists({ limit: 50 }),
      spotifyApi.getMyRecentlyPlayedTracks({ limit: 50 }).catch(() => null),
    ]);

    const me = meRes.body;
    const topArtists = topArtistsRes.body.items || [];
    const topTracks = topTracksRes.body.items || [];
    const playlists = playlistsRes.body;
    const followedArtistsPage = followedRes.body;
    const recent = recentRes ? recentRes.body : null;

    // Audio features for mood
    let audioFeatures = [];
    try {
      const trackIds = topTracks.map((t) => t.id).filter(Boolean);
      if (trackIds.length > 0) {
        const featuresRes =
          await spotifyApi.getAudioFeaturesForTracks(trackIds);
        audioFeatures = (featuresRes.body.audio_features || []).filter(Boolean);
      }
    } catch (err) {
      console.error('audio features error', err?.body || err);
    }

    const displayName = me.display_name || 'Spotify User';
    const avatarUrl = (me.images && me.images[0] && me.images[0].url) || null;
    const country = me.country || 'Unknown';
    const product = me.product || 'free';

    const playlistsCount =
      typeof playlists.total === 'number'
        ? playlists.total
        : (playlists.items || []).length;

    const followedArtistsCount = followedArtistsPage?.artists?.total || 0;

    // Genres from top artists
    const genreCounts = {};
    topArtists.forEach((artist) => {
      (artist.genres || []).forEach((g) => {
        const key = g.toLowerCase();
        genreCounts[key] = (genreCounts[key] || 0) + 1;
      });
    });

    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const maxGenreCount = sortedGenres[0]?.[1] || 1;

    const genres = sortedGenres.map(([name, count]) => ({
      name,
      weight: count / maxGenreCount,
    }));

    // Favorite artists
    const favoriteArtists = topArtists.slice(0, 12).map((artist) => ({
      name: artist.name,
      imageUrl: artist.images && artist.images[0] ? artist.images[0].url : '',
    }));

    // Top tracks (no uri field, to match your current type)
    const topTracksMapped = topTracks.slice(0, 10).map((track, idx) => ({
      rank: idx + 1,
      title: track.name,
      artist:
        track.artists && track.artists[0]
          ? track.artists[0].name
          : 'Unknown artist',
      albumArt:
        track.album && track.album.images && track.album.images[0]
          ? track.album.images[0].url
          : '',
    }));

    // Mood from audio features
    const average = (arr, key) =>
      arr.length
        ? arr.reduce((sum, f) => sum + (f[key] || 0), 0) / arr.length
        : 0;

    const avgEnergy = average(audioFeatures, 'energy');
    const avgValence = average(audioFeatures, 'valence');
    const avgDanceability = average(audioFeatures, 'danceability');

    const mood = [
      { axis: 'Energetic', value: avgEnergy },
      { axis: 'Happy', value: avgValence },
      {
        axis: 'Chill',
        value: 1 - avgEnergy * 0.6 - avgDanceability * 0.4,
      },
      { axis: 'Danceable', value: avgDanceability },
      {
        axis: 'Melancholy',
        value: 1 - avgValence,
      },
    ].map((m) => ({
      ...m,
      value: Math.max(0, Math.min(1, m.value || 0)),
    }));

    // Listening habits from recently played
    const bucketCounts = {
      Morning: 0,
      Afternoon: 0,
      Evening: 0,
      'Late Night': 0,
    };

    if (recent && Array.isArray(recent.items)) {
      recent.items.forEach((item) => {
        const playedAt = item.played_at;
        if (!playedAt) return;
        const hour = new Date(playedAt).getHours(); // 0–23 UTC

        if (hour >= 5 && hour < 12) bucketCounts.Morning += 1;
        else if (hour >= 12 && hour < 17) bucketCounts.Afternoon += 1;
        else if (hour >= 17 && hour < 23) bucketCounts.Evening += 1;
        else bucketCounts['Late Night'] += 1;
      });
    }

    const totalBuckets =
      bucketCounts.Morning +
        bucketCounts.Afternoon +
        bucketCounts.Evening +
        bucketCounts['Late Night'] || 1;

    const listeningHabits = Object.entries(bucketCounts).map(
      ([label, count]) => ({
        label,
        value: count / totalBuckets,
      }),
    );

    const tasteProfile = {
      displayName,
      avatarUrl,
      country,
      product,
      playlistsCount,
      followedArtistsCount,
      mood,
      genres,
      favoriteArtists,
      topTracks: topTracksMapped,
      listeningHabits,
    };

    res.json(tasteProfile);
  } catch (err) {
    console.error('taste-profile error', err?.body || err);
    res.status(500).json({ error: 'Failed to build taste profile' });
  }
});

// health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});
