// GainMenu.js
import React from 'react';

const GainMenu = ({ gainValue, setGainValue, isNegative, setIsNegative, applyGain, cancelConnection }) => {
  return (
    <div className="gain-menu">
      <h4>Set Gain Value</h4>
      <input
        type="text"
        value={gainValue}
        onChange={(e) => setGainValue(e.target.value)}
        placeholder="Gain value (K, 10, etc.)"
        autoFocus
      />
      <div className="gain-menu-options">
        <label>
          <input
            type="checkbox"
            checked={isNegative}
            onChange={(e) => setIsNegative(e.target.checked)}
          />
          Negative feedback (-H)
        </label>
      </div>
      <div className="gain-menu-buttons">
        <button className="apply-btn" onClick={applyGain}>
          Apply
        </button>
        <button className="cancel-btn" onClick={cancelConnection}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default GainMenu;
