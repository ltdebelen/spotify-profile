import SpotifyPlayer from 'react-spotify-web-playback';

type PlayerProps = {
  accessToken: string | null;
  trackUri: string;
};

const Player = ({ accessToken, trackUri }: PlayerProps) => {
  if (!accessToken) return null;

  return (
    <SpotifyPlayer
      token={accessToken}
      uris={trackUri ? [trackUri] : []}
      styles={{
        bgColor: '#020617', // slate-950
        color: '#e5e7eb', // slate-200
        sliderColor: '#22c55e', // green-500
        trackArtistColor: '#9ca3af',
        trackNameColor: '#f9fafb',
      }}
    />
  );
};

export default Player;
