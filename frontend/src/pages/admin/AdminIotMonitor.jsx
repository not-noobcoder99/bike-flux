import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Cpu, Signal, Trash2 } from 'lucide-react';

export default function AdminIotMonitor() {
  const [units, setUnits] = useState([]);
  const [error, setError] = useState('');

  function refresh() { client.get('/admin/iot-units').then((res) => setUnits(res.data)); }
  useEffect(refresh, []);

  async function handlePing(unit_id) {
    try { await client.patch(`/admin/iot-units/${unit_id}/simulate-ping`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to ping unit'); }
  }

  async function handleDelete(unit_id) {
    if (!window.confirm('Delete this IoT unit record?')) return;
    try { await client.delete(`/admin/iot-units/${unit_id}`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to delete unit'); }
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <Cpu size={24} style={{ color: 'var(--accent-start)' }} />
        <h2>IoT Monitor</h2>
      </div>

      <div className="glass-card">
        <p className="help-text">Simulate pings from IoT devices to test connectivity.</p>
        {error && <p className="error">{error}</p>}
        
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Serial</th><th>Bike</th><th>Last Ping</th><th>Actions</th></tr></thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.iot_unit_id}>
                  <td style={{ fontFamily: 'monospace' }}>{u.device_serial}</td>
                  <td style={{ fontWeight: 600 }}>{u.plate_number || 'Unassigned'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.last_ping_at ? new Date(u.last_ping_at).toLocaleString() : 'Never'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="btn-sm" style={{ border: '1px solid var(--accent-start)', color: 'var(--text-primary)', background: 'transparent' }} onClick={() => handlePing(u.iot_unit_id)}>
                        <Signal size={14} style={{ color: 'var(--accent-start)' }} /> Ping
                      </button>
                      <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(u.iot_unit_id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {units.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center' }}>No IoT units registered.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
