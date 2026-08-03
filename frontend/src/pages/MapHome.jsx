import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import ScootyMarker from '../components/ScootyMarker.jsx';
import 'leaflet/dist/leaflet.css';

const NUST_CENTER = [33.6431, 72.9857]; // approx campus center, adjust as needed

export default function MapHome() {
  const [scooties, setScooties] = useState([]);
  const [position, setPosition] = useState(NUST_CENTER);
  const navigate = useNavigate();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {} // fall back to campus center if permission denied
    );
  }, []);

  useEffect(() => {
    client
      .get('/scooties/nearest', { params: { lat: position[0], lng: position[1] } })
      .then((res) => setScooties(res.data))
      .catch((err) => console.error(err));
  }, [position]);

  function handleSelect(scooty) {
    navigate('/scan', { state: { scooty } });
  }

  return (
    <div className="map-page">
      <h2>Nearby Scooties</h2>
      <MapContainer center={position} zoom={16} style={{ height: '70vh', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        {scooties.map((s) => (
          <ScootyMarker key={s.scooty_id} scooty={s} onSelect={handleSelect} />
        ))}
      </MapContainer>
    </div>
  );
}
