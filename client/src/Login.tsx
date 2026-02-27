import { Button } from './components/ui/button';

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
    ].join('%20');

  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-950 text-slate-50'>
      <div className='max-w-md w-full text-center space-y-4 px-4'>
        <h1 className='text-3xl font-semibold tracking-tight'>
          Spotify Profile
        </h1>
        <p className='text-slate-400'>
          Connect your Spotify account to search tracks and play them right in
          your browser.
        </p>

        <Button
          size='lg'
          className='mt-4'
          onClick={() => {
            window.location.href = AUTH_URL;
          }}
        >
          Login with Spotify
        </Button>
      </div>
    </div>
  );
};

export default Login;
