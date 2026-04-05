import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wanderwise.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_db()
    c = conn.cursor()

    # ── 1. places — Master table for every discovered place ────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS places (
        place_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT,
        sub_category TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        formatted_address TEXT,
        city TEXT,
        state TEXT,
        country TEXT,
        postal_code TEXT,
        phone TEXT,
        website TEXT,
        google_maps_url TEXT,

        google_rating REAL,
        google_total_ratings INTEGER,
        wanderwise_rating REAL,
        wanderwise_total_ratings INTEGER DEFAULT 0,
        popularity_score REAL DEFAULT 0,

        opening_hours_json TEXT,
        entry_fee TEXT,
        estimated_visit_duration_minutes INTEGER,
        best_time_to_visit TEXT,
        best_season TEXT,
        crowd_level TEXT,
        accessibility_info TEXT,
        dress_code TEXT,
        photography_allowed INTEGER DEFAULT 1,

        ai_summary TEXT,
        historical_significance TEXT,
        local_tips TEXT,
        nearby_food_suggestions TEXT,
        tags_json TEXT,
        photos_json TEXT,

        is_promoted INTEGER DEFAULT 0,
        promoted_until TIMESTAMP,
        affiliate_booking_url TEXT,
        claimed_by_business INTEGER DEFAULT 0,
        business_owner_email TEXT,

        source TEXT DEFAULT 'ai',
        is_hidden_gem INTEGER DEFAULT 0,
        submitted_by TEXT,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        save_count INTEGER DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ── 2. itineraries — saved trip plans ──────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS itineraries (
        itinerary_id TEXT PRIMARY KEY,
        user_session_id TEXT,
        title TEXT,
        city TEXT NOT NULL,
        state TEXT,
        country TEXT,
        center_latitude REAL,
        center_longitude REAL,
        num_days INTEGER NOT NULL,
        travel_mode TEXT DEFAULT 'driving',
        interests_json TEXT,
        budget_level TEXT DEFAULT 'moderate',

        total_places INTEGER,
        total_distance_km REAL,
        total_travel_time_minutes INTEGER,
        estimated_total_cost TEXT,
        currency TEXT DEFAULT 'INR',

        trip_summary TEXT,
        packing_tips TEXT,
        local_phrases_json TEXT,
        safety_tips TEXT,
        best_transport_options TEXT,

        share_token TEXT UNIQUE,
        is_public INTEGER DEFAULT 0,
        pdf_generated INTEGER DEFAULT 0,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ── 3. itinerary_stops — individual stops within a trip ────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS itinerary_stops (
        stop_id INTEGER PRIMARY KEY AUTOINCREMENT,
        itinerary_id TEXT NOT NULL,
        place_id TEXT,
        day_number INTEGER NOT NULL,
        stop_order INTEGER NOT NULL,
        time_slot TEXT,

        place_name TEXT NOT NULL,
        place_category TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        formatted_address TEXT,
        photo_url TEXT,

        suggested_arrival_time TEXT,
        suggested_departure_time TEXT,
        visit_duration_minutes INTEGER,

        travel_to_next_distance_km REAL,
        travel_to_next_duration_minutes INTEGER,
        travel_to_next_mode TEXT,
        travel_to_next_polyline TEXT,

        entry_fee TEXT,
        meal_budget TEXT,
        tips TEXT,
        is_meal_stop INTEGER DEFAULT 0,
        is_rest_stop INTEGER DEFAULT 0,

        google_place_id TEXT,
        google_maps_link TEXT,

        FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id)
    )
    """)

    # ── 4. route_directions — cached Google Directions per day ─────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS route_directions (
        route_id INTEGER PRIMARY KEY AUTOINCREMENT,
        itinerary_id TEXT NOT NULL,
        day_number INTEGER NOT NULL,
        travel_mode TEXT,

        origin_lat REAL,
        origin_lng REAL,
        destination_lat REAL,
        destination_lng REAL,
        waypoints_json TEXT,

        overview_polyline TEXT,
        total_distance_km REAL,
        total_duration_minutes INTEGER,
        steps_json TEXT,
        google_maps_route_url TEXT,

        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id)
    )
    """)

    # ── 5. search_cache — AI query caching ─────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS search_cache (
        query_hash TEXT PRIMARY KEY,
        original_query TEXT,
        city TEXT,
        results_json TEXT,
        result_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP
    )
    """)

    # ── 6. user_sessions ───────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS user_sessions (
        session_id TEXT PRIMARY KEY,
        display_name TEXT,
        email TEXT,
        explorer_points INTEGER DEFAULT 0,
        total_places_visited INTEGER DEFAULT 0,
        total_trips_planned INTEGER DEFAULT 0,
        badges_json TEXT,
        preferred_categories_json TEXT,
        preferred_budget TEXT,
        home_city TEXT,
        home_latitude REAL,
        home_longitude REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ── 7. user_favorites ──────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS user_favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        place_id TEXT NOT NULL,
        place_name TEXT,
        latitude REAL,
        longitude REAL,
        category TEXT,
        notes TEXT,
        visited INTEGER DEFAULT 0,
        visited_at TIMESTAMP,
        rating_given REAL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES user_sessions(session_id),
        FOREIGN KEY (place_id) REFERENCES places(place_id)
    )
    """)

    # ── 8. place_reviews ───────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS place_reviews (
        review_id INTEGER PRIMARY KEY AUTOINCREMENT,
        place_id TEXT NOT NULL,
        session_id TEXT,
        reviewer_name TEXT,
        rating REAL,
        review_text TEXT,
        visit_date TEXT,
        photos_json TEXT,
        helpful_votes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (place_id) REFERENCES places(place_id)
    )
    """)

    # ── 9. analytics_events ────────────────────────────────────────────────
    c.execute("""
    CREATE TABLE IF NOT EXISTS analytics_events (
        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        event_type TEXT,
        event_data_json TEXT,
        place_id TEXT,
        itinerary_id TEXT,
        city TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # ── Indexes for performance ────────────────────────────────────────────
    c.execute("CREATE INDEX IF NOT EXISTS idx_places_city ON places(city)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_places_category ON places(category)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_places_coords ON places(latitude, longitude)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_stops_itinerary ON itinerary_stops(itinerary_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_favorites_session ON user_favorites(session_id)")
    c.execute("CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics_events(event_type)")

    conn.commit()
    conn.close()
    print("✅ WanderWise database initialized with 9 tables")

if __name__ == "__main__":
    init_db()
