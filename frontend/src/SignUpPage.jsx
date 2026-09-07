// src/SignupPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import FloatingInput from './FloatingInput';
import { clearSession } from './authStorage';
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

const SignUpPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [notice, setNotice] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice(null);
    if (password !== confirm) {
      setNotice({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      if (res.ok) {
        clearSession();
        setNotice({ type: 'success', message: 'Account created successfully. Redirecting to login.' });
        setTimeout(() => navigate('/login', { replace: true }), 700);
      } else {
        const body = await res.json().catch(() => ({}));
        setNotice({ type: 'error', message: body.detail || body.message || 'Signup failed' });
        setSubmitting(false);
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Network error. Please try again.' });
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card-glow w-full shadow-xl px-6 sm:px-8 py-8 sm:py-10 animate-page-fade">
        <div className="text-center mb-8 animate-stagger" style={{ animationDelay: '0ms' }}>
          <div className="flex items-center justify-center gap-2 lg:hidden">
            <img src={logoIcon} alt="MindSpark" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
            <h1 className="text-3xl sm:text-4xl font-extrabold text-purple-600 tracking-tight">MindSpark</h1>
          </div>
          <p className="mt-2 text-gray-600 font-medium">Create your account to get started.</p>
        </div>

        <Notice type={notice?.type} message={notice?.message} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="animate-stagger" style={{ animationDelay: '60ms' }}>
            <FloatingInput
              id="fullName"
              type="text"
              icon="🙂"
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="animate-stagger" style={{ animationDelay: '120ms' }}>
            <FloatingInput
              id="email"
              type="email"
              icon="📧"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="animate-stagger" style={{ animationDelay: '180ms' }}>
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

          <div className="animate-stagger" style={{ animationDelay: '240ms' }}>
            <FloatingInput
              id="confirm"
              type={showConfirm ? 'text' : 'password'}
              icon="🔒"
              label="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg"
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              }
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="animate-stagger w-full rounded-xl border border-orange-300 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 active:from-orange-700 active:to-pink-700 text-white font-bold py-3.5 text-base shadow-lg shadow-orange-200 transition-all hover:scale-[1.02] hover:shadow-orange-300 disabled:opacity-70 disabled:hover:scale-100"
            style={{ animationDelay: '300ms' }}
          >
            {submitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-600 text-sm animate-stagger" style={{ animationDelay: '360ms' }}>
          <span>Already have an account? </span>
          <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600">Log in!</Link>
        </div>

        <div className="mt-5 text-center animate-stagger" style={{ animationDelay: '360ms' }}>
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-700 font-medium">Back to Home</Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignUpPage;
