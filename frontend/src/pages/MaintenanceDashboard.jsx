import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { Wrench, AlertTriangle, Send, AlertCircle, Bike, Battery } from 'lucide-react';

const LOG_STATUS = ['open', 'in_progress', 'resolved'];
const SCOOTY_STATUS = ['available', 'maintenance', 'offline'];

export default function MaintenanceDashboard() {
  const [logs, setLogs] = useState([]);
  const [scooties, setScooties] = useState([]);
  const [form, setForm] = useState({ scooty_id: '', issue_description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function refreshLogs() {
    client.get('/maintenance/logs').then((res) => setLogs(res.data));
  }

  function refreshScooties() {
    client.get('/maintenance/scooties').then((res) => setScooties(res.data));
  }

  useEffect(() => {
    Promise.all([
      client.get('/maintenance/logs').then((res) => setLogs(res.data)),
      client.get('/maintenance/scooties').then((res) => setScooties(res.data)),
    ]).finally(() => setLoading(false));
  }, []);

  async function handleReport(e) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/maintenance/logs', {
        scooty_id: Number(form.scooty_id),
        issue_description: form.issue_description,
      });
      setForm({ scooty_id: '', issue_description: '' });
      refreshLogs();
      refreshScooties();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to report issue');
    }
  }

  async function handleLogStatusChange(log_id, status) {
    await client.patch(`/maintenance/logs/${log_id}`, { status });
    refreshLogs();
    refreshScooties();
  }

  async function handleScootyStatusChange(scooty_id, status) {
    await client.patch(`/maintenance/scooties/${scooty_id}/status`, { status });
    refreshScooties();
  }

  const maintenanceScooties = scooties.filter((s) => s.status === 'maintenance');
  const openLogs = logs.filter((l) => l.status !== 'resolved');

  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner"></div>
        <span className="spinner-text">Loading maintenance data...</span>
      </div>
    );
  }

  return (
    <div className="dashboard-page fade-in">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <Wrench size={24} style={{ color: 'var(--accent-start)' }} /> Maintenance Dashboard
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Report issues, track open logs, and manage scooty status.
      </p>

      {/* Report Issue */}
      <section>
        <div className="glass-card">
          <div className="glass-card-header">
            <AlertTriangle size={22} />
            <h3>Report Issue</h3>
          </div>
          <form onSubmit={handleReport}>
            {error && (
              <p className="error">
                <AlertCircle size={16} /> {error}
              </p>
            )}
            <div className="form-group">
              <label>Select Scooty</label>
              <select
                value={form.scooty_id}
                onChange={(e) => setForm({ ...form, scooty_id: e.target.value })}
                required
              >
                <option value="">Choose a scooty...</option>
                {scooties.map((s) => (
                  <option key={s.scooty_id} value={s.scooty_id}>
                    {s.plate_number} ({s.status})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Issue Description</label>
              <textarea
                placeholder="Describe the issue in detail..."
                value={form.issue_description}
                onChange={(e) => setForm({ ...form, issue_description: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit">
                <Send size={16} /> Report Issue
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Open Maintenance Logs */}
      <section>
        <div className="glass-card">
          <div className="glass-card-header">
            <AlertTriangle size={22} />
            <h3>Open Maintenance Logs</h3>
            {openLogs.length > 0 && <span className="badge badge-open">{openLogs.length} open</span>}
          </div>
          {openLogs.length === 0 ? (
            <div className="empty-state">
              <AlertTriangle size={40} />
              <p>No open maintenance logs. All clear!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Scooty</th><th>Issue</th><th>Reporter</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {openLogs.map((log) => (
                    <tr key={log.log_id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.plate_number}</td>
                      <td>{log.issue_description}</td>
                      <td>{log.reporter_name || '—'}</td>
                      <td><span className={`badge badge-${log.status}`}>{log.status}</span></td>
                      <td>
                        <select
                          value={log.status}
                          onChange={(e) => handleLogStatusChange(log.log_id, e.target.value)}
                        >
                          {LOG_STATUS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Scooties in Maintenance */}
      <section>
        <div className="glass-card">
          <div className="glass-card-header">
            <Bike size={22} />
            <h3>Scooties in Maintenance</h3>
            <span className="badge badge-maintenance">{maintenanceScooties.length}</span>
          </div>
          {maintenanceScooties.length === 0 ? (
            <div className="empty-state">
              <Bike size={40} />
              <p>No scooties currently in maintenance.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Plate</th><th>Battery</th><th>Status</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceScooties.map((s) => (
                    <tr key={s.scooty_id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.plate_number}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Battery size={14} /> {s.battery_level}%
                        </div>
                      </td>
                      <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                      <td>
                        <select
                          value={s.status}
                          onChange={(e) => handleScootyStatusChange(s.scooty_id, e.target.value)}
                        >
                          {SCOOTY_STATUS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
