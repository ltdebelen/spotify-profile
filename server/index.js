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

/* ------------------------
   POST /login
------------------------ */
app.post('/login', (req, res) => {
  const code = req.body.code;
  if (!code) return res.status(400).json({ error: 'Missing code' });

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

/* ------------------------
   POST /refresh
------------------------ */
app.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ error: 'Missing refreshToken' });

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

/* ------------------------
   GET /taste-profile
------------------------ */
app.get('/taste-profile', async (req, res) => {
  const tokenMatch = (req.headers.authorization || '').match(/^Bearer (.+)$/);

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

    const displayName = me.display_name || 'Spotify User';
    const avatarUrl = me.images?.[0]?.url || null;
    const country = me.country || 'Unknown';
    const product = me.product || 'free';

    const playlistsCount =
      typeof playlists.total === 'number'
        ? playlists.total
        : (playlists.items || []).length;

    const followedArtistsCount = followedArtistsPage?.artists?.total || 0;

    /* ---- Favorite Artists ---- */
    const favoriteArtists = topArtists.slice(0, 12).map((artist) => ({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images?.[0]?.url || '',
    }));

    /* ---- Top Tracks ---- */
    const topTracksMapped = topTracks.slice(0, 10).map((track, idx) => ({
      rank: idx + 1,
      title: track.name,
      artist: track.artists?.[0]?.name || 'Unknown artist',
      albumArt: track.album?.images?.[0]?.url || '',
      uri: track.uri,
    }));

    /* ---- Mood ---- */
    let audioFeatures = [];
    try {
      const trackIds = topTracks.map((t) => t.id).filter(Boolean);
      if (trackIds.length > 0) {
        const featuresRes =
          await spotifyApi.getAudioFeaturesForTracks(trackIds);
        audioFeatures = (featuresRes.body.audio_features || []).filter(Boolean);
      }
    } catch (_) {}

    const avg = (arr, key) =>
      arr.length
        ? arr.reduce((sum, f) => sum + (f[key] || 0), 0) / arr.length
        : 0;

    const mood = [
      { axis: 'Energetic', value: avg(audioFeatures, 'energy') },
      { axis: 'Happy', value: avg(audioFeatures, 'valence') },
      {
        axis: 'Chill',
        value:
          1 -
          avg(audioFeatures, 'energy') * 0.6 -
          avg(audioFeatures, 'danceability') * 0.4,
      },
      { axis: 'Danceable', value: avg(audioFeatures, 'danceability') },
      { axis: 'Melancholy', value: 1 - avg(audioFeatures, 'valence') },
    ].map((m) => ({ ...m, value: Math.max(0, Math.min(1, m.value)) }));

    /* ---- Listening Habits ---- */
    const bucketCounts = {
      Morning: 0,
      Afternoon: 0,
      Evening: 0,
      'Late Night': 0,
    };

    if (recent?.items) {
      recent.items.forEach((item) => {
        const hour = new Date(item.played_at).getHours();
        if (hour >= 5 && hour < 12) bucketCounts.Morning++;
        else if (hour >= 12 && hour < 17) bucketCounts.Afternoon++;
        else if (hour >= 17 && hour < 23) bucketCounts.Evening++;
        else bucketCounts['Late Night']++;
      });
    }

    const total = Object.values(bucketCounts).reduce((a, b) => a + b, 0) || 1;
    const listeningHabits = Object.entries(bucketCounts).map(([label, c]) => ({
      label,
      value: c / total,
    }));

    /* ---- Personality ---- */
    const habitMap = Object.fromEntries(
      listeningHabits.map((h) => [h.label, h.value]),
    );

    const night = (habitMap['Late Night'] || 0) + (habitMap['Evening'] || 0);
    const morning = habitMap['Morning'] || 0;
    const afternoon = habitMap['Afternoon'] || 0;

    const energetic =
      mood.find((m) => m.axis === 'Energetic')?.value +
      mood.find((m) => m.axis === 'Danceable')?.value;
    const chill = mood.find((m) => m.axis === 'Chill')?.value;
    const melancholy = mood.find((m) => m.axis === 'Melancholy')?.value;

    let listeningPersonality = {
      archetype: 'The Balanced Listener',
      summary:
        'You move through different moods and times of day without a single dominant pattern.',
      traits: [
        'Listens across multiple parts of the day',
        'Mix of upbeat and mellow tracks',
        'Comfortable jumping between different vibes',
      ],
    };

    // simple bias-based personality rules
    if (night > 0.55)
      listeningPersonality = {
        archetype: 'The Night Rider',
        summary:
          'Your listening peaks in the evenings and late nights, leaning into immersive music.',
        traits: [
          'Prefers evenings',
          'Likes focus/gaming music',
          'Enjoys quiet-hour listening',
        ],
      };

    if (morning > 0.45)
      listeningPersonality = {
        archetype: 'The Day Starter',
        summary: 'You lean on music to set the tone for your day.',
        traits: [
          'Morning listener',
          'Motivation via music',
          'Prefers steady uplifting tracks',
        ],
      };

    if (afternoon > 0.5)
      listeningPersonality = {
        archetype: 'The Midday Driver',
        summary: 'Music helps your productivity in the afternoon.',
        traits: [
          'Afternoon listener',
          'Focus or background music',
          'Energetic consistency',
        ],
      };

    if (energetic > 1.2 && night > 0.4)
      listeningPersonality = {
        archetype: 'The High-Energy Night Rider',
        summary: 'You gravitate toward energetic tracks later in the day.',
        traits: [
          'Loves upbeat tracks',
          'Night-based listener',
          'Great for drives/gaming',
        ],
      };

    if (chill > 0.6 && morning + afternoon > 0.4)
      listeningPersonality = {
        archetype: 'The Chill Navigator',
        summary: 'You favor smoother, laid-back sounds.',
        traits: ['Chill listener', 'Daytime music', 'Music as a comfort layer'],
      };

    if (melancholy > 0.5 && night > 0.3)
      listeningPersonality = {
        archetype: 'The Late-Night Reflector',
        summary: 'You’re drawn to emotional, reflective tracks.',
        traits: ['Night listener', 'Emotional tracks', 'Reflective mood'],
      };

    /* ---- Artist Momentum ---- */
    const recentArtistCounts = {};
    recent?.items?.forEach((item) => {
      const artists = item.track?.artists || [];
      artists.forEach((a) => {
        if (!a.name) return;
        recentArtistCounts[a.name] = (recentArtistCounts[a.name] || 0) + 1;
      });
    });

    const rideOrDie = [];
    const newObsessions = [];
    const quietFavorites = [];

    topArtists.forEach((artist, idx) => {
      const name = artist.name;
      const count = recentArtistCounts[name] || 0;

      if (idx < 5 && count >= 2) rideOrDie.push(name);
      else if (idx >= 5 && count >= 2) newObsessions.push(name);
      else if (idx < 10 && count === 0) quietFavorites.push(name);
    });

    const artistMomentum = [
      { label: 'Ride-or-Die Artists', artists: rideOrDie.slice(0, 6) },
      { label: 'New Obsessions', artists: newObsessions.slice(0, 6) },
      { label: 'Quiet Favorites', artists: quietFavorites.slice(0, 6) },
    ].filter((b) => b.artists.length > 0);

    res.json({
      displayName,
      avatarUrl,
      country,
      product,
      playlistsCount,
      followedArtistsCount,
      mood,
      favoriteArtists,
      topTracks: topTracksMapped,
      listeningHabits,
      listeningPersonality,
      artistMomentum,
    });
  } catch (err) {
    console.error('taste-profile error', err?.body || err);
    res.status(500).json({ error: 'Failed to build taste profile' });
  }
});

/* ------------------------
   GET /artist-info
   (ONLY RETURN spotifyURL + image)
------------------------ */
app.get('/artist-info', async (req, res) => {
  const tokenMatch = (req.headers.authorization || '').match(/^Bearer (.+)$/);

  if (!tokenMatch)
    return res.status(401).json({ error: 'Missing auth header' });

  const accessToken = tokenMatch[1];
  const artistId = req.query.id;

  if (!artistId) return res.status(400).json({ error: 'Missing artist id' });

  const spotifyApi = createSpotifyClient(accessToken);

  try {
    const artistRes = await spotifyApi.getArtist(artistId);
    const artist = artistRes.body;

    res.json({
      id: artist.id,
      name: artist.name,
      imageUrl: artist.images?.[0]?.url || '',
      spotifyUrl: artist.external_urls?.spotify || '',
    });
  } catch (err) {
    console.error('artist-info error', err?.body || err);
    res.status(500).json({ error: 'Failed to load artist info' });
  }
});

/* ------------------------
   Health Check
------------------------ */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});
