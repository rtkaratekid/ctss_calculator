from datetime import datetime, timedelta, timezone
import math
import json
import sqlite3
from typing import Optional, List, Dict

class TrainingLoad:
    def __init__(self, date: str, daily_stress: float, ctl: float, atl: float, tsb: float):
        self.date = date
        self.daily_stress = daily_stress
        self.ctl = ctl
        self.atl = atl
        self.tsb = tsb
    
    def __str__(self):
        return (f"TrainingLoad({self.date}, Stress: {self.daily_stress:.1f}, "
                f"CTL: {self.ctl:.1f}, ATL: {self.atl:.1f}, TSB: {self.tsb:.1f})")
    
    def to_dict(self) -> Dict:
        return {
            'date': self.date,
            'daily_stress': round(self.daily_stress, 1),
            'ctl': round(self.ctl, 1),
            'atl': round(self.atl, 1),
            'tsb': round(self.tsb, 1)
        }
    
    @classmethod
    def new(cls) -> 'TrainingLoad':
        date = datetime.now().strftime('%Y-%m-%d')
        return cls(date, 0.0, 0.0, 0.0, 0.0)

    def save(self, cursor: sqlite3.Cursor):
        # Add date validation
        current_date = datetime.now(timezone.utc).date()
        record_date = datetime.strptime(self.date, '%Y-%m-%d').date()
        
        if record_date > current_date:
            raise ValueError("Cannot save training load for future dates")

        cursor.execute('''
            INSERT OR REPLACE INTO training_load 
            (date, daily_stress, ctl, atl, tsb)
            VALUES (?, ?, ?, ?, ?)
        ''', (self.date, self.daily_stress, self.ctl, self.atl, self.tsb))

    @classmethod
    def get_by_date(cls, cursor: sqlite3.Cursor, date: str) -> Optional['TrainingLoad']:
        cursor.execute('SELECT date, daily_stress, ctl, atl, tsb FROM training_load WHERE date = ?', (date,))
        row = cursor.fetchone()
        if not row:
            return None
        return cls(row[0], row[1], row[2], row[3], row[4])

    @classmethod
    def get_previous_load(cls, cursor: sqlite3.Cursor, current_date: str) -> Optional['TrainingLoad']:
        """Get the latest training load BEFORE or ON the specified date"""
        cursor.execute('''
            SELECT date, daily_stress, ctl, atl, tsb 
            FROM training_load 
            WHERE date <= ?
            ORDER BY date DESC 
            LIMIT 1
        ''', (current_date,))
        row = cursor.fetchone()
        return cls(row[0], row[1], row[2], row[3], row[4]) if row else None

    @classmethod
    def get_latest(cls, cursor: sqlite3.Cursor) -> Optional['TrainingLoad']:
        cursor.execute('''
            SELECT date, daily_stress, ctl, atl, tsb 
            FROM training_load 
            ORDER BY date DESC 
            LIMIT 1
        ''')
        row = cursor.fetchone()
        return cls(row[0], row[1], row[2], row[3], row[4]) if row else None

    def calculate(self, cursor: sqlite3.Cursor):
        """Calculate CTL/ATL/TSB using UTC dates"""
        # previous_load = self.get_latest(cursor)
        previous_load = self.get_previous_load(cursor, self.date)

        
        if not previous_load:
            self.ctl = self.daily_stress
            self.atl = self.daily_stress
            self.tsb = 0.0
            return


        # Parse dates as UTC datetimes
        prev_date = datetime.strptime(previous_load.date, '%Y-%m-%d').replace(tzinfo=timezone.utc)
        current_date = datetime.strptime(self.date, '%Y-%m-%d').replace(tzinfo=timezone.utc)
        
        if prev_date == current_date and previous_load.daily_stress == self.daily_stress:
            self.ctl = previous_load.ctl
            self.atl = previous_load.atl
            self.tsb = previous_load.tsb
            return

        # Calculate precise days elapsed
        # delta = current_date - prev_date
        # exact_days = delta.total_seconds() / (3600 * 24)
        # full_days_elapsed = int(exact_days)  # Only count completed days
        delta = current_date - prev_date
        full_days_elapsed = max(delta.days - 1, 0)  # THIS IS THE CRITICAL FIX

        # print(f"Date debug: Prev {prev_date} | Current {current_date} | Days {exact_days:.2f}")

        # Apply decay only for full days
        ctl = previous_load.ctl * (29/30) ** full_days_elapsed
        atl = previous_load.atl * (6/7) ** full_days_elapsed

        # Add today's stress
        ctl = ctl * (29/30) + self.daily_stress * (1/30)
        atl = atl * (6/7) + self.daily_stress * (1/7)

        # Round values
        self.ctl = round(ctl, 1)
        self.atl = round(atl, 1)
        self.tsb = round(self.ctl - self.atl, 1)

        print(f"""
        Training Load Calculation:
        - Previous Date: {previous_load.date} (UTC)
        - Current Date:  {self.date} (UTC)
        - Full Days Elapsed: {full_days_elapsed}
        - Previous Stress: {previous_load.daily_stress:.1f} → New Stress: {self.daily_stress:.1f}
        - Previous CTL: {previous_load.ctl:.1f} → New CTL: {self.ctl:.1f}
        - Previous ATL: {previous_load.atl:.1f} → New ATL: {self.atl:.1f}
        """)




