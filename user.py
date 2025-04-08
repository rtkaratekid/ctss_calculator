from enum import Enum

class GripType(Enum):
    TWENTY_MM_HALF_CRIMP = '20mm_half_crimp'
    TWENTY_MM_IMR_HALF_CRIMP = '20mm_imr_half_crimp'
    TWENTY_MM_MRP_HALF_CRIMP = '20mm_mrp_half_crimp'
    FULL_CRIMP = 'full_crimp'
    TWENTY_MM_CHISEL = '20mm_chisel'
    DEEP_2_FINGER_POCKET = 'deep_2finger_pocket'
    SHALLOW_2_FINGER_POCKET = 'shallow_2finger_pocket'
    SLOPER = 'sloper'
    WIDE_PINCH = 'wide_pinch'
    MEDIUM_PINCH = 'medium_pinch'
    NARROW_PINCH = 'narrow_pinch'

class User:
    def __init__(self, id, name, email, password):
        self.id = id
        self.name = name
        self.email = email
        self.password = password
        self.bouldering_max_grade = None
        self.route_max_grade = None
        # self.max_weighted_hangs = {
        #     GripType.TWENTY_MM_HALF_CRIMP: None,
        #     GripType.TWENTY_MM_IMR_HALF_CRIMP: None,
        #     GripType.TWENTY_MM_MRP_HALF_CRIMP: None,
        #     GripType.FULL_CRIMP: None,
        #     GripType.TWENTY_MM_CHISEL: None,
        #     GripType.DEEP_2_FINGER_POCKET: None,
        #     GripType.SHALLOW_2_FINGER_POCKET: None,
        #     GripType.SLOPER: None,
        #     GripType.WIDE_PINCH: None,
        #     GripType.MEDIUM_PINCH: None,
        #     GripType.NARROW_PINCH: None
        # }

    def save(self, cursor):
        cursor.execute("INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)", (self.id, self.name, self.email, self.password))

    @staticmethod
    def get_by_email(cursor, email):
        cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
        user_tuple = cursor.fetchone()
        if user_tuple:
            return User(user_tuple[0], user_tuple[1], user_tuple[2], user_tuple[3])
        else:
            return None
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'password': self.password,
            'bouldering_max_grade': self.bouldering_max_grade,
            'route_max_grade': self.route_max_grade,
        }
