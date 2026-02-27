import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import spotifyWebApi from 'spotify-web-api-node';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/refresh', (req, res) => {
  const refreshToken = req.body.refreshToken;

  const spotifyApi = new spotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: refreshToken,
  });

  spotifyApi
    .refreshAccessToken()
    .then((data: any) => {
      res.json({
        accessToken: data.body.access_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch((err: any) => {
      console.log('REFRESH TOKEN error: ', err);
      res.sendStatus(400);
    });
});

app.post('/login', (req, res) => {
  const code = req.body.code;

  const spotifyApi = new spotifyWebApi({
    redirectUri: process.env.REDIRECT_URI,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
  });

  spotifyApi
    .authorizationCodeGrant(code)
    .then((data: any) => {
      res.json({
        accessToken: data.body.access_token,
        refreshToken: data.body.refresh_token,
        expiresIn: data.body.expires_in,
      });
    })
    .catch((err: any) => {
      console.log('LOGIN ROUTE error: ', err);
      res.sendStatus(400);
    });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀🚀🚀 Server running on port ${PORT} 🚀 🚀 🚀 `);
});
