import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "comiccrafter.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        gender TEXT,
        face TEXT,
        body TEXT,
        hair TEXT,
        facial_hair TEXT,
        accessory TEXT,
        skin_color TEXT,
        clothing_color TEXT,
        usage_count INTEGER DEFAULT 1,
        last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, gender, body, hair, accessory, skin_color, clothing_color)
    )
    """)
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
