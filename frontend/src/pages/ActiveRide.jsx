import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { Camera, MapPin, CheckCircle, AlertCircle, ArrowLeft, Route, Clock, Banknote } from 'lucide-react';

export default function ActiveRide() {
  const { state } = useLocation();
  const ride_id = state?.ride_id;
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [ending, setEnding] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const uploadRes = await client.post('/rides/upload-photo', formData);
      await client.post('/rides/condition-photo', {
        ride_id,
        photo_url: uploadRes.data.photo_url,
        photo_type: 'start',
      });
      setPhotoConfirmed(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Photo upload failed');
    } finally {
      setUploading(false);
    }
  }

  function handleEndRide() {
    setEnding(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setEnding(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await client.post('/rides/end', {
            ride_id,
            end_lat: pos.coords.latitude,
            end_lng: pos.coords.longitude,
          });
          setResult(res.data);
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to end ride');
        } finally {
          setEnding(false);
        }
      },
      (geoErr) => {
        setError(`Location access denied: ${geoErr.message}`);
        setEnding(false);
      }
    );
  }

  if (!ride_id) {
    return (
      <div className="ride-page fade-in">
        <div className="ride-detail-card">
          <div className="empty-state">
            <MapPin size={48} />
            <p>No active ride found. Go unlock a scooty first.</p>
          </div>
          <button onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
            <ArrowLeft size={18} /> Back to Map
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="ride-page fade-in">
        <div className="ride-detail-card">
          <div style={{ marginBottom: '0.5rem' }}>
            <CheckCircle size={48} style={{ color: 'var(--status-success)' }} />
          </div>
          <h2>Ride Complete!</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Here's your trip summary</p>

          <div className="ride-summary-grid">
            <div className="ride-summary-item">
              <Route size={22} style={{ color: 'var(--accent-start)', marginBottom: '4px' }} />
              <span className="value">{result.distance_km.toFixed(2)}</span>
              <span className="label">Kilometers</span>
            </div>
            <div className="ride-summary-item">
              <Clock size={22} style={{ color: 'var(--accent-end)', marginBottom: '4px' }} />
              <span className="value">{result.duration_minutes}</span>
              <span className="label">Minutes</span>
            </div>
            <div className="ride-summary-item">
              <Banknote size={22} style={{ color: 'var(--status-success)', marginBottom: '4px' }} />
              <span className="value">PKR {result.fare_amount}</span>
              <span className="label">Fare Charged</span>
            </div>
          </div>

          <button onClick={() => navigate('/')} style={{ width: '100%' }}>
            <ArrowLeft size={18} /> Back to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ride-page fade-in">
      <div className="ride-detail-card">
        <h2>Ride #{ride_id}</h2>

        {error && (
          <p className="error" style={{ textAlign: 'left', marginTop: '1rem' }}>
            <AlertCircle size={16} /> {error}
          </p>
        )}

        {!photoConfirmed ? (
          <div style={{ marginTop: '1.5rem' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              <Camera size={18} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Take a photo confirming the scooty's condition before riding off.
            </p>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              disabled={uploading}
            />
            {uploading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '0.75rem', color: 'var(--text-muted)' }}>
                <div className="spinner spinner-sm"></div>
                Uploading photo...
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: '1.5rem' }}>
            <div className="ride-active-indicator">
              <div className="pulse-dot"></div>
              Ride in progress — GPS is tracking your trip
            </div>
            <button
              disabled={ending}
              onClick={handleEndRide}
              style={{ width: '100%', marginTop: '1rem', padding: '14px' }}
              className="btn-danger"
            >
              {ending ? (
                <><div className="spinner spinner-sm"></div> Ending ride...</>
              ) : (
                <>End Ride</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
