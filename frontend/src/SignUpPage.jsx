// src/SignupPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const SignUpPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      // eslint-disable-next-line no-alert
      alert('Passwords do not match');
      return;
    }
    // eslint-disable-next-line no-alert
    alert(`Signing up ${fullName}`);
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-violet-100 p-6 lg:p-10">
      <div className="w-full max-w-xl sm:max-w-2xl lg:max-w-4xl bg-white rounded-3xl shadow-xl px-6 sm:px-10 lg:px-16 py-10 lg:py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-purple-600 tracking-tight">MindSpark</h1>
          <p className="mt-3 text-gray-600 font-medium text-base lg:text-lg">Create your account to get started.</p>
        </div>

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
            className="w-full rounded-xl bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white font-bold py-3.5 lg:py-4 text-base lg:text-lg shadow-md transition-colors"
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