import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Route, MapPin } from 'lucide-react';

export default function AdminRides() {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState('');

  function refresh() { client.get('/admin/rides').then((res) => setRides(res.data)); }
  useEffect(refresh, []);

  return (
    <div className="dashboard-page fade-in">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <Route size={24} style={{ color: 'var(--accent-start)' }} />
        <h2>All System Rides</h2>
      </div>

      <div className="glass-card">
        {error && <p className="error">{error}</p>}
        {rides.length === 0 ? (
          <div className="empty-state"><Route size={40} /><p>No rides have been taken yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>User</th><th>Bike</th><th>Distance</th><th>Duration</th><th>Fare</th><th>Status</th><th>Started At</th></tr></thead>
              <tbody>
                {rides.map((r) => (
                  <tr key={r.ride_id}>
                    <td style={{ fontWeight: 600 }}>{r.user_name || `User #${r.user_id}`}</td>
                    <td>{r.plate_number || `Bike #${r.scooty_id}`}</td>
                    <td>{r.distance_km || 0} km</td>
                    <td>{r.duration_minutes || 0} mins</td>
                    <td>PKR {r.fare_amount || 0}</td>
                    <td><span className={`badge badge-${r.status === 'active' ? 'in_use' : 'completed'}`}>{r.status}</span></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{new Date(r.start_time).toLocaleString()}</td>
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
