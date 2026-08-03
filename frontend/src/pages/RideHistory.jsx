import { useEffect, useState } from 'react';
import client from '../api/client.js';

export default function RideHistory() {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    client.get('/rides/history').then((res) => setRides(res.data));
  }, []);

  return (
    <div className="history-page">
      <h2>Ride History</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Distance (km)</th><th>Duration (min)</th><th>Fare</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rides.map((r) => (
            <tr key={r.ride_id}>
              <td>{new Date(r.created_at).toLocaleString()}</td>
              <td>{r.distance_km}</td>
              <td>{r.duration_minutes}</td>
              <td>PKR {r.fare_amount}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
