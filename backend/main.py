from flask_cors import CORS
from flask import Flask, jsonify, request
from db import init_db, get_db
import os, json, uuid

app = Flask(__name__)
CORS(app)

# Initialize DB on startup
init_db()

@app.route('/api/comics', methods=['POST'])
def save_comic():
    data = request.get_json()
    comic_id = str(uuid.uuid4())[:8]
    
    conn = get_db()
    conn.execute("""
        INSERT INTO comics (comic_id, title, author, canvas_json, preview_base64)
        VALUES (?, ?, ?, ?, ?)
    """, (comic_id, data.get('title', 'Untitled Comic'), data.get('author', 'Anonymous'),
          data.get('canvas_json', '{}'), data.get('preview_base64', '')))
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success', 'comic_id': comic_id})

@app.route('/api/comics', methods=['GET'])
def get_comics():
    conn = get_db()
    # We only fetch metadata and preview image logic to avoid huge payloads
    rows = conn.execute("SELECT comic_id, title, author, preview_base64, created_at FROM comics ORDER BY created_at DESC").fetchall()
    conn.close()
    
    comics = [dict(r) for r in rows]
    return jsonify({'comics': comics})

@app.route('/api/comics/<comic_id>', methods=['GET'])
def get_comic(comic_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM comics WHERE comic_id = ?", (comic_id,)).fetchone()
    conn.close()
    
    if not row:
        return jsonify({'error': 'Comic not found'}), 404
        
    return jsonify({'comic': dict(row)})

@app.route('/api/characters', methods=['POST'])
def save_character():
    data = request.get_json()
    name = data.get('name', 'Anonymous')
    gender = data.get('gender', 'Other')
    face = data.get('face', '')
    body = data.get('body', '')
    hair = data.get('hair', '')
    facial_hair = data.get('facial_hair', '')
    accessory = data.get('accessory', '')
    skin_color = data.get('skin_color', '')
    clothing_color = data.get('clothing_color', '')
    
    conn = get_db()
    row = conn.execute("""
        SELECT id, usage_count FROM characters 
        WHERE name=? AND gender=? AND body=? AND hair=? AND accessory=? AND skin_color=? AND clothing_color=?
    """, (name, gender, body, hair, accessory, skin_color, clothing_color)).fetchone()
    
    if row:
        conn.execute("""
            UPDATE characters 
            SET usage_count = usage_count + 1, face=?, facial_hair=?, last_used=CURRENT_TIMESTAMP
            WHERE id=?
        """, (face, facial_hair, row['id']))
    else:
        conn.execute("""
            INSERT INTO characters (name, gender, face, body, hair, facial_hair, accessory, skin_color, clothing_color)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (name, gender, face, body, hair, facial_hair, accessory, skin_color, clothing_color))
        
    conn.commit()
    conn.close()
    
    return jsonify({'status': 'success'})

@app.route('/api/characters', methods=['GET'])
def get_characters():
    conn = get_db()
    rows = conn.execute("SELECT * FROM characters ORDER BY usage_count DESC, last_used DESC LIMIT 20").fetchall()
    conn.close()
    
    chars = [dict(r) for r in rows]
    return jsonify({'characters': chars})

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)