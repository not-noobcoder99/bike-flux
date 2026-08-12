import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { History, Clock } from 'lucide-react';

export default function RideHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/rides/history')
      .then((res) => setRides(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner"></div>
        <span className="spinner-text">Loading ride history...</span>
      </div>
    );
  }

  return (
    <div className="history-page fade-in">
      <div className="glass-card">
        <div className="glass-card-header">
          <History size={22} />
          <h3>Ride History</h3>
        </div>

        {rides.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <p>No rides yet. Unlock a scooty from the map to take your first ride!</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Distance</th>
                  <th>Duration</th>
                  <th>Fare</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rides.map((r) => (
                  <tr key={r.ride_id}>
                    <td>{new Date(r.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{r.distance_km} km</td>
                    <td>{r.duration_minutes} min</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>PKR {r.fare_amount}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
