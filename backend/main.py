from google import genai
from google.genai import types
from flask_cors import CORS
from flask import Flask, jsonify, request, render_template, send_file
from dotenv import load_dotenv
from db import init_db, get_db
import os, json, uuid, hashlib, urllib.parse
from datetime import datetime, timedelta

load_dotenv()

# ── Gemini client (new SDK) ───────────────────────────────────────────────
client = genai.Client(api_key=os.getenv("API_KEY"))
GOOGLE_MAPS_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

app = Flask(__name__, template_folder='../frontend/build', static_folder='../frontend/build/static')
CORS(app)

# Initialize DB on startup
init_db()

# ── Helpers ────────────────────────────────────────────────────────────────

def ai_generate(prompt, use_search=True):
    """Generate content via Gemini, optionally with Google Search grounding."""
    print(f"\n[{datetime.utcnow().isoformat()}] --- STARTING GEMINI API CALL ---")
    print(f"Use Search: {use_search}")
    print(f"Prompt preview: {prompt[:100]}...\n")
    config_kwargs = {}
    if use_search:
        tools = [types.Tool(google_search=types.GoogleSearch())]
        config_kwargs['tools'] = tools
    
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(**config_kwargs)
        )
        print(f"[{datetime.utcnow().isoformat()}] --- GEMINI API CALL FINISHED ---")
        return response.text
    except Exception as e:
        print(f"[{datetime.utcnow().isoformat()}] --- GEMINI API EXT ERROR: {str(e)} ---")
        raise e

def ai_generate_json(prompt, use_search=True):
    """Generate content and parse as JSON."""
    print(f"[{datetime.utcnow().isoformat()}] Preparing to call ai_generate()...")
    raw = ai_generate(prompt, use_search)
    print(f"[{datetime.utcnow().isoformat()}] AI text generated. Length: {len(raw)}. Attempting JSON parse...")
    
    # Strip markdown fences
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
    if cleaned.startswith("json"):
        cleaned = cleaned[4:].strip()
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()
    try:
        parsed = json.loads(cleaned)
        print(f"[{datetime.utcnow().isoformat()}] JSON successfully parsed!")
        return parsed
    except:
        # Try to find JSON within the text
        print(f"[{datetime.utcnow().isoformat()}] Standard JSON parse failed. Attempting fallback parse...")
        start = cleaned.find('{')
        end = cleaned.rfind('}')
        if start == -1:
            start = cleaned.find('[')
            end = cleaned.rfind(']')
        if start != -1 and end != -1:
            parsed = json.loads(cleaned[start:end+1])
            print(f"[{datetime.utcnow().isoformat()}] Fallback JSON successfully parsed!")
            return parsed
        print(f"[{datetime.utcnow().isoformat()}] ALL JSON parse attempts failed.")
        raise ValueError(f"Could not parse JSON from: {raw[:200]}")

def query_hash(q):
    return hashlib.md5(q.strip().lower().encode()).hexdigest()

def build_google_maps_dir_url(stops):
    """Build a Google Maps directions URL for a list of stops."""
    if not stops or len(stops) < 2:
        return ""
    base = "https://www.google.com/maps/dir/"
    parts = []
    for s in stops:
        parts.append(f"{s['latitude']},{s['longitude']}")
    return base + "/".join(parts)

# ── Routes ─────────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return render_template('index.html')

