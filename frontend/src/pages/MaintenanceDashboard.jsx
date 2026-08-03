import { useEffect, useState } from 'react';
import client from '../api/client.js';

const LOG_STATUS = ['open', 'in_progress', 'resolved'];
const SCOOTY_STATUS = ['available', 'maintenance', 'offline'];

export default function MaintenanceDashboard() {
  const [logs, setLogs] = useState([]);
  const [scooties, setScooties] = useState([]);
  const [form, setForm] = useState({ scooty_id: '', issue_description: '' });
  const [error, setError] = useState('');

  function refreshLogs() {
    client.get('/maintenance/logs').then((res) => setLogs(res.data));
  }

  function refreshScooties() {
    client.get('/maintenance/scooties').then((res) => setScooties(res.data));
  }

  useEffect(() => {
    refreshLogs();
    refreshScooties();
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

  return (
    <div className="dashboard-page">
      <h2>Maintenance Dashboard</h2>

      <section>
        <h3>Report Issue</h3>
        <form onSubmit={handleReport}>
          {error && <p className="error">{error}</p>}
          <select
            value={form.scooty_id}
            onChange={(e) => setForm({ ...form, scooty_id: e.target.value })}
            required
          >
            <option value="">Select scooty</option>
            {scooties.map((s) => (
              <option key={s.scooty_id} value={s.scooty_id}>
                {s.plate_number} ({s.status})
              </option>
            ))}
          </select>
          <textarea
            placeholder="Describe the issue"
            value={form.issue_description}
            onChange={(e) => setForm({ ...form, issue_description: e.target.value })}
            rows={3}
            required
          />
          <button type="submit">Report Issue</button>
        </form>
      </section>

      <section>
        <h3>Open Maintenance Logs</h3>
        <table>
          <thead>
            <tr>
              <th>Scooty</th><th>Issue</th><th>Reporter</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {logs.filter((l) => l.status !== 'resolved').map((log) => (
              <tr key={log.log_id}>
                <td>{log.plate_number}</td>
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
      </section>

      <section>
        <h3>Scooties in Maintenance ({maintenanceScooties.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Plate</th><th>Battery</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceScooties.map((s) => (
              <tr key={s.scooty_id}>
                <td>{s.plate_number}</td>
                <td>{s.battery_level}%</td>
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
      </section>
    </div>
  );
}
