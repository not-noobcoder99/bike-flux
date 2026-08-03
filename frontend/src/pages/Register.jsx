import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', phone: '', student_id: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="auth-page">
      <h2>Create your Bike Flux account</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Full name" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
        <input type="password" placeholder="Password" value={form.password} onChange={(e) => update('password', e.target.value)} required />
        <input placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
        <input placeholder="Student ID" value={form.student_id} onChange={(e) => update('student_id', e.target.value)} />
        {error && <p className="error">{error}</p>}
        {success && <p className="success">Registered! Redirecting to login...</p>}
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
