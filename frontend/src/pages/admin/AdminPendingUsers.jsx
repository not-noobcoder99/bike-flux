import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { UserCheck, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPendingUsers() {
  const [users, setUsers] = useState([]);

  function refresh() { client.get('/admin/users/pending').then((res) => setUsers(res.data)); }
  useEffect(refresh, []);

  async function handleApprove(user_id) {
    await client.patch(`/admin/users/${user_id}/approve`);
    refresh();
  }

  async function handleReject(user_id) {
    await client.delete(`/admin/users/${user_id}`);
    refresh();
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <UserCheck size={24} style={{ color: 'var(--accent-start)' }} />
        <h2>Pending Users</h2>
      </div>
      
      <div className="glass-card">
        {users.length === 0 ? (
          <div className="empty-state"><UserCheck size={40} /><p>No pending approvals.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Student ID</th><th>Phone</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id}>
                    <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.student_id || '—'}</td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="btn-sm" style={{ border: '1px solid var(--status-success)', color: 'var(--status-success)', background: 'transparent' }} onClick={() => handleApprove(u.user_id)}>
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button type="button" className="btn-danger btn-sm" onClick={() => handleReject(u.user_id)}>
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
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
