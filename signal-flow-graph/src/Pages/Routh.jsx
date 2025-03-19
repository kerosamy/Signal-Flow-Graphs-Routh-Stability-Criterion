import React, { useState } from 'react';
import './Routh.css'; // Import the CSS file

const RouthCriterion = () => {
  const [coefficients, setCoefficients] = useState('');
  const [result, setResult] = useState('');
  const [rhsPoles, setRhsPoles] = useState(null);
  const [routhTable, setRouthTable] = useState([]);

  // Small epsilon value to replace zero
  const epsilon = 1e-6;

  // Function to generate Routh-Hurwitz Table
  const calculateRouthTable = (coeffs) => {
    let routhTable = [];
    const n = coeffs.length;
  
    // First row is the coefficients of the even powers
    let firstRow = [];
    for (let i = 0; i < n; i += 2) {
      firstRow.push(coeffs[i]);
    }
  
    // Second row is the coefficients of the odd powers
    let secondRow = [];
    for (let i = 1; i < n; i += 2) {
      secondRow.push(coeffs[i]);
    }
  
    routhTable.push(firstRow);
    routhTable.push(secondRow);
  
    // Generate remaining rows
    let rowIndex = 2;
    while (true) {
      let prevRow = routhTable[rowIndex - 2];
      let currentRow = routhTable[rowIndex - 1];


      // If the current row has fewer than 2 elements, break the loop
      if (currentRow.length < 1) {
        break;
      }

      let newRow = [];
      for (let i = 0; i < prevRow.length-1; i++) {
        const a = prevRow[0] || 0; // Default to 0 if undefined
        const b = currentRow[0] || 0; // Default to 0 if undefined
        const c = prevRow[i + 1] || 0; // Default to 0 if undefined
        const d = currentRow[i + 1] || 0; // Default to 0 if undefined

  
        let value = ((b * c) - (a * d)) / (b); // Use epsilon to avoid division by zero
  
        if (value === 0) {
          value = epsilon;
        }
  
        newRow.push(value);
      }
      routhTable.push(newRow);
      rowIndex++;
    }
  
    return routhTable;
  };
  

  // Function to analyze stability
  const analyzeStability = () => {
    const coeffs = coefficients
      .split(',')
      .map((item) => parseFloat(item.trim()))
      .filter((item) => !isNaN(item));
    // console.log(coeffs);

    if (coeffs.length === 0) {
      setResult('Please enter valid coefficients.');
      setRhsPoles(null);
      setRouthTable([]);
      return;
    }

    let routhTable = calculateRouthTable(coeffs);
    setRouthTable(routhTable); // Store the final Routh table for rendering

    let rhsPolesCount = 0;

    // Check for sign changes in the first column of the Routh table
    let prevSign = Math.sign(routhTable[0][0]);
    for (let i = 1; i < routhTable.length; i++) {
      if (routhTable[i][0] !== undefined) {
        const currentSign = Math.sign(routhTable[i][0]);

        // If signs are different and not zero, count as sign change
        if (currentSign !== prevSign && currentSign !== 0) {
          rhsPolesCount++;
        }

        prevSign = currentSign;
      }
    }

    // Set result based on sign changes
    if (rhsPolesCount === 0) {
      setResult('The system is stable.');
      setRhsPoles(null);
    } else {
      setResult('The system is unstable.');
      setRhsPoles(rhsPolesCount);
    }
  };

  // Function to render Routh-Hurwitz Table
  const renderRouthTable = () => {
    return (
      <table border="1" style={{ marginTop: '20px', width: '100%', textAlign: 'center' }}>
        <thead>
          <tr>
            <th>Row</th>
            {Array.from({ length: routhTable.length }).map((_, index) => (
              <th key={index}>R{index}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {routhTable.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <td>Row {rowIndex + 1}</td>
              {row.map((value, colIndex) => (
                <td key={colIndex}>{value.toFixed(4)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Routh-Hurwitz Stability Criterion</h1>
      <div>
        <label>
          Enter coefficients of the characteristic equation (separate with commas):
          <input
            type="text"
            value={coefficients}
            onChange={(e) => setCoefficients(e.target.value)}
            placeholder="e.g. 1, -3, 2, -5"
          />
        </label>
      </div>
      <div>
        <button onClick={analyzeStability}>Analyze Stability</button>
      </div>
      <div style={{ marginTop: '20px' }}>
        <h3>Result:</h3>
        <p>{result}</p>
        {rhsPoles !== null && (
          <p>Number of poles in the Right-Hand Side of the plane: {rhsPoles}</p>
        )}
      </div>

      {/* Render the Routh table */}
      {routhTable.length > 0 && renderRouthTable()}
    </div>
  );
};

export default RouthCriterion;
