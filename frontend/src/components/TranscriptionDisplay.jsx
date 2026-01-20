import React, { useState, useEffect } from 'react';
import './TranscriptionDisplay.css';

function TranscriptionDisplay({ transcription, isLoading, error, onTextChange, allowEdit = true }) {
  const [localText, setLocalText] = useState(transcription || '');

  useEffect(() => {
    setLocalText(transcription || '');
  }, [transcription]);

  const handleChange = (e) => {
    const newText = e.target.value;
    setLocalText(newText);
    if (onTextChange) {
      onTextChange(newText);
    }
  };

  if (isLoading) {
    return (
      <div className="transcription-display">
        <div className="loading">Transcribing audio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="transcription-display">
        <div className="error">{error}</div>
        {allowEdit && (
          <div className="manual-input-section">
            <label htmlFor="manual-transcription">Or enter text manually:</label>
            <textarea
              id="manual-transcription"
              className="transcription-input"
              value={localText}
              onChange={handleChange}
              placeholder="Type or paste your transcription here..."
              rows={4}
            />
          </div>
        )}
      </div>
    );
  }

  if (allowEdit) {
    return (
      <div className="transcription-display">
        <label htmlFor="transcription-textarea" className="transcription-label">
          Transcription {transcription && '(from audio)'}
        </label>
        <textarea
          id="transcription-textarea"
          className="transcription-input"
          value={localText}
          onChange={handleChange}
          placeholder="Transcription will appear here after transcribing audio, or type/paste text manually..."
          rows={6}
        />
        {localText && (
          <div className="char-count">{localText.length} characters</div>
        )}
      </div>
    );
  }

  if (!transcription) {
    return (
      <div className="transcription-display">
        <div className="manual-input-section">
          <label htmlFor="manual-transcription">Enter text manually:</label>
          <textarea
            id="manual-transcription"
            className="transcription-input"
            value={localText}
            onChange={handleChange}
            placeholder="Type or paste your text here..."
            rows={6}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="transcription-display">
      <div className="transcription-text">{transcription}</div>
    </div>
  );
}

export default TranscriptionDisplay;

