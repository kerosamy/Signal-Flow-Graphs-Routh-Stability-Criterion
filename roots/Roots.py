from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app) 
@app.route('/calculate_rhs_roots', methods=['POST'])
def calculate_rhs_roots():
    data = request.get_json()
    coeffs = data.get('coefficients', [])

    try:
        roots = np.roots(coeffs)
        rhs_roots = [r.real + r.imag * 1j for r in roots if r.real > 0]
        return jsonify({
            "rhs_roots": [str(r) for r in rhs_roots]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True)
