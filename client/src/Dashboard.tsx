import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import { Input } from '@/components/ui/input';
import SpotifyWebApi from 'spotify-web-api-node';
import TrackSearchResult from './TrackSearchResult';
import Player from './Player';
import axios from 'axios';

const spotifyApi = new SpotifyWebApi({
  clientId: '73b6186881114575932eb11e8dc82a0b',
});

const Dashboard = ({ code }: { code: string }) => {
  const accessToken = useAuth(code);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [playingTrack, setPlayingTrack] = useState();

  function chooseTrack(track) {
    setPlayingTrack(track);
    setSearch('');
  }

  useEffect(() => {
    if (!accessToken) return;
    spotifyApi.setAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!search) return setSearchResults([]);
    if (!accessToken) return;
    let cancel = false;

    spotifyApi.searchTracks(search, { limit: 10 }).then((res: any) => {
      if (cancel) return;
      setSearchResults(
        res.body.tracks.items.map((track) => {
          const smallestAlbumImage = track.album.images.reduce(
            (smallest, image) => {
              if (image.height < smallest.height) return image;
              return smallest;
            },
            track.album.images[0],
          );

          return {
            artist: track.artists[0].name,
            title: track.name,
            uri: track.uri,
            albumUrl: smallestAlbumImage.url,
          };
        }),
      );
    });

    return () => (cancel = true);
  }, [search, accessToken]);

  return (
    <div className='flex flex-col min-h-screen'>
      <div className='p-4'>
        <Input
          placeholder='Search Songs/Artists'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className='px-8'>
        {searchResults.map((track) => (
          <TrackSearchResult
            track={track}
            key={track.uri}
            chooseTrack={chooseTrack}
          />
        ))}
      </div>
      <div className='mt-auto w-full p-4 bg-gray-100 text-center'>
        <Player accessToken={accessToken} trackUri={playingTrack?.uri} />
      </div>
    </div>
  );
};

export default Dashboard;
