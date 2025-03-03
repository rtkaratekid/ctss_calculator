from flask import Flask, request, send_from_directory
import json
import os

app = Flask(__name__)

# Ensure the data directory exists
if not os.path.exists('data'):
    os.makedirs('data')

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/submit-session', methods=['POST'])
def submit_session():
    data = request.json
    print('Received data:', data)  # Add this line

    session_type = data.get('type')
    
    if session_type not in ['bouldering', 'endurance', 'hangboard']:
        return {'error': 'Invalid session type'}, 400

    filename = f'data/{session_type}_sessions.jsonl'
    
    # Append new session data
    with open(filename, 'a') as f:
        json.dump(data, f, separators=(',', ':'))
        f.write('\n')

    return {'message': f'{session_type.capitalize()} session saved successfully'}, 200


if __name__ == '__main__':
    app.run(debug=True)