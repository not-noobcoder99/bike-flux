import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { CreditCard, AlertCircle } from 'lucide-react';

const CARD_STATUS_OPTIONS = ['active', 'blocked', 'expired'];

export default function AdminVirtualCards() {
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');

  function refresh() { client.get('/admin/virtual-cards').then((res) => setCards(res.data)); }
  useEffect(refresh, []);

  async function handleStatusChange(card_id, status) {
    try { await client.patch(`/admin/virtual-cards/${card_id}/status`, { status }); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to update card'); }
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <CreditCard size={24} style={{ color: 'var(--accent-start)' }} />
        <h2>Virtual Cards</h2>
      </div>

      <div className="glass-card">
        {error && <p className="error"><AlertCircle size={16} /> {error}</p>}
        {cards.length === 0 ? (
          <div className="empty-state"><CreditCard size={40} /><p>No virtual cards yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>User</th><th>Card Number</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {cards.map((c) => (
                  <tr key={c.card_id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.full_name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({c.email})</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{c.card_number}</td>
                    <td>PKR {c.balance}</td>
                    <td><span className={`badge badge-${c.status === 'active' ? 'available' : 'offline'}`}>{c.status}</span></td>
                    <td>
                      <select value={c.status} onChange={(e) => handleStatusChange(c.card_id, e.target.value)}>
                        {CARD_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
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
