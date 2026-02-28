import { motion } from 'framer-motion';
import useAuth from './useAuth';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Equal,
  MoonStar,
  SunMedium,
  Gauge,
  Zap,
  Waves,
  CloudMoon,
} from 'lucide-react';

type MoodAxis = 'Energetic' | 'Happy' | 'Chill' | 'Danceable' | 'Melancholy';

type MoodPoint = {
  axis: MoodAxis;
  value: number;
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

  const PersonalityIcon = getListeningPersonalityIcon(
    data.listeningPersonality.archetype,
  );

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

            <div
              className='relative h-40 flex items-center justify-center'
              style={{ marginTop: '10rem' }}
            >
              <div className='absolute inset-6 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-emerald-400/20 blur-xl' />
              <div className='relative grid grid-cols-5 gap-1 w-full text-lg text-slate-400'>
                {data.mood.map((m) => (
                  <div
                    key={m.axis}
                    className='flex flex-col items-center gap-1'
                  >
                    <div className='h-80 w-2 rounded-full bg-slate-800 overflow-hidden'>
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

          {/* Listening Personality + Artist Momentum */}
          <motion.section
            className='col-span-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-4'
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Listening Personality */}
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

            {/* Artist Momentum */}
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
                  className='flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-800/70 transition-colors cursor-pointer'
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

            <div className='space-y-4'>
              {data.listeningHabits.map((slot) => (
                <div key={slot.label} className='flex items-center gap-3'>
                  <span className='w-32 text-lg text-slate-400 text-right'>
                    {slot.label}
                  </span>
                  <motion.div
                    className='h-7 rounded-md bg-gradient-to-r from-purple-500 to-emerald-400 shadow-md flex items-center'
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(slot.value * 100, 8)}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                    style={{ minWidth: '2rem', maxWidth: '100%' }}
                  >
                    <span className='ml-2 text-slate-50 font-semibold'>
                      {Math.round(slot.value * 100)}%
                    </span>
                  </motion.div>
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
