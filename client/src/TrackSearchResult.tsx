const TrackSearchResult = ({ track, handlePlay, chooseTrack }) => {
  function handlePlay() {
    chooseTrack(track);
  }

  return (
    <div className='flex m-2 align-center cursor-pointer' onClick={handlePlay}>
      <img src={track.albumUrl} style={{ height: '64px', width: '64px' }} />
      <div className='ml-3'>
        <div>{track.title}</div>
        <div>{track.artist}</div>
      </div>
    </div>
  );
};

export default TrackSearchResult;
