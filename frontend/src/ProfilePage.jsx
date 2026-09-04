import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SparkleBackground from './SparkleBackground';
import { useModal } from './Modal';

function StatRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="font-extrabold text-gray-900">{label}</div>
      <div className="font-semibold text-gray-700">{value}</div>
    </div>
  );
}

function ControlRow({ label, subtitle, action = 'Edit', onClick, disabled }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="font-extrabold text-gray-900">{label}</div>
        {subtitle ? <div className="text-xs text-gray-500 font-semibold">{subtitle}</div> : null}
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className="px-4 py-1.5 rounded-full bg-sky-300 hover:bg-sky-400 text-white font-bold shadow disabled:opacity-50 transition-colors"
      >
        {action}
      </button>
    </div>
  );
}

function formatActiveSince(memberSince) {
  if (!memberSince) return 'Recently';
  const then = new Date(memberSince);
  const days = Math.floor((Date.now() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return '1 month ago';
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

function ProfilePage() {
  const navigate = useNavigate();
  const modal = useModal();
  const childId = 1; // TODO: replace with actual childId from authentication
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [childId]);

  async function fetchStats() {
    try {
      const response = await fetch(`http://localhost:8000/profile-stats/${childId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to load profile');
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateChildProfile(payload) {
    setSaving(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:8000/child-profile/${childId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to update profile');
      setStats((prev) => ({ ...prev, ...data }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const handleSetScreenTime = async () => {
    const current = stats?.daily_time_limit ?? '';
    const input = await modal.prompt('Set a daily screen time limit (in minutes):', current);
    if (input === null) return; // cancelled
    const minutes = parseInt(input, 10);
    if (isNaN(minutes) || minutes < 0) {
      await modal.alert('Please enter a valid number of minutes.');
      return;
    }
    updateChildProfile({ daily_time_limit: minutes });
  };

  const handleManageSavedData = () => {
    navigate('/history');
  };

  const handleEditChildProfile = async () => {
    const newName = await modal.prompt("Child's name:", stats?.child_name || '');
    if (newName === null) return; // cancelled
    if (!newName.trim()) {
      await modal.alert('Name cannot be empty.');
      return;
    }
    const ageInput = await modal.prompt("Child's age:", stats?.child_age ?? '');
    if (ageInput === null) return; // cancelled
    const age = parseInt(ageInput, 10);
    if (isNaN(age) || age < 0 || age > 18) {
      await modal.alert('Please enter a valid age (0-18).');
      return;
    }
    updateChildProfile({ child_name: newName.trim(), child_age: age });
  };

  const name = stats?.child_name || 'Learner';

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-purple-200 to-purple-300 p-6 lg:p-10">
      <SparkleBackground />
      <div className="relative z-10 mx-auto max-w-5xl bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 shadow-xl">
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">{name}'s Profile</h1>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="mt-6 bg-gray-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/70 flex items-center justify-center text-2xl">👤</div>
          <div>
            <div className="font-extrabold text-gray-900">{name}'s Profile</div>
            <div className="text-sm text-gray-600 font-semibold">
              {loading
                ? 'Loading...'
                : `Age: ${stats?.child_age ?? '—'} | Active since: ${formatActiveSince(stats?.member_since)}`}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-gray-100 rounded-2xl p-5">
          <div className="text-xl font-extrabold text-purple-700 mb-2">Progress Report</div>
          <StatRow
            label="Time Spent:"
            value={loading ? '...' : `${stats?.time_spent_today_minutes ?? 0} minutes today`}
          />
          <StatRow
            label="Quizzes Completed:"
            value={loading ? '...' : `${stats?.quizzes_completed ?? 0} quizzes`}
          />
          <StatRow
            label="Average Quiz Score:"
            value={loading ? '...' : `${stats?.average_score_percentage ?? 0}%`}
          />
        </div>

        <div className="mt-6 bg-gray-100 rounded-2xl p-5">
          <div className="text-xl font-extrabold text-purple-700 mb-2">Account Controls</div>
          <ControlRow
            label="Set Screen Time Limit"
            subtitle={stats?.daily_time_limit ? `Currently: ${stats.daily_time_limit} min/day` : 'Not set'}
            action="Edit"
            onClick={handleSetScreenTime}
            disabled={loading || saving}
          />
          <ControlRow
            label="Manage Saved Data"
            subtitle="View learning history & quizzes"
            action="View"
            onClick={handleManageSavedData}
          />
          <ControlRow
            label="Edit Child Profile"
            subtitle="Update name and age"
            action="Edit"
            onClick={handleEditChildProfile}
            disabled={loading || saving}
          />
        </div>

        <nav className="mt-10 grid grid-cols-4 gap-4 text-center text-gray-600">
          <Link to="/home" className="rounded-2xl bg-purple-100 py-3 font-semibold text-purple-700">Home</Link>
          <Link to="/history" className="rounded-2xl bg-gray-100 py-3 font-semibold">History</Link>
          <Link to="/assessment" className="rounded-2xl bg-gray-100 py-3 font-semibold">Assessment</Link>
          <Link to="/settings" className="rounded-2xl bg-gray-100 py-3 font-semibold">Settings</Link>
        </nav>
      </div>
    </div>
  );
}

export default ProfilePage;
