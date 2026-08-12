import { useEffect, useState } from 'react';
import client from '../api/client.js';
import {
  LayoutDashboard, Bike, MapPin, Users, UserCheck, Tag, CreditCard, Receipt,
  Cpu, Route, Camera, Play, Plus, Trash2, Edit3, Save, X, AlertCircle,
  CheckCircle, Zap, DollarSign, TrendingUp, Crown, Signal
} from 'lucide-react';

const SCOOTY_STATUS_OPTIONS = ['available', 'in_use', 'maintenance', 'offline'];
const ROLE_OPTIONS = ['rider', 'admin', 'maintenance'];
const CARD_STATUS_OPTIONS = ['active', 'blocked', 'expired'];

/* ==========================================================================
   PANEL COMPONENTS
   ========================================================================== */

function ScootyStatusPanel() {
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
    <section>
      <div className="section-header">
        <Bike size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>Bike Fleet</h3>
        <span className="badge badge-available">{scooties.length} total</span>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Plate</th><th>Model</th><th>Zone</th><th>Battery</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {scooties.map((s) => (
              <tr key={s.scooty_id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.plate_number}</td>
                <td>{s.model || '—'}</td>
                <td>{s.zone_name || '—'}</td>
                <td>{s.battery_level}%</td>
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
      <div className="zone-form">
        <h4><Plus size={18} /> Add New Bike</h4>
        {error && <p className="error"><AlertCircle size={16} /> {error}</p>}
        <form onSubmit={handleAddScooty}>
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
            <label>Battery %</label>
            <input type="number" min="0" max="100" value={form.battery_level} onChange={(e) => setForm({ ...form, battery_level: e.target.value })} />
          </div>
          <div className="form-actions"><button type="submit"><Plus size={16} /> Add Bike</button></div>
        </form>
      </div>
    </section>
  );
}

function ZoneManagementPanel() {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', capacity: 20, center_lat: '', center_lng: '', coordinates: '' });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  function refresh() { client.get('/admin/zones').then((res) => setZones(res.data)); }
  useEffect(refresh, []);

  function resetForm() {
    setForm({ name: '', description: '', capacity: 20, center_lat: '', center_lng: '', coordinates: '' });
    setEditingId(null); setError('');
  }

  function startEdit(zone) {
    const geo = typeof zone.geofence_geojson === 'string' ? JSON.parse(zone.geofence_geojson) : zone.geofence_geojson;
    setEditingId(zone.zone_id);
    setForm({
      name: zone.name, description: zone.description || '', capacity: zone.capacity,
      center_lat: zone.center_lat || '', center_lng: zone.center_lng || '',
      coordinates: JSON.stringify(geo?.coordinates?.[0] || []),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    let coordinates;
    try { coordinates = JSON.parse(form.coordinates); }
    catch { setError('Coordinates must be valid JSON: [[lng,lat],...] — first & last point must match'); return; }
    const payload = {
      name: form.name, description: form.description, capacity: Number(form.capacity),
      center_lat: form.center_lat ? Number(form.center_lat) : null,
      center_lng: form.center_lng ? Number(form.center_lng) : null,
      geofence_geojson: { type: 'Polygon', coordinates: [coordinates] },
    };
    try {
      if (editingId) await client.put(`/admin/zones/${editingId}`, payload);
      else await client.post('/admin/zones', payload);
      resetForm(); refresh();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save zone'); }
  }

  async function handleDelete(zone_id) {
    if (!window.confirm('Delete this parking station?')) return;
    await client.delete(`/admin/zones/${zone_id}`);
    refresh();
  }

  return (
    <section>
      <div className="section-header">
        <MapPin size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>Parking Stations</h3>
        <span className="badge badge-available">{zones.length} zones</span>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Name</th><th>Capacity</th><th>Center</th><th>Actions</th></tr></thead>
          <tbody>
            {zones.map((z) => (
              <tr key={z.zone_id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{z.name}</td>
                <td>{z.capacity}</td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{z.center_lat}, {z.center_lng}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => startEdit(z)}><Edit3 size={14} /> Edit</button>
                    <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(z.zone_id)}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {zones.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No stations yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="zone-form">
        <h4>{editingId ? <><Edit3 size={18} /> Edit Station</> : <><Plus size={18} /> Add New Station</>}</h4>
        {error && <p className="error"><AlertCircle size={16} /> {error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Name</label><input placeholder="Station name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><input placeholder="Brief description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-group"><label>Capacity</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
          <div className="form-group"><label>Center Latitude</label><input placeholder="33.6431" value={form.center_lat} onChange={(e) => setForm({ ...form, center_lat: e.target.value })} /></div>
          <div className="form-group"><label>Center Longitude</label><input placeholder="72.9857" value={form.center_lng} onChange={(e) => setForm({ ...form, center_lng: e.target.value })} /></div>
          <div className="form-group"><label>Polygon Coordinates (JSON)</label><textarea placeholder='[[lng,lat],...]' value={form.coordinates} onChange={(e) => setForm({ ...form, coordinates: e.target.value })} rows={3} /></div>
          <div className="form-actions">
            <button type="submit">{editingId ? <><Save size={16} /> Update</> : <><Plus size={16} /> Create</>}</button>
            {editingId && <button type="button" className="btn-secondary" onClick={resetForm}><X size={16} /> Cancel</button>}
          </div>
        </form>
      </div>
    </section>
  );
}

function AllUsersPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', student_id: '' });

  function refresh() { client.get('/admin/users').then((res) => setUsers(res.data)); }
  useEffect(refresh, []);

  async function handleRoleChange(user_id, role) {
    try { await client.patch(`/admin/users/${user_id}/role`, { role }); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to update role'); }
  }
  async function handleStatusChange(user_id, status) {
    try {
      if (status === 'active') await client.patch(`/admin/users/${user_id}/approve`);
      else await client.patch(`/admin/users/${user_id}/suspend`);
      refresh();
    } catch (err) { setError(err.response?.data?.error || 'Failed to update status'); }
  }
  async function handleDelete(user_id) {
    if (!window.confirm('Permanently delete this user and their data?')) return;
    try { await client.delete(`/admin/users/${user_id}`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to delete user'); }
  }

  function startEdit(u) {
    setEditingId(u.user_id);
    setEditForm({ full_name: u.full_name, phone: u.phone || '', student_id: u.student_id || '' });
  }
  async function saveEdit(user_id) {
    try {
      await client.put(`/admin/users/${user_id}`, editForm);
      setEditingId(null);
      refresh();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save changes'); }
  }

  return (
    <section>
      <div className="section-header">
        <Users size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>All Users</h3>
        <span className="badge badge-available">{users.length} users</span>
      </div>
      {error && <p className="error"><AlertCircle size={16} /> {error}</p>}
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Student ID</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id}>
                {editingId === u.user_id ? (
                  <>
                    <td><input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></td>
                    <td style={{ color: 'var(--text-muted)' }}>{u.email}</td>
                    <td><input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></td>
                    <td><input value={editForm.student_id} onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })} /></td>
                    <td>{u.role}</td>
                    <td>{u.status}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="btn-sm" onClick={() => saveEdit(u.user_id)}><Save size={14} /> Save</button>
                        <button type="button" className="btn-secondary btn-sm" onClick={() => setEditingId(null)}><X size={14} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone || '—'}</td>
                    <td>{u.student_id || '—'}</td>
                    <td>
                      <select value={u.role} onChange={(e) => handleRoleChange(u.user_id, e.target.value)}>
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      <select value={u.status} onChange={(e) => handleStatusChange(u.user_id, e.target.value)}>
                        <option value="active">active</option>
                        <option value="pending">pending</option>
                        <option value="suspended">suspended</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button type="button" className="btn-secondary btn-sm" onClick={() => startEdit(u)}><Edit3 size={14} /></button>
                        <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(u.user_id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PendingUsersPanel() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  function refresh() { client.get('/admin/users/pending').then((res) => setUsers(res.data)); }
  useEffect(refresh, []);

  async function handleApprove(user_id) {
    try { await client.patch(`/admin/users/${user_id}/approve`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to approve'); }
  }
  async function handleReject(user_id) {
    if (!window.confirm('Suspend this account?')) return;
    try { await client.patch(`/admin/users/${user_id}/suspend`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to suspend'); }
  }

  return (
    <section>
      <div className="section-header">
        <UserCheck size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>Pending Registrations</h3>
        {users.length > 0 && <span className="badge badge-open">{users.length} pending</span>}
      </div>
      {error && <p className="error"><AlertCircle size={16} /> {error}</p>}
      {users.length === 0 ? (
        <div className="empty-state">
          <UserCheck size={40} />
          <p>No pending registrations.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Student ID</th><th>Registered</th><th>Action</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.user_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td>{u.student_id || '—'}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(u.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" className="btn-sm" onClick={() => handleApprove(u.user_id)}><CheckCircle size={14} /> Approve</button>
                      <button type="button" className="btn-danger btn-sm" onClick={() => handleReject(u.user_id)}><X size={14} /> Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PricingPlansPanel() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: '', base_fare: 0, per_minute_rate: 0, per_km_rate: 0, is_subscription: false, monthly_price: '' });
  const [error, setError] = useState('');
  function refresh() { client.get('/admin/plans').then((res) => setPlans(res.data)); }
  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/admin/plans', {
        ...form,
        base_fare: Number(form.base_fare), per_minute_rate: Number(form.per_minute_rate), per_km_rate: Number(form.per_km_rate),
        monthly_price: form.monthly_price ? Number(form.monthly_price) : null,
      });
      setForm({ name: '', base_fare: 0, per_minute_rate: 0, per_km_rate: 0, is_subscription: false, monthly_price: '' });
      refresh();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add plan'); }
  }
  async function handleDelete(plan_id) {
    if (!window.confirm('Delete this pricing plan?')) return;
    await client.delete(`/admin/plans/${plan_id}`);
    refresh();
  }

  return (
    <section>
      <div className="section-header">
        <Tag size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>Pricing Plans</h3>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>Name</th><th>Base</th><th>Per Min</th><th>Per Km</th><th>Subscription?</th><th>Monthly</th><th>Action</th></tr></thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.plan_id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                <td>PKR {p.base_fare}</td>
                <td>PKR {p.per_minute_rate}</td>
                <td>PKR {p.per_km_rate}</td>
                <td>{p.is_subscription ? <span className="badge badge-available">Yes</span> : <span className="badge badge-offline">No</span>}</td>
                <td>{p.monthly_price ? `PKR ${p.monthly_price}` : '—'}</td>
                <td><button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(p.plan_id)}><Trash2 size={14} /></button></td>
              </tr>
            ))}
            {plans.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No plans yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="zone-form">
        <h4><Plus size={18} /> Add New Plan</h4>
        {error && <p className="error"><AlertCircle size={16} /> {error}</p>}
        <form onSubmit={handleAdd}>
          <div className="form-group"><label>Plan Name</label><input placeholder="e.g. Student Plan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Base Fare (PKR)</label><input type="number" step="0.01" value={form.base_fare} onChange={(e) => setForm({ ...form, base_fare: e.target.value })} /></div>
          <div className="form-group"><label>Rate Per Minute (PKR)</label><input type="number" step="0.01" value={form.per_minute_rate} onChange={(e) => setForm({ ...form, per_minute_rate: e.target.value })} /></div>
          <div className="form-group"><label>Rate Per Km (PKR)</label><input type="number" step="0.01" value={form.per_km_rate} onChange={(e) => setForm({ ...form, per_km_rate: e.target.value })} /></div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_subscription} onChange={(e) => setForm({ ...form, is_subscription: e.target.checked })} />
            Is a subscription plan
          </label>
          {form.is_subscription && (
            <div className="form-group"><label>Monthly Price (PKR)</label><input type="number" step="0.01" placeholder="e.g. 500" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} /></div>
          )}
          <div className="form-actions"><button type="submit"><Plus size={16} /> Add Plan</button></div>
        </form>
      </div>
    </section>
  );
}

function SubscriptionsPanel() {
  const [subs, setSubs] = useState([]);
  function refresh() { client.get('/admin/subscriptions').then((res) => setSubs(res.data)); }
  useEffect(refresh, []);

  async function handleCancel(subscription_id) {
    if (!window.confirm('Cancel this subscription?')) return;
    await client.patch(`/admin/subscriptions/${subscription_id}/cancel`);
    refresh();
  }

  return (
    <section>
      <div className="section-header">
        <Crown size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>Subscriptions</h3>
      </div>
      {subs.length === 0 ? (
        <div className="empty-state"><Crown size={40} /><p>No subscriptions yet.</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>User</th><th>Plan</th><th>Start</th><th>End</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.subscription_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.full_name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({s.email})</span></td>
                  <td>{s.plan_name}</td>
                  <td style={{ fontSize: '0.82rem' }}>{new Date(s.start_date).toLocaleDateString()}</td>
                  <td style={{ fontSize: '0.82rem' }}>{new Date(s.end_date).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${s.status === 'active' ? 'available' : 'offline'}`}>{s.status}</span></td>
                  <td>{s.status === 'active' && <button type="button" className="btn-danger btn-sm" onClick={() => handleCancel(s.subscription_id)}><X size={14} /> Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function TransactionsPanel() {
  const [txns, setTxns] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ user_id: '', amount: '', type: 'topup', status: 'success' });
  const [error, setError] = useState('');

  function refresh() { client.get('/admin/transactions').then((res) => setTxns(res.data)); }
  useEffect(() => { refresh(); client.get('/admin/users').then((res) => setUsers(res.data)); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/admin/transactions', { ...form, user_id: Number(form.user_id), amount: Number(form.amount) });
      setForm({ user_id: '', amount: '', type: 'topup', status: 'success' });
      refresh();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create transaction'); }
  }

  return (
    <section>
      <div className="section-header">
        <Receipt size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>Transactions</h3>
      </div>
      <div className="table-wrapper">
        <table>
          <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.transaction_id}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.full_name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({t.email})</span></td>
                <td style={{ textTransform: 'capitalize' }}>{t.type.replace('_', ' ')}</td>
                <td>PKR {t.amount}</td>
                <td><span className={`badge badge-${t.status === 'success' ? 'resolved' : t.status === 'failed' ? 'open' : 'in_progress'}`}>{t.status}</span></td>
                <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(t.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}</td>
              </tr>
            ))}
            {txns.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No transactions yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="zone-form">
        <h4><Plus size={18} /> Record Manual Transaction</h4>
        <p className="help-text">Simulates payment activity without a live gateway — updates the user's wallet balance directly.</p>
        {error && <p className="error"><AlertCircle size={16} /> {error}</p>}
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>User</label>
            <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
              <option value="">Select user</option>
              {users.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-group"><label>Amount (PKR)</label><input type="number" step="0.01" placeholder="e.g. 500" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="topup">topup</option>
              <option value="refund">refund</option>
              <option value="ride_charge">ride_charge (deducts)</option>
              <option value="subscription">subscription</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="success">success</option>
              <option value="pending">pending</option>
              <option value="failed">failed</option>
            </select>
          </div>
          <div className="form-actions"><button type="submit"><Plus size={16} /> Record Transaction</button></div>
        </form>
      </div>
    </section>
  );
}

function IotMonitorPanel() {
  const [units, setUnits] = useState([]);
  const [error, setError] = useState('');
  function refresh() { client.get('/admin/iot-units').then((res) => setUnits(res.data)); }
  useEffect(refresh, []);

  async function handlePing(iot_unit_id) {
    try { await client.patch(`/admin/iot-units/${iot_unit_id}/simulate-ping`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Ping failed'); }
  }
  async function handleDelete(iot_unit_id) {
    if (!window.confirm('Remove this IoT unit?')) return;
    await client.delete(`/admin/iot-units/${iot_unit_id}`);
    refresh();
  }

  return (
    <section>
      <div className="section-header">
        <Cpu size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>IoT Device Monitor</h3>
        <span className="badge badge-in_use">Simulated</span>
      </div>
      <p className="help-text">No physical hardware connected — "Simulate Ping" mimics a device heartbeat.</p>
      {error && <p className="error"><AlertCircle size={16} /> {error}</p>}
      {units.length === 0 ? (
        <div className="empty-state"><Cpu size={40} /><p>No IoT units yet — add a bike to auto-provision one.</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Scooty</th><th>Serial</th><th>Relay</th><th>Firmware</th><th>Last Ping</th><th>Action</th></tr></thead>
            <tbody>
              {units.map((u) => (
                <tr key={u.iot_unit_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.plate_number || '—'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{u.device_serial}</td>
                  <td><span className={`badge badge-${u.relay_status === 'locked' ? 'offline' : 'available'}`}>{u.relay_status}</span></td>
                  <td>{u.firmware_version}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.last_ping_at ? new Date(u.last_ping_at).toLocaleString() : 'never'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button type="button" className="btn-sm" onClick={() => handlePing(u.iot_unit_id)}><Signal size={14} /> Ping</button>
                      <button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(u.iot_unit_id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function RidesPanel() {
  const [rides, setRides] = useState([]);
  useEffect(() => { client.get('/admin/rides').then((res) => setRides(res.data)); }, []);

  return (
    <section>
      <div className="section-header">
        <Route size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>All Rides</h3>
        <span className="badge badge-available">{rides.length} rides</span>
      </div>
      {rides.length === 0 ? (
        <div className="empty-state"><Route size={40} /><p>No rides yet.</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>User</th><th>Bike</th><th>Distance</th><th>Duration</th><th>Fare</th><th>Status</th></tr></thead>
            <tbody>
              {rides.map((r) => (
                <tr key={r.ride_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.full_name}</td>
                  <td>{r.plate_number}</td>
                  <td>{r.distance_km} km</td>
                  <td>{r.duration_minutes} min</td>
                  <td>PKR {r.fare_amount}</td>
                  <td><span className={`badge badge-${r.status === 'completed' ? 'resolved' : 'in_progress'}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ConditionPhotosPanel() {
  const [photos, setPhotos] = useState([]);
  function refresh() { client.get('/admin/condition-photos').then((res) => setPhotos(res.data)); }
  useEffect(refresh, []);

  async function handleDelete(photo_id) {
    if (!window.confirm('Delete this photo record?')) return;
    await client.delete(`/admin/condition-photos/${photo_id}`);
    refresh();
  }

  return (
    <section>
      <div className="section-header">
        <Camera size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>Condition Photos</h3>
      </div>
      {photos.length === 0 ? (
        <div className="empty-state"><Camera size={40} /><p>No condition photos yet.</p></div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Bike</th><th>Type</th><th>URL</th><th>Taken</th><th>Action</th></tr></thead>
            <tbody>
              {photos.map((p) => (
                <tr key={p.photo_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.plate_number}</td>
                  <td><span className="badge badge-in_use">{p.photo_type}</span></td>
                  <td><a href={`http://localhost:5000${p.photo_url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-accent)' }}>View Photo</a></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(p.taken_at).toLocaleString()}</td>
                  <td><button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(p.photo_id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function VirtualCardsPanel() {
  const [cards, setCards] = useState([]);
  const [error, setError] = useState('');
  function refresh() { client.get('/admin/virtual-cards').then((res) => setCards(res.data)); }
  useEffect(refresh, []);

  async function handleStatusChange(card_id, status) {
    try { await client.patch(`/admin/virtual-cards/${card_id}/status`, { status }); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to update card'); }
  }

  return (
    <section>
      <div className="section-header">
        <CreditCard size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>Virtual Cards</h3>
      </div>
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
    </section>
  );
}

function SimulateRidePanel() {
  const [users, setUsers] = useState([]);
  const [scooties, setScooties] = useState([]);
  const [form, setForm] = useState({ user_id: '', scooty_id: '', distance_km: '', duration_minutes: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/admin/users').then((res) => setUsers(res.data.filter((u) => u.status === 'active')));
    client.get('/admin/scooties').then((res) => setScooties(res.data));
  }, []);

  async function handleSimulate(e) {
    e.preventDefault();
    setError(''); setResult(null);
    try {
      const res = await client.post('/admin/simulate-ride', {
        user_id: Number(form.user_id),
        scooty_id: Number(form.scooty_id),
        distance_km: form.distance_km ? Number(form.distance_km) : undefined,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
      });
      setResult(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Simulation failed'); }
  }

  return (
    <section>
      <div className="section-header">
        <Play size={22} style={{ color: 'var(--accent-start)' }} />
        <h3>Simulate a Ride</h3>
      </div>
      <p className="help-text">
        Runs a full unlock → ride → completion → billing cycle instantly, without real GPS or IoT hardware.
      </p>
      {error && <p className="error"><AlertCircle size={16} /> {error}</p>}
      {result && (
        <p className="success">
          <CheckCircle size={16} /> Ride #{result.ride_id} completed — {result.distance_km} km, {result.duration_minutes} min, fare PKR {result.fare_amount}
        </p>
      )}
      <form onSubmit={handleSimulate}>
        <div className="form-group">
          <label>Rider</label>
          <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
            <option value="">Select rider</option>
            {users.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Bike</label>
          <select value={form.scooty_id} onChange={(e) => setForm({ ...form, scooty_id: e.target.value })} required>
            <option value="">Select bike</option>
            {scooties.map((s) => <option key={s.scooty_id} value={s.scooty_id}>{s.plate_number}</option>)}
          </select>
        </div>
        <div className="form-group"><label>Distance (km) <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>— optional</span></label><input type="number" step="0.01" placeholder="e.g. 2.5" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} /></div>
        <div className="form-group"><label>Duration (min) <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>— optional</span></label><input type="number" placeholder="e.g. 15" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
        <div className="form-actions"><button type="submit"><Play size={16} /> Simulate Ride</button></div>
      </form>
    </section>
  );
}

/* ==========================================================================
   MAIN ADMIN DASHBOARD
   ========================================================================== */

const TABS = [
  { id: 'scooties', label: 'Bikes', icon: Bike },
  { id: 'zones', label: 'Stations', icon: MapPin },
  { id: 'users', label: 'All Users', icon: Users },
  { id: 'pending', label: 'Pending Users', icon: UserCheck },
  { id: 'plans', label: 'Pricing Plans', icon: Tag },
  { id: 'subscriptions', label: 'Subscriptions', icon: Crown },
  { id: 'transactions', label: 'Transactions', icon: Receipt },
  { id: 'cards', label: 'Virtual Cards', icon: CreditCard },
  { id: 'iot', label: 'IoT Monitor', icon: Cpu },
  { id: 'photos', label: 'Photos', icon: Camera },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('scooties');

  function refreshStats() { client.get('/admin/dashboard').then((res) => setStats(res.data)); }
  useEffect(refreshStats, []);

  const statCards = stats ? [
    { icon: Bike, label: 'Available', value: stats.scooty_counts.available || 0, color: '#22c55e' },
    { icon: Zap, label: 'In Use', value: stats.scooty_counts.in_use || 0, color: '#3b82f6' },
    { icon: Bike, label: 'Maintenance', value: stats.scooty_counts.maintenance || 0, color: '#f59e0b' },
    { icon: AlertCircle, label: 'Open Logs', value: stats.open_maintenance_logs, color: '#ef4444' },
    { icon: MapPin, label: 'Zones', value: stats.zone_count, color: '#8b5cf6' },
    { icon: Users, label: 'Pending Users', value: stats.pending_users, color: '#ec4899' },
    { icon: Receipt, label: 'Transactions', value: stats.total_transactions, color: '#06b6d4' },
    { icon: DollarSign, label: 'Revenue', value: `PKR ${stats.total_revenue}`, color: '#22c55e' },
    { icon: Crown, label: 'Active Subs', value: stats.active_subscriptions, color: '#f59e0b' },
  ] : [];

  return (
    <div className="dashboard-page fade-in">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <LayoutDashboard size={24} style={{ color: 'var(--accent-start)' }} /> Admin Dashboard
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        Manage your fleet, users, pricing, and transactions.
      </p>

      {stats && (
        <div className="stats-row">
          {statCards.map((sc, i) => (
            <div className="stat-card" key={i}>
              <div className="stat-icon" style={{ background: `linear-gradient(135deg, ${sc.color}, ${sc.color}99)` }}>
                <sc.icon size={20} />
              </div>
              <span className="stat-value">{sc.value}</span>
              <span className="stat-label">{sc.label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'active' : ''}
            onClick={() => { setTab(t.id); refreshStats(); }}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'scooties' && <ScootyStatusPanel />}
      {tab === 'zones' && <ZoneManagementPanel />}
      {tab === 'users' && <AllUsersPanel />}
      {tab === 'pending' && <PendingUsersPanel />}
      {tab === 'plans' && <PricingPlansPanel />}
      {tab === 'subscriptions' && <SubscriptionsPanel />}
      {tab === 'transactions' && <TransactionsPanel />}
      {tab === 'cards' && <VirtualCardsPanel />}
      {tab === 'iot' && <IotMonitorPanel />}
      {tab === 'photos' && <ConditionPhotosPanel />}
    </div>
  );
}
