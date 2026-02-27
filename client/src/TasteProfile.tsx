import { motion } from 'framer-motion';
import useAuth from './useAuth';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

type MoodAxis = 'Energetic' | 'Happy' | 'Chill' | 'Danceable' | 'Melancholy';

type MoodPoint = {
  axis: MoodAxis;
  value: number;
};

type GenreBubble = {
  name: string;
  weight: number;
};

type ArtistChip = {
  name: string;
  imageUrl: string;
};

type TopTrack = {
  rank: number;
  title: string;
  artist: string;
  albumArt: string;
};

type ListeningHabit = {
  label: string;
  value: number;
};

type TasteProfileData = {
  displayName: string;
  avatarUrl?: string | null;
  country: string;
  product: 'free' | 'premium' | string;
  playlistsCount: number;
  followedArtistsCount: number;
  mood: MoodPoint[];
  genres: GenreBubble[];
  favoriteArtists: ArtistChip[];
  topTracks: TopTrack[];
  listeningHabits: ListeningHabit[];
};

type TasteProfileProps = {
  code: string;
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

const TasteProfile = ({ code }: TasteProfileProps) => {
  const accessToken = useAuth(code);

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

  {
    console.log('data', data);
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50'>
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
          {/* Mood Analysis (placeholder visual) */}
          <motion.section
            className='col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h2 className='text-2xl font-semibold mb-2'>Mood Analysis</h2>
            <p className='text-xl text-slate-400 mb-3'>
              Based on your energy, danceability, and valence across recent
              listening.
            </p>

            <div className='relative h-40 flex items-center justify-center'>
              <div className='absolute inset-6 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-emerald-400/20 blur-xl' />
              <div className='relative grid grid-cols-5 gap-1 w-full text-lg text-slate-400'>
                {data.mood.map((m) => (
                  <div
                    key={m.axis}
                    className='flex flex-col items-center gap-1'
                  >
                    <div className='h-20 w-2 rounded-full bg-slate-800 overflow-hidden'>
                      <div
                        className='w-full bg-gradient-to-t from-emerald-400 to-purple-400'
                        style={{ height: `${m.value * 100}%` }}
                      />
                    </div>
                    <span className='text-lg text-center'>{m.axis}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          {/* Top Genres bubbles (textual, not real chart yet) */}
          <motion.section
            className='col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className='text-2xl font-semibold mb-5'>Top Genres</h2>

            <div className='flex flex-wrap gap-x-4 gap-y-3 justify-start items-center min-h-[56px]'>
              {data.genres.map((genre) => (
                <span
                  key={genre.name}
                  className='inline-flex items-center rounded-full bg-gradient-to-r from-purple-600/70 to-indigo-500/70 text-2xl font-medium px-6 py-3 shadow-sm'
                >
                  {genre.name}
                </span>
              ))}
            </div>
          </motion.section>

          {/* Favorite Artists */}
          <motion.section
            className='col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className='text-2xl font-semibold mb-2'>Favorite Artists</h2>
            <p className='text-xl text-slate-400 mb-3'>
              Your most played + followed artists blend.
            </p>

            <div className='flex -space-x-3 mb-3'>
              {data.favoriteArtists.slice(0, 4).map((artist) => (
                <div
                  key={artist.name}
                  className='h-14 w-14 rounded-full border border-slate-900 overflow-hidden'
                >
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className='h-full w-full object-cover'
                  />
                </div>
              ))}
            </div>

            <ul className='space-y-1 text-xl text-slate-300'>
              {data.favoriteArtists.map((artist) => (
                <li key={artist.name}>• {artist.name}</li>
              ))}
            </ul>
          </motion.section>
        </div>

        {/* Bottom grid: Top Tracks & Listening Habits */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {/* Top Tracks */}
          <motion.section
            className='col-span-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className='space-y-1'>
              {data.topTracks.map((track) => (
                <div
                  key={track.rank}
                  className='flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-800/70 transition-colors'
                >
                  <span className='w-5 text-lg text-slate-400'>
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
                    <span className='text-xl font-medium truncate'>
                      {track.title}
                    </span>
                    <span className='text-lg text-slate-400 truncate'>
                      {track.artist}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Listening Habits */}
          <motion.section
            className='col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className='text-2xl font-semibold mb-2'>Listening Habits</h2>
            <p className='text-xl text-slate-400 mb-3'>
              When you tend to listen the most.
            </p>

            <div className='flex items-end gap-2 h-40'>
              {data.listeningHabits.map((slot) => (
                <div
                  key={slot.label}
                  className='flex-1 flex flex-col items-center gap-1'
                >
                  <div className='w-7 rounded-t-md bg-gradient-to-t from-purple-500 to-emerald-400'>
                    <div
                      className='w-full bg-transparent'
                      style={{ height: `${slot.value * 100}%` }}
                    />
                  </div>
                  <span className='text-lg text-slate-400 text-center'>
                    {slot.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

export default TasteProfile;
