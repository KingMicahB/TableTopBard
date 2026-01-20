import { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../context/AppContext';
import './PlayerControls.css';

const PlayerControls = () => {
  const { playlist, currentSongIndex, setCurrentSongIndex } = useAppState();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [loopMode, setLoopMode] = useState('none'); // 'none', 'all', 'one'
  const [isShuffled, setIsShuffled] = useState(false);
  const audioRef = useRef(null);
  const previousVolumeRef = useRef(1);

  const currentSong = currentSongIndex !== null ? playlist[currentSongIndex] : null;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (loopMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNext();
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [loopMode]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong && currentSong.audioUrl) {
      audio.src = currentSong.audioUrl;
      audio.load();
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    }
  }, [currentSong, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    audio.currentTime = percent * audio.duration;
    setCurrentTime(audio.currentTime);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
      previousVolumeRef.current = newVolume;
    }
  };

  const handleMute = () => {
    if (isMuted) {
      setVolume(previousVolumeRef.current);
      setIsMuted(false);
    } else {
      previousVolumeRef.current = volume;
      setIsMuted(true);
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      setCurrentSongIndex(randomIndex);
    } else {
      const nextIndex = loopMode === 'all' 
        ? (currentSongIndex + 1) % playlist.length
        : Math.min(currentSongIndex + 1, playlist.length - 1);
      setCurrentSongIndex(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (playlist.length === 0) return;
    
    if (isShuffled) {
      const randomIndex = Math.floor(Math.random() * playlist.length);
      setCurrentSongIndex(randomIndex);
    } else {
      const prevIndex = loopMode === 'all'
        ? (currentSongIndex - 1 + playlist.length) % playlist.length
        : Math.max(currentSongIndex - 1, 0);
      setCurrentSongIndex(prevIndex);
    }
  };

  const toggleLoop = () => {
    const modes = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(loopMode);
    setLoopMode(modes[(currentIndex + 1) % modes.length]);
  };

  const formatTime = (seconds) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong || !currentSong.audioUrl) {
    return (
      <div className="player-controls-empty">
        <p>Select a song from the playlist to play</p>
      </div>
    );
  }

  return (
    <div className="player-controls glass-card">
      <div className="current-song">
        {currentSong.coverImage && (
          <img 
            src={currentSong.coverImage} 
            alt={currentSong.title || 'Cover'} 
            className="current-song-cover"
          />
        )}
        <div className="current-song-info">
          <div className="current-song-title">
            {currentSong.title || `Song ${currentSongIndex + 1}`}
          </div>
          {currentSong.prompt && (
            <div className="current-song-prompt">
              {currentSong.prompt}
            </div>
          )}
        </div>
      </div>

      <div className="player-main-controls">
        <button 
          className="player-btn"
          onClick={handlePrevious}
          disabled={playlist.length <= 1}
        >
          ⏮
        </button>
        <button 
          className="player-btn player-btn-primary"
          onClick={handlePlayPause}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button 
          className="player-btn"
          onClick={handleNext}
          disabled={playlist.length <= 1}
        >
          ⏭
        </button>
      </div>

      <div className="player-progress">
        <span className="player-time">{formatTime(currentTime)}</span>
        <div className="progress-bar-container" onClick={handleSeek}>
          <div 
            className="progress-bar"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <span className="player-time">{formatTime(duration)}</span>
      </div>

      <div className="player-secondary-controls">
        <button 
          className={`player-btn ${loopMode !== 'none' ? 'active' : ''}`}
          onClick={toggleLoop}
          title={`Loop: ${loopMode}`}
        >
          {loopMode === 'none' && '🔁'}
          {loopMode === 'all' && '🔁'}
          {loopMode === 'one' && '🔂'}
        </button>
        <button 
          className={`player-btn ${isShuffled ? 'active' : ''}`}
          onClick={() => setIsShuffled(!isShuffled)}
          title="Shuffle"
        >
          🔀
        </button>
        <div className="volume-control">
          <button 
            className="player-btn"
            onClick={handleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : volume > 0.5 ? '🔊' : '🔉'}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>

      {currentSong.audioUrl && (
        <audio
          ref={audioRef}
          src={currentSong.audioUrl}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        />
      )}
    </div>
  );
};

export default PlayerControls;
