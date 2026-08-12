import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Receipt, Plus } from 'lucide-react';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [form, setForm] = useState({ user_id: '', amount: '', type: 'topup', status: 'success' });
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);

  function refresh() { 
    client.get('/admin/transactions').then((res) => setTransactions(res.data)); 
    client.get('/admin/users').then((res) => setUsers(res.data));
  }
  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/admin/transactions', {
        user_id: Number(form.user_id), amount: Number(form.amount), type: form.type, status: form.status,
      });
      setForm({ user_id: '', amount: '', type: 'topup', status: 'success' });
      refresh();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add transaction'); }
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <Receipt size={24} style={{ color: 'var(--accent-start)' }} />
        <h2>Transactions</h2>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        {transactions.length === 0 ? (
          <div className="empty-state"><Receipt size={40} /><p>No transactions yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.transaction_id}>
                    <td>{new Date(t.created_at).toLocaleString()}</td>
                    <td>{t.type.replace('_', ' ')}</td>
                    <td style={{ fontWeight: 600 }}>PKR {t.amount}</td>
                    <td><span className={`badge badge-${t.status === 'success' ? 'available' : 'offline'}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <Plus size={20} />
          <h3>Manual Transaction (Topup/Refund)</h3>
        </div>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleAdd} className="admin-form">
          <div className="form-group">
            <label>User</label>
            <select value={form.user_id} onChange={(e) => setForm({...form, user_id: e.target.value})} required>
              <option value="">Select user</option>
              {users.map(u => <option key={u.user_id} value={u.user_id}>{u.full_name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Amount (PKR)</label><input type="number" required value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} /></div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})}>
              <option value="topup">Topup</option>
              <option value="refund">Refund</option>
              <option value="ride_charge">Ride Charge</option>
            </select>
          </div>
          <button type="submit" style={{ marginTop: '1rem' }}>Create Transaction</button>
        </form>
      </div>
    </div>
  );
}
