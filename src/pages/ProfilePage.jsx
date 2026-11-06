import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export function ProfilePage() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    setForm({ name: profile?.name || '', phone: profile?.phone || '', address: profile?.address || '' });
  }, [profile]);

  async function submit(event) {
    event.preventDefault();
    setStatus('saving');
    try {
      await updateProfile(form);
      setStatus('saved');
    } catch (error) {
      console.error('Unable to update profile:', error);
      setStatus('error');
    }
  }

  return (
    <div className="inner-page profile-page">
      <div className="inner-page-heading"><p className="eyebrow"><span className="eyebrow-line" />Your account</p><h1>Make it <em>personal.</em></h1></div>
      <div className="profile-layout">
        <form className="profile-form" onSubmit={submit}>
          <p className="eyebrow"><span className="eyebrow-line" />Personal details</p>
          <label>Full name<input name="name" onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label>
          <label>Email address<input disabled value={user?.email || ''} /></label>
          <label>Phone number<input name="phone" onChange={(event) => setForm({ ...form, phone: event.target.value })} required value={form.phone} /></label>
          <label>Delivery address<textarea name="address" onChange={(event) => setForm({ ...form, address: event.target.value })} required rows="3" value={form.address} /></label>
          {status === 'error' && <p className="form-error" role="alert">We couldn't save your details. Please try again.</p>}
          {status === 'saved' && <p className="form-success" role="status">Profile updated.</p>}
          <button className="solid-button" disabled={status === 'saving'} type="submit">{status === 'saving' ? 'Saving…' : 'Save details'} <span>↗</span></button>
        </form>
        <aside className="profile-aside">
          <div className="profile-aside-card"><span className="profile-avatar large">{(profile?.name || user?.email || 'A').charAt(0).toUpperCase()}</span><strong>{profile?.name || 'Your account'}</strong><span>{user?.email}</span></div>
          <div className="profile-quick-links"><Link to="/orders">View order history <span>↗</span></Link><button aria-pressed={theme === 'dark'} onClick={toggleTheme} type="button">{theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} <span>{theme === 'dark' ? '☼' : '◐'}</span></button><button onClick={signOut} type="button">Sign out <span>↗</span></button></div>
        </aside>
      </div>
    </div>
  );
}
