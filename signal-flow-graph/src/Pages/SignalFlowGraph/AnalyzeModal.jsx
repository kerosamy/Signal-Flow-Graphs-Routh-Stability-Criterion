// AnalyzeModal.js
import React from 'react';

const AnalyzeModal = ({ showAnalyzeModal, nodes, sourceNode, setSourceNode, destNode, setDestNode, submitAnalysis, cancelAnalysis }) => {
  if (!showAnalyzeModal) return null;

  return (
    <div className="analyze-modal" style={{ display: 'block' }}>
      <h3>Select Source and Destination Nodes</h3>
      <div className="dropdowns">
        <label>Source Node:</label>
        <select onChange={(e) => setSourceNode(e.target.value)} value={sourceNode}>
          <option value="">Select Source Node</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.data.label}
            </option>
          ))}
        </select>
      </div>
      <div className="dropdowns">
        <label>Destination Node:</label>
        <select onChange={(e) => setDestNode(e.target.value)} value={destNode}>
          <option value="">Select Destination Node</option>
          {nodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.data.label}
            </option>
          ))}
        </select>
      </div>
      <div className="modal-buttons">
        <button onClick={submitAnalysis}>Analyze</button>
        <button onClick={cancelAnalysis}>Cancel</button>
      </div>
    </div>
  );
};

export default AnalyzeModal;
