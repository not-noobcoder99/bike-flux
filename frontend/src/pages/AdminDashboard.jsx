import { useEffect, useState } from 'react';
import client from '../api/client.js';

const SCOOTY_STATUS_OPTIONS = ['available', 'in_use', 'maintenance', 'offline'];
const ROLE_OPTIONS = ['rider', 'admin', 'maintenance'];
const CARD_STATUS_OPTIONS = ['active', 'blocked', 'expired'];

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
      <h3>Bike Fleet (SCOOTIES)</h3>
      <table>
        <thead><tr><th>Plate</th><th>Model</th><th>Zone</th><th>Battery</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {scooties.map((s) => (
            <tr key={s.scooty_id}>
              <td>{s.plate_number}</td><td>{s.model || '—'}</td><td>{s.zone_name || '—'}</td><td>{s.battery_level}%</td>
              <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
              <td>
                <select value={s.status} onChange={(e) => handleStatusChange(s.scooty_id, e.target.value)}>
                  {SCOOTY_STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {' '}
                <button type="button" className="btn-danger" onClick={() => handleDelete(s.scooty_id)}>Remove</button>
              </td>
            </tr>
          ))}
          {scooties.length === 0 && <tr><td colSpan={6}>No bikes yet — add one below.</td></tr>}
        </tbody>
      </table>
      <form className="zone-form" onSubmit={handleAddScooty}>
        <h4>Add New Bike</h4>
        {error && <p className="error">{error}</p>}
        <input placeholder="Plate number (e.g. BF-003)" value={form.plate_number} onChange={(e) => setForm({ ...form, plate_number: e.target.value })} required />
        <input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <select value={form.current_zone_id} onChange={(e) => setForm({ ...form, current_zone_id: e.target.value })}>
          <option value="">No starting zone</option>
          {zones.map((z) => <option key={z.zone_id} value={z.zone_id}>{z.name}</option>)}
        </select>
        <input placeholder="Starting latitude" value={form.current_lat} onChange={(e) => setForm({ ...form, current_lat: e.target.value })} />
        <input placeholder="Starting longitude" value={form.current_lng} onChange={(e) => setForm({ ...form, current_lng: e.target.value })} />
        <input type="number" min="0" max="100" placeholder="Battery %" value={form.battery_level} onChange={(e) => setForm({ ...form, battery_level: e.target.value })} />
        <div className="form-actions"><button type="submit">Add Bike</button></div>
      </form>
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
      <h3>Parking Stations (PARKING_ZONES)</h3>
      <table>
        <thead><tr><th>Name</th><th>Capacity</th><th>Center</th><th>Actions</th></tr></thead>
        <tbody>
          {zones.map((z) => (
            <tr key={z.zone_id}>
              <td>{z.name}</td><td>{z.capacity}</td><td>{z.center_lat}, {z.center_lng}</td>
              <td>
                <button type="button" className="btn-secondary" onClick={() => startEdit(z)}>Edit</button>
                {' '}
                <button type="button" className="btn-danger" onClick={() => handleDelete(z.zone_id)}>Delete</button>
              </td>
            </tr>
          ))}
          {zones.length === 0 && <tr><td colSpan={4}>No stations yet.</td></tr>}
        </tbody>
      </table>
      <form className="zone-form" onSubmit={handleSubmit}>
        <h4>{editingId ? 'Edit Station' : 'Add New Station'}</h4>
        {error && <p className="error">{error}</p>}
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input type="number" placeholder="Capacity" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        <input placeholder="Center lat" value={form.center_lat} onChange={(e) => setForm({ ...form, center_lat: e.target.value })} />
        <input placeholder="Center lng" value={form.center_lng} onChange={(e) => setForm({ ...form, center_lng: e.target.value })} />
        <textarea placeholder='Polygon coords: [[lng,lat],...]' value={form.coordinates} onChange={(e) => setForm({ ...form, coordinates: e.target.value })} rows={3} />
        <div className="form-actions">
          <button type="submit">{editingId ? 'Update' : 'Create'}</button>
          {editingId && <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>}
        </div>
      </form>
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
      <h3>All Users (USERS)</h3>
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Student ID</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.user_id}>
              {editingId === u.user_id ? (
                <>
                  <td><input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} /></td>
                  <td>{u.email}</td>
                  <td><input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></td>
                  <td><input value={editForm.student_id} onChange={(e) => setEditForm({ ...editForm, student_id: e.target.value })} /></td>
                  <td>{u.role}</td>
                  <td>{u.status}</td>
                  <td>
                    <button type="button" onClick={() => saveEdit(u.user_id)}>Save</button>
                    {' '}
                    <button type="button" className="btn-secondary" onClick={() => setEditingId(null)}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{u.full_name}</td>
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
                    <button type="button" className="btn-secondary" onClick={() => startEdit(u)}>Edit</button>
                    {' '}
                    <button type="button" className="btn-danger" onClick={() => handleDelete(u.user_id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
          {users.length === 0 && <tr><td colSpan={7}>No users yet.</td></tr>}
        </tbody>
      </table>
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
      <h3>Pending Registrations ({users.length})</h3>
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Student ID</th><th>Registered</th><th>Action</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.user_id}>
              <td>{u.full_name}</td><td>{u.email}</td><td>{u.phone || '—'}</td><td>{u.student_id || '—'}</td>
              <td>{new Date(u.created_at).toLocaleString()}</td>
              <td>
                <button type="button" onClick={() => handleApprove(u.user_id)}>Approve</button>
                {' '}
                <button type="button" className="btn-danger" onClick={() => handleReject(u.user_id)}>Reject</button>
              </td>
            </tr>
          ))}
          {users.length === 0 && <tr><td colSpan={6}>No pending registrations.</td></tr>}
        </tbody>
      </table>
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
      <h3>Pricing Plans (PRICING_PLANS)</h3>
      <table>
        <thead><tr><th>Name</th><th>Base</th><th>Per Min</th><th>Per Km</th><th>Subscription?</th><th>Monthly</th><th>Action</th></tr></thead>
        <tbody>
          {plans.map((p) => (
            <tr key={p.plan_id}>
              <td>{p.name}</td><td>{p.base_fare}</td><td>{p.per_minute_rate}</td><td>{p.per_km_rate}</td>
              <td>{p.is_subscription ? 'Yes' : 'No'}</td><td>{p.monthly_price || '—'}</td>
              <td><button type="button" className="btn-danger" onClick={() => handleDelete(p.plan_id)}>Delete</button></td>
            </tr>
          ))}
          {plans.length === 0 && <tr><td colSpan={7}>No plans yet.</td></tr>}
        </tbody>
      </table>
      <form className="zone-form" onSubmit={handleAdd}>
        <h4>Add New Plan</h4>
        {error && <p className="error">{error}</p>}
        <input placeholder="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="number" step="0.01" placeholder="Base fare" value={form.base_fare} onChange={(e) => setForm({ ...form, base_fare: e.target.value })} />
        <input type="number" step="0.01" placeholder="Rate per minute" value={form.per_minute_rate} onChange={(e) => setForm({ ...form, per_minute_rate: e.target.value })} />
        <input type="number" step="0.01" placeholder="Rate per km" value={form.per_km_rate} onChange={(e) => setForm({ ...form, per_km_rate: e.target.value })} />
        <label>
          <input type="checkbox" checked={form.is_subscription} onChange={(e) => setForm({ ...form, is_subscription: e.target.checked })} />
          {' '}Is a subscription plan
        </label>
        {form.is_subscription && (
          <input type="number" step="0.01" placeholder="Monthly price" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: e.target.value })} />
        )}
        <div className="form-actions"><button type="submit">Add Plan</button></div>
      </form>
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
      <h3>Subscriptions (SUBSCRIPTIONS)</h3>
      <table>
        <thead><tr><th>User</th><th>Plan</th><th>Start</th><th>End</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {subs.map((s) => (
            <tr key={s.subscription_id}>
              <td>{s.full_name} ({s.email})</td><td>{s.plan_name}</td>
              <td>{new Date(s.start_date).toLocaleDateString()}</td>
              <td>{new Date(s.end_date).toLocaleDateString()}</td>
              <td><span className={`badge badge-${s.status === 'active' ? 'available' : 'offline'}`}>{s.status}</span></td>
              <td>{s.status === 'active' && <button type="button" className="btn-danger" onClick={() => handleCancel(s.subscription_id)}>Cancel</button>}</td>
            </tr>
          ))}
          {subs.length === 0 && <tr><td colSpan={6}>No subscriptions yet.</td></tr>}
        </tbody>
      </table>
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
      <h3>Transactions (TRANSACTIONS)</h3>
      <table>
        <thead><tr><th>User</th><th>Type</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>
          {txns.map((t) => (
            <tr key={t.transaction_id}>
              <td>{t.full_name} ({t.email})</td><td>{t.type}</td><td>PKR {t.amount}</td>
              <td><span className={`badge badge-${t.status === 'success' ? 'resolved' : t.status === 'failed' ? 'open' : 'in_progress'}`}>{t.status}</span></td>
              <td>{new Date(t.created_at).toLocaleString()}</td>
            </tr>
          ))}
          {txns.length === 0 && <tr><td colSpan={5}>No transactions yet.</td></tr>}
        </tbody>
      </table>
      <form className="zone-form" onSubmit={handleCreate}>
        <h4>Record Manual Transaction (refund / adjustment / topup)</h4>
        <p style={{ fontSize: '0.85rem', color: '#666' }}>Simulates payment activity without a live gateway — updates the user's wallet balance directly.</p>
        {error && <p className="error">{error}</p>}
        <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
          <option value="">Select user</option>
          {users.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
        </select>
        <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="topup">topup</option>
          <option value="refund">refund</option>
          <option value="ride_charge">ride_charge (deducts)</option>
          <option value="subscription">subscription</option>
        </select>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="success">success</option>
          <option value="pending">pending</option>
          <option value="failed">failed</option>
        </select>
        <div className="form-actions"><button type="submit">Record Transaction</button></div>
      </form>
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
      <h3>IoT Device Monitor (IOT_UNITS) — Simulated</h3>
      <p style={{ fontSize: '0.85rem', color: '#666' }}>No physical hardware is connected yet — "Simulate Ping" mimics a device heartbeat.</p>
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>Scooty</th><th>Serial</th><th>Relay</th><th>Firmware</th><th>Last Ping</th><th>Action</th></tr></thead>
        <tbody>
          {units.map((u) => (
            <tr key={u.iot_unit_id}>
              <td>{u.plate_number || '—'}</td><td>{u.device_serial}</td>
              <td><span className={`badge badge-${u.relay_status === 'locked' ? 'offline' : 'available'}`}>{u.relay_status}</span></td>
              <td>{u.firmware_version}</td>
              <td>{u.last_ping_at ? new Date(u.last_ping_at).toLocaleString() : 'never'}</td>
              <td>
                <button type="button" onClick={() => handlePing(u.iot_unit_id)}>Simulate Ping</button>
                {' '}
                <button type="button" className="btn-danger" onClick={() => handleDelete(u.iot_unit_id)}>Remove</button>
              </td>
            </tr>
          ))}
          {units.length === 0 && <tr><td colSpan={6}>No IoT units yet — add a bike to auto-provision one.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}

function RidesPanel() {
  const [rides, setRides] = useState([]);
  useEffect(() => { client.get('/admin/rides').then((res) => setRides(res.data)); }, []);

  return (
    <section>
      <h3>All Rides (RIDES)</h3>
      <table>
        <thead><tr><th>User</th><th>Bike</th><th>Distance</th><th>Duration</th><th>Fare</th><th>Status</th></tr></thead>
        <tbody>
          {rides.map((r) => (
            <tr key={r.ride_id}>
              <td>{r.full_name}</td><td>{r.plate_number}</td>
              <td>{r.distance_km} km</td><td>{r.duration_minutes} min</td>
              <td>PKR {r.fare_amount}</td>
              <td><span className={`badge badge-${r.status === 'completed' ? 'resolved' : 'in_progress'}`}>{r.status}</span></td>
            </tr>
          ))}
          {rides.length === 0 && <tr><td colSpan={6}>No rides yet.</td></tr>}
        </tbody>
      </table>
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
      <h3>Condition Photos (CONDITION_PHOTOS)</h3>
      <table>
        <thead><tr><th>Bike</th><th>Type</th><th>URL</th><th>Taken</th><th>Action</th></tr></thead>
        <tbody>
          {photos.map((p) => (
            <tr key={p.photo_id}>
              <td>{p.plate_number}</td><td>{p.photo_type}</td>
              <td><a href={`http://localhost:5000${p.photo_url}`} target="_blank" rel="noreferrer">view</a></td>
              <td>{new Date(p.taken_at).toLocaleString()}</td>
              <td><button type="button" className="btn-danger" onClick={() => handleDelete(p.photo_id)}>Delete</button></td>
            </tr>
          ))}
          {photos.length === 0 && <tr><td colSpan={5}>No condition photos yet.</td></tr>}
        </tbody>
      </table>
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
      <h3>Virtual Cards (VIRTUAL_CARDS)</h3>
      {error && <p className="error">{error}</p>}
      <table>
        <thead><tr><th>User</th><th>Card Number</th><th>Balance</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {cards.map((c) => (
            <tr key={c.card_id}>
              <td>{c.full_name} ({c.email})</td><td>{c.card_number}</td><td>PKR {c.balance}</td>
              <td><span className={`badge badge-${c.status === 'active' ? 'available' : 'offline'}`}>{c.status}</span></td>
              <td>
                <select value={c.status} onChange={(e) => handleStatusChange(c.card_id, e.target.value)}>
                  {CARD_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
          {cards.length === 0 && <tr><td colSpan={5}>No virtual cards yet.</td></tr>}
        </tbody>
      </table>
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
      <h3>Simulate a Ride</h3>
      <p style={{ fontSize: '0.85rem', color: '#666' }}>
        Runs a full unlock → ride → completion → billing cycle instantly, without real GPS or IoT hardware.
      </p>
      {error && <p className="error">{error}</p>}
      {result && (
        <p className="success">
          Ride #{result.ride_id} completed — {result.distance_km} km, {result.duration_minutes} min, fare PKR {result.fare_amount}
        </p>
      )}
      <form onSubmit={handleSimulate}>
        <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required>
          <option value="">Select rider</option>
          {users.map((u) => <option key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</option>)}
        </select>
        <select value={form.scooty_id} onChange={(e) => setForm({ ...form, scooty_id: e.target.value })} required>
          <option value="">Select bike</option>
          {scooties.map((s) => <option key={s.scooty_id} value={s.scooty_id}>{s.plate_number}</option>)}
        </select>
        <input type="number" step="0.01" placeholder="Distance km (optional)" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} />
        <input type="number" placeholder="Duration min (optional)" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} />
        <button type="submit">Simulate Ride</button>
      </form>
    </section>
  );
}

const TABS = [
  { id: 'scooties', label: 'Bikes' },
  { id: 'zones', label: 'Stations' },
  { id: 'users', label: 'All Users' },
  { id: 'pending', label: 'Pending Users' },
  { id: 'plans', label: 'Pricing Plans' },
  { id: 'subscriptions', label: 'Subscriptions' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'cards', label: 'Virtual Cards' },
  { id: 'iot', label: 'IoT Monitor' },
  { id: 'rides', label: 'Rides' },
  { id: 'photos', label: 'Condition Photos' },
  { id: 'simulate', label: 'Simulate Ride' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [tab, setTab] = useState('scooties');

  function refreshStats() { client.get('/admin/dashboard').then((res) => setStats(res.data)); }
  useEffect(refreshStats, []);

  return (
    <div className="dashboard-page">
      <h2>Admin Dashboard</h2>

      {stats && (
        <div className="stats-row">
          <div className="stat-card"><span className="stat-value">{stats.scooty_counts.available || 0}</span><span className="stat-label">Available</span></div>
          <div className="stat-card"><span className="stat-value">{stats.scooty_counts.in_use || 0}</span><span className="stat-label">In Use</span></div>
          <div className="stat-card"><span className="stat-value">{stats.scooty_counts.maintenance || 0}</span><span className="stat-label">Maintenance</span></div>
          <div className="stat-card"><span className="stat-value">{stats.open_maintenance_logs}</span><span className="stat-label">Open Logs</span></div>
          <div className="stat-card"><span className="stat-value">{stats.zone_count}</span><span className="stat-label">Zones</span></div>
          <div className="stat-card"><span className="stat-value">{stats.pending_users}</span><span className="stat-label">Pending Users</span></div>
          <div className="stat-card"><span className="stat-value">{stats.total_transactions}</span><span className="stat-label">Transactions</span></div>
          <div className="stat-card"><span className="stat-value">PKR {stats.total_revenue}</span><span className="stat-label">Revenue</span></div>
          <div className="stat-card"><span className="stat-value">{stats.active_subscriptions}</span><span className="stat-label">Active Subs</span></div>
        </div>
      )}

      <div className="tab-bar" style={{ flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} onClick={() => { setTab(t.id); refreshStats(); }}>
            {t.label}
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
      {tab === 'rides' && <RidesPanel />}
      {tab === 'photos' && <ConditionPhotosPanel />}
      {tab === 'simulate' && <SimulateRidePanel />}
    </div>
  );
}