# ─────────────────────────────────────────────────────────────────────────────
# SEARCH — AI-powered discovery with Google Search grounding
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/search', methods=['POST'])
def search():
    data = request.get_json()
    query_text = data.get('query', '').strip()
    city = data.get('city', '')
    if not query_text:
        return jsonify({'error': 'No query provided'}), 400

    # Check cache first
    qh = query_hash(query_text + city)
    conn = get_db()
    cached = conn.execute("SELECT results_json FROM search_cache WHERE query_hash = ? AND expires_at > ?",
                          (qh, datetime.utcnow().isoformat())).fetchone()
    if cached:
        conn.close()
        return jsonify(json.loads(cached['results_json']))

    # AI search
    prompt = f"""You are a travel expert. For the query: "{query_text}" {f'in/near {city}' if city else ''}

Return a JSON array of places. Each place must have:
{{
  "name": "Place Name",
  "category": "temple|restaurant|beach|museum|park|shopping|viewpoint|hotel|cafe|historical|adventure|nightlife",
  "latitude": 12.345,
  "longitude": 78.901,
  "formatted_address": "Full address",
  "city": "City name",
  "state": "State name",
  "country": "Country",
  "description": "2-3 sentence description",
  "google_rating": 4.5,
  "entry_fee": "Free" or "₹50",
  "estimated_visit_duration_minutes": 60,
  "best_time_to_visit": "Early morning 6-8 AM",
  "crowd_level": "low|moderate|high",
  "tags": ["family-friendly", "photography", "sunset"],
  "local_tips": "One insider tip",
  "photo_keyword": "keyword for finding a photo of this place"
}}

Return 6-10 places. Return ONLY the JSON array, no markdown.
Coordinates MUST be accurate real-world latitude/longitude."""

    try:
        places = ai_generate_json(prompt, use_search=True)
        if isinstance(places, dict) and 'places' in places:
            places = places['places']
        if not isinstance(places, list):
            places = [places]

        # Store each place in DB
        for p in places:
            place_id = str(uuid.uuid4())[:12]
            p['place_id'] = place_id
            try:
                conn.execute("""
                    INSERT OR IGNORE INTO places
                    (place_id, name, description, category, latitude, longitude,
                     formatted_address, city, state, country, google_rating,
                     entry_fee, estimated_visit_duration_minutes, best_time_to_visit,
                     crowd_level, tags_json, local_tips, ai_summary, source)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, (place_id, p.get('name'), p.get('description'), p.get('category'),
                      p.get('latitude'), p.get('longitude'), p.get('formatted_address'),
                      p.get('city'), p.get('state'), p.get('country'), p.get('google_rating'),
                      p.get('entry_fee'), p.get('estimated_visit_duration_minutes'),
                      p.get('best_time_to_visit'), p.get('crowd_level'),
                      json.dumps(p.get('tags', [])), p.get('local_tips'),
                      p.get('description'), 'ai'))
            except Exception as e:
                print(f"DB insert error for {p.get('name')}: {e}")

        # Cache the search result
        result_payload = {'places': places, 'query': query_text, 'city': city}
        conn.execute("""
            INSERT OR REPLACE INTO search_cache (query_hash, original_query, city, results_json, result_count, expires_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (qh, query_text, city, json.dumps(result_payload), len(places),
              (datetime.utcnow() + timedelta(days=7)).isoformat()))

        conn.commit()
        conn.close()
        return jsonify(result_payload)

    except Exception as e:
        conn.close()
        print(f"Search error: {e}")
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# PLACE DETAILS
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/place/<place_id>', methods=['GET'])
def get_place(place_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM places WHERE place_id = ?", (place_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Place not found'}), 404

    # Increment view count
    conn.execute("UPDATE places SET view_count = view_count + 1 WHERE place_id = ?", (place_id,))
    conn.commit()

    place = dict(row)
    place['tags'] = json.loads(place.get('tags_json') or '[]')

    # Get reviews
    reviews = conn.execute(
        "SELECT * FROM place_reviews WHERE place_id = ? ORDER BY created_at DESC LIMIT 10",
        (place_id,)
    ).fetchall()
    place['reviews'] = [dict(r) for r in reviews]

    conn.close()
    return jsonify({'place': place})

@app.route('/api/place/<place_id>/review', methods=['POST'])
def add_review(place_id):
    data = request.get_json()
    conn = get_db()
    conn.execute("""
        INSERT INTO place_reviews (place_id, session_id, reviewer_name, rating, review_text, visit_date)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (place_id, data.get('session_id'), data.get('reviewer_name', 'Anonymous'),
          data.get('rating'), data.get('review_text'), data.get('visit_date')))

    # Update place aggregate rating
    stats = conn.execute(
        "SELECT AVG(rating) as avg_r, COUNT(*) as cnt FROM place_reviews WHERE place_id = ?", (place_id,)
    ).fetchone()
    conn.execute("UPDATE places SET wanderwise_rating = ?, wanderwise_total_ratings = ? WHERE place_id = ?",
                 (round(stats['avg_r'], 1), stats['cnt'], place_id))
    conn.commit()
    conn.close()
    return jsonify({'status': 'ok'})

# ─────────────────────────────────────────────────────────────────────────────
# NEARBY PLACES
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/places/nearby', methods=['GET'])
def nearby_places():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius_km = request.args.get('radius', default=5, type=float)
    category = request.args.get('category', default='', type=str)

    if lat is None or lng is None:
        return jsonify({'error': 'lat and lng required'}), 400

    # Simple bounding box (approx)
    delta = radius_km / 111.0
    conn = get_db()
    query = """
        SELECT * FROM places
        WHERE latitude BETWEEN ? AND ?
          AND longitude BETWEEN ? AND ?
    """
    params = [lat - delta, lat + delta, lng - delta, lng + delta]
    if category:
        query += " AND category = ?"
        params.append(category)
    query += " ORDER BY popularity_score DESC LIMIT 50"

    rows = conn.execute(query, params).fetchall()
    conn.close()
    places = []
    for r in rows:
        p = dict(r)
        p['tags'] = json.loads(p.get('tags_json') or '[]')
        places.append(p)
    return jsonify({'places': places})

# ─────────────────────────────────────────────────────────────────────────────
# TRIP PLANNER — AI-generated itinerary with route optimization
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/plan-trip', methods=['POST'])
def plan_trip():
    data = request.get_json()
    city = data.get('city', '')
    num_days = data.get('num_days', 1)
    interests = data.get('interests', [])
    travel_mode = data.get('travel_mode', 'driving')
    budget = data.get('budget_level', 'moderate')

    if not city:
        return jsonify({'error': 'City is required'}), 400

    prompt = f"""You are an expert travel planner. Create a detailed {num_days}-day trip itinerary for {city}.

Traveler interests: {', '.join(interests) if interests else 'general sightseeing'}
Budget level: {budget}
Travel mode: {travel_mode}

Return a JSON object with this EXACT structure:
{{
  "title": "Catchy trip title",
  "city": "{city}",
  "center_latitude": 12.34,
  "center_longitude": 78.90,
  "trip_summary": "2-3 sentence overview of the trip",
  "estimated_total_cost": "₹5,000 - ₹8,000",
  "packing_tips": "Key items to pack",
  "safety_tips": "Important safety advice",
  "best_transport_options": "How to get around",
  "local_phrases": {{"hello": "local_word", "thank you": "local_word", "how much": "local_word"}},
  "days": [
    {{
      "day_number": 1,
      "theme": "Day theme like 'Heritage & Culture'",
      "stops": [
        {{
          "stop_order": 1,
          "place_name": "Exact place name",
          "category": "temple|restaurant|beach|museum|park|viewpoint|cafe|shopping|historical",
          "latitude": 12.345,
          "longitude": 78.901,
          "formatted_address": "Full address",
          "time_slot": "morning|afternoon|evening",
          "suggested_arrival_time": "09:00 AM",
          "suggested_departure_time": "10:30 AM",
          "visit_duration_minutes": 90,
          "entry_fee": "Free or ₹50",
          "tips": "One specific tip for this stop",
          "is_meal_stop": false,
          "description": "Why visit this place"
        }}
      ]
    }}
  ]
}}

CRITICAL RULES:
- Include 4-6 stops per day (mix of sightseeing + meals)
- At least 1 breakfast, 1 lunch, 1 dinner stop per day (mark is_meal_stop: true)
- All coordinates MUST be real, accurate latitude/longitude
- Order stops geographically to minimize travel time
- Include realistic timings with enough travel buffer
- Return ONLY the JSON, no markdown fences."""

    try:
        itinerary_data = ai_generate_json(prompt, use_search=True)
        itinerary_id = str(uuid.uuid4())[:12]
        share_token = str(uuid.uuid4())[:8]

        # Flatten all stops for route building
        all_stops = []
        for day in itinerary_data.get('days', []):
            for stop in day.get('stops', []):
                stop['day_number'] = day['day_number']
                all_stops.append(stop)

        # Build Google Maps direction URLs per day
        days_routes = {}
        for day in itinerary_data.get('days', []):
            day_stops = day.get('stops', [])
            if len(day_stops) >= 2:
                url = build_google_maps_dir_url(day_stops)
                days_routes[day['day_number']] = url

        # Store itinerary in DB
        conn = get_db()
        conn.execute("""
            INSERT INTO itineraries
            (itinerary_id, title, city, state, country, center_latitude, center_longitude,
             num_days, travel_mode, interests_json, budget_level, total_places,
             trip_summary, packing_tips, safety_tips, best_transport_options,
             local_phrases_json, estimated_total_cost, share_token)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (itinerary_id, itinerary_data.get('title'), city, '', '',
              itinerary_data.get('center_latitude'), itinerary_data.get('center_longitude'),
              num_days, travel_mode, json.dumps(interests), budget,
              len(all_stops), itinerary_data.get('trip_summary'),
              itinerary_data.get('packing_tips'), itinerary_data.get('safety_tips'),
              itinerary_data.get('best_transport_options'),
              json.dumps(itinerary_data.get('local_phrases', {})),
              itinerary_data.get('estimated_total_cost'), share_token))

        # Store each stop
        for stop in all_stops:
            place_id = str(uuid.uuid4())[:12]
            # Also insert into places table
            conn.execute("""
                INSERT OR IGNORE INTO places
                (place_id, name, description, category, latitude, longitude, formatted_address,
                 city, entry_fee, estimated_visit_duration_minutes, local_tips, source)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            """, (place_id, stop.get('place_name'), stop.get('description'),
                  stop.get('category'), stop.get('latitude'), stop.get('longitude'),
                  stop.get('formatted_address'), city, stop.get('entry_fee'),
                  stop.get('visit_duration_minutes'), stop.get('tips'), 'itinerary'))

            gmap_link = f"https://www.google.com/maps/search/?api=1&query={stop.get('latitude')},{stop.get('longitude')}"
            conn.execute("""
                INSERT INTO itinerary_stops
                (itinerary_id, place_id, day_number, stop_order, time_slot,
                 place_name, place_category, latitude, longitude, formatted_address,
                 suggested_arrival_time, suggested_departure_time, visit_duration_minutes,
                 entry_fee, tips, is_meal_stop, google_maps_link)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (itinerary_id, place_id, stop.get('day_number'), stop.get('stop_order'),
                  stop.get('time_slot'), stop.get('place_name'), stop.get('category'),
                  stop.get('latitude'), stop.get('longitude'), stop.get('formatted_address'),
                  stop.get('suggested_arrival_time'), stop.get('suggested_departure_time'),
                  stop.get('visit_duration_minutes'), stop.get('entry_fee'),
                  stop.get('tips'), 1 if stop.get('is_meal_stop') else 0, gmap_link))

        # Store route URLs
        for day_num, route_url in days_routes.items():
            day_stops = [s for s in all_stops if s.get('day_number') == day_num]
            waypoints = [{'lat': s['latitude'], 'lng': s['longitude']} for s in day_stops]
            conn.execute("""
                INSERT INTO route_directions
                (itinerary_id, day_number, travel_mode, origin_lat, origin_lng,
                 destination_lat, destination_lng, waypoints_json, google_maps_route_url)
                VALUES (?,?,?,?,?,?,?,?,?)
            """, (itinerary_id, day_num, travel_mode,
                  day_stops[0]['latitude'], day_stops[0]['longitude'],
                  day_stops[-1]['latitude'], day_stops[-1]['longitude'],
                  json.dumps(waypoints), route_url))

        conn.commit()
        conn.close()

        # Build response
        result = {
            'itinerary_id': itinerary_id,
            'share_token': share_token,
            **itinerary_data,
            'route_urls': days_routes
        }
        return jsonify(result)

    except Exception as e:
        print(f"Trip planning error: {e}")
        return jsonify({'error': str(e)}), 500

# ─────────────────────────────────────────────────────────────────────────────
# GET ITINERARY — retrieve a saved trip
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/itinerary/<itinerary_id>', methods=['GET'])
def get_itinerary(itinerary_id):
    conn = get_db()
    itin = conn.execute("SELECT * FROM itineraries WHERE itinerary_id = ?", (itinerary_id,)).fetchone()
    if not itin:
        # Try share_token
        itin = conn.execute("SELECT * FROM itineraries WHERE share_token = ?", (itinerary_id,)).fetchone()
    if not itin:
        conn.close()
        return jsonify({'error': 'Itinerary not found'}), 404

    itin_dict = dict(itin)
    itin_dict['interests'] = json.loads(itin_dict.get('interests_json') or '[]')
    itin_dict['local_phrases'] = json.loads(itin_dict.get('local_phrases_json') or '{}')

    # Get stops grouped by day
    stops = conn.execute(
        "SELECT * FROM itinerary_stops WHERE itinerary_id = ? ORDER BY day_number, stop_order",
        (itin_dict['itinerary_id'],)
    ).fetchall()

    days = {}
    for s in stops:
        d = s['day_number']
        if d not in days:
            days[d] = []
        days[d].append(dict(s))

    itin_dict['days'] = [{'day_number': k, 'stops': v} for k, v in sorted(days.items())]

    # Get route URLs
    routes = conn.execute(
        "SELECT * FROM route_directions WHERE itinerary_id = ?",
        (itin_dict['itinerary_id'],)
    ).fetchall()
    route_urls = {}
    for r in routes:
        route_urls[r['day_number']] = {
            'google_maps_route_url': r['google_maps_route_url'],
            'waypoints': json.loads(r['waypoints_json'] or '[]'),
            'total_distance_km': r['total_distance_km'],
            'total_duration_minutes': r['total_duration_minutes']
        }
    itin_dict['route_urls'] = route_urls

    conn.close()
    return jsonify({'itinerary': itin_dict})

# ─────────────────────────────────────────────────────────────────────────────
# FAVORITES
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/favorites', methods=['GET'])
def get_favorites():
    session_id = request.args.get('session', '')
    if not session_id:
        return jsonify({'favorites': []})
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM user_favorites WHERE session_id = ? ORDER BY saved_at DESC",
        (session_id,)
    ).fetchall()
    conn.close()
    return jsonify({'favorites': [dict(r) for r in rows]})

@app.route('/api/favorites/add', methods=['POST'])
def add_favorite():
    data = request.get_json()
    conn = get_db()
    # Ensure session exists
    conn.execute("INSERT OR IGNORE INTO user_sessions (session_id) VALUES (?)", (data.get('session_id'),))
    conn.execute("""
        INSERT OR IGNORE INTO user_favorites (session_id, place_id, place_name, latitude, longitude, category, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (data.get('session_id'), data.get('place_id'), data.get('place_name'),
          data.get('latitude'), data.get('longitude'), data.get('category'), data.get('notes', '')))
    # Increment save_count
    conn.execute("UPDATE places SET save_count = save_count + 1 WHERE place_id = ?", (data.get('place_id'),))
    conn.commit()
    conn.close()
    return jsonify({'status': 'saved'})

@app.route('/api/favorites/remove', methods=['POST'])
def remove_favorite():
    data = request.get_json()
    conn = get_db()
    conn.execute("DELETE FROM user_favorites WHERE session_id = ? AND place_id = ?",
                 (data.get('session_id'), data.get('place_id')))
    conn.commit()
    conn.close()
    return jsonify({'status': 'removed'})

# ─────────────────────────────────────────────────────────────────────────────
# POPULAR / TRENDING
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/popular', methods=['GET'])
def popular_places():
    city = request.args.get('city', '')
    conn = get_db()
    query = "SELECT * FROM places"
    params = []
    if city:
        query += " WHERE city LIKE ?"
        params.append(f"%{city}%")
    query += " ORDER BY view_count + save_count DESC LIMIT 20"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    places = []
    for r in rows:
        p = dict(r)
        p['tags'] = json.loads(p.get('tags_json') or '[]')
        places.append(p)
    return jsonify({'places': places})

# ─────────────────────────────────────────────────────────────────────────────
# ANALYTICS
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/track', methods=['POST'])
def track_event():
    data = request.get_json()
    conn = get_db()
    conn.execute("""
        INSERT INTO analytics_events (session_id, event_type, event_data_json, place_id, itinerary_id, city)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (data.get('session_id'), data.get('event_type'), json.dumps(data.get('event_data', {})),
          data.get('place_id'), data.get('itinerary_id'), data.get('city')))
    conn.commit()
    conn.close()
    return jsonify({'status': 'tracked'})

# ─────────────────────────────────────────────────────────────────────────────
# RECENT ITINERARIES
# ─────────────────────────────────────────────────────────────────────────────

@app.route('/api/itineraries/recent', methods=['GET'])
def recent_itineraries():
    conn = get_db()
    rows = conn.execute(
        "SELECT itinerary_id, title, city, num_days, travel_mode, total_places, estimated_total_cost, share_token, created_at FROM itineraries ORDER BY created_at DESC LIMIT 10"
    ).fetchall()
    conn.close()
    return jsonify({'itineraries': [dict(r) for r in rows]})

# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)