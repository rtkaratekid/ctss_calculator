from flask import Flask, request, jsonify, render_template, send_from_directory
import json
import os
import datetime

app = Flask(__name__)

if not os.path.exists('data'):
    os.makedirs('data')

@app.route('/')
def serve_index():
    return render_template('index.html')

@app.route('/<path:path>')
def serve_static(path):
    if path.endswith('.html'):
        return render_template(path)
    return send_from_directory('static', path)

@app.route('/api/submit-session', methods=['POST'])
def submit_session():
    data = request.json
    print('Received data:', data)

    session_type = data.get('type')
    
    if session_type not in ['bouldering', 'endurance', 'hangboard']:
        return {'error': 'Invalid session type'}, 400

    filename = f'data/{session_type}_sessions.jsonl'
    
    with open(filename, 'a') as f:
        json.dump(data, f, separators=(',', ':'))
        f.write('\n')

    return {'message': f'{session_type.capitalize()} session saved successfully'}, 200

@app.route('/api/submit-training-load', methods=['POST'])
def submit_training_load():
    data = request.json
    print('Received data:', data)

    filename = 'data/training_load.jsonl'
    
    with open(filename, 'a') as f:
        json.dump(data, f, separators=(',', ':'))
        f.write('\n')

    return {'message': 'Training load saved successfully'}, 200

@app.route('/api/historical-data/<session_type>')
def get_historical_data(session_type):
    if session_type not in ['bouldering', 'endurance', 'hangboard', 'training_load']:
        return {'error': 'Invalid session type'}, 400

    historical_data = []

    filename = ''
    if session_type == 'training_load':
        filename = 'data/training_load.jsonl'
        with open(filename) as f:
            for line in f:
                training_load = json.loads(line)
                historical_data.append({
                    'date': training_load.get('date'),
                    'daily_stress': training_load.get('daily_stress'),
                    'ctl': training_load.get('ctl'),
                    'atl': training_load.get('atl'),
                    'tsb': training_load.get('tsb')
                })
    else:
        filename = f'data/{session_type}_sessions.jsonl'
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                for line in f:
                    try:
                        session = json.loads(line.strip())
                        historical_data.append({
                            'date': session.get('date'),
                            'totalCTSS': session.get('totalCTSS')
                        })
                    except json.JSONDecodeError as e:
                        print(f"Error parsing JSON on line: {line}")
                        print(f"Error details: {str(e)}")
                        continue  # Skip this line and continue with the next

    return jsonify(historical_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)