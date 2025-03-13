from flask import Flask, request, jsonify, render_template, send_from_directory
import sqlite3
import os
from datetime import datetime
from training_load import TrainingLoad, Session, TrainingLoadManager

app = Flask(__name__)
DATABASE = 'training_data.db'

def init_db():
    with sqlite3.connect(DATABASE) as conn:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS sessions
                    (id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT,
                    date TEXT,
                    total_ctss REAL,
                    data TEXT)''')
        
        c.execute('''
            CREATE TABLE IF NOT EXISTS training_load (
                date TEXT PRIMARY KEY,
                daily_stress REAL,
                ctl REAL,
                atl REAL,
                tsb REAL
            )
        ''')
        conn.commit()

init_db()

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
    try:
        session_type = data['type']
        date = data.get('date', datetime.now().strftime('%Y-%m-%d'))
        print(f"Received {session_type} session data for {date}")
        print(data)
        
        with sqlite3.connect(DATABASE) as conn:
            # Create session with calculated CTSS
            session = Session(session_type, date, data)
            session.save(conn.cursor())
            
            # Update training load for this date
            TrainingLoadManager.update_daily_load(conn.cursor(), date)
            conn.commit()

        return jsonify({
            'message': 'Session saved successfully',
            'total_ctss': round(session.total_ctss, 1),
            'session': session.to_dict()
        }), 200
    
    except (KeyError, ValueError) as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/historical-data/<session_type>')
def get_historical_data(session_type):
    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            
            if session_type == 'training_load':
                cursor.execute('SELECT date FROM training_load ORDER BY date')
                dates = [row[0] for row in cursor.fetchall()]
                loads = [TrainingLoad.get_by_date(cursor, date).to_dict() for date in dates]
                return jsonify(loads)
            
            if session_type not in ['bouldering', 'endurance', 'hangboard']:
                return jsonify({'error': 'Invalid session type'}), 400
                
            cursor.execute('SELECT date, total_ctss FROM sessions WHERE type = ? ORDER BY date', (session_type,))
            return jsonify([{'date': row[0], 'total_ctss': row[1]} for row in cursor.fetchall()])
    
    except Exception as e:
        return jsonify({'error': 'Server error'}), 500

@app.route('/api/daily-stress')
def get_daily_stress():
    try:
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        with sqlite3.connect(DATABASE) as conn:

            # Update training load for requested date
            TrainingLoadManager.update_daily_load(conn.cursor(), date)
            conn.commit()
            
            # Get updated load
            load = TrainingLoad.get_by_date(conn.cursor(), date)
            
        return jsonify(load.to_dict() if load else {'error': 'No data found'}), 200
    
    except Exception as e:
        return jsonify({'error': 'Server error'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
