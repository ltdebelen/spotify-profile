const TrackSearchResult = ({
  track,
  chooseTrack,
}: {
  track: any;
  chooseTrack: (track: any) => void;
}) => {
  return (
    <button
      type='button'
      onClick={() => chooseTrack(track)}
      className='w-full flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 hover:bg-slate-800/80 transition-colors text-left'
    >
      <div className='h-12 w-12 flex-shrink-0 overflow-hidden rounded'>
        <img
          src={track.albumUrl}
          alt={track.title}
          className='h-full w-full object-cover'
        />
      </div>
      <div className='flex flex-col flex-1 min-w-0'>
        <span className='text-sm font-medium truncate'>{track.title}</span>
        <span className='text-xs text-slate-400 truncate'>{track.artist}</span>
      </div>
    </button>
  );
};

export default TrackSearchResult;
