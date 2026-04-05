import React, { useState, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { AppContext } from '../App';
import axios from 'axios';

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c4a6e' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#38bdf8' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#134e4a' }] },
];

const CATEGORY_COLORS = {
  temple: '#fb923c', restaurant: '#f43f5e', cafe: '#f43f5e', beach: '#38bdf8',
  museum: '#a855f7', historical: '#a855f7', park: '#34d399', shopping: '#fbbf24',
  viewpoint: '#818cf8', hotel: '#f472b6', adventure: '#34d399', nightlife: '#c084fc'
};

const CATEGORY_ICONS = {
  temple: '🏛️', restaurant: '🍽️', cafe: '☕', beach: '🏖️', museum: '🏛️',
  historical: '🏰', park: '🌳', shopping: '🛍️', viewpoint: '📸',
  hotel: '🏨', adventure: '🧗', nightlife: '🌙'
};

export default function Explore() {
  const { mapsKey, api, sessionId } = useContext(AppContext);
  const location = useLocation();
  const passedPlaces = location.state?.allPlaces || [];
  const passedSelected = location.state?.selectedPlace || null;

  const [places, setPlaces] = useState(passedPlaces);
  const [selectedPlace, setSelectedPlace] = useState(passedSelected);
  const [map, setMap] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [loading, setLoading] = useState(false);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: mapsKey });

  const center = React.useMemo(() => {
    if (passedSelected) return { lat: passedSelected.latitude, lng: passedSelected.longitude };
    if (passedPlaces.length > 0) {
      const avgLat = passedPlaces.reduce((s, p) => s + (p.latitude || 0), 0) / passedPlaces.length;
      const avgLng = passedPlaces.reduce((s, p) => s + (p.longitude || 0), 0) / passedPlaces.length;
      return { lat: avgLat, lng: avgLng };
    }
    return { lat: 12.9716, lng: 77.5946 }; // Bangalore default
  }, [passedPlaces, passedSelected]);

  const onMapLoad = useCallback(m => setMap(m), []);

  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${api}/api/search`, { query: searchQ });
      const newPlaces = res.data.places || [];
      setPlaces(newPlaces);
      if (newPlaces.length > 0 && map) {
        const bounds = new window.google.maps.LatLngBounds();
        newPlaces.forEach(p => bounds.extend({ lat: p.latitude, lng: p.longitude }));
        map.fitBounds(bounds, 60);
      }
    } catch {}
    setLoading(false);
  };

  const saveFavorite = async (place) => {
    await axios.post(`${api}/api/favorites/add`, {
      session_id: sessionId, place_id: place.place_id, place_name: place.name,
      latitude: place.latitude, longitude: place.longitude, category: place.category
    });
    alert(`💾 ${place.name} saved to favorites!`);
  };

  if (!isLoaded) return <div className="loading-center"><div className="spinner" /><p>Loading map…</p></div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>
      {/* Sidebar */}
      <div style={{ width: 360, minWidth: 320, background: '#0a0f1a', borderRight: '1px solid #1e293b', overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="search-box" style={{ maxWidth: '100%' }}>
          <input
            placeholder="Search places…"
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && doSearch()}
            style={{ fontSize: '0.9rem', padding: 12 }}
          />
          <button onClick={doSearch} disabled={loading} style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
            {loading ? '…' : '🔍'}
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>{places.length} places</p>

        {places.map((p, i) => (
          <div
            key={p.place_id || i}
            onClick={() => {
              setSelectedPlace(p);
              map?.panTo({ lat: p.latitude, lng: p.longitude });
              map?.setZoom(15);
            }}
            style={{
              padding: 12, background: selectedPlace?.place_id === p.place_id ? '#1e293b' : '#111827',
              borderRadius: 10, border: `1px solid ${selectedPlace?.place_id === p.place_id ? '#38bdf8' : '#1e293b'}`,
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.65rem', color: CATEGORY_COLORS[(p.category || '').toLowerCase()] || '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1 }}>
                  {CATEGORY_ICONS[(p.category || '').toLowerCase()] || '📍'} {p.category}
                </span>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9', margin: '4px 0 2px' }}>{p.name}</h4>
              </div>
              {p.google_rating && <span style={{ fontSize: '0.75rem', color: '#fbbf24' }}>⭐ {p.google_rating}</span>}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              {(p.description || '').slice(0, 85)}{(p.description || '').length > 85 ? '…' : ''}
            </p>
            {p.entry_fee && <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4, display: 'inline-block' }}>🎫 {p.entry_fee}</span>}
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1 }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={center}
          zoom={passedPlaces.length > 0 ? 12 : 10}
          onLoad={onMapLoad}
          options={{ styles: MAP_STYLES, disableDefaultUI: false, zoomControl: true, mapTypeControl: false, streetViewControl: false }}
        >
          {places.map((p, i) => (
            <Marker
              key={p.place_id || i}
              position={{ lat: p.latitude, lng: p.longitude }}
              title={p.name}
              onClick={() => setSelectedPlace(p)}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: CATEGORY_COLORS[(p.category || '').toLowerCase()] || '#38bdf8',
                fillOpacity: 1,
                strokeColor: '#0a0f1a',
                strokeWeight: 2,
                scale: selectedPlace?.place_id === p.place_id ? 12 : 8
              }}
            />
          ))}

          {selectedPlace && (
            <InfoWindow
              position={{ lat: selectedPlace.latitude, lng: selectedPlace.longitude }}
              onCloseClick={() => setSelectedPlace(null)}
            >
              <div className="map-info-card">
                <h4>{selectedPlace.name}</h4>
                <p style={{ marginBottom: 6 }}>{(selectedPlace.description || '').slice(0, 120)}</p>
                <div style={{ display: 'flex', gap: 8, fontSize: '0.72rem', color: '#64748b', marginBottom: 8 }}>
                  {selectedPlace.google_rating && <span>⭐ {selectedPlace.google_rating}</span>}
                  {selectedPlace.entry_fee && <span>🎫 {selectedPlace.entry_fee}</span>}
                  {selectedPlace.estimated_visit_duration_minutes && <span>⏱ {selectedPlace.estimated_visit_duration_minutes}m</span>}
                </div>
                {selectedPlace.local_tips && <p style={{ fontSize: '0.72rem', color: '#38bdf8', fontStyle: 'italic' }}>💡 {selectedPlace.local_tips}</p>}
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selectedPlace.latitude},${selectedPlace.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: '#10b981', textDecoration: 'none', fontWeight: 600 }}
                  >
                    📍 Directions
                  </a>
                  <button
                    onClick={() => saveFavorite(selectedPlace)}
                    style={{ fontSize: '0.75rem', color: '#f472b6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                  >
                    ❤️ Save
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
