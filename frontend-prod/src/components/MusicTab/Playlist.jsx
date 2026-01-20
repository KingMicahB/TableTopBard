import { useAppState } from '../../context/AppContext';
import './Playlist.css';

const Playlist = ({ onSelectSong, currentIndex }) => {
  const { playlist, removeSongFromPlaylist, reorderPlaylist } = useAppState();

  if (playlist.length === 0) {
    return (
      <div className="playlist-empty">
        <p>No songs in playlist yet.</p>
        <p className="empty-hint">Generate music from the Live Recording page to add songs here.</p>
      </div>
    );
  }

  return (
    <div className="playlist">
      <h3 className="playlist-title">Playlist ({playlist.length})</h3>
      <div className="playlist-items">
        {playlist.map((song, index) => (
          <div
            key={song.id || index}
            className={`playlist-item ${currentIndex === index ? 'active' : ''}`}
            onClick={() => onSelectSong(index)}
          >
            {song.coverImage && (
              <img 
                src={song.coverImage} 
                alt={song.title || 'Cover'} 
                className="playlist-item-cover"
              />
            )}
            <div className="playlist-item-info">
              <div className="playlist-item-title">
                {song.title || `Song ${index + 1}`}
              </div>
              {song.prompt && (
                <div className="playlist-item-prompt">
                  {song.prompt.substring(0, 60)}...
                </div>
              )}
            </div>
            <button
              className="playlist-item-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeSongFromPlaylist(index);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Playlist;
