import { Button } from './components/ui/button';

const Login = () => {
  const AUTH_URL =
    `https://accounts.spotify.com/authorize?client_id=${import.meta.env.VITE_SPOTIFY_CLIENT_ID}` +
    `&response_type=code&redirect_uri=${encodeURIComponent(import.meta.env.VITE_SPOTIFY_REDIRECT_URI)}` +
    `&scope=streaming%20user-modify-playback-state%20user-library-read%20user-library-modify%20user-read-playback-state%20user-read-email%20user-read-private`;

  return (
    <div className='flex flex-col h-screen items-center justify-center'>
      <h1 className='mb-10 text-4xl font-bold'>Spotify Profile</h1>
      <Button asChild size='lg'>
        <a href={AUTH_URL}>Login with Spotify</a>
      </Button>
    </div>
  );
};

export default Login;
