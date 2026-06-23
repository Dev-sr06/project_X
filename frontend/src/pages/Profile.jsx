import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password && form.password.length < 6)
      return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email };
      if (form.password) payload.password = form.password;
      const { data } = await api.put('/auth/me', payload);
      updateUser(data);
      setSuccess('Profile updated');
      setForm(f => ({ ...f, password: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Profile</div>
      </div>

      <div className="profile-card">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="name" value={form.name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" name="email" type="email" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label className="form-label">New Password <span style={{ color: '#999', fontWeight: 400 }}>(leave blank to keep current)</span></label>
            <input className="form-input" name="password" type="password" value={form.password}
              onChange={handle} placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
