# 🗺️ WanderWise — AI-Powered Local Discovery & Trip Planning Platform

> **"Discover hidden gems. Plan smarter trips. Earn from every recommendation."**

WanderWise is a full-stack platform that combines **Google Maps**, **Gemini AI**, and **crowd-sourced local knowledge** to help travelers and locals discover the best spots around them — while generating revenue through affiliate partnerships, promoted listings, and premium planning tools.

---

## 🎯 The Problem

- Google Maps shows *everything*, but doesn't curate or personalize.
- Travel blogs are outdated and not interactive.
- Tourists waste time visiting mediocre spots because they lack *local insight*.
- Local businesses (restaurants, guides, homestays) struggle to reach tourists digitally.
- Manually planning a multi-stop trip with optimal routes is painful and time-consuming.

## 💡 The Solution

WanderWise is a **hyper-local discovery engine** that uses AI to generate personalized itineraries with **route-optimized Google Maps directions**, surface hidden gems, and connect travelers with local businesses — all on an interactive map.

---

## 🧠 Core Features

### 1. 🔍 AI Smart Search
- Natural language queries: *"Best sunset viewpoints near Pondicherry"*, *"kid-friendly temples in Madurai"*
- Gemini AI (grounded with Google Search) interprets intent → returns curated places with map pins
- Each result includes: photo, rating, timing, entry fee, best time to visit, crowd level
- Results are **cached in DB** — same query won't hit the AI twice

### 2. 🗺️ Interactive Map Explorer
- Full-screen Google Map with categorized markers (🏛️ Temples, 🍽️ Restaurants, 🏖️ Beaches, 📸 Photo Spots, 🛍️ Shopping)
- Click a pin → rich info card with reviews, photos, directions, "Add to Trip" button
- Heatmap overlay showing popular areas by time of day
- Radius-based exploration: "Show me everything within 5 km"
- **Nearby Places auto-fetch**: Uses Google Places API to populate surrounding POIs automatically

### 3. 📋 AI Trip Planner + Route Map (⭐ KEY FEATURE)
- Select a city + number of days + interests + travel mode (🚗 car / 🚶 walk / 🚌 transit)
- AI generates a **day-by-day itinerary** with:
  - Morning / Afternoon / Evening slots
  - Estimated visit duration per place
  - Travel time between stops (via Google Directions API)
  - Budget breakdown (entry fees, food, transport)
  - Meal stop suggestions inserted between activities
- **Route Optimization**: The itinerary is **reordered using shortest-path logic** so users waste minimal travel time
- **Embedded Google Maps Route**: Each day renders a full Google Maps directions polyline showing the optimized driving/walking route with waypoints
- **Live Route Link**: "Open in Google Maps" button that launches the native Google Maps app with the full day's route pre-loaded
- Export full trip as **PDF** or **shareable link**
- **Monetization**: Free for 1-day plans, Premium ($2.99) for multi-day + PDF export + route optimization

### 4. 📍 Place Detail Pages
- Individual pages for each place with:
  - Photo gallery (Google Places Photos API)
  - User ratings + AI-generated summary
  - Opening hours, entry fee, accessibility info
  - "Best time to visit" with crowd prediction
  - Google Street View embed
  - Nearby food & hotel recommendations
  - "Been here" check-in button for gamification
- All data **persisted in DB** so pages load instantly on revisit

### 5. 💎 "Hidden Gems" Community Layer
- Users can submit secret spots with photos + tips (verified by upvotes)
- Gamification: earn "Explorer Points" for contributions
- Leaderboard for top local guides per city
- **Monetization**: Featured "Local Guide" badge (paid) for businesses/influencers

### 6. 🏪 Business Listings & Promoted Pins (💰 Primary Revenue)
- Restaurants, hotels, tour guides can claim their listing for free
- **Promoted Pins**: Businesses pay to appear as highlighted pins on the map ($5-50/month)
- **Affiliate Bookings**: Direct booking links (Booking.com, Viator, Zomato affiliate)
- **Commission model**: 5-15% on each booking made through the platform

