import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useAuth from './useAuth';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import SpotifyPlayer from 'react-spotify-web-playback';
import {
  Equal,
  MoonStar,
  SunMedium,
  Gauge,
  Zap,
  Waves,
  CloudMoon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './components/ui/dialog';
import MoodChart from './components/tasteProfile/MoodChart';
import ListeningHabitsChart from './components/tasteProfile/ListeningHabitsChart';

type MoodAxis = 'Energetic' | 'Happy' | 'Chill' | 'Danceable' | 'Melancholy';

type MoodPoint = {
  axis: MoodAxis;
  value: number;
};

type ArtistChip = {
  id: string;
  name: string;
  imageUrl: string;
};

type TopTrack = {
  rank: number;
  title: string;
  artist: string;
  albumArt: string;
  uri?: string;
};

type ListeningHabit = {
  label: string;
  value: number;
};

type ListeningPersonality = {
  archetype: string;
  summary: string;
  traits: string[];
};

type ArtistMomentumBucket = {
  label: string;
  artists: string[];
};

type TasteProfileData = {
  displayName: string;
  avatarUrl?: string | null;
  country: string;
  product: 'free' | 'premium' | string;
  playlistsCount: number;
  followedArtistsCount: number;
  mood: MoodPoint[];
  favoriteArtists: ArtistChip[];
  topTracks: TopTrack[];
  listeningHabits: ListeningHabit[];
  listeningPersonality: ListeningPersonality;
  artistMomentum: ArtistMomentumBucket[];
};

type TasteProfileProps = {
  code: string;
};

type ArtistDetail = {
  id: string;
  name: string;
  imageUrl: string;
  spotifyUrl: string | null;
};

type LyricsResponse = {
  lyrics: string | null;
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

function getListeningPersonalityIcon(archetype: string) {
  switch (archetype) {
    case 'The Night Rider':
      return MoonStar;
    case 'The High-Energy Night Rider':
      return Zap;
    case 'The Day Starter':
      return SunMedium;
    case 'The Midday Driver':
      return Gauge;
    case 'The Chill Navigator':
      return Waves;
    case 'The Late-Night Reflector':
      return CloudMoon;
    case 'The Balanced Listener':
    default:
      return Equal;
  }
}

const TasteProfile = ({ code }: TasteProfileProps) => {
  const accessToken = useAuth(code);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<ArtistChip | null>(null);
  const [isArtistDialogOpen, setIsArtistDialogOpen] = useState(false);

  const { data, isLoading, isError } = useQuery<TasteProfileData>({
    queryKey: ['taste-profile', accessToken],
    enabled: !!accessToken,
    queryFn: async () => {
      if (!accessToken) throw new Error('Missing access token');

      const res = await axios.get<TasteProfileData>(
        `${SERVER_URL}/taste-profile`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return res.data;
    },
  });

  // Artist info query
  const {
    data: artistInfo,
    isLoading: isArtistLoading,
    isError: isArtistError,
  } = useQuery<ArtistDetail>({
    queryKey: ['artist-info', selectedArtist?.id, accessToken],
    enabled: !!accessToken && !!selectedArtist?.id && isArtistDialogOpen,
    queryFn: async () => {
      const res = await axios.get<ArtistDetail>(`${SERVER_URL}/artist-info`, {
        params: { id: selectedArtist?.id },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.data;
    },
  });

  // Reset to first track when new data loads
  useEffect(() => {
    if (data?.topTracks?.length) {
      setCurrentIndex(0);
    }
  }, [data]);

  const topTracksForLyrics = data?.topTracks ?? [];
  const currentTrack =
    topTracksForLyrics.length > 0
      ? topTracksForLyrics[
          Math.min(currentIndex, topTracksForLyrics.length - 1)
        ]
      : null;

  const {
    data: lyricsData,
    isLoading: isLyricsLoading,
    isError: isLyricsError,
  } = useQuery<LyricsResponse>({
    queryKey: ['lyrics', currentTrack?.title, currentTrack?.artist],
    enabled: !!currentTrack?.title && !!currentTrack?.artist,
    queryFn: async () => {
      const res = await axios.get<LyricsResponse>(`${SERVER_URL}/lyrics`, {
        params: {
          title: currentTrack!.title,
          artist: currentTrack!.artist,
        },
      });
      return res.data;
    },
  });

  if (!accessToken) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-950 text-slate-50'>
        <p className='text-slate-400 text-sm'>Connecting to Spotify…</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-950 text-slate-50'>
        <p className='text-slate-400 text-sm'>Building your taste profile…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-950 text-slate-50'>
        <p className='text-red-400 text-sm'>
          Failed to load your taste profile. Please try again.
        </p>
      </div>
    );
  }

  const PersonalityIcon = getListeningPersonalityIcon(
    data.listeningPersonality.archetype,
  );

  // Build URI list for the player
  const trackUris = (data.topTracks || [])
    .map((t) => t.uri)
    .filter((uri): uri is string => Boolean(uri));

  const currentTrackUri =
    trackUris.length > 0 && currentIndex >= 0 && currentIndex < trackUris.length
      ? trackUris[currentIndex]
      : null;

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 pb-28'>
      <div className='px-10 py-15 space-y-6'>
        {/* Hero */}
        <motion.section
          className='flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 backdrop-blur'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className='flex items-center gap-4'>
            <div className='h-24 w-24 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-xl text-slate-400'>
              {data.avatarUrl ? (
                <img
                  src={data.avatarUrl}
                  alt={data.displayName}
                  className='h-full w-full object-cover'
                />
              ) : (
                <span>No Photo</span>
              )}
            </div>
            <div className='space-y-1'>
              <p className='text-xl uppercase tracking-[0.2em] text-slate-400'>
                Taste Profile
              </p>
              <h1 className='text-4xl md:text-5xl font-semibold'>
                Hi, {data.displayName.split(' ')[0]} — here’s your music vibe.
              </h1>
              <p className='text-xl text-slate-400'>
                {data.country} •{' '}
                {data.product === 'premium' ? 'Premium' : 'Free'} listener
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3 text-xl'>
            <div className='rounded-full bg-emerald-500/10 text-emerald-300 px-3 py-1 border border-emerald-500/40'>
              <span className='font-semibold'>{data.playlistsCount}</span>{' '}
              playlists
            </div>
            <div className='rounded-full bg-amber-500/10 text-amber-300 px-3 py-1 border border-amber-500/40'>
              <span className='font-semibold'>{data.followedArtistsCount}</span>{' '}
              artists followed
            </div>
          </div>
        </motion.section>

        {/* Main grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <motion.section
            className='col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h2 className='text-2xl font-semibold mb-2'>Mood Analysis</h2>
            <p className='text-sm md:text-base text-slate-400 mb-4'>
              Based on your energy, danceability, and valence across recent
              listening.
            </p>
            <div className='mb-16'>
              <MoodChart mood={data.mood} />
            </div>

            {/* Listening Habits */}
            <div className='mt-15'>
              <h3 className='text-2xl font-semibold mb-2'>Listening Habits</h3>
              <p className='text-sm md:text-base text-slate-400 mb-4'>
                When you tend to listen the most.
              </p>
              <ListeningHabitsChart habits={data.listeningHabits} />
            </div>
          </motion.section>

          {/* Personality + Momentum */}
          <motion.section
            className='col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className='flex items-center gap-2 mb-5'>
              <PersonalityIcon className='w-10 h-10 text-emerald-300' />
              <h2 className='text-2xl font-semibold'>
                {data.listeningPersonality.archetype}
              </h2>
            </div>
            <p className='text-xl text-slate-400 mb-5'>
              {data.listeningPersonality.summary}
            </p>

            <div className='flex flex-wrap gap-2 mb-10'>
              {data.listeningPersonality.traits.map((trait) => (
                <span
                  key={trait}
                  className='inline-flex items-center rounded-full bg-slate-800/80 text-lg text-slate-200 px-3 py-1 border border-slate-700/80'
                >
                  {trait}
                </span>
              ))}
            </div>

            {data.artistMomentum.length > 0 && (
              <div className='space-y-2'>
                {data.artistMomentum.map((bucket) => (
                  <div key={bucket.label} className='mb-5'>
                    <p className='text-sm font-semibold text-slate-300 mb-3'>
                      {bucket.label}
                    </p>
                    <div className='flex flex-wrap gap-1'>
                      {bucket.artists.map((name) => (
                        <span
                          key={name}
                          className='inline-flex items-center rounded-full bg-gradient-to-r from-purple-600/70 to-indigo-500/70 text-lg px-2.5 py-1 shadow-sm'
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          {/* Favorite Artists */}
          <motion.section
            className='col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className='text-2xl font-semibold mb-2'>Favorite Artists</h2>
            <p className='text-base md:text-lg text-slate-400 mb-3'>
              Your most played + followed artists blend.
            </p>

            <ul className='space-y-1 text-slate-300'>
              {data.favoriteArtists.map((artist) => (
                <li key={artist.id}>
                  <button
                    type='button'
                    onClick={() => {
                      setSelectedArtist(artist);
                      setIsArtistDialogOpen(true);
                    }}
                    className='w-full flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-800/70 transition-colors text-left'
                  >
                    <div className='h-12 w-12 rounded-full border border-slate-700 overflow-hidden flex-shrink-0'>
                      {artist.imageUrl ? (
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <div className='h-full w-full flex items-center justify-center text-xs text-slate-500 bg-slate-800'>
                          ?
                        </div>
                      )}
                    </div>
                    <span className='truncate text-lg'>{artist.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.section>
        </div>

        {/* Bottom grid: Top Tracks & Lyrics */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          <motion.section
            className='col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='space-y-1'>
              <h2 className='text-2xl font-semibold mb-2'>Top Tracks</h2>
              {data.topTracks.map((track) => {
                const isActive =
                  isPlaying &&
                  track.uri &&
                  currentTrackUri &&
                  track.uri === currentTrackUri;

                return (
                  <div
                    key={track.rank}
                    onClick={() => {
                      if (!track.uri) return;
                      const uriIndex = trackUris.findIndex(
                        (uri) => uri === track.uri,
                      );
                      if (uriIndex === -1) return;
                      setCurrentIndex(uriIndex);
                      setIsPlaying(true);
                    }}
                    className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors cursor-pointer ${
                      isActive ? 'bg-slate-800/90' : 'hover:bg-slate-800/70'
                    }`}
                  >
                    <span
                      className={`w-5 text-lg ${
                        isActive
                          ? 'text-emerald-400 font-semibold'
                          : 'text-slate-400'
                      }`}
                    >
                      {track.rank}.
                    </span>
                    <div className='h-14 w-14 rounded-md overflow-hidden flex-shrink-0'>
                      <img
                        src={track.albumArt}
                        alt={track.title}
                        className='h-full w-full object-cover'
                      />
                    </div>
                    <div className='flex flex-col min-w-0'>
                      <span
                        className={`text-xl font-medium truncate ${
                          isActive ? 'text-slate-50' : ''
                        }`}
                      >
                        {track.title}
                      </span>
                      <span className='text-lg text-slate-400 truncate'>
                        {track.artist}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Lyrics */}
          <motion.section
            className='col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className='text-2xl font-semibold mb-2'>Lyrics</h2>

            {currentTrack ? (
              <div className='space-y-4'>
                <div className='rounded-xl border border-slate-700 bg-slate-900/80 p-4 flex flex-col items-center gap-3'>
                  <div className='h-24 w-24 rounded-lg overflow-hidden mb-1'>
                    <img
                      src={currentTrack.albumArt}
                      alt={currentTrack.title}
                      className='h-full w-full object-cover'
                    />
                  </div>
                  <div className='text-center'>
                    <p className='text-lg font-semibold truncate max-w-[16rem]'>
                      {currentTrack.title}
                    </p>
                    <p className='text-sm text-slate-400 truncate max-w-[16rem]'>
                      {currentTrack.artist}
                    </p>
                  </div>
                </div>

                {isLyricsLoading && (
                  <p className='text-sm text-slate-400 text-center'>
                    Loading lyrics…
                  </p>
                )}

                {isLyricsError && (
                  <p className='text-sm text-red-400 text-center'>
                    Failed to load lyrics.
                  </p>
                )}

                {lyricsData?.lyrics && (
                  <pre className='whitespace-pre-wrap text-sm text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 max-h-150 overflow-y-auto'>
                    {lyricsData.lyrics}
                  </pre>
                )}

                {!isLyricsLoading && !lyricsData?.lyrics && !isLyricsError && (
                  <p className='text-sm text-slate-500 text-center'>
                    No lyrics found.
                  </p>
                )}
              </div>
            ) : (
              <p className='text-sm text-slate-400'>
                Start playing one of your top tracks to see track details here.
              </p>
            )}
          </motion.section>
        </div>
      </div>

      {/* Artist Dialog */}
      <Dialog
        open={isArtistDialogOpen && !!selectedArtist}
        onOpenChange={(open) => {
          setIsArtistDialogOpen(open);
          if (!open) setSelectedArtist(null);
        }}
      >
        <DialogContent className='max-w-md bg-slate-950 border-slate-800 text-slate-50'>
          <DialogHeader className='items-center'>
            <DialogTitle className='text-2xl'>
              {selectedArtist?.name}
            </DialogTitle>
            <DialogDescription className='text-center text-slate-400'>
              One of your top artists based on your recent listening.
            </DialogDescription>
          </DialogHeader>

          <div className='mt-4 flex flex-col gap-4'>
            {/* Artist Image */}
            <div className='flex flex-col items-center gap-4'>
              <div className='h-32 w-32 rounded-full overflow-hidden border border-slate-700'>
                {selectedArtist?.imageUrl ? (
                  <img
                    src={selectedArtist.imageUrl}
                    alt={selectedArtist.name}
                    className='h-full w-full object-cover'
                  />
                ) : (
                  <div className='h-full w-full flex items-center justify-center text-sm text-slate-500 bg-slate-800'>
                    No image
                  </div>
                )}
              </div>
            </div>

            {/* Loading */}
            {isArtistLoading && (
              <p className='text-sm text-slate-400 text-center'>
                Loading artist details…
              </p>
            )}

            {/* Error */}
            {isArtistError && !isArtistLoading && (
              <p className='text-sm text-red-400 text-center'>
                Failed to load artist details. Please try again.
              </p>
            )}

            {/* Info */}
            {artistInfo && !isArtistLoading && !isArtistError && (
              <div className='space-y-4 text-center'>
                {artistInfo.spotifyUrl && (
                  <a
                    href={artistInfo.spotifyUrl}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex items-center justify-center text-xs text-emerald-300 hover:text-emerald-200 underline underline-offset-4'
                  >
                    View on Spotify
                  </a>
                )}

                {!artistInfo.spotifyUrl && (
                  <p className='text-sm text-slate-400'>
                    No additional details available.
                  </p>
                )}
              </div>
            )}

            {/* Fallback */}
            {!artistInfo && !isArtistLoading && !isArtistError && (
              <p className='text-sm text-slate-300 text-center leading-relaxed'>
                This artist shows up often in your recent listening. Details
                will appear here once available.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Spotify Web Player */}
      {accessToken && trackUris.length > 0 && (
        <div className='fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800 px-2 py-2'>
          <SpotifyPlayer
            token={accessToken}
            uris={trackUris}
            offset={currentIndex}
            play={isPlaying}
            name='Taste Profile Player'
            hideAttribution
            initialVolume={0.5}
            callback={(state) => {
              if (!state.isPlaying) setIsPlaying(false);
              else setIsPlaying(true);

              const uri = state?.track?.uri;
              if (uri) {
                const idx = trackUris.findIndex((tUri) => tUri === uri);
                if (idx !== -1) setCurrentIndex(idx);
              }
            }}
            styles={{
              bgColor: '#020617',
              color: '#e2e8f0',
              trackNameColor: '#f9fafb',
              trackArtistColor: '#94a3b8',
              sliderColor: '#22c55e',
              sliderTrackColor: '#1e293b',
              sliderHandleColor: '#e2e8f0',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TasteProfile;
