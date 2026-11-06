import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerAccount, resetPassword, signIn } from '../services/accounts';

const initialForm = { name: '', email: '', password: '', phone: '', address: '' };

export function LoginPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) navigate(location.state?.from || '/', { replace: true });
  }, [location.state, navigate, user]);

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setStatus('submitting');
    setMessage('');
    try {
      if (mode === 'login') await signIn(form.email, form.password);
      else await registerAccount(form);
      navigate(location.state?.from || '/', { replace: true });
    } catch (error) {
      console.error('Authentication request failed:', error);
      setStatus('error');
      setMessage(authenticationMessage(error.code));
    }
  }

  async function forgotPassword() {
    if (!form.email) {
      setStatus('error');
      setMessage('Enter your email address first.');
      return;
    }
    try {
      await resetPassword(form.email);
      setStatus('success');
      setMessage('Password reset email sent. Check your inbox.');
    } catch (error) {
      console.error('Password reset failed:', error);
      setStatus('error');
      setMessage(authenticationMessage(error.code));
    }
  }

  return (
    <div className="auth-page inner-page">
      <div className="auth-intro">
        <p className="eyebrow"><span className="eyebrow-line" />D&Z account</p>
        <h1>{mode === 'login' ? <>Welcome <em>back.</em></> : <>Make it <em>yours.</em></>}</h1>
        <p>Save your details, follow your orders, and keep your edit close.</p>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => setMode('login')} type="button">Sign in</button>
          <button className={mode === 'register' ? 'auth-tab active' : 'auth-tab'} onClick={() => setMode('register')} type="button">Create account</button>
        </div>
        {mode === 'register' && <label>Full name<input name="name" onChange={updateField} required value={form.name} /></label>}
        <label>Email address<input name="email" onChange={updateField} required type="email" value={form.email} /></label>
        <label>Password<input minLength="6" name="password" onChange={updateField} required type="password" value={form.password} /></label>
        {mode === 'register' && <><label>Phone number<input name="phone" onChange={updateField} required value={form.phone} /></label><label>Address<input name="address" onChange={updateField} required value={form.address} /></label></>}
        {message && <p className={status === 'success' ? 'form-success' : 'form-error'} role="alert">{message}</p>}
        <button className="solid-button full" disabled={status === 'submitting'} type="submit">{status === 'submitting' ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <span>↗</span></button>
        {mode === 'login' && <button className="forgot-button" onClick={forgotPassword} type="button">Forgot your password?</button>}
      </form>
    </div>
  );
}

function authenticationMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'That email is already registered.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Use a password with at least six characters.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
  };
  return messages[code] || 'We could not complete that request. Please try again.';
}
