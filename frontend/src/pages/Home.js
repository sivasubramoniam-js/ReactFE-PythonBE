import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PlaceCard from '../components/PlaceCard';
import { AppContext } from '../App';

const QUICK_SEARCHES = [
  "Hidden gems in Pondicherry", "Best temples in Tamil Nadu", "Sunset viewpoints in Goa",
  "Street food in Mumbai", "Historical forts in Rajasthan", "Beach cafes in Kerala",
  "Adventure spots near Bangalore", "Heritage walks in Delhi"
];

export default function Home() {
  const { api, sessionId } = useContext(AppContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const search = async (q) => {
    const term = (q || query).trim();
    if (!term) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const res = await axios.post(`${api}/api/search`, { query: term });
      setResults(res.data.places || []);
      // Track event
      axios.post(`${api}/api/track`, { session_id: sessionId, event_type: 'search', event_data: { query: term } }).catch(() => {});
    } catch (e) {
      setError(e.response?.data?.error || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceClick = (place) => {
    navigate('/explore', { state: { selectedPlace: place, allPlaces: results } });
  };

  return (
    <div>
      <div className={`hero ${searched ? 'searched' : ''}`} style={searched ? { minHeight: 'auto', paddingTop: 32, paddingBottom: 24 } : {}}>
        {!searched && (
          <>
            <h1>Discover the Undiscovered</h1>
            <p className="subtitle">AI-powered local discovery. Find hidden gems, plan optimized trips, and explore like a local.</p>
          </>
        )}
        <div className="search-box">
          <input
            type="text"
            placeholder="What are you looking for? e.g. 'sunset temples in Hampi'"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <button onClick={() => search()} disabled={loading || !query.trim()}>
            {loading ? '✨ Searching…' : '🔍 Search'}
          </button>
        </div>
        {!searched && (
          <div className="quick-chips">
            {QUICK_SEARCHES.map((q, i) => (
              <button key={i} className="chip" onClick={() => { setQuery(q); search(q); }}>{q}</button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="page">
        {error && <div style={{ color: '#f43f5e', textAlign: 'center', padding: 24 }}>{error}</div>}

        {loading && (
          <div className="loading-center">
            <div className="spinner" />
            <p style={{ color: '#94a3b8' }}>AI is discovering amazing places for you…</p>
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: 8 }}>No places found</p>
            <p>Try a different search query</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="results-section" style={{ marginTop: searched ? 0 : 48 }}>
            <p style={{ color: '#64748b', marginBottom: 16 }}>Found {results.length} places — click any card to view on map</p>
            <div className="places-grid">
              {results.map((place, i) => (
                <PlaceCard key={place.place_id || i} place={place} onClick={handlePlaceClick} />
              ))}
            </div>
          </div>
        )}

        {/* Recent Itineraries CTA */}
        {!searched && (
          <div style={{ textAlign: 'center', marginTop: 80, marginBottom: 60 }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 12 }}>Plan Your Perfect Trip</h2>
            <p style={{ color: '#64748b', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
              Let AI build a route-optimized itinerary with day-by-day schedules, travel times, and a Google Maps route you can follow.
            </p>
            <button className="plan-btn" style={{ maxWidth: 300 }} onClick={() => navigate('/plan')}>
              🗺️ Start Planning
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
