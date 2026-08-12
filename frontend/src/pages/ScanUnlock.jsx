import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { Unlock, AlertCircle, Battery, ArrowLeft, MapPin } from 'lucide-react';

export default function ScanUnlock() {
  const { state } = useLocation();
  const scooty = state?.scooty;
  const [status, setStatus] = useState('idle'); // idle | unlocking | unlocked
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleUnlock() {
    setStatus('unlocking');
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setStatus('idle');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await client.post('/rides/unlock', {
            scooty_id: scooty.scooty_id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setStatus('unlocked');
          navigate('/ride', { state: { ride_id: res.data.ride_id } });
        } catch (err) {
          setError(err.response?.data?.error || 'Unlock failed');
          setStatus('idle');
        }
      },
      (geoErr) => {
        setError(`Location access denied: ${geoErr.message}`);
        setStatus('idle');
      }
    );
  }

  if (!scooty) {
    return (
      <div className="scan-page fade-in">
        <div className="ride-detail-card">
          <div className="empty-state">
            <MapPin size={48} />
            <p>No scooty selected. Go back to the map and tap a marker.</p>
          </div>
          <button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
            <ArrowLeft size={18} /> Back to Map
          </button>
        </div>
      </div>
    );
  }

  const level = scooty.battery_level;
  const barClass = level >= 60 ? 'high' : level >= 25 ? 'medium' : 'low';

  return (
    <div className="scan-page fade-in">
      <div className="ride-detail-card">
        <h2>Scooty {scooty.plate_number}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Ready to unlock</p>

        <div className="battery-display">
          <Battery size={20} style={{ color: `var(--status-${barClass === 'high' ? 'success' : barClass === 'medium' ? 'warning' : 'danger'})` }} />
          <div className="battery-bar">
            <div className={`battery-fill ${barClass}`} style={{ width: `${level}%` }} />
          </div>
          <span className="battery-text">{level}%</span>
        </div>

        {error && (
          <p className="error" style={{ textAlign: 'left', marginTop: '1rem' }}>
            <AlertCircle size={16} /> {error}
          </p>
        )}

        <button
          disabled={status === 'unlocking'}
          onClick={handleUnlock}
          style={{ width: '100%', marginTop: '1.5rem', padding: '14px' }}
        >
          {status === 'unlocking' ? (
            <><div className="spinner spinner-sm"></div> Unlocking...</>
          ) : (
            <><Unlock size={20} /> Confirm & Unlock</>
          )}
        </button>
      </div>
    </div>
  );
}
