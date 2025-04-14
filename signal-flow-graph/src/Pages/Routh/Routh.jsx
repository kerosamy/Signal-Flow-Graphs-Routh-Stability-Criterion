import React, { useState } from 'react';
import styles from './Routh.module.css'; // Import the CSS module

const RouthCriterion = () => {
  const [coefficients, setCoefficients] = useState('');
  const [result, setResult] = useState('');
  const [rhsPoles, setRhsPoles] = useState(null);
  const [routhTable, setRouthTable] = useState([]);

  const epsilon = 1e-6;

  const calculateRouthTable = (coeffs) => {
    let routhTable = [];
    const n = coeffs.length;

    let firstRow = [];
    for (let i = 0; i < n; i += 2) {
      firstRow.push(coeffs[i]);
    }

    let secondRow = [];
    for (let i = 1; i < n; i += 2) {
      secondRow.push(coeffs[i]);
    }

    routhTable.push(firstRow);
    routhTable.push(secondRow);

    let rowIndex = 2;
    while (true) {
      let prevRow = routhTable[rowIndex - 2];
      let currentRow = routhTable[rowIndex - 1];

      if (currentRow.length < 1) {
        break;
      }

      let newRow = [];
      for (let i = 0; i < prevRow.length - 1; i++) {
        const a = prevRow[0] || 0;
        const b = currentRow[0] || 0;
        const c = prevRow[i + 1] || 0;
        const d = currentRow[i + 1] || 0;

        let value = ((b * c) - (a * d)) / b;

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

  const analyzeStability = () => {
    const coeffs = coefficients
      .split(',')
      .map((item) => parseFloat(item.trim()))
      .filter((item) => !isNaN(item));

    if (coeffs.length === 0) {
      setResult('Please enter valid coefficients.');
      setRhsPoles(null);
      setRouthTable([]);
      return;
    }

    let routhTable = calculateRouthTable(coeffs);
    setRouthTable(routhTable);

    let rhsPolesCount = 0;
    let prevSign = Math.sign(routhTable[0][0]);
    for (let i = 1; i < routhTable.length; i++) {
      if (routhTable[i][0] !== undefined) {
        const currentSign = Math.sign(routhTable[i][0]);
        if (currentSign !== prevSign && currentSign !== 0) {
          rhsPolesCount++;
        }
        prevSign = currentSign;
      }
    }

    if (rhsPolesCount === 0) {
      setResult('The system is stable.');
      setRhsPoles(null);
    } else {
      setResult('The system is unstable.');
      setRhsPoles(rhsPolesCount);
    }
  };

  const renderRouthTable = () => {
    return (
      <table className={styles.table}>
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
    <div className={styles.routhContainer}> {/* Apply the container class here */}
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
      <div>
        <h3>Result:</h3>
        <p>{result}</p>
        {rhsPoles !== null && (
          <p>Number of poles in the Right-Hand Side of the plane: {rhsPoles}</p>
        )}
      </div>

      {routhTable.length > 0 && renderRouthTable()}
    </div>
  );
};

export default RouthCriterion;
