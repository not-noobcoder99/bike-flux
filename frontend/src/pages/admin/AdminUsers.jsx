import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Users, Trash2 } from 'lucide-react';

const ROLE_OPTIONS = ['rider', 'admin', 'maintenance'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  function refresh() { client.get('/admin/users').then((res) => setUsers(res.data)); }
  useEffect(refresh, []);

  async function handleSuspend(user_id) {
    try { await client.patch(`/admin/users/${user_id}/suspend`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to suspend user'); }
  }

  async function handleRoleChange(user_id, role) {
    try { await client.patch(`/admin/users/${user_id}/role`, { role }); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to update role'); }
  }

  async function handleDelete(user_id) {
    if (!window.confirm('Permanently delete user?')) return;
    try { await client.delete(`/admin/users/${user_id}`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to delete user'); }
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <Users size={24} style={{ color: 'var(--accent-start)' }} />
        <h2>All Users</h2>
      </div>
      
      <div className="glass-card">
        {error && <p className="error" style={{ marginBottom: '1rem' }}>{error}</p>}
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select value={u.role} onChange={(e) => handleRoleChange(u.user_id, e.target.value)}>
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td><span className={`badge badge-${u.status === 'active' ? 'available' : 'offline'}`}>{u.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {u.status !== 'suspended' && (
                        <button type="button" className="btn-sm" style={{ border: '1px solid var(--status-error)', color: 'var(--status-error)', background: 'transparent' }} onClick={() => handleSuspend(u.user_id)}>Suspend</button>
                      )}
                      <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(u.user_id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
