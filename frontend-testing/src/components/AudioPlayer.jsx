import React, { useState, useRef, useEffect } from 'react';
import PromptEditor from './PromptEditor';
import './AudioPlayer.css';

function AudioPlayer({ audioUrl, isLoading, error, placeholder, musicPrompt, onPromptChange, aiPrompt, model, instrumental, customMode, songs = [] }) {
  if (isLoading) {
    return (
      <div className="audio-player">
        <h3>Generated Music</h3>
        <div className="loading">Generating music...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="audio-player">
        <h3>Generated Music</h3>
        <div className="error">{error}</div>
      </div>
    );
  }

  // Build API call preview
  const apiCallPreview = musicPrompt ? {
    endpoint: 'POST /api/audio/generate-music',
    url: 'https://api.sunoapi.org/api/v1/generate',
    headers: {
      'Authorization': 'Bearer [YOUR_API_KEY]',
      'Content-Type': 'application/json',
    },
    body: {
      prompt: musicPrompt,
      model: model || 'V5',
      instrumental: instrumental !== undefined ? instrumental : true,
      customMode: customMode !== undefined ? customMode : false,
      callBackUrl: '[YOUR_BACKEND_URL]/api/audio/suno-callback',
    },
    validation: {
      promptLength: musicPrompt.length,
      maxLength: 500, // Non-custom mode limit
      isValid: musicPrompt.length <= 500,
    },
  } : null;

  return (
    <div className="audio-player">
      {/* Always show prompt editor */}
      <PromptEditor
        prompt={aiPrompt}
        onPromptChange={onPromptChange}
        placeholder="Generate music based on the following prompt:\n\n${prompt}"
        previewText="prompt"
      />

      {/* Show API call preview */}
      {apiCallPreview && (
        <div className="api-call-preview">
          <h4>API Call Preview</h4>
          <div className="api-call-details">
            <div className="api-endpoint">
              <strong>Endpoint:</strong> {apiCallPreview.endpoint}
            </div>
            <div className="api-url">
              <strong>Suno API URL:</strong> {apiCallPreview.url}
            </div>
            <div className="api-headers">
              <strong>Headers:</strong>
              <pre>{JSON.stringify(apiCallPreview.headers, null, 2)}</pre>
            </div>
            <div className="api-body">
              <strong>Request Body:</strong>
              <pre>{JSON.stringify(apiCallPreview.body, null, 2)}</pre>
            </div>
            {apiCallPreview.validation && (
              <div className={`api-validation ${apiCallPreview.validation.isValid ? 'valid' : 'invalid'}`}>
                <strong>Prompt Validation:</strong>
                <div>
                  Length: {apiCallPreview.validation.promptLength} / {apiCallPreview.validation.maxLength} characters
                  {!apiCallPreview.validation.isValid && (
                    <span className="validation-error"> ⚠️ Prompt exceeds maximum length!</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {placeholder && (
        <div className="placeholder">
          <p>Suno API integration is not yet configured.</p>
          <p>This is a placeholder. Once the Suno API is integrated, generated music will appear here.</p>
        </div>
      )}

      {/* Show both generated songs */}
      {songs && songs.length > 0 && (
        <div className="songs-container">
          <h4>Generated Songs ({songs.length})</h4>
          {songs.map((song, index) => (
            <SongPlayer key={song.id || index} song={song} index={index} />
          ))}
        </div>
      )}

      {/* Fallback: Single audio URL (backwards compatibility) */}
      {audioUrl && (!songs || songs.length === 0) && (
        <div className="player-container">
          <h4>Generated Music</h4>
          <SimpleAudioPlayer audioUrl={audioUrl} />
          <a href={audioUrl} download className="download-button">
            Download
          </a>
        </div>
      )}
    </div>
  );
}

// Enhanced song player component with time tracking
function SongPlayer({ song, index }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(song.duration || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleLoadStart = () => setIsLoading(true);
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('loadstart', handleLoadStart);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('loadstart', handleLoadStart);
    };
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audio.currentTime = percentage * audio.duration;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="song-item">
      <div className="song-header">
        <h5>Song {index + 1}{song.title && `: ${song.title}`}</h5>
        {duration && (
          <span className="song-duration">{formatTime(duration)}</span>
        )}
      </div>
      {song.image_url && (
        <img src={song.image_url} alt={song.title || `Song ${index + 1}`} className="song-cover" />
      )}
      
      <div className="audio-player-wrapper">
        <audio 
          ref={audioRef}
          className="audio-element"
          preload="metadata"
        >
          <source src={song.audio_url || song.stream_audio_url} type="audio/mpeg" />
          <source src={song.audio_url || song.stream_audio_url} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
        
        <div className="audio-controls">
          <button 
            className="play-pause-button"
            onClick={() => {
              const audio = audioRef.current;
              if (audio) {
                if (isPlaying) {
                  audio.pause();
                } else {
                  audio.play();
                }
              }
            }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div className="audio-progress-container">
            <div className="time-display">
              <span className="current-time">{formatTime(currentTime)}</span>
              <span className="total-time">{formatTime(duration)}</span>
            </div>
            <div 
              className="audio-progress-bar"
              onClick={handleProgressClick}
              role="button"
              tabIndex={0}
              aria-label="Seek audio"
            >
              <div 
                className="audio-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
              <div 
                className="audio-progress-handle"
                style={{ left: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="song-actions">
        <a href={song.audio_url || song.stream_audio_url} download className="download-button">
          Download Song {index + 1}
        </a>
      </div>
      {song.prompt && (
        <div className="song-prompt">
          <strong>Prompt:</strong> {song.prompt}
        </div>
      )}
      {song.tags && (
        <div className="song-tags">
          <strong>Tags:</strong> {song.tags}
        </div>
      )}
    </div>
  );
}

// Simple audio player for single audio URL (backwards compatibility)
function SimpleAudioPlayer({ audioUrl }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audio.currentTime = percentage * duration;
  };

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="audio-player-wrapper">
      <audio 
        ref={audioRef}
        className="audio-element"
        preload="metadata"
      >
        <source src={audioUrl} type="audio/mpeg" />
        <source src={audioUrl} type="audio/wav" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="audio-controls">
        <button 
          className="play-pause-button"
          onClick={() => {
            const audio = audioRef.current;
            if (audio) {
              if (isPlaying) {
                audio.pause();
              } else {
                audio.play();
              }
            }
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        
        <div className="audio-progress-container">
          <div className="time-display">
            <span className="current-time">{formatTime(currentTime)}</span>
            <span className="total-time">{formatTime(duration)}</span>
          </div>
          <div 
            className="audio-progress-bar"
            onClick={handleProgressClick}
            role="button"
            tabIndex={0}
            aria-label="Seek audio"
          >
            <div 
              className="audio-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
            <div 
              className="audio-progress-handle"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;

