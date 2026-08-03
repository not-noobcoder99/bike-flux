import { Marker, Popup } from 'react-leaflet';

export default function ScootyMarker({ scooty, onSelect }) {
  return (
    <Marker position={[scooty.current_lat, scooty.current_lng]}>
      <Popup>
        <div>
          <strong>{scooty.plate_number}</strong>
          <p>Battery: {scooty.battery_level}%</p>
          <button onClick={() => onSelect(scooty)}>Scan &amp; Unlock</button>
        </div>
      </Popup>
    </Marker>
  );
}
