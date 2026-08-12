import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';
import { User, Mail, Phone, IdCard, Shield, Save, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', student_id: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/auth/me').then((res) => {
      setProfile(res.data);
      setForm({
        full_name: res.data.full_name || '',
        phone: res.data.phone || '',
        student_id: res.data.student_id || '',
      });
      setLoading(false);
    });
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await client.put('/auth/profile', form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner"></div>
        <span className="spinner-text">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="profile-page fade-in">
      <div className="glass-card" style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div className="glass-card-header">
          <User size={22} />
          <h3>My Profile</h3>
        </div>

        {/* Read-only info */}
        <div className="profile-info-grid">
          <div className="profile-info-item">
            <Mail size={16} />
            <div>
              <span className="profile-label">Email</span>
              <span className="profile-value">{profile.email}</span>
            </div>
          </div>
          <div className="profile-info-item">
            <Shield size={16} />
            <div>
              <span className="profile-label">Role</span>
              <span className="profile-value" style={{ textTransform: 'capitalize' }}>{profile.role}</span>
            </div>
          </div>
          <div className="profile-info-item">
            <Calendar size={16} />
            <div>
              <span className="profile-label">Member Since</span>
              <span className="profile-value">
                {new Date(profile.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* Editable form */}
        <form onSubmit={handleSave} style={{ marginTop: '1.5rem' }}>
          <div className="form-group">
            <label htmlFor="profile-name">Full Name</label>
            <input
              id="profile-name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-phone">Phone Number</label>
            <input
              id="profile-phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="03XX-XXXXXXX"
            />
          </div>

          <div className="form-group">
            <label htmlFor="profile-student-id">Student ID</label>
            <input
              id="profile-student-id"
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              placeholder="e.g. 2024-CS-123"
            />
          </div>

          {error && (
            <p className="error">
              <AlertCircle size={16} /> {error}
            </p>
          )}
          {success && (
            <p className="success">
              <CheckCircle size={16} /> Profile updated successfully
            </p>
          )}

          <button type="submit" disabled={saving} style={{ width: '100%' }}>
            {saving ? (
              <><div className="spinner spinner-sm"></div> Saving...</>
            ) : (
              <><Save size={18} /> Save Changes</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