### 7. 📊 Crowd Intelligence
- Real-time crowd estimates at popular spots (Google Popular Times)
- "Best time to visit" AI predictions
- Weather-aware recommendations (OpenWeatherMap API integration)

### 8. 🎫 Deals & Coupons Hub
- Partner with local businesses for exclusive discounts
- Flash deals for nearby restaurants during off-peak hours

### 9. 📸 AI Photo Spot Finder
- Upload a photo → AI identifies the location and suggests similar photogenic spots nearby
- "Instagram-worthy spots near me" search query support

### 10. 🔔 Smart Alerts
- "You're near [hidden gem]! 92% of visitors loved it" — proximity-based push suggestions
- Price drop alerts for nearby hotel deals

---

## 💰 Revenue Model Summary

| Channel | Type | Est. Revenue |
|---|---|---|
| Promoted Map Pins | B2B Subscription | $5–50/month per business |
| Affiliate Hotel Bookings | Commission | 5–12% per booking |
| Affiliate Restaurant/Experience | Commission | 8–15% per booking |
| Premium Trip Planner | B2C Subscription | $2.99 per plan / $9.99/month |
| Featured Local Guide Badge | B2B One-time | $19.99/year |
| Coupon/Deal Commissions | Transaction fee | 10% per redemption |
| API Access (for other apps) | B2B Licensing | Custom pricing |

---

## 🗄️ Database Schema (SQLite → PostgreSQL)

We store **everything possible** to minimize API calls, enable offline access, and power analytics.

