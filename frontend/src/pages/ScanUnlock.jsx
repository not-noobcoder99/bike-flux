import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client.js';

// In production this reads a real QR code (e.g. via a camera library).
// Here the scooty is passed in via navigation state from the map marker,
// standing in for "scan result -> scooty_id".
export default function ScanUnlock() {
  const { state } = useLocation();
  const scooty = state?.scooty;
  const [status, setStatus] = useState('idle'); // idle | unlocking | unlocked
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleUnlock() {
    setStatus('unlocking');
    setError('');
    try {
      navigator.geolocation?.getCurrentPosition(async (pos) => {
        const res = await client.post('/rides/unlock', {
          scooty_id: scooty.scooty_id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setStatus('unlocked');
        navigate('/ride', { state: { ride_id: res.data.ride_id } });
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Unlock failed');
      setStatus('idle');
    }
  }

  if (!scooty) return <p>No scooty selected. Go back to the map and tap a marker.</p>;

  return (
    <div className="scan-page">
      <h2>Scooty {scooty.plate_number}</h2>
      <p>Battery: {scooty.battery_level}%</p>
      {error && <p className="error">{error}</p>}
      <button disabled={status === 'unlocking'} onClick={handleUnlock}>
        {status === 'unlocking' ? 'Unlocking...' : 'Confirm & Unlock'}
      </button>
    </div>
  );
}
