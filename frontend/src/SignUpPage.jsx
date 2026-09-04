// src/SignupPage.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SparkleBackground from './SparkleBackground';

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
  const [notice, setNotice] = useState(null);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice(null);
    if (password !== confirm) {
      setNotice({ type: 'error', message: 'Passwords do not match.' });
      return;
    }
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });
      if (res.ok) {
        try {
          localStorage.removeItem('mindspark_token');
          localStorage.removeItem('mindspark_user');
        } catch (e) {}
        setNotice({ type: 'success', message: 'Account created successfully. Redirecting to login.' });
        setTimeout(() => navigate('/login', { replace: true }), 700);
      } else {
        const body = await res.json().catch(() => ({}));
        setNotice({ type: 'error', message: body.detail || body.message || 'Signup failed' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'Network error. Please try again.' });
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-violet-100 p-6 lg:p-10">
      <SparkleBackground />
      <div className="relative z-10 w-full max-w-xl sm:max-w-2xl lg:max-w-4xl bg-white rounded-3xl shadow-xl px-6 sm:px-10 lg:px-16 py-10 lg:py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-purple-600 tracking-tight">MindSpark</h1>
          <p className="mt-3 text-gray-600 font-medium text-base lg:text-lg">Create your account to get started.</p>
        </div>

        <Notice type={notice?.type} message={notice?.message} />

        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 lg:py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 lg:py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 lg:py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="confirm">Confirm Password</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 lg:py-4 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl border border-orange-300 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 active:from-orange-700 active:to-pink-700 text-white font-bold py-3.5 lg:py-4 text-base lg:text-lg shadow-lg shadow-orange-200 transition-colors"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-8 text-center text-gray-600 text-sm lg:text-base">
          <span>Already have an account? </span>
          <Link to="/login" className="font-semibold text-orange-500 hover:text-orange-600">Log in!</Link>
        </div>

        <div className="mt-5 text-center">
          <Link to="/" className="text-sm lg:text-base text-gray-500 hover:text-gray-700 font-medium">Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;