### `places` — Master table for every discovered place
```sql
CREATE TABLE IF NOT EXISTS places (
    place_id TEXT PRIMARY KEY,                    -- Google Place ID or UUID for user-submitted
    name TEXT NOT NULL,
    description TEXT,                             -- AI-generated description
    category TEXT,                                -- temple, restaurant, beach, museum, park, shopping, viewpoint, etc.
    sub_category TEXT,                            -- e.g. "south-indian" for restaurant, "shiva" for temple
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
    
    -- Ratings & Popularity
    google_rating REAL,                           -- 1.0 - 5.0
    google_total_ratings INTEGER,
    wanderwise_rating REAL,                       -- Our platform rating
    wanderwise_total_ratings INTEGER DEFAULT 0,
    popularity_score REAL DEFAULT 0,              -- Computed: views + saves + visits
    
    -- Timings & Logistics
    opening_hours_json TEXT,                      -- JSON: {"monday": "06:00-20:00", ...}
    entry_fee TEXT,                               -- "Free" / "₹50 adults, ₹25 children"
    estimated_visit_duration_minutes INTEGER,     -- AI estimated: 30, 60, 120 etc.
    best_time_to_visit TEXT,                      -- "Early morning (6-8 AM)" / "Sunset"
    best_season TEXT,                             -- "October to March"
    crowd_level TEXT,                             -- "low" / "moderate" / "high"
    accessibility_info TEXT,                      -- "Wheelchair accessible", "Steep stairs"
    dress_code TEXT,                              -- For temples: "Traditional clothing required"
    photography_allowed INTEGER DEFAULT 1,        -- 0 = no, 1 = yes, 2 = restricted
    
    -- Rich Content
    ai_summary TEXT,                              -- 2-3 line AI-generated pitch
    historical_significance TEXT,                 -- For heritage sites
    local_tips TEXT,                              -- "Visit during Pongal for special pujas"
    nearby_food_suggestions TEXT,                 -- JSON array of nearby restaurant names
    tags_json TEXT,                               -- JSON: ["family-friendly", "photography", "sunset", "free-entry"]
    photos_json TEXT,                             -- JSON: array of photo URLs (Google Places + user uploads)
    
    -- Business / Monetization
    is_promoted INTEGER DEFAULT 0,                -- Paid business listing
    promoted_until TIMESTAMP,
    affiliate_booking_url TEXT,                   -- Hotel/experience booking link
    claimed_by_business INTEGER DEFAULT 0,
    business_owner_email TEXT,
    
    -- Metadata
    source TEXT DEFAULT 'ai',                     -- 'ai', 'google', 'user', 'import'
    is_hidden_gem INTEGER DEFAULT 0,              -- Community-submitted
    submitted_by TEXT,                            -- User who submitted (if hidden gem)
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    save_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `itineraries` — Saved AI-generated trip plans
```sql
CREATE TABLE IF NOT EXISTS itineraries (
    itinerary_id TEXT PRIMARY KEY,                -- UUID
    user_session_id TEXT,                         -- Browser session or user ID
    title TEXT,                                   -- "3-Day Pondicherry Adventure"
    city TEXT NOT NULL,
    state TEXT,
    country TEXT,
    center_latitude REAL,                         -- City center coordinates
    center_longitude REAL,
    num_days INTEGER NOT NULL,
    travel_mode TEXT DEFAULT 'driving',           -- driving, walking, transit, bicycling
    interests_json TEXT,                          -- JSON: ["temples", "beaches", "food"]
    budget_level TEXT DEFAULT 'moderate',         -- budget, moderate, luxury
    
    -- Trip Metadata
    total_places INTEGER,
    total_distance_km REAL,                       -- Sum of all inter-stop distances
    total_travel_time_minutes INTEGER,            -- Sum of all travel times
    estimated_total_cost TEXT,                    -- "₹5,000 - ₹8,000"
    currency TEXT DEFAULT 'INR',
    
    -- AI Content
    trip_summary TEXT,                            -- AI overview of the trip
    packing_tips TEXT,                            -- AI-generated packing list
    local_phrases_json TEXT,                      -- JSON: {"hello": "vanakkam", "thanks": "nandri"}
    safety_tips TEXT,                             -- Area-specific safety advice
    best_transport_options TEXT,                  -- "Auto-rickshaws are cheapest. Ola/Uber available."
    
    -- Sharing & Export
    share_token TEXT UNIQUE,                      -- Short token for shareable link
    is_public INTEGER DEFAULT 0,
    pdf_generated INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `itinerary_stops` — Individual stops within a trip (ordered)
```sql
CREATE TABLE IF NOT EXISTS itinerary_stops (
    stop_id INTEGER PRIMARY KEY AUTOINCREMENT,
    itinerary_id TEXT NOT NULL,
    place_id TEXT,                                -- FK → places.place_id (if stored)
    day_number INTEGER NOT NULL,                  -- Day 1, 2, 3...
    stop_order INTEGER NOT NULL,                  -- Order within the day (1, 2, 3...)
    time_slot TEXT,                               -- "morning", "afternoon", "evening", "night"
    
    -- Place Details (denormalized for speed)
    place_name TEXT NOT NULL,
    place_category TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    formatted_address TEXT,
    photo_url TEXT,
    
    -- Schedule
    suggested_arrival_time TEXT,                  -- "09:00 AM"
    suggested_departure_time TEXT,                -- "10:30 AM"
    visit_duration_minutes INTEGER,               -- 90
    
    -- Travel to NEXT stop
    travel_to_next_distance_km REAL,
    travel_to_next_duration_minutes INTEGER,
    travel_to_next_mode TEXT,                     -- driving, walking, transit
    travel_to_next_polyline TEXT,                 -- Encoded Google Directions polyline
    
    -- Cost & Tips
    entry_fee TEXT,
    meal_budget TEXT,                             -- If this is a meal stop
    tips TEXT,                                    -- "Try the filter coffee here"
    is_meal_stop INTEGER DEFAULT 0,              -- 1 = restaurant / food stop
    is_rest_stop INTEGER DEFAULT 0,              -- 1 = hotel check-in / break
    
    -- Google Maps integration
    google_place_id TEXT,                         -- For fetching live data
    google_maps_link TEXT,                        -- Direct link to this place
    
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id)
);
```

### `route_directions` — Cached Google Directions API responses per day
```sql
CREATE TABLE IF NOT EXISTS route_directions (
    route_id INTEGER PRIMARY KEY AUTOINCREMENT,
    itinerary_id TEXT NOT NULL,
    day_number INTEGER NOT NULL,
    travel_mode TEXT,                             -- driving, walking, transit
    
    -- Full route data
    origin_lat REAL,
    origin_lng REAL,
    destination_lat REAL,
    destination_lng REAL,
    waypoints_json TEXT,                          -- JSON array of {lat, lng} for intermediate stops
    
    -- Google Directions response (cached)
    overview_polyline TEXT,                       -- Encoded polyline for the full day route
    total_distance_km REAL,
    total_duration_minutes INTEGER,
    steps_json TEXT,                              -- JSON: detailed turn-by-turn (optional)
    google_maps_route_url TEXT,                   -- "https://www.google.com/maps/dir/..." pre-built URL
    
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id)
);
```

### `search_cache` — Cache AI search results to save API quota
```sql
CREATE TABLE IF NOT EXISTS search_cache (
    query_hash TEXT PRIMARY KEY,                  -- MD5 of normalized query
    original_query TEXT,
    city TEXT,
    results_json TEXT,                            -- Full JSON response from AI
    result_count INTEGER,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP                          -- Auto-expire after 7 days
);
```

### `user_sessions` — Track anonymous users + favorites
```sql
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id TEXT PRIMARY KEY,                  -- Browser fingerprint or UUID
    display_name TEXT,
    email TEXT,
    
    -- Gamification
    explorer_points INTEGER DEFAULT 0,
    total_places_visited INTEGER DEFAULT 0,
    total_trips_planned INTEGER DEFAULT 0,
    badges_json TEXT,                             -- JSON: ["first_trip", "10_places", "hidden_gem_finder"]
    
    -- Preferences
    preferred_categories_json TEXT,               -- JSON: ["temples", "food"]
    preferred_budget TEXT,                        -- budget, moderate, luxury
    home_city TEXT,
    home_latitude REAL,
    home_longitude REAL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `user_favorites` — Bookmarked / saved places
```sql
CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    place_id TEXT NOT NULL,
    place_name TEXT,
    latitude REAL,
    longitude REAL,
    category TEXT,
    notes TEXT,                                   -- Personal notes: "Must try the dosa here"
    visited INTEGER DEFAULT 0,                   -- User checked in
    visited_at TIMESTAMP,
    rating_given REAL,                            -- User's personal rating
    
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (session_id) REFERENCES user_sessions(session_id),
    FOREIGN KEY (place_id) REFERENCES places(place_id)
);
```

### `place_reviews` — User reviews + ratings
```sql
CREATE TABLE IF NOT EXISTS place_reviews (
    review_id INTEGER PRIMARY KEY AUTOINCREMENT,
    place_id TEXT NOT NULL,
    session_id TEXT,
    reviewer_name TEXT,
    rating REAL,                                  -- 1.0 - 5.0
    review_text TEXT,
    visit_date TEXT,                              -- "2026-03"
    photos_json TEXT,                             -- User-uploaded photo URLs
    helpful_votes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (place_id) REFERENCES places(place_id)
);
```

### `analytics_events` — Track everything for business insights
```sql
CREATE TABLE IF NOT EXISTS analytics_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    event_type TEXT,                              -- 'search', 'view_place', 'save_place', 'plan_trip', 'click_affiliate', 'open_route'
    event_data_json TEXT,                         -- Flexible JSON payload
    place_id TEXT,
    itinerary_id TEXT,
    city TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🏗️ Tech Stack

