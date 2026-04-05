import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../App';

const ALL_INTERESTS = [
  '🏛️ Temples', '🍽️ Food & Cafes', '🏖️ Beaches', '🏰 Historical', '🌳 Nature & Parks',
  '📸 Photography', '🛍️ Shopping', '🧗 Adventure', '🏨 Luxury', '🌙 Nightlife',
  '🧘 Wellness', '🎭 Culture & Art'
];

export default function TripPlanner() {
  const { api, sessionId } = useContext(AppContext);
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [numDays, setNumDays] = useState(2);
  const [travelMode, setTravelMode] = useState('driving');
  const [budget, setBudget] = useState('moderate');
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentTrips, setRecentTrips] = useState([]);

  React.useEffect(() => {
    axios.get(`${api}/api/itineraries/recent`).then(r => setRecentTrips(r.data.itineraries || [])).catch(() => {});
  }, [api]);

  const toggleInterest = (interest) => {
    setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const planTrip = async () => {
    if (!city.trim()) { setError('Please enter a city'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${api}/api/plan-trip`, {
        city: city.trim(), num_days: numDays, travel_mode: travelMode,
        budget_level: budget, interests: interests.map(i => i.replace(/^.\s/, ''))
      });
      // Track event
      axios.post(`${api}/api/track`, {
        session_id: sessionId, event_type: 'plan_trip',
        event_data: { city, num_days: numDays }, city
      }).catch(() => {});
      navigate(`/trip/${res.data.itinerary_id}`);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to generate itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ paddingTop: 40 }}>
      <div className="planner-form">
        <h2>🗺️ AI Trip Planner</h2>
        <p style={{ color: '#94a3b8', marginBottom: 24, fontSize: '0.9rem' }}>
          Enter your destination and preferences — AI will generate a route-optimized day-by-day itinerary with Google Maps directions.
        </p>

        {error && <div style={{ color: '#f43f5e', marginBottom: 16, fontSize: '0.85rem' }}>{error}</div>}

        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label>Destination City</label>
            <input placeholder="e.g. Pondicherry, Goa, Jaipur…" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Days</label>
            <select value={numDays} onChange={e => setNumDays(Number(e.target.value))}>
              {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n} day{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Travel Mode</label>
            <select value={travelMode} onChange={e => setTravelMode(e.target.value)}>
              <option value="driving">🚗 Driving</option>
              <option value="walking">🚶 Walking</option>
              <option value="transit">🚌 Public Transit</option>
              <option value="bicycling">🚲 Bicycling</option>
            </select>
          </div>
          <div className="form-group">
            <label>Budget Level</label>
            <select value={budget} onChange={e => setBudget(e.target.value)}>
              <option value="budget">💰 Budget</option>
              <option value="moderate">💵 Moderate</option>
              <option value="luxury">💎 Luxury</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
            Interests (select one or more)
          </label>
          <div className="interest-tags">
            {ALL_INTERESTS.map(interest => (
              <button
                key={interest}
                className={`interest-tag ${interests.includes(interest) ? 'selected' : ''}`}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <button className="plan-btn" onClick={planTrip} disabled={loading}>
          {loading ? '✨ AI is planning your perfect trip…' : '🚀 Generate Itinerary'}
        </button>
      </div>

      {/* Recent trips */}
      {recentTrips.length > 0 && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#94a3b8', marginBottom: 16, fontWeight: 600 }}>Recent Itineraries</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentTrips.map(trip => (
              <div
                key={trip.itinerary_id}
                onClick={() => navigate(`/trip/${trip.itinerary_id}`)}
                style={{
                  padding: 16, background: '#111827', border: '1px solid #1e293b', borderRadius: 12,
                  cursor: 'pointer', transition: 'border-color 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#334155'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#1e293b'}
              >
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: '#f1f5f9', marginBottom: 4 }}>{trip.title}</h4>
                  <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: '#64748b' }}>
                    <span>📍 {trip.city}</span>
                    <span>📅 {trip.num_days} day{trip.num_days > 1 ? 's' : ''}</span>
                    <span>🚗 {trip.travel_mode}</span>
                    {trip.estimated_total_cost && <span>💰 {trip.estimated_total_cost}</span>}
                  </div>
                </div>
                <span style={{ color: '#38bdf8', fontSize: '0.8rem', fontWeight: 600 }}>View →</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
