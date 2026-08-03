import { useEffect, useState } from 'react';
import client from '../api/client.js';

const STATUS_OPTIONS = ['available', 'in_use', 'maintenance', 'offline'];

function ScootyStatusPanel() {
  const [scooties, setScooties] = useState([]);

  function refresh() {
    client.get('/admin/scooties').then((res) => setScooties(res.data));
  }

  useEffect(refresh, []);

  async function handleStatusChange(scooty_id, status) {
    await client.patch(`/admin/scooties/${scooty_id}/status`, { status });
    refresh();
  }

  return (
    <section>
      <h3>Scooty Fleet Status</h3>
      <table>
        <thead>
          <tr>
            <th>Plate</th><th>Model</th><th>Zone</th><th>Battery</th><th>Status</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {scooties.map((s) => (
            <tr key={s.scooty_id}>
              <td>{s.plate_number}</td>
              <td>{s.model || '—'}</td>
              <td>{s.zone_name || '—'}</td>
              <td>{s.battery_level}%</td>
              <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
              <td>
                <select
                  value={s.status}
                  onChange={(e) => handleStatusChange(s.scooty_id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function MaintenanceLogsPanel() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    client.get('/admin/maintenance-logs').then((res) => setLogs(res.data));
  }, []);

  return (
    <section>
      <h3>Maintenance Logs</h3>
      <table>
        <thead>
          <tr>
            <th>Scooty</th><th>Issue</th><th>Reporter</th><th>Status</th><th>Reported</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.log_id}>
              <td>{log.plate_number}</td>
              <td>{log.issue_description}</td>
              <td>{log.reporter_name || '—'}</td>
              <td><span className={`badge badge-${log.status}`}>{log.status}</span></td>
              <td>{new Date(log.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ZoneManagementPanel() {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({
    name: '', description: '', capacity: 20, center_lat: '', center_lng: '', coordinates: '',
  });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function refresh() {
    client.get('/admin/zones').then((res) => setZones(res.data));
  }

  useEffect(refresh, []);

  function resetForm() {
    setForm({ name: '', description: '', capacity: 20, center_lat: '', center_lng: '', coordinates: '' });
    setEditingId(null);
    setError('');
  }

  function startEdit(zone) {
    const geo = typeof zone.geofence_geojson === 'string'
      ? JSON.parse(zone.geofence_geojson)
      : zone.geofence_geojson;
    setEditingId(zone.zone_id);
    setForm({
      name: zone.name,
      description: zone.description || '',
      capacity: zone.capacity,
      center_lat: zone.center_lat || '',
      center_lng: zone.center_lng || '',
      coordinates: JSON.stringify(geo?.coordinates?.[0] || []),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    let coordinates;
    try {
      coordinates = JSON.parse(form.coordinates);
    } catch {
      setError('Coordinates must be valid JSON array of [lng, lat] pairs');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description,
      capacity: Number(form.capacity),
      center_lat: form.center_lat ? Number(form.center_lat) : null,
      center_lng: form.center_lng ? Number(form.center_lng) : null,
      geofence_geojson: { type: 'Polygon', coordinates: [coordinates] },
    };

    try {
      if (editingId) {
        await client.put(`/admin/zones/${editingId}`, payload);
      } else {
        await client.post('/admin/zones', payload);
      }
      resetForm();
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save zone');
    }
  }

  async function handleDelete(zone_id) {
    if (!window.confirm('Delete this zone?')) return;
    await client.delete(`/admin/zones/${zone_id}`);
    refresh();
  }

  return (
    <section>
      <h3>Zone Management</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Capacity</th><th>Center</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z) => (
            <tr key={z.zone_id}>
              <td>{z.name}</td>
              <td>{z.capacity}</td>
              <td>{z.center_lat}, {z.center_lng}</td>
              <td>
                <button type="button" className="btn-secondary" onClick={() => startEdit(z)}>Edit</button>
                {' '}
                <button type="button" className="btn-danger" onClick={() => handleDelete(z.zone_id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="zone-form" onSubmit={handleSubmit}>
        <h4>{editingId ? 'Edit Zone' : 'Add Zone'}</h4>
        {error && <p className="error">{error}</p>}
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        <input placeholder="Center lat" value={form.center_lat} onChange={(e) => setForm({ ...form, center_lat: e.target.value })} />
        <input placeholder="Center lng" value={form.center_lng} onChange={(e) => setForm({ ...form, center_lng: e.target.value })} />
        <textarea
          placeholder='Polygon coordinates JSON: [[lng,lat],[lng,lat],...]'
          value={form.coordinates}
          onChange={(e) => setForm({ ...form, coordinates: e.target.value })}
          rows={3}
        />
        <div className="form-actions">
          <button type="submit">{editingId ? 'Update Zone' : 'Create Zone'}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
        </div>
      </form>
    </section>
  );
}

function PendingUsersPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  function refresh() {
    client.get('/admin/users/pending').then((res) => setUsers(res.data));
  }

  useEffect(refresh, []);

  async function handleApprove(user_id) {
    try {
      await client.patch(`/admin/users/${user_id}/approve`);
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve user');
    }
  }

  async function handleSuspend(user_id) {
    if (!window.confirm('Suspend this account?')) return;
    try {
      await client.patch(`/admin/users/${user_id}/suspend`);
      refresh();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to suspend user');
    }
  }

  return (
    <section>
      <h3>Pending Registrations ({users.length})</h3>
      {error && <p className="error">{error}</p>}
      <table>
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Phone</th><th>Student ID</th><th>Registered</th><th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.user_id}>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td>{u.phone || '—'}</td>
              <td>{u.student_id || '—'}</td>
              <td>{new Date(u.created_at).toLocaleString()}</td>
              <td>
                <button type="button" onClick={() => handleApprove(u.user_id)}>Approve</button>
                {' '}
                <button type="button" className="btn-danger" onClick={() => handleSuspend(u.user_id)}>Reject</button>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr><td colSpan={6}>No pending registrations.</td></tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('scooties');

  function refreshStats() {
    client.get('/admin/dashboard').then((res) => setStats(res.data));
  }

  useEffect(refreshStats, []);

  return (
    <div className="dashboard-page">
      <h2>Admin Dashboard</h2>

      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{stats.scooty_counts.available || 0}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.scooty_counts.in_use || 0}</span>
            <span className="stat-label">In Use</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.scooty_counts.maintenance || 0}</span>
            <span className="stat-label">Maintenance</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.open_maintenance_logs}</span>
            <span className="stat-label">Open Logs</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.zone_count}</span>
            <span className="stat-label">Zones</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.pending_users}</span>
            <span className="stat-label">Pending Users</span>
          </div>
        </div>
      )}

      <div className="tab-bar">
        <button type="button" className={tab === 'scooties' ? 'active' : ''} onClick={() => setTab('scooties')}>Scooties</button>
        <button type="button" className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>Maintenance Logs</button>
        <button type="button" className={tab === 'zones' ? 'active' : ''} onClick={() => setTab('zones')}>Zones</button>
        <button type="button" className={tab === 'users' ? 'active' : ''} onClick={() => { setTab('users'); refreshStats(); }}>Pending Users</button>
      </div>

      {tab === 'scooties' && <ScootyStatusPanel />}
      {tab === 'logs' && <MaintenanceLogsPanel />}
      {tab === 'zones' && <ZoneManagementPanel />}
      {tab === 'users' && <PendingUsersPanel />}
    </div>
  );
}