class Session:
    def __init__(self, session_type: str, date: str, data: Dict):
        self.session_type = session_type
        self.date = date
        self.data = data
        self.total_ctss = 0.0
        
        # Calculate CTSS on initialization
        self.calculate_ctss()

    def __str__(self):
        return f"Session({self.date}, {self.session_type}, CTSS: {self.total_ctss:.1f})"

    def to_dict(self) -> Dict:
        return {
            'type': self.session_type,
            'date': self.date,
            'total_ctss': round(self.total_ctss, 1),
            'data': self.data
        }

    def save(self, cursor: sqlite3.Cursor):
        cursor.execute('''
            INSERT INTO sessions (type, date, total_ctss, data)
            VALUES (?, ?, ?, ?)
        ''', (self.session_type, self.date, self.total_ctss, json.dumps(self.data)))

    @classmethod
    def get_by_date(cls, cursor: sqlite3.Cursor, date: str) -> List['Session']:
        cursor.execute('SELECT type, date, total_ctss, data FROM sessions WHERE date = ?', (date,))
        return [cls(row[0], row[1], json.loads(row[3])) for row in cursor.fetchall()]

    def calculate_ctss(self):
        """Calculate session-specific CTSS based on type"""
        print(f"Calculating CTSS for {self.session_type} session")
        if self.session_type == 'bouldering':
            self._calculate_bouldering_ctss()
        elif self.session_type == 'endurance':
            self._calculate_endurance_ctss()
        elif self.session_type == 'hangboard':
            self._calculate_hangboard_ctss()
        else:
            raise ValueError(f"Invalid session type: {self.session_type}")

    def _calculate_bouldering_ctss(self):
        print('Calculating bouldering CTSS')
        """Bouldering CSS formula implementation"""
        max_grade = int(self.data['max_grade'])  # Convert to integer
        attempts = self.data['attempts']
        duration = float(self.data['duration_hours'])  # Ensure float type


        intensity_sum = sum(
            ((int(grade) + 1) / (max_grade + 1)) ** 2 * count
            for grade, count in attempts.items()
        )
        
        total_attempts = sum(int(count) for count in attempts.values())
        self.total_ctss = intensity_sum * (total_attempts / duration)
        # total_attempts = sum(attempts.values())
        # self.total_ctss = intensity_sum * (total_attempts / duration)
        print(f"Total CTSS: {self.total_ctss:.1f}")

    def _calculate_endurance_ctss(self):
        """Endurance ECSS formula implementation"""
        max_grade = float(self.data['max_grade'])
        routes = self.data['routes']
        session_duration = float(self.data['duration_hours'])

        intensity_time = 0.0
        total_climbing_time = 0.0
        
        for route in routes:
            # Convert values to floats from JSON numbers/strings
            grade = float(route['grade'])
            time_minutes = float(route['time'])  # Time is in minutes from client
            
            # Convert minutes to hours for calculations
            time_hours = time_minutes / 60
            
            intensity_time += (grade / max_grade) ** 2 * time_hours
            total_climbing_time += time_hours

        self.total_ctss = 100 * intensity_time * (total_climbing_time / session_duration)
        print(f"Total ECTSS: {self.total_ctss:.1f}")

    def _calculate_hangboard_ctss(self):
        """Hangboard HSS formula implementation"""
        scaling_factor = 1  # Use the established scaling factor
        sets = self.data['sets']
        duration = float(self.data['duration_hours'])

        intensity_tut = sum(
            (set['intensity'] ** 2) *          # Access dictionary values
            set['reps'] * 
            (set['secondsPerRep'] / 60)        # Convert seconds to minutes
            for set in sets
        )
        
        total_tut = sum(
            set['reps'] * (set['secondsPerRep'] / 60)
            for set in sets
        )
        
        self.total_ctss = intensity_tut * (total_tut / duration) * scaling_factor

class TrainingLoadManager:
    @staticmethod
    def update_daily_load(cursor: sqlite3.Cursor, date: str):
        """Update daily training load for a specific date"""
        # Get all sessions for the date
        sessions = Session.get_by_date(cursor, date)
        daily_stress = sum(session.total_ctss for session in sessions)

        # Get or create training load
        training_load = TrainingLoad.get_by_date(cursor, date) or TrainingLoad.new()
        training_load.date = date
        training_load.daily_stress = daily_stress
        
        # Calculate CTL/ATL/TSB
        training_load.calculate(cursor)
        training_load.save(cursor)
