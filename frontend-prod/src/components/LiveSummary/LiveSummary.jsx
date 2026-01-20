import { useState } from 'react';
import { useAppState } from '../../context/AppContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { api } from '../../services/api';
import { defaultPrompts, defaultModels, availableModels } from '../../config';
import PromptEditor from '../PromptEditor/PromptEditor';
import ModelSelector from '../ModelSelector/ModelSelector';
import './LiveSummary.css';

const LiveSummary = () => {
  const { transcription, summary, setSummary } = useAppState();
  const [prompt, setPrompt] = useState(defaultPrompts.summarization);
  const [model, setModel] = useState(defaultModels.summarization);
  const [isLoading, setIsLoading] = useState(false);

  const refreshSummary = async (text) => {
    if (!text || text.trim().length === 0) return;
    
    setIsLoading(true);
    try {
      const response = await api.summarizeText(text, prompt, model);
      setSummary(response.summary);
    } catch (error) {
      console.error('Failed to summarize:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const { isRefreshing, lastRefresh, forceRefresh } = useAutoRefresh(
    transcription,
    refreshSummary,
    30000, // 30 seconds
    2000   // 2 second debounce
  );

  const handleManualRefresh = () => {
    forceRefresh();
  };

  return (
    <div className="live-summary glass-card">
      <div className="section-header">
        <h2>Live Summary</h2>
        <div className="header-actions">
          <button 
            className="btn btn-sm" 
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading || !transcription}
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

      <div className="summary-display">
        {summary ? (
          <div className="summary-text">{summary}</div>
        ) : (
          <div className="summary-placeholder">
            {transcription 
              ? 'Summary will appear here automatically every 30 seconds...'
              : 'Start recording to generate summary...'}
          </div>
        )}
        {(isRefreshing || isLoading) && (
          <div className="loading-indicator">Updating summary...</div>
        )}
      </div>

      <ModelSelector
        label="Summarization"
        value={model}
        onChange={setModel}
        options={availableModels.summarization}
      />

      <PromptEditor
        prompt={prompt}
        onPromptChange={setPrompt}
        placeholder="Enter your summarization prompt..."
        previewText="transcription"
      />
    </div>
  );
};

export default LiveSummary;
