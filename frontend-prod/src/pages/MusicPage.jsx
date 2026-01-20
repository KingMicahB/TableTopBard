import { useState } from 'react';
import { useAppState } from '../context/AppContext';
import Playlist from '../components/MusicTab/Playlist';
import PlayerControls from '../components/MusicTab/PlayerControls';
import './MusicPage.css';

const MusicPage = () => {
  const { currentSongIndex, setCurrentSongIndex } = useAppState();
  const [selectedIndex, setSelectedIndex] = useState(currentSongIndex);

  const handleSelectSong = (index) => {
    setSelectedIndex(index);
    setCurrentSongIndex(index);
  };

  return (
    <div className="music-page">
      <div className="music-page-container">
        <div className="music-page-header">
          <h1>Music Player</h1>
          <p className="page-subtitle">
            Play your generated music with full playlist controls
          </p>
        </div>

        <div className="music-content">
          <div className="music-player-section">
            <PlayerControls />
          </div>
          <div className="music-playlist-section">
            <Playlist 
              onSelectSong={handleSelectSong}
              currentIndex={selectedIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPage;