### Backend (Python/Flask)
- **Flask** — REST API server
- **Gemini AI** (`google-genai`) — Smart search, itinerary generation, place descriptions
- **Google Maps Platform APIs**:
  - Places API (Nearby Search, Place Details, Place Photos)
  - Geocoding API
  - Directions API (route optimization + polylines)
  - Distance Matrix API (travel time between stops)
  - Maps JavaScript API (frontend map)
- **SQLite** → PostgreSQL — Data persistence (10 tables)
- **python-dotenv** — Environment config

### Frontend (React)
- **React** — SPA framework
- **Material UI** — Component library
- **@react-google-maps/api** — Google Maps integration (Map, Markers, Polylines, InfoWindows, DirectionsRenderer)
- **Redux Toolkit** — State management
- **React Router** — Navigation
- **Axios** — API calls
- **react-markdown** — AI response rendering
- **jsPDF** — PDF export for itineraries

---

## 📁 Project Structure

```
ReactFE-PythonBE/
├── backend/
│   ├── main.py              # Flask app + all API routes
│   ├── db.py                # Database init + helper functions
│   ├── .env                 # API_KEY, GOOGLE_MAPS_API_KEY
│   └── wanderwise.db        # SQLite database (auto-created)
├── frontend/
│   ├── src/
│   │   ├── App.js           # Root + Router
│   │   ├── pages/
│   │   │   ├── Home.js      # Landing page with hero search
│   │   │   ├── Explore.js   # Full-screen map explorer
│   │   │   ├── TripPlanner.js # AI itinerary builder + route map
│   │   │   └── PlaceDetail.js # Individual place page
│   │   ├── components/
│   │   │   ├── MapView.js    # Google Map with markers + polylines
│   │   │   ├── PlaceCard.js  # Place info card (reusable)
│   │   │   ├── RouteMap.js   # Day route with DirectionsRenderer
│   │   │   ├── DayTimeline.js# Visual timeline for a day's stops
│   │   │   ├── SearchBar.js  # AI-powered search input
│   │   │   └── Header.js     # Navigation bar
│   │   ├── store/
│   │   │   ├── placesSlice.js
│   │   │   ├── tripSlice.js
│   │   │   └── store.js
│   │   └── App.css
│   └── public/
└── README.md
```

