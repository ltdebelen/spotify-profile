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
      const status = err?.body?.error?.status;
      // Spotify is currently returning 403 for this endpoint on many apps.
      // We just ignore that case and fall back to neutral mood instead of spamming the console.
      if (status !== 403) {
        console.error('audio features error', err?.body || err);
      }
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

    // Favorite artists
    const favoriteArtists = topArtists.slice(0, 12).map((artist) => ({
      name: artist.name,
      imageUrl: artist.images && artist.images[0] ? artist.images[0].url : '',
    }));

    // Top tracks
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

    // Mood from audio features (falls back to neutral-ish if audioFeatures is empty)
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

    // --- Listening Personality ---
    const habitMap = {};
    listeningHabits.forEach((h) => {
      habitMap[h.label] = h.value;
    });

    const nightShare =
      (habitMap['Late Night'] || 0) + (habitMap['Evening'] || 0);
    const morningShare = habitMap['Morning'] || 0;
    const afternoonShare = habitMap['Afternoon'] || 0;

    const energeticScore =
      (mood.find((m) => m.axis === 'Energetic')?.value || 0) +
      (mood.find((m) => m.axis === 'Danceable')?.value || 0);
    const chillScore = mood.find((m) => m.axis === 'Chill')?.value || 0;
    const melancholyScore =
      mood.find((m) => m.axis === 'Melancholy')?.value || 0;

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

    if (nightShare > 0.55) {
      listeningPersonality = {
        archetype: 'The Night Rider',
        summary:
          'Your listening peaks in the evenings and late nights, leaning into immersive music when the world is quieter.',
        traits: [
          'Most listening happens in the evening or late night',
          'Music is a companion for focus, gaming, or winding down',
          nightShare > 0.7
            ? 'You thrive in late-night deep dives and long sessions'
            : 'You enjoy ending the day with music',
        ],
      };
    } else if (morningShare > 0.45) {
      listeningPersonality = {
        archetype: 'The Day Starter',
        summary:
          'You lean on music to set the tone for your day and keep momentum going.',
        traits: [
          'Frequent listening in the morning',
          'Music used to set mood and energy early',
          'Prefers steady, uplifting tracks to get moving',
        ],
      };
    } else if (afternoonShare > 0.5) {
      listeningPersonality = {
        archetype: 'The Midday Driver',
        summary:
          'You like music as a productivity boost or a backdrop while getting things done.',
        traits: [
          'Listening peaks in the afternoon',
          'Music used to maintain focus or energy',
          'Comfortable with repeat listens of familiar tracks',
        ],
      };
    }

    if (energeticScore > 1.2 && nightShare > 0.4) {
      listeningPersonality = {
        archetype: 'The High-Energy Night Rider',
        summary:
          'You gravitate toward upbeat, high-impact tracks, especially later in the day.',
        traits: [
          'Prefers energetic and danceable songs',
          'Evenings and nights are prime listening windows',
          'Great soundtrack selector for drives, games, and late-night work',
        ],
      };
    } else if (chillScore > 0.6 && morningShare + afternoonShare > 0.4) {
      listeningPersonality = {
        archetype: 'The Chill Navigator',
        summary:
          'You favor smoother, laid-back sounds that keep you moving without overwhelming the moment.',
        traits: [
          'Leans toward chill or low-key tracks',
          'Steady listening across daylight hours',
          'Enjoys music as a comfort layer rather than the main event',
        ],
      };
    } else if (melancholyScore > 0.5 && nightShare > 0.3) {
      listeningPersonality = {
        archetype: 'The Late-Night Reflector',
        summary:
          'You’re drawn to emotional, reflective tracks, especially when the day winds down.',
        traits: [
          'Often listens during evenings or late nights',
          'Music is a space for introspection and emotion',
          'Prefers songs with emotional weight or moodier production',
        ],
      };
    }

    // --- Artist Momentum ---

    const recentArtistCounts = {};
    if (recent && Array.isArray(recent.items)) {
      recent.items.forEach((item) => {
        const track = item.track;
        const artistsForTrack = (track?.artists || []).map((a) => a.name);
        artistsForTrack.forEach((name) => {
          if (!name) return;
          recentArtistCounts[name] = (recentArtistCounts[name] || 0) + 1;
        });
      });
    }

    const rideOrDie = [];
    const newObsessions = [];
    const quietFavorites = [];

    topArtists.forEach((artist, index) => {
      const name = artist.name;
      const plays = recentArtistCounts[name] || 0;

      if (!name) return;

      if (index < 5 && plays >= 2) {
        rideOrDie.push(name);
      } else if (index >= 5 && plays >= 2) {
        newObsessions.push(name);
      } else if (index < 10 && plays === 0) {
        quietFavorites.push(name);
      }
    });

    const artistMomentum = [
      {
        label: 'Ride-or-Die Artists',
        artists: rideOrDie.slice(0, 6),
      },
      {
        label: 'New Obsessions',
        artists: newObsessions.slice(0, 6),
      },
      {
        label: 'Quiet Favorites',
        artists: quietFavorites.slice(0, 6),
      },
    ].filter((bucket) => bucket.artists.length > 0);

    const tasteProfile = {
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
