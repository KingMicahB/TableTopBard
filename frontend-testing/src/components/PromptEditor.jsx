import React, { useState, useEffect, useRef } from 'react';
import './PromptEditor.css';

function PromptEditor({ prompt, onPromptChange, placeholder, previewText }) {
  // prompt is now just a string (user prompt), not an object
  const [userPrompt, setUserPrompt] = useState(typeof prompt === 'string' ? prompt : (prompt?.user || ''));
  const isUserInputRef = useRef(false);
  const lastPromptRef = useRef(null);

  // Initialize from props on mount
  useEffect(() => {
    const promptValue = typeof prompt === 'string' ? prompt : (prompt?.user || '');
    if (promptValue && !lastPromptRef.current) {
      setUserPrompt(promptValue);
      lastPromptRef.current = promptValue;
    }
  }, []);

  // Only sync from props if they changed externally (not from user input)
  useEffect(() => {
    if (!prompt) return;
    
    const promptValue = typeof prompt === 'string' ? prompt : (prompt?.user || '');
    const currentUser = userPrompt;
    
    // Only update if props are different AND it wasn't from user input
    if (!isUserInputRef.current) {
      if (promptValue !== currentUser) {
        // Check if this matches what we last sent (to avoid loops)
        const lastSent = lastPromptRef.current;
        if (lastSent !== promptValue) {
          setUserPrompt(promptValue);
          lastPromptRef.current = promptValue;
        }
      }
    } else {
      // Reset flag after handling user input
      isUserInputRef.current = false;
    }
  }, [prompt, userPrompt]);

  const handleUserPromptChange = (e) => {
    const newValue = e.target.value;
    setUserPrompt(newValue);
    isUserInputRef.current = true;
    
    if (onPromptChange) {
      lastPromptRef.current = newValue;
      onPromptChange(newValue);
    }
  };

  return (
    <div className="prompt-editor">
      <h4>User Prompt Configuration</h4>
      <p className="prompt-info">System prompts are managed on the backend. Only the user prompt can be customized here.</p>
      <div className="prompt-section">
        <label htmlFor="user-prompt">
          User Prompt {previewText && `(use ${'{'}{previewText}{'}'} or $${'{'}{previewText}{'}'} to insert ${previewText}):`}
        </label>
        <textarea
          id="user-prompt"
          className="prompt-input"
          value={userPrompt}
          onChange={handleUserPromptChange}
          placeholder={placeholder?.user || placeholder || "User prompt for the AI..."}
          rows={4}
        />
        {previewText && userPrompt && (
          <div className="prompt-preview">
            <strong>Preview (with {previewText}):</strong>
            <div className="preview-text">
              {userPrompt.replace(
                new RegExp(`\\$\\{${previewText}\\}|\\{${previewText}\\}`, 'g'),
                `[${previewText} will appear here]`
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PromptEditor;
