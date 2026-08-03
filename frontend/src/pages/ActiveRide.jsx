import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client.js';

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
      // Don't set Content-Type manually — axios must generate it itself
      // so it includes the multipart boundary, or the backend can't parse the file.
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

  async function handleEndRide() {
    setEnding(true);
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      const res = await client.post('/rides/end', {
        ride_id,
        end_lat: pos.coords.latitude,
        end_lng: pos.coords.longitude,
      });
      setResult(res.data);
      setEnding(false);
    });
  }

  if (!ride_id) return <p>No active ride found. Go unlock a scooty first.</p>;

  if (result) {
    return (
      <div className="ride-summary">
        <h2>Ride complete!</h2>
        <p>Distance: {result.distance_km.toFixed(2)} km</p>
        <p>Duration: {result.duration_minutes} min</p>
        <p>Fare charged: PKR {result.fare_amount}</p>
        <button onClick={() => navigate('/')}>Back to map</button>
      </div>
    );
  }

  return (
    <div className="ride-page">
      <h2>Ride #{ride_id}</h2>
      {error && <p className="error">{error}</p>}
      {!photoConfirmed ? (
        <>
          <p>Take a photo confirming the scooty's condition before riding off.</p>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            disabled={uploading}
          />
          {uploading && <p>Uploading...</p>}
        </>
      ) : (
        <>
          <p>Ride in progress. GPS is tracking your trip.</p>
          <button disabled={ending} onClick={handleEndRide}>
            {ending ? 'Ending ride...' : 'End Ride'}
          </button>
        </>
      )}
    </div>
  );
}
