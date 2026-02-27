import { useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-node';
import useAuth from './useAuth';
import TrackSearchResult from './TrackSearchResult';
import Player from './Player';
import { Input } from './components/ui/input';

const spotifyApi = new SpotifyWebApi({
  clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
});

export type Track = {
  artist: string;
  title: string;
  uri: string;
  albumUrl: string;
};

const Dashboard = ({ code }: { code: string }) => {
  const accessToken = useAuth(code);

  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [playingTrack, setPlayingTrack] = useState<Track | null>(null);

  function chooseTrack(track: Track) {
    setPlayingTrack(track);
    setSearch('');
  }

  // set access token
  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  // search tracks
  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      return;
    }
    if (!accessToken) return;

    let cancel = false;

    spotifyApi
      .searchTracks(search, { limit: 10 })
      .then((res: any) => {
        if (cancel) return;

        const items = res.body.tracks?.items ?? [];

        const tracks: Track[] = items.map((track: any) => {
          const smallestAlbumImage = track.album.images.reduce(
            (smallest: any, image: any) => {
              if (image.height < smallest.height) return image;
              return smallest;
            },
            track.album.images[0],
          );

          return {
            artist: track.artists[0]?.name ?? 'Unknown artist',
            title: track.name,
            uri: track.uri,
            albumUrl: smallestAlbumImage.url,
          };
        });

        setSearchResults(tracks);
      })
      .catch((err: any) => {
        console.error('search error', err);
      });

    return () => {
      cancel = true;
    };
  }, [search, accessToken]);

  return (
    <div className='min-h-screen flex flex-col bg-slate-950 text-slate-50'>
      <div className='max-w-4xl w-full mx-auto px-4 pt-6 pb-28 space-y-4'>
        <header className='space-y-2'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Spotify Search
          </h1>
          <p className='text-sm text-slate-400'>
            Search for tracks and play them using your Spotify account.
          </p>
          <Input
            type='search'
            placeholder='Search for a song…'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </header>

        <section className='space-y-2'>
          {searchResults.map((track) => (
            <TrackSearchResult
              key={track.uri}
              track={track}
              chooseTrack={chooseTrack}
            />
          ))}
        </section>
      </div>

      <footer className='fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-900/90 backdrop-blur px-4 py-2'>
        <Player accessToken={accessToken} trackUri={playingTrack?.uri ?? ''} />
      </footer>
    </div>
  );
};

export default Dashboard;
