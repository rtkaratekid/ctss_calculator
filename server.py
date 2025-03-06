from flask import Flask, request, jsonify, render_template, send_from_directory
import json
import os
import datetime

app = Flask(__name__)

# Ensure the data directory exists
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

@app.route('/api/get-current-training-load')
def get_current_training_load():
    filename = 'data/training_load.jsonl'
    date = datetime.datetime.now().strftime('%Y-%m-%d')
    training_load = {'date': date, 'daily_stress': 0, 'ctl': 0, 'atl': 0, 'tsb': 0}

    if os.path.exists(filename):
        with open(filename, 'r') as f:
            for line in f:
                training_load = json.loads(line)
    
    return jsonify(training_load)


@app.route('/api/get-last-training-load')
def get_last_training_load():
    filename = 'data/training_load.jsonl'
    date = datetime.datetime.now().strftime('%Y-%m-%d')
    training_load = {'date': date, 'daily_stress': 0, 'ctl': 0, 'atl': 0, 'tsb': 0}

    if os.path.exists(filename):
        with open(filename, 'r') as f:
            for line in f:
                # get the line with the most recent date that isn't today
                if json.loads(line).get('date') != date:
                    training_load = json.loads(line)
    
    print('Training laod:', training_load)
    return jsonify(training_load)

@app.route('/api/bctss')
def get_bctss():
    filename = 'data/bouldering_sessions.jsonl'
    date = datetime.datetime.now().strftime('%Y-%m-%d')
    total_bctss = 0

    if os.path.exists(filename):
        with open(filename, 'r') as f:
            for line in f:
                session = json.loads(line)
                if session.get('date') == date:
                    total_bctss += session.get('totalCTSS')

    return jsonify({'date': date, 'totalCTSS': total_bctss})

@app.route('/api/ectss')
def get_ectss():
    filename = 'data/endurance_sessions.jsonl'
    date = datetime.datetime.now().strftime('%Y-%m-%d')
    total_ectss = 0

    if os.path.exists(filename):
        with open(filename, 'r') as f:
            for line in f:
                session = json.loads(line)
                if session.get('date') == date:
                    total_ectss += session.get('totalCTSS')

    return jsonify({'date': date, 'totalCTSS': total_ectss})

@app.route('/api/hctss')
def get_hctss():
    filename = 'data/hangboard_sessions.jsonl'
    date = datetime.datetime.now().strftime('%Y-%m-%d')
    total_hctss = 0

    if os.path.exists(filename):
        with open(filename, 'r') as f:
            for line in f:
                session = json.loads(line)
                if session.get('date') == date:
                    total_hctss += session.get('totalCTSS')

    return jsonify({'date': date, 'totalCTSS': total_hctss})

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
                    session = json.loads(line)
                    historical_data.append({
                        'date': session.get('date'),
                        'totalCTSS': session.get('totalCTSS')
                    })

    return jsonify(historical_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)