import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';
import { AppContext } from '../App';

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#134e4a' }] },
];

const DAY_COLORS = ['#38bdf8', '#818cf8', '#f472b6', '#34d399', '#fb923c', '#f43f5e', '#fbbf24'];

const STOP_ICONS = { morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' };

export default function TripView() {
  const { id } = useParams();
  const { mapsKey, api } = useContext(AppContext);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeDay, setActiveDay] = useState(1);
  const [selectedStop, setSelectedStop] = useState(null);
  const [map, setMap] = useState(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: mapsKey });

  useEffect(() => {
    setLoading(true);
    axios.get(`${api}/api/itinerary/${id}`)
      .then(res => {
        setItinerary(res.data.itinerary);
        setLoading(false);
      })
      .catch(e => {
        setError(e.response?.data?.error || 'Failed to load itinerary');
        setLoading(false);
      });
  }, [id, api]);

  const onMapLoad = useCallback(m => setMap(m), []);

  if (loading) return <div className="loading-center"><div className="spinner" /><p style={{ color: '#94a3b8' }}>Loading your itinerary…</p></div>;
  if (error) return <div className="page"><div style={{ color: '#f43f5e', textAlign: 'center', padding: 48 }}>{error}</div></div>;
  if (!itinerary) return null;

  const days = itinerary.days || [];
  const currentDay = days.find(d => d.day_number === activeDay);
  const currentStops = currentDay?.stops || [];
  const routeUrls = itinerary.route_urls || {};

  // Build polyline path from stops
  const polylinePath = currentStops.map(s => ({ lat: s.latitude, lng: s.longitude }));

  // Center map on current day's stops
  const dayCenter = currentStops.length > 0
    ? { lat: currentStops.reduce((s, p) => s + p.latitude, 0) / currentStops.length,
        lng: currentStops.reduce((s, p) => s + p.longitude, 0) / currentStops.length }
    : { lat: itinerary.center_latitude || 12.97, lng: itinerary.center_longitude || 77.59 };

  const dayColor = DAY_COLORS[(activeDay - 1) % DAY_COLORS.length];

  // Build "Open in Google Maps" URL for the active day
  const routeData = routeUrls[activeDay];
  const gmapsUrl = routeData?.google_maps_route_url || '';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* Left: Itinerary */}
      <div style={{ width: 420, minWidth: 380, overflowY: 'auto', borderRight: '1px solid #1e293b', background: '#0a0f1a' }}>

        {/* Header */}
        <div className="itinerary-header" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #1e293b' }}>
          <h1 style={{ fontSize: '1.5rem' }}>{itinerary.title}</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '8px 0' }}>{itinerary.trip_summary}</p>
          <div className="itinerary-meta">
            <div className="meta-chip">📍 {itinerary.city}</div>
            <div className="meta-chip">📅 {itinerary.num_days} days</div>
            <div className="meta-chip">🚗 {itinerary.travel_mode}</div>
            {itinerary.estimated_total_cost && <div className="meta-chip">💰 {itinerary.estimated_total_cost}</div>}
            {itinerary.total_places && <div className="meta-chip">📌 {itinerary.total_places} stops</div>}
          </div>
        </div>

        {/* Day tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', overflowX: 'auto' }}>
          {days.map(day => (
            <button
              key={day.day_number}
              onClick={() => { setActiveDay(day.day_number); setSelectedStop(null); }}
              style={{
                flex: 1, padding: '12px 16px', border: 'none', cursor: 'pointer',
                background: activeDay === day.day_number ? '#111827' : 'transparent',
                color: activeDay === day.day_number ? DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length] : '#64748b',
                fontWeight: activeDay === day.day_number ? 700 : 400,
                fontSize: '0.85rem', borderBottom: activeDay === day.day_number ? `2px solid ${DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length]}` : '2px solid transparent',
                whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              Day {day.day_number}
            </button>
          ))}
        </div>

        {/* Timeline for active day */}
        <div style={{ padding: 20 }}>
          {/* Open in Google Maps */}
          {gmapsUrl && (
            <a href={gmapsUrl} target="_blank" rel="noopener noreferrer" className="route-btn" style={{ marginBottom: 16, display: 'inline-flex', textDecoration: 'none' }}>
              🗺️ Open Full Route in Google Maps
            </a>
          )}

          <div className="timeline">
            {currentStops.map((stop, i) => (
              <div
                key={stop.stop_id || i}
                className={`timeline-stop ${stop.is_meal_stop ? 'meal' : ''}`}
                onClick={() => {
                  setSelectedStop(stop);
                  map?.panTo({ lat: stop.latitude, lng: stop.longitude });
                  map?.setZoom(16);
                }}
                style={{ cursor: 'pointer', borderColor: selectedStop?.stop_id === stop.stop_id ? dayColor : '#1e293b' }}
              >
                <div className="stop-time">
                  {STOP_ICONS[stop.time_slot] || '📍'} {stop.suggested_arrival_time} — {stop.suggested_departure_time}
                </div>
                <div className="stop-name">
                  {stop.is_meal_stop ? '🍽️ ' : ''}{stop.place_name}
                </div>
                {stop.tips && <div className="stop-desc">💡 {stop.tips}</div>}
                <div className="stop-meta">
                  {stop.place_category && <span className={`card-category cat-${(stop.place_category || '').toLowerCase()}`} style={{ padding: '1px 6px', fontSize: '0.65rem' }}>{stop.place_category}</span>}
                  {stop.visit_duration_minutes && <span>⏱ {stop.visit_duration_minutes} min</span>}
                  {stop.entry_fee && <span>🎫 {stop.entry_fee}</span>}
                </div>
                {stop.google_maps_link && (
                  <a href={stop.google_maps_link} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.72rem', color: '#10b981', textDecoration: 'none', display: 'inline-block', marginTop: 6 }}
                    onClick={e => e.stopPropagation()}>
                    📍 View on Google Maps
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Trip Tips */}
        <div style={{ padding: '0 20px 40px', borderTop: '1px solid #1e293b', marginTop: 8, paddingTop: 20 }}>
          {itinerary.best_transport_options && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: '#38bdf8', fontSize: '0.85rem', marginBottom: 6 }}>🚗 Getting Around</h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{itinerary.best_transport_options}</p>
            </div>
          )}
          {itinerary.packing_tips && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: '#818cf8', fontSize: '0.85rem', marginBottom: 6 }}>🎒 Packing Tips</h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{itinerary.packing_tips}</p>
            </div>
          )}
          {itinerary.safety_tips && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ color: '#f43f5e', fontSize: '0.85rem', marginBottom: 6 }}>⚠️ Safety Tips</h4>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.5 }}>{itinerary.safety_tips}</p>
            </div>
          )}
          {itinerary.local_phrases && Object.keys(itinerary.local_phrases).length > 0 && (
            <div>
              <h4 style={{ color: '#34d399', fontSize: '0.85rem', marginBottom: 6 }}>💬 Useful Phrases</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(itinerary.local_phrases).map(([eng, local]) => (
                  <span key={eng} style={{ fontSize: '0.72rem', padding: '4px 10px', borderRadius: 8, border: '1px solid #1e293b', color: '#94a3b8' }}>
                    {eng} → <strong style={{ color: '#34d399' }}>{local}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Map */}
      <div style={{ flex: 1 }}>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={dayCenter}
            zoom={13}
            onLoad={onMapLoad}
            options={{ styles: MAP_STYLES, disableDefaultUI: false, zoomControl: true, mapTypeControl: false, streetViewControl: false }}
          >
            {/* Route polyline */}
            {polylinePath.length >= 2 && (
              <Polyline
                path={polylinePath}
                options={{
                  strokeColor: dayColor,
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                  geodesic: true,
                  icons: [{
                    icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3, strokeColor: dayColor, fillColor: dayColor, fillOpacity: 1 },
                    offset: '50%', repeat: '100px'
                  }]
                }}
              />
            )}

            {/* Stop markers */}
            {currentStops.map((stop, i) => (
              <Marker
                key={stop.stop_id || i}
                position={{ lat: stop.latitude, lng: stop.longitude }}
                label={{ text: String(i + 1), color: '#0a0f1a', fontWeight: 'bold', fontSize: '12px' }}
                title={stop.place_name}
                onClick={() => setSelectedStop(stop)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: stop.is_meal_stop ? '#f43f5e' : dayColor,
                  fillOpacity: 1,
                  strokeColor: '#0a0f1a',
                  strokeWeight: 3,
                  scale: selectedStop?.stop_id === stop.stop_id ? 16 : 12
                }}
              />
            ))}

            {/* InfoWindow */}
            {selectedStop && (
              <InfoWindow
                position={{ lat: selectedStop.latitude, lng: selectedStop.longitude }}
                onCloseClick={() => setSelectedStop(null)}
              >
                <div className="map-info-card">
                  <h4>{selectedStop.place_name}</h4>
                  <p style={{ fontSize: '0.72rem', color: '#38bdf8', marginBottom: 4 }}>
                    {selectedStop.suggested_arrival_time} — {selectedStop.suggested_departure_time}
                  </p>
                  {selectedStop.tips && <p style={{ fontStyle: 'italic' }}>💡 {selectedStop.tips}</p>}
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, fontSize: '0.7rem' }}>
                    {selectedStop.entry_fee && <span>🎫 {selectedStop.entry_fee}</span>}
                    {selectedStop.visit_duration_minutes && <span>⏱ {selectedStop.visit_duration_minutes}m</span>}
                  </div>
                  <a
                    href={selectedStop.google_maps_link}
                    target="_blank" rel="noopener noreferrer"
                    style={{ display: 'block', marginTop: 8, color: '#10b981', fontSize: '0.75rem', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="loading-center"><div className="spinner" /></div>
        )}
      </div>
    </div>
  );
}
