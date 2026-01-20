import React from 'react';
import './ModelSelector.css';

function ModelSelector({ label, value, onChange, options, disabled = false }) {
  return (
    <div className="model-selector">
      <label htmlFor={`model-select-${label}`} className="model-label">
        {label} Model:
      </label>
      <select
        id={`model-select-${label}`}
        className="model-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModelSelector;
