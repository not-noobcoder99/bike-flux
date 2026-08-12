import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import client from '../api/client.js';
import ScootyMarker from '../components/ScootyMarker.jsx';
import { MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons broken by Vite's bundler
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const NUST_CENTER = [33.6431, 72.9857];

export default function MapHome() {
  const [scooties, setScooties] = useState([]);
  const [position, setPosition] = useState(NUST_CENTER);
  const [activeRide, setActiveRide] = useState(null);
  const navigate = useNavigate();

  // Check for active ride on load — redirect if mid-ride
  useEffect(() => {
    client
      .get('/rides/active')
      .then((res) => {
        if (res.data && res.data.ride_id) {
          setActiveRide(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {}
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
      <div className="map-overlay fade-in">
        <MapPin size={20} />
        <h2>Nearby Scooties</h2>
        <span className="map-count-badge">{scooties.length} found</span>
      </div>

      {activeRide && (
        <div
          className="active-ride-banner fade-in"
          onClick={() => navigate('/ride', { state: { ride_id: activeRide.ride_id } })}
        >
          <div className="pulse-dot"></div>
          You have an active ride — tap to resume
        </div>
      )}

      <MapContainer
        center={position}
        zoom={16}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
        />
        {scooties.map((s) => (
          <ScootyMarker key={s.scooty_id} scooty={s} onSelect={handleSelect} />
        ))}
      </MapContainer>
    </div>
  );
}
