import { useEffect, useState } from 'react';
import client from '../api/client.js';
import { Play, Bike, Route, Clock, Banknote, AlertCircle, CheckCircle, Calculator } from 'lucide-react';

export default function SimulateRide() {
  const [scooties, setScooties] = useState([]);
  const [form, setForm] = useState({ scooty_id: '', distance_km: '', duration_minutes: '' });
  const [farePreview, setFarePreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    client.get('/scooties').then((res) => setScooties(res.data));
  }, []);

  // Auto-calculate fare when distance or duration changes
  useEffect(() => {
    const dist = Number(form.distance_km);
    const dur = Number(form.duration_minutes);
    if (dist > 0 && dur > 0) {
      setCalculating(true);
      const timer = setTimeout(() => {
        client
          .post('/rides/calculate-fare', { distance_km: dist, duration_minutes: dur })
          .then((res) => setFarePreview(res.data.fare_amount))
          .catch(() => setFarePreview(null))
          .finally(() => setCalculating(false));
      }, 400); // debounce
      return () => clearTimeout(timer);
    } else {
      setFarePreview(null);
    }
  }, [form.distance_km, form.duration_minutes]);

  async function handleSimulate(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await client.post('/rides/simulate', {
        scooty_id: Number(form.scooty_id),
        distance_km: form.distance_km ? Number(form.distance_km) : undefined,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
      });
      setResult(res.data);
      setForm({ scooty_id: '', distance_km: '', duration_minutes: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-page fade-in">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <Play size={24} style={{ color: 'var(--accent-start)' }} /> Ride Simulator
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Simulate a complete ride cycle — unlock, ride, billing — without physically riding. Great for testing.
      </p>

      {error && (
        <p className="error" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} /> {error}
        </p>
      )}

      {result && (
        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
          <div className="glass-card-header">
            <CheckCircle size={22} style={{ color: 'var(--status-success)' }} />
            <h3>Simulation Complete!</h3>
          </div>
          <div className="ride-summary-grid">
            <div className="ride-summary-item">
              <Route size={22} style={{ color: 'var(--accent-start)', marginBottom: '4px' }} />
              <span className="value">{result.distance_km} km</span>
              <span className="label">Distance</span>
            </div>
            <div className="ride-summary-item">
              <Clock size={22} style={{ color: 'var(--accent-end)', marginBottom: '4px' }} />
              <span className="value">{result.duration_minutes} min</span>
              <span className="label">Duration</span>
            </div>
            <div className="ride-summary-item">
              <Banknote size={22} style={{ color: 'var(--status-success)', marginBottom: '4px' }} />
              <span className="value">PKR {result.fare_amount}</span>
              <span className="label">Fare Charged</span>
            </div>
          </div>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Ride #{result.ride_id} — amount deducted from your wallet.
          </p>
        </div>
      )}

      <div className="glass-card">
        <div className="glass-card-header">
          <Bike size={22} />
          <h3>Configure Simulation</h3>
        </div>

        <form onSubmit={handleSimulate}>
          <div className="form-group">
            <label>Select Bike</label>
            <select
              value={form.scooty_id}
              onChange={(e) => setForm({ ...form, scooty_id: e.target.value })}
              required
            >
              <option value="">Choose a bike...</option>
              {scooties.map((s) => (
                <option key={s.scooty_id} value={s.scooty_id}>
                  {s.plate_number} — Battery {s.battery_level}%
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Distance Traveled (km)</label>
            <input
              type="number"
              step="0.01"
              min="0.1"
              placeholder="e.g. 2.5"
              value={form.distance_km}
              onChange={(e) => setForm({ ...form, distance_km: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Ride Duration (minutes)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 15"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              required
            />
          </div>

          {/* Live fare preview */}
          {(farePreview !== null || calculating) && (
            <div className="fare-preview">
              <Calculator size={18} />
              <span>
                Estimated fare: {' '}
                {calculating ? (
                  <span style={{ color: 'var(--text-muted)' }}>calculating...</span>
                ) : (
                  <strong style={{ color: 'var(--status-success)' }}>PKR {farePreview}</strong>
                )}
              </span>
            </div>
          )}

          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px' }}>
              {loading ? (
                <><div className="spinner spinner-sm"></div> Simulating ride...</>
              ) : (
                <><Play size={18} /> Run Simulation</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
