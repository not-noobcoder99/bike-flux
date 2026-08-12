import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Bike, Plus, Trash2, AlertCircle, Zap } from 'lucide-react';

const SCOOTY_STATUS_OPTIONS = ['available', 'in_use', 'maintenance', 'offline'];

export default function AdminBikes() {
  const [scooties, setScooties] = useState([]);
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ plate_number: '', model: '', current_zone_id: '', current_lat: '', current_lng: '', battery_level: 100 });
  const [error, setError] = useState('');

  function refresh() { client.get('/admin/scooties').then((res) => setScooties(res.data)); }
  useEffect(() => { refresh(); client.get('/admin/zones').then((res) => setZones(res.data)); }, []);

  async function handleStatusChange(scooty_id, status) {
    await client.patch(`/admin/scooties/${scooty_id}/status`, { status });
    refresh();
  }

  async function handleRecharge(scooty_id) {
    await client.post(`/admin/scooties/${scooty_id}/recharge`);
    refresh();
  }

  async function handleAddScooty(e) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/admin/scooties', {
        plate_number: form.plate_number,
        model: form.model || null,
        current_zone_id: form.current_zone_id ? Number(form.current_zone_id) : null,
        current_lat: form.current_lat ? Number(form.current_lat) : null,
        current_lng: form.current_lng ? Number(form.current_lng) : null,
        battery_level: Number(form.battery_level),
      });
      setForm({ plate_number: '', model: '', current_zone_id: '', current_lat: '', current_lng: '', battery_level: 100 });
      refresh();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add scooty'); }
  }

  async function handleDelete(scooty_id) {
    if (!window.confirm('Remove this bike from the fleet?')) return;
    try { await client.delete(`/admin/scooties/${scooty_id}`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to delete scooty'); }
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <Bike size={24} style={{ color: 'var(--accent-start)' }} />
        <h2>Bike Fleet Management</h2>
        <span className="badge badge-available">{scooties.length} total</span>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Plate</th><th>Model</th><th>Zone</th><th>Battery</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {scooties.map((s) => (
                <tr key={s.scooty_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.plate_number}</td>
                  <td>{s.model || '—'}</td>
                  <td>{s.zone_name || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={`badge badge-${s.battery_level > 20 ? 'available' : 'offline'}`}>{s.battery_level}%</span>
                      {s.battery_level < 100 && (
                        <button 
                          type="button" 
                          className="btn-sm" 
                          style={{ background: 'transparent', border: '1px solid var(--accent-start)', color: 'var(--accent-start)', padding: '2px 8px' }}
                          onClick={() => handleRecharge(s.scooty_id)}
                          title="Recharge to 100%"
                        >
                          <Zap size={14} /> Recharge
                        </button>
                      )}
                    </div>
                  </td>
                  <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <select value={s.status} onChange={(e) => handleStatusChange(s.scooty_id, e.target.value)}>
                        {SCOOTY_STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(s.scooty_id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {scooties.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No bikes yet — add one below.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <Plus size={20} />
          <h3>Add New Bike</h3>
        </div>
        {error && <p className="error"><AlertCircle size={16} /> {error}</p>}
        <form onSubmit={handleAddScooty} className="admin-form">
          <div className="form-group">
            <label>Plate Number</label>
            <input placeholder="e.g. BF-003" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input placeholder="e.g. Yadea G5" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Starting Zone</label>
            <select value={form.current_zone_id} onChange={(e) => setForm({ ...form, current_zone_id: e.target.value })}>
              <option value="">No starting zone</option>
              {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Starting Latitude</label>
            <input placeholder="33.6431" value={form.current_lat} onChange={(e) => setForm({ ...form, current_lat: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Starting Longitude</label>
            <input placeholder="72.9857" value={form.current_lng} onChange={(e) => setForm({ ...form, current_lng: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Battery Level (%)</label>
            <input type="number" min="0" max="100" value={form.battery_level} onChange={(e) => setForm({ ...form, battery_level: e.target.value })} required />
          </div>
          <button type="submit" style={{ marginTop: '1rem', width: '200px' }}>Add Bike</button>
        </form>
      </div>
    </div>
  );
}
