import React from 'react';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

function convertToFractionLatex(expr) {
  if (typeof expr !== 'string') return expr;

  // Converts 'A / B' into LaTeX \frac{A}{B}
  return expr.replace(/([^\s()]+)\s*\/\s*([^\s()]+)/g, (_, numerator, denominator) => {
    return `\\frac{${numerator}}{${denominator}}`;
  });
}

function ResultModal({ showResultModal, analysisResult, closeResultModal }) {
  if (!showResultModal) return null;

  const { 
    forward_paths = [], 
    loops = [], 
    transfer_function = {}, 
    determinant = {}, 
    forward_path_gains = [], 
    loop_gains = [],
    path_determinants = []
  } = analysisResult.result;

  return (
    <MathJaxContext>
      <MathJax>
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Signal Flow Graph Analysis</h2>
            
            {/* Transfer Function */}
            <div className="result-section">
              <h3>Transfer Function</h3>
              <div className="result-box">
                <p>
                  <strong>Expression:</strong>{" "}
                  <MathJax inline>
                    {"\\(" + convertToFractionLatex(transfer_function.expression) + "\\)"}
                  </MathJax>
                </p>
                <p>
                  <strong>Numeric Value:</strong>{" "}
                  <MathJax inline>
                    {"\\(" + convertToFractionLatex(transfer_function.numeric_value) + "\\)"}
                  </MathJax>
                </p>
              </div>
            </div>
            
            {/* Determinant */}
            <div className="result-section">
              <h3>Determinant (Δ)</h3>
              <div className="result-box">
                <p>
                  <strong>Expression:</strong>{" "}
                  <MathJax inline>
                    {"\\(" + convertToFractionLatex(determinant.expression) + "\\)"}
                  </MathJax>
                </p>
                <p>
                  <strong>Numeric Value:</strong>{" "}
                  <MathJax inline>
                    {"\\(" + convertToFractionLatex(determinant.numeric_value) + "\\)"}
                  </MathJax>
                </p>
              </div>
            </div>
            
            {/* Forward Paths */}
            <div className="result-section">
              <h3>Forward Paths</h3>
              <div className="result-box">
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Path</th>
                      <th>Gain</th>
                      <th>Path Determinant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forward_paths.map((path, index) => {
                      const gain = forward_path_gains[index]?.gain || '';
                      const pathDet = path_determinants[index]?.determinant || '';
                      return (
                        <tr key={index}>
                          <td>{path.id || `P${index+1}`}</td>
                          <td>{path.display}</td>
                          <td><MathJax inline>{"\\(" + convertToFractionLatex(gain) + "\\)"}</MathJax></td>
                          <td><MathJax inline>{"\\(" + convertToFractionLatex(pathDet) + "\\)"}</MathJax></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Loops */}
            <div className="result-section">
              <h3>Loops</h3>
              <div className="result-box">
                <table className="result-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Loop</th>
                      <th>Gain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loops.map((loop, index) => {
                      const gain = loop_gains[index] || '';
                      return (
                        <tr key={index}>
                          <td>{loop.id || `L${index+1}`}</td>
                          <td>{loop.display}</td>
                          <td><MathJax inline>{"\\(" + convertToFractionLatex(gain) + "\\)"}</MathJax></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={closeResultModal} className="close-button">Close</button>
            </div>
          </div>

          <style jsx>{`
            .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background-color: rgba(0, 0, 0, 0.7);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 1000;
            }
            
            .modal-content {
              background: white;
              border-radius: 8px;
              padding: 20px;
              width: 80%;
              max-width: 800px;
              max-height: 90vh;
              overflow-y: auto;
            }
            
            h2 {
              text-align: center;
              margin-bottom: 20px;
              color: #333;
            }
            
            h3 {
              margin-top: 15px;
              margin-bottom: 10px;
              color: #444;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
            }
            
            .result-section {
              margin-bottom: 20px;
            }
            
            .result-box {
              background-color: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 5px;
              padding: 15px;
            }
            
            .result-table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .result-table th, .result-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            .result-table th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            
            .result-table tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .modal-footer {
              display: flex;
              justify-content: center;
              margin-top: 20px;
            }
            
            .close-button {
              background-color: #4CAF50;
              border: none;
              color: white;
              padding: 10px 20px;
              font-size: 16px;
              cursor: pointer;
              border-radius: 4px;
            }
            
            .close-button:hover {
              background-color: #45a049;
            }
          `}</style>
        </div>
      </MathJax>
    </MathJaxContext>
  );
}

export default ResultModal;
