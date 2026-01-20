import React, { useState, useEffect } from 'react';
import PromptEditor from './PromptEditor';
import './SummaryDisplay.css';

function SummaryDisplay({ summary, isLoading, error, transcription, onPromptChange, prompt, onManualInput }) {
  const [manualSummary, setManualSummary] = useState('');

  useEffect(() => {
    if (summary) {
      setManualSummary(summary);
    }
  }, [summary]);

  const handleManualChange = (e) => {
    const newText = e.target.value;
    setManualSummary(newText);
    if (onManualInput) {
      onManualInput(newText);
    }
  };

  if (isLoading) {
    return (
      <div className="summary-display">
        <div className="loading">Generating summary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-display">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="summary-display">
      {/* Always show prompt editor */}
      <PromptEditor
        prompt={prompt}
        onPromptChange={onPromptChange}
        placeholder="Please summarize the following transcribed text:\n\n${text}"
        previewText="text"
      />

      {/* Manual summary input - always visible */}
      <div className="manual-input-section">
        <label htmlFor="manual-summary-input">
          Summary {summary && '(from AI)'} {!summary && '(enter manually)'}:
        </label>
        <textarea
          id="manual-summary-input"
          className="summary-input"
          value={manualSummary}
          onChange={handleManualChange}
          placeholder="Summary will appear here after generation, or type/paste summary manually..."
          rows={4}
        />
        {manualSummary && (
          <div className="char-count">{manualSummary.length} characters</div>
        )}
      </div>

      {summary && (
        <div className="summary-result">
          <h4>Generated Summary</h4>
          <div className="summary-text">{summary}</div>
        </div>
      )}
    </div>
  );
}

export default SummaryDisplay;

