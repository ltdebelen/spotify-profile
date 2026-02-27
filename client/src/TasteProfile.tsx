import { motion } from 'framer-motion';
import useAuth from './useAuth';
import { Button } from './components/ui/button';

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

const mockTasteProfile: TasteProfileData = {
  displayName: 'Lawrence De Belen',
  avatarUrl: null,
  country: 'US',
  product: 'premium',
  playlistsCount: 42,
  followedArtistsCount: 22,
  mood: [
    { axis: 'Energetic', value: 0.75 },
    { axis: 'Happy', value: 0.7 },
    { axis: 'Chill', value: 0.55 },
    { axis: 'Danceable', value: 0.8 },
    { axis: 'Melancholy', value: 0.4 },
  ],
  genres: [
    { name: 'K-Pop', weight: 1.0 },
    { name: 'P-Pop / OPM', weight: 0.9 },
    { name: 'Hip Hop / Rap', weight: 0.7 },
    { name: 'Pop', weight: 0.6 },
    { name: 'R&B', weight: 0.55 },
    { name: 'Soft Rock', weight: 0.4 },
  ],
  favoriteArtists: [
    {
      name: 'TWICE',
      imageUrl:
        'https://i.scdn.co/image/ab6761610000e5eb3d8820046fd455b38d644864',
    },
    {
      name: 'BINI',
      imageUrl:
        'https://i.scdn.co/image/ab6761610000e5eb8b10e8b83993fa8dc12ace18',
    },
    {
      name: 'NewJeans',
      imageUrl:
        'https://i.scdn.co/image/ab6761610000e5eb8dae71b664393f38ba91f891',
    },
    {
      name: 'Hev Abi',
      imageUrl:
        'https://i.scdn.co/image/ab6761610000e5ebd2b019b0ca5be2662b96831c',
    },
  ],
  topTracks: [
    {
      rank: 1,
      title: 'Sample Track 1',
      artist: 'TWICE',
      albumArt:
        'https://i.scdn.co/image/ab6761610000e5eb3d8820046fd455b38d644864',
    },
    {
      rank: 2,
      title: 'Sample Track 2',
      artist: 'BINI',
      albumArt:
        'https://i.scdn.co/image/ab6761610000e5eb8b10e8b83993fa8dc12ace18',
    },
    {
      rank: 3,
      title: 'Sample Track 3',
      artist: 'NewJeans',
      albumArt:
        'https://i.scdn.co/image/ab6761610000e5eb8dae71b664393f38ba91f891',
    },
    {
      rank: 4,
      title: 'Sample Track 4',
      artist: 'Drake',
      albumArt:
        'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
    },
    {
      rank: 5,
      title: 'Sample Track 5',
      artist: 'The Weeknd',
      albumArt:
        'https://i.scdn.co/image/ab6761610000e5eb9e528993a2820267b97f6aae',
    },
  ],
  listeningHabits: [
    { label: 'Morning', value: 0.3 },
    { label: 'Afternoon', value: 0.55 },
    { label: 'Evening', value: 0.8 },
    { label: 'Late Night', value: 0.95 },
  ],
};

type TasteProfileProps = {
  code: string;
};

const TasteProfile = ({ code }: TasteProfileProps) => {
  const accessToken = useAuth(code);

  const data = mockTasteProfile;

  if (!accessToken) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-slate-950 text-slate-50'>
        <p className='text-slate-400 text-sm'>Connecting to Spotify…</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-8 space-y-6'>
        {/* Hero */}
        <motion.section
          className='flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 px-5 py-4 backdrop-blur'
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className='flex items-center gap-4'>
            <div className='h-14 w-14 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-xs text-slate-400'>
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
              <p className='text-xs uppercase tracking-[0.2em] text-slate-400'>
                Taste Profile
              </p>
              <h1 className='text-xl md:text-2xl font-semibold'>
                Hi, {data.displayName.split(' ')[0]} — here’s your music vibe.
              </h1>
              <p className='text-xs text-slate-400'>
                {data.country} •{' '}
                {data.product === 'premium' ? 'Premium' : 'Free'} listener
              </p>
            </div>
          </div>

          <div className='flex items-center gap-3 text-xs'>
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
            <h2 className='text-sm font-semibold mb-2'>Mood Analysis</h2>
            <p className='text-xs text-slate-400 mb-3'>
              Based on your energy, danceability, and valence across recent
              listening.
            </p>

            <div className='relative h-40 flex items-center justify-center'>
              <div className='absolute inset-6 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-emerald-400/20 blur-xl' />
              <div className='relative grid grid-cols-5 gap-1 w-full text-[10px] text-slate-400'>
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
                    <span className='text-[9px] text-center'>{m.axis}</span>
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
            <h2 className='text-sm font-semibold mb-2'>Top Genres</h2>
            <p className='text-xs text-slate-400 mb-3'>
              Heaviest bubbles = genres you lean on the most.
            </p>

            <div className='flex flex-wrap gap-2'>
              {data.genres.map((genre) => (
                <span
                  key={genre.name}
                  className='inline-flex items-center rounded-full bg-gradient-to-r from-purple-600/70 to-indigo-500/70 text-[11px] font-medium px-3 py-1 shadow-sm'
                  style={{ transform: `scale(${0.85 + genre.weight * 0.3})` }}
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
            <h2 className='text-sm font-semibold mb-2'>Favorite Artists</h2>
            <p className='text-xs text-slate-400 mb-3'>
              Your most played + followed artists blend.
            </p>

            <div className='flex -space-x-3 mb-3'>
              {data.favoriteArtists.slice(0, 4).map((artist) => (
                <div
                  key={artist.name}
                  className='h-10 w-10 rounded-full border border-slate-900 overflow-hidden'
                >
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className='h-full w-full object-cover'
                  />
                </div>
              ))}
            </div>

            <ul className='space-y-1 text-xs text-slate-300'>
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
            <div className='flex items-center justify-between mb-3'>
              <h2 className='text-sm font-semibold'>Top Tracks</h2>
              <Button
                size='sm'
                variant='outline'
                className='border-slate-700 bg-slate-900/80 text-[11px] h-7 px-2'
              >
                Open in Spotify
              </Button>
            </div>

            <div className='space-y-1'>
              {data.topTracks.map((track) => (
                <div
                  key={track.rank}
                  className='flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-800/70 transition-colors'
                >
                  <span className='w-5 text-[11px] text-slate-400'>
                    {track.rank}.
                  </span>
                  <div className='h-9 w-9 rounded-md overflow-hidden flex-shrink-0'>
                    <img
                      src={track.albumArt}
                      alt={track.title}
                      className='h-full w-full object-cover'
                    />
                  </div>
                  <div className='flex flex-col min-w-0'>
                    <span className='text-xs font-medium truncate'>
                      {track.title}
                    </span>
                    <span className='text-[11px] text-slate-400 truncate'>
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
            <h2 className='text-sm font-semibold mb-2'>Listening Habits</h2>
            <p className='text-xs text-slate-400 mb-3'>
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
                  <span className='text-[10px] text-slate-400 text-center'>
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
