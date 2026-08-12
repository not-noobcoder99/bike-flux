import { Marker, Popup } from 'react-leaflet';

export default function ScootyMarker({ scooty, onSelect }) {
  const level = scooty.battery_level;
  const barClass = level >= 60 ? 'high' : level >= 25 ? 'medium' : 'low';

  return (
    <Marker position={[scooty.current_lat, scooty.current_lng]}>
      <Popup>
        <div>
          <strong style={{ fontSize: '1rem' }}>{scooty.plate_number}</strong>
          <div className="popup-battery-bar">
            <div
              className={`popup-battery-fill ${barClass}`}
              style={{ width: `${level}%` }}
            />
          </div>
          <p style={{ margin: '4px 0', fontSize: '0.82rem' }}>Battery: {level}%</p>
          <button
            onClick={() => onSelect(scooty)}
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '7px 14px',
              fontSize: '0.82rem',
            }}
          >
            Scan & Unlock
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
