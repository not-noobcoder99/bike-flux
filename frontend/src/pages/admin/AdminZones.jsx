import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { MapPin, Plus, Trash2 } from 'lucide-react';

export default function AdminZones() {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', capacity: 10, center_lat: '', center_lng: '' });
  const [error, setError] = useState('');

  function refresh() { client.get('/admin/zones').then((res) => setZones(res.data)); }
  useEffect(refresh, []);

  async function handleAddZone(e) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/admin/zones', {
        name: form.name, description: form.description, capacity: Number(form.capacity),
        center_lat: form.center_lat ? Number(form.center_lat) : null,
        center_lng: form.center_lng ? Number(form.center_lng) : null,
        geofence_geojson: JSON.stringify({ type: 'Polygon', coordinates: [] }),
      });
      setForm({ name: '', description: '', capacity: 10, center_lat: '', center_lng: '' });
      refresh();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add zone'); }
  }

  async function handleDelete(zone_id) {
    if (!window.confirm('Delete this zone?')) return;
    try { await client.delete(`/admin/zones/${zone_id}`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to delete zone'); }
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <MapPin size={24} style={{ color: 'var(--accent-start)' }} />
        <h2>Parking Zones</h2>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Capacity</th><th>Center Lat/Lng</th><th>Actions</th></tr></thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z.zone_id}>
                  <td style={{ fontWeight: 600 }}>{z.name}</td>
                  <td>{z.capacity} bikes</td>
                  <td>{z.center_lat}, {z.center_lng}</td>
                  <td><button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(z.zone_id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <Plus size={20} />
          <h3>Add New Zone</h3>
        </div>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleAddZone} className="admin-form">
          <div className="form-group"><label>Name</label><input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
          <div className="form-group"><label>Description</label><input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} /></div>
          <div className="form-group"><label>Capacity</label><input type="number" required value={form.capacity} onChange={(e) => setForm({...form, capacity: e.target.value})} /></div>
          <div className="form-group"><label>Center Lat</label><input value={form.center_lat} onChange={(e) => setForm({...form, center_lat: e.target.value})} /></div>
          <div className="form-group"><label>Center Lng</label><input value={form.center_lng} onChange={(e) => setForm({...form, center_lng: e.target.value})} /></div>
          <button type="submit" style={{ marginTop: '1rem' }}>Add Zone</button>
        </form>
      </div>
    </div>
  );
}
