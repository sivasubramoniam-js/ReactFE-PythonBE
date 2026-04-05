import React from 'react';

const CATEGORY_ICONS = {
  temple: '🏛️', restaurant: '🍽️', cafe: '☕', beach: '🏖️', museum: '🏛️',
  historical: '🏰', park: '🌳', shopping: '🛍️', viewpoint: '📸',
  hotel: '🏨', adventure: '🧗', nightlife: '🌙'
};

export default function PlaceCard({ place, onClick }) {
  const cat = (place.category || '').toLowerCase();
  const icon = CATEGORY_ICONS[cat] || '📍';

  return (
    <div className="place-card" onClick={() => onClick && onClick(place)}>
      <div className="card-body">
        <span className={`card-category cat-${cat}`}>{icon} {cat || 'place'}</span>
        <h3 className="card-title">{place.name}</h3>
        <p className="card-desc">{place.description || place.ai_summary || ''}</p>
        <div className="card-meta">
          {place.google_rating && <span>⭐ {place.google_rating}</span>}
          {place.entry_fee && <span>🎫 {place.entry_fee}</span>}
          {place.estimated_visit_duration_minutes && <span>⏱ {place.estimated_visit_duration_minutes} min</span>}
          {place.crowd_level && <span>👥 {place.crowd_level}</span>}
        </div>
        {place.tags && place.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {place.tags.slice(0, 4).map((t, i) => (
              <span key={i} style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 10, border: '1px solid #1e293b', color: '#94a3b8' }}>{t}</span>
            ))}
          </div>
        )}
        {place.local_tips && (
          <p style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: 8, fontStyle: 'italic' }}>💡 {place.local_tips}</p>
        )}
      </div>
    </div>
  );
}
