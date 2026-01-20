import { useState } from 'react';
import { useAppState } from '../../context/AppContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { api } from '../../services/api';
import { defaultPrompts, defaultModels, availableModels } from '../../config';
import PromptEditor from '../PromptEditor/PromptEditor';
import ModelSelector from '../ModelSelector/ModelSelector';
import './LiveMusicPrompt.css';

const LiveMusicPrompt = () => {
  const { summary, musicPrompt, setMusicPrompt, addSong, setCurrentSongIndex, playlist } = useAppState();
  const [prompt, setPrompt] = useState(defaultPrompts.musicPromptGeneration);
  const [model, setModel] = useState(defaultModels.musicPromptGeneration);
  const [musicModel, setMusicModel] = useState(defaultModels.musicGeneration);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicError, setMusicError] = useState(null);

  const refreshMusicPrompt = async (summaryText) => {
    if (!summaryText || summaryText.trim().length === 0) return;
    
    setIsLoading(true);
    try {
      const response = await api.generateMusicPrompt(summaryText, prompt, model);
      setMusicPrompt(response.prompt);
    } catch (error) {
      console.error('Failed to generate music prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { isRefreshing, lastRefresh, forceRefresh } = useAutoRefresh(
    summary,
    refreshMusicPrompt,
    30000, // 30 seconds
    2000   // 2 second debounce
  );

  const handleManualRefresh = () => {
    forceRefresh();
  };

  const handleGenerateMusic = async () => {
    if (!musicPrompt) {
      setMusicError('No music prompt available. Please generate prompt first.');
      return;
    }
    
    try {
      setIsGeneratingMusic(true);
      setMusicError(null);
      
      // Validate prompt length for non-custom mode (max 500 characters)
      if (musicPrompt.length > 500) {
        setMusicError(`Prompt is too long. Maximum 500 characters for non-custom mode. Current: ${musicPrompt.length} characters.`);
        return;
      }

      const result = await api.generateMusic(musicPrompt, {
        model: musicModel,
        instrumental: true,
        customMode: false,
      });
      
      // Suno API returns songs in the songs array
      if (result.songs && Array.isArray(result.songs) && result.songs.length > 0) {
        // Add each song to the playlist
        result.songs.forEach((song) => {
          const audioUrl = song.audio_url || song.stream_audio_url || song.source_audio_url;
          if (audioUrl) {
            addSong({
              id: song.id || `${Date.now()}-${Math.random()}`,
              title: song.title || song.name || 'Generated Song',
              audioUrl: audioUrl,
              coverImage: song.cover_image_url || song.image_url,
              prompt: musicPrompt,
              tags: song.tags || [],
            });
          }
        });
        
        // Set the first song as current
        if (playlist.length === 0 && result.songs[0]) {
          setCurrentSongIndex(0);
        } else {
          setCurrentSongIndex(playlist.length);
        }
      } else {
        throw new Error('No songs received from Suno API');
      }
    } catch (err) {
      setMusicError(err.message);
      console.error('Music generation error:', err);
    } finally {
      setIsGeneratingMusic(false);
    }
  };

  return (
    <div className="live-music-prompt glass-card">
      <div className="section-header">
        <h2>Live Music Prompt</h2>
        <div className="header-actions">
          <button 
            className="btn btn-sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading || !summary}
          >
            {isRefreshing || isLoading ? 'Refreshing...' : 'Refresh Now'}
          </button>
          {lastRefresh && (
            <span className="last-refresh">
              Last: {new Date(lastRefresh).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div className="prompt-display">
        {musicPrompt ? (
          <div className="prompt-text">{musicPrompt}</div>
        ) : (
          <div className="prompt-placeholder">
            {summary 
              ? 'Music prompt will appear here automatically every 30 seconds...'
              : 'Generate a summary first...'}
          </div>
        )}
        {(isRefreshing || isLoading) && (
          <div className="loading-indicator">Updating prompt...</div>
        )}
      </div>

      {musicPrompt && (
        <div className="music-generation-section">
          <button 
            className="btn btn-primary" 
            onClick={handleGenerateMusic}
            disabled={isGeneratingMusic || !musicPrompt}
          >
            {isGeneratingMusic ? 'Generating Music...' : 'Generate Music'}
          </button>
          {musicError && (
            <div className="error-message">{musicError}</div>
          )}
        </div>
      )}

      <ModelSelector
        label="Music Prompt"
        value={model}
        onChange={setModel}
        options={availableModels.musicPromptGeneration}
      />

      <ModelSelector
        label="Music Generation"
        value={musicModel}
        onChange={setMusicModel}
        options={availableModels.musicGeneration}
      />

      <PromptEditor
        prompt={prompt}
        onPromptChange={setPrompt}
        placeholder="Enter your music prompt generation prompt..."
        previewText="summary"
      />
    </div>
  );
};

export default LiveMusicPrompt;
