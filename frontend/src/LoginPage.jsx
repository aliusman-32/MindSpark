import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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
  const [notice, setNotice] = useState(null);
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    (async () => {
      setNotice(null);
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          // store token and user info
          try {
            const toStore = { user_id: data.user_id };
            if (data.email) toStore.email = data.email;
            else if (email) toStore.email = email;
            localStorage.setItem('mindspark_user', JSON.stringify(toStore));
            if (data.access_token) localStorage.setItem('mindspark_token', data.access_token);
          } catch (e) {}
          setNotice({ type: 'success', message: 'Login successful. Redirecting to your home page.' });
          setTimeout(() => navigate('/home'), 700);
        } else {
          const body = await res.json().catch(() => ({}));
          setNotice({ type: 'error', message: body.detail || body.message || 'Invalid credentials' });
        }
      } catch (err) {
        setNotice({ type: 'error', message: 'Network error. Please try again.' });
      }
    })();
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-violet-100 p-6 lg:p-10">
      <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-4xl bg-white rounded-3xl shadow-xl px-6 sm:px-10 lg:px-16 py-10 lg:py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-purple-600 tracking-tight">MindSpark</h1>
          <p className="mt-3 text-gray-600 font-medium text-base lg:text-lg">Welcome back! Log in to continue.</p>
        </div>

        <Notice type={notice?.type} message={notice?.message} />

        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
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

          <div className="flex items-center justify-between text-sm">
            <label className="inline-flex items-center gap-2 select-none">
              <input type="checkbox" className="size-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-gray-600">Remember me</span>
            </label>
            <a href="#" className="font-semibold text-orange-500 hover:text-orange-600">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl border border-orange-300 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 active:from-orange-700 active:to-pink-700 text-white font-bold py-3.5 lg:py-4 text-base lg:text-lg shadow-lg shadow-orange-200 transition-colors"
          >
            Log In
          </button>
        </form>

        <div className="mt-8 text-center text-gray-600 text-sm lg:text-base">
          <span>Don't have an account? </span>
          <Link to="/signup" className="font-semibold text-orange-500 hover:text-orange-600">Sign up</Link>
        </div>

        <div className="mt-5 text-center">
          <Link to="/" className="text-sm lg:text-base text-gray-500 hover:text-gray-700 font-medium">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
