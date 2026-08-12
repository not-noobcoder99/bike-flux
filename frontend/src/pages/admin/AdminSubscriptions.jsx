import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Crown, XCircle } from 'lucide-react';

export default function AdminSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState('');

  function refresh() { client.get('/admin/subscriptions').then((res) => setSubscriptions(res.data)); }
  useEffect(refresh, []);

  async function handleCancel(sub_id) {
    if (!window.confirm('Cancel this subscription?')) return;
    try { await client.post(`/admin/subscriptions/${sub_id}/cancel`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to cancel subscription'); }
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <Crown size={24} style={{ color: 'var(--accent-start)' }} />
        <h2>Subscriptions</h2>
      </div>

      <div className="glass-card">
        {error && <p className="error">{error}</p>}
        {subscriptions.length === 0 ? (
          <div className="empty-state"><Crown size={40} /><p>No subscriptions yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>User</th><th>Plan</th><th>Started</th><th>End Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {subscriptions.map((s) => (
                  <tr key={s.subscription_id}>
                    <td style={{ fontWeight: 600 }}>{s.full_name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({s.email})</span></td>
                    <td>{s.plan_name}</td>
                    <td>{new Date(s.start_date).toLocaleDateString()}</td>
                    <td>{new Date(s.end_date).toLocaleDateString()}</td>
                    <td><span className={`badge badge-${s.status === 'active' ? 'available' : 'offline'}`}>{s.status}</span></td>
                    <td>
                      {s.status === 'active' && (
                        <button type="button" className="btn-danger btn-sm" onClick={() => handleCancel(s.subscription_id)}>
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                    </td>
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