---

## 🔌 API Endpoints

### Discovery
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/search` | AI smart search with Google grounding |
| GET | `/places/nearby?lat=&lng=&radius=&category=` | Nearby places from DB + Google Places |
| GET | `/place/<place_id>` | Full place details |
| POST | `/place/<place_id>/review` | Submit a review |

### Trip Planning
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/plan-trip` | Generate AI itinerary + route-optimized stops |
| GET | `/itinerary/<id>` | Get saved itinerary with all stops |
| GET | `/itinerary/<id>/day/<n>/route` | Get directions polyline for a specific day |
| GET | `/itinerary/<id>/export-pdf` | Download itinerary as PDF |
| GET | `/itinerary/shared/<token>` | View shared itinerary (public link) |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/favorites/add` | Save a place to favorites |
| GET | `/favorites?session=` | Get user's saved places |
| POST | `/favorites/<id>/visited` | Mark as visited |
| POST | `/hidden-gem/submit` | Submit a hidden gem |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/track` | Log an analytics event |
| GET | `/popular?city=` | Get trending places in a city |

---

## 🚀 MVP Build Order

| Phase | Feature | Details |
|-------|---------|---------|
| **Phase 1** | Backend DB + AI Search | Init all tables, `/search` endpoint with caching |
| **Phase 2** | Map Explorer | Interactive Google Map with pins from search results |
| **Phase 3** | Trip Planner + Route | AI itinerary → Directions API → polyline on map + "Open in Google Maps" |
| **Phase 4** | Place Details | Individual place pages with photos, reviews, nearby suggestions |
| **Phase 5** | Favorites + Sessions | Save places, mark visited, basic gamification |
| **Phase 6** | Polish + Export | PDF export, share links, analytics tracking |

---

## 🔑 Required Environment Variables (`.env`)

```env
API_KEY=<your-gemini-api-key>
GOOGLE_MAPS_API_KEY=<your-google-maps-platform-key>
```

The Google Maps API key needs these APIs enabled:
- Maps JavaScript API
- Places API (New)
- Directions API
- Geocoding API
- Distance Matrix API

---

## 🏃 Getting Started

```bash
# Backend
cd backend
pip install flask flask-cors google-genai python-dotenv
python main.py

# Frontend
cd frontend
npm install
npm start
```

---

## 📜 License

MIT

---

*Built with ❤️ by Siva — Powered by Google Maps + Gemini AI*
