
import React, { useState, useEffect } from 'react';
import PromptEditor from './PromptEditor';
import './MusicPromptDisplay.css';

function MusicPromptDisplay({ prompt, isLoading, error, summary, onPromptChange, aiPrompt, onManualInput }) {
  const [manualPrompt, setManualPrompt] = useState('');

  useEffect(() => {
    if (prompt) {
      setManualPrompt(prompt);
    }
  }, [prompt]);

  const handleManualChange = (e) => {
    const newText = e.target.value;
    setManualPrompt(newText);
    if (onManualInput) {
      onManualInput(newText);
    }
  };

  if (isLoading) {
    return (
      <div className="music-prompt-display">
        <div className="loading">Generating music prompt...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="music-prompt-display">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="music-prompt-display">
      {/* Always show prompt editor */}
      <PromptEditor
        prompt={aiPrompt}
        onPromptChange={onPromptChange}
        placeholder="Based on the following summary, create a detailed music generation prompt for Suno AI:\n\n${summary}\n\nGenerate a prompt that captures the essence and mood of this content."
        previewText="summary"
      />

      {/* Manual music prompt input - always visible */}
      <div className="manual-input-section">
        <label htmlFor="manual-music-prompt-input">
          Music Prompt {prompt && '(from AI)'} {!prompt && '(enter manually)'}:
        </label>
        <textarea
          id="manual-music-prompt-input"
          className="prompt-input"
          value={manualPrompt}
          onChange={handleManualChange}
          placeholder="Music prompt will appear here after generation, or type/paste music prompt manually..."
          rows={4}
        />
        {manualPrompt && (
          <div className="char-count">{manualPrompt.length} characters</div>
        )}
      </div>

      {prompt && (
        <div className="prompt-result">
          <h4>Generated Music Prompt</h4>
          <div className="prompt-text">{prompt}</div>
        </div>
      )}
    </div>
  );
}

export default MusicPromptDisplay;

