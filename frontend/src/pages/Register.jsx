import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { UserPlus, AlertCircle, CheckCircle, User, Mail, Lock, Phone, IdCard } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', student_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">
            <UserPlus />
          </div>
          <h2>Create your account</h2>
          <p>Join Bike Flux and start riding today</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reg-name">Full name</label>
            <input
              id="reg-name"
              placeholder="Ahmed Khan"
              value={form.full_name}
              onChange={(e) => update('full_name', e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Email address</label>
            <input
              id="reg-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              placeholder="Choose a strong password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-phone">Phone number <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <input
              id="reg-phone"
              placeholder="03XX-XXXXXXX"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-student-id">Student ID <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <input
              id="reg-student-id"
              placeholder="e.g. 2024-CS-123"
              value={form.student_id}
              onChange={(e) => update('student_id', e.target.value)}
            />
          </div>

          {error && (
            <p className="error">
              <AlertCircle size={16} /> {error}
            </p>
          )}

          {success && (
            <p className="success">
              <CheckCircle size={16} /> Registered! Redirecting to login...
            </p>
          )}

          <button type="submit" disabled={loading || success}>
            {loading ? (
              <><div className="spinner spinner-sm"></div> Creating account...</>
            ) : success ? (
              <><CheckCircle size={18} /> Account Created</>
            ) : (
              <><UserPlus size={18} /> Create Account</>
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
