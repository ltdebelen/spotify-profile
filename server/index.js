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

// health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`🚀 Server listening on http://localhost:${port}`);
});
