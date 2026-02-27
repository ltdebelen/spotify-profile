import { SpotifyOutlined } from '@ant-design/icons';
import { Button } from './components/ui/button';
import { motion } from 'framer-motion';

const Login = () => {
  const AUTH_URL =
    'https://accounts.spotify.com/authorize' +
    `?client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}` +
    '&response_type=code' +
    `&redirect_uri=${encodeURIComponent(
      import.meta.env.VITE_SPOTIFY_REDIRECT_URI,
    )}` +
    '&scope=' +
    [
      'streaming',
      'user-modify-playback-state',
      'user-library-read',
      'user-read-playback-state',
      'user-read-email',
      'user-read-private',
      'user-top-read',
      'playlist-read-private',
      'user-follow-read',
      'user-read-recently-played',
    ].join('%20');

  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-950 text-slate-50'>
      <motion.div
        className='max-w-sm w-full text-center space-y-6 px-6 py-8 rounded-2xl bg-slate-900/70 backdrop-blur border border-slate-800'
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Spotify Icon centered */}
        <div className='flex justify-center'>
          <SpotifyOutlined className='text-6xl' />
        </div>

        {/* Title */}
        <div>
          <h1 className='text-5xl font-bold tracking-tight mb-4'>
            Spotify Profile
          </h1>
          <p className='text-lg text-slate-400 mt-1'>
            Connect your Spotify account to explore your music vibe.
          </p>
        </div>

        {/* Login Button */}
        <div>
          <Button
            size='lg'
            className='mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-50 cursor-pointer text-xl px-10'
            onClick={() => (window.location.href = AUTH_URL)}
          >
            Login with Spotify
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
