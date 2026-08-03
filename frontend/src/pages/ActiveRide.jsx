import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client.js';

export default function ActiveRide() {
  const { state } = useLocation();
  const ride_id = state?.ride_id;
  const [photoConfirmed, setPhotoConfirmed] = useState(false);
  const [ending, setEnding] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  // Placeholder: real implementation uploads the captured photo to storage
  // (e.g. S3) first, then sends the resulting URL here.
  async function confirmConditionPhoto() {
    const fakePhotoUrl = `https://storage.example.com/condition/${ride_id}-start.jpg`;
    await client.post('/rides/condition-photo', { ride_id, photo_url: fakePhotoUrl, photo_type: 'start' });
    setPhotoConfirmed(true);
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
      {!photoConfirmed ? (
        <>
          <p>Take a photo confirming the scooty's condition before riding off.</p>
          <button onClick={confirmConditionPhoto}>Confirm Condition Photo</button>
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
