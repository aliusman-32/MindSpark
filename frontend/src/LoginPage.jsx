import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import FloatingInput from './FloatingInput';
import { saveSession } from './authStorage';
import { useModal } from './Modal';
import logoIcon from './assets/new_logo.jpg';

function Notice({ type, message }) {
  if (!message) return null;

  const styles =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-rose-200 bg-rose-50 text-rose-800';

  const icon = type === 'success' ? '✓' : '✕';

  return (
    <div className={`mb-6 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${styles}`} role="status" aria-live="polite">
      <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-white/80 text-base font-black">
        {icon}
      </div>
      <div>{message}</div>
    </div>
  );
}

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const modal = useModal();

  function handleSubmit(event) {
    event.preventDefault();
    (async () => {
      setNotice(null);
      setSubmitting(true);
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          // store token and user info
          const toStore = { user_id: data.user_id };
          if (data.email) toStore.email = data.email;
          else if (email) toStore.email = email;
          saveSession({ user: toStore, token: data.access_token, remember: rememberMe });
          setNotice({ type: 'success', message: 'Login successful. Redirecting to your home page.' });
          setTimeout(() => navigate('/home'), 700);
        } else {
          const body = await res.json().catch(() => ({}));
          setNotice({ type: 'error', message: body.detail || body.message || 'Invalid credentials' });
          setSubmitting(false);
        }
      } catch (err) {
        setNotice({ type: 'error', message: 'Network error. Please try again.' });
        setSubmitting(false);
      }
    })();
  }

  return (
    <AuthLayout>
      <div className="auth-card-glow w-full shadow-xl px-6 sm:px-8 py-8 sm:py-10 animate-page-fade">
        <div className="text-center mb-8 animate-stagger" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-center gap-2 lg:hidden">
            <img src={logoIcon} alt="MindSpark" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-600 tracking-tight">MindSpark</h1>
          </div>
          <p className="mt-2 text-gray-600 font-medium">Welcome back! Log in to continue.</p>
        </div>

        <Notice type={notice?.type} message={notice?.message} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="animate-stagger" style={{ animationDelay: '80ms' }}>
            <FloatingInput
              id="email"
              type="email"
              icon="📧"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="animate-stagger" style={{ animationDelay: '150ms' }}>
            <FloatingInput
              id="password"
              type={showPassword ? 'text' : 'password'}
              icon="🔒"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              }
            />
          </div>

          <div className="flex items-center justify-between text-sm animate-stagger" style={{ animationDelay: '220ms' }}>
            <label className="inline-flex items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-600">Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => modal.alert('Password reset isn\'t available yet. Please contact support for help signing in.')}
              className="font-semibold text-orange-500 hover:text-orange-600"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="animate-stagger w-full rounded-xl border border-orange-300 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 active:from-orange-700 active:to-pink-700 text-white font-bold py-3.5 text-base shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] hover:shadow-orange-300 disabled:opacity-70 disabled:hover:scale-100"
            style={{ animationDelay: '290ms' }}
          >
            {submitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-600 text-sm animate-stagger" style={{ animationDelay: '360ms' }}>
          <span>Don't have an account? </span>
          <Link to="/signup" className="font-semibold text-orange-500 hover:text-orange-600">Sign up</Link>
        </div>

        <div className="mt-5 text-center animate-stagger" style={{ animationDelay: '360ms' }}>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 font-medium">Back to Home</Link>
        </div>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
