import { useEffect, useState } from 'react';
import client from '../../api/client.js';
import { Tag, Plus, Trash2 } from 'lucide-react';

export default function AdminPricingPlans() {
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ name: '', base_fare: 0, per_minute_rate: 0, per_km_rate: 0, is_subscription: false, monthly_price: 0 });
  const [error, setError] = useState('');

  function refresh() { client.get('/admin/plans').then((res) => setPlans(res.data)); }
  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await client.post('/admin/plans', {
        name: form.name, base_fare: Number(form.base_fare),
        per_minute_rate: Number(form.per_minute_rate), per_km_rate: Number(form.per_km_rate),
        is_subscription: form.is_subscription, monthly_price: form.is_subscription ? Number(form.monthly_price) : null,
      });
      setForm({ name: '', base_fare: 0, per_minute_rate: 0, per_km_rate: 0, is_subscription: false, monthly_price: 0 });
      refresh();
    } catch (err) { setError(err.response?.data?.error || 'Failed to add plan'); }
  }

  async function handleDelete(plan_id) {
    if (!window.confirm('Delete this pricing plan?')) return;
    try { await client.delete(`/admin/plans/${plan_id}`); refresh(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to delete plan'); }
  }

  return (
    <div className="dashboard-page fade-in">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <Tag size={24} style={{ color: 'var(--accent-start)' }} />
        <h2>Pricing Plans</h2>
      </div>

      <div className="glass-card" style={{ marginBottom: '2rem' }}>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Base Fare</th><th>Per Min</th><th>Per KM</th><th>Type</th><th>Actions</th></tr></thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.plan_id}>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>PKR {p.base_fare}</td>
                  <td>PKR {p.per_minute_rate}</td>
                  <td>PKR {p.per_km_rate}</td>
                  <td>
                    {p.is_subscription ? (
                      <span className="badge badge-in_use">Sub (PKR {p.monthly_price}/mo)</span>
                    ) : (
                      <span className="badge badge-available">Pay As You Go</span>
                    )}
                  </td>
                  <td><button type="button" className="btn-danger btn-sm" onClick={() => handleDelete(p.plan_id)}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <Plus size={20} />
          <h3>Add New Plan</h3>
        </div>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleAdd} className="admin-form">
          <div className="form-group"><label>Name</label><input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.is_subscription} onChange={(e) => setForm({...form, is_subscription: e.target.value === 'true'})}>
              <option value="false">Pay As You Go</option>
              <option value="true">Subscription</option>
            </select>
          </div>
          {form.is_subscription && (
            <div className="form-group"><label>Monthly Price (PKR)</label><input type="number" required value={form.monthly_price} onChange={(e) => setForm({...form, monthly_price: e.target.value})} /></div>
          )}
          <div className="form-group"><label>Base Fare (PKR)</label><input type="number" required value={form.base_fare} onChange={(e) => setForm({...form, base_fare: e.target.value})} /></div>
          <div className="form-group"><label>Per Minute (PKR)</label><input type="number" required value={form.per_minute_rate} onChange={(e) => setForm({...form, per_minute_rate: e.target.value})} /></div>
          <div className="form-group"><label>Per KM (PKR)</label><input type="number" required value={form.per_km_rate} onChange={(e) => setForm({...form, per_km_rate: e.target.value})} /></div>
          <button type="submit" style={{ marginTop: '1rem' }}>Add Plan</button>
        </form>
      </div>
    </div>
  );
}
