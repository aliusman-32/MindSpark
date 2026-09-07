import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Skeleton from './Skeleton';
import { useModal } from './Modal';
import { getProfilePhoto, setProfilePhoto } from './profilePhoto';

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
  const [photo, setPhoto] = useState(() => getProfilePhoto());
  const fileInputRef = useRef(null);

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

  const handlePhotoPick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      await modal.alert('Please choose an image file.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      await modal.alert('Please choose an image smaller than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(reader.result);
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
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
    <PageShell maxWidth="max-w-5xl">
        <AppHeader />
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">{name}'s Profile</h1>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
            {error}
          </div>
        )}

        <div className="mt-6 bg-gray-100 rounded-2xl p-5 flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full bg-white/70 border-2 border-white shadow flex items-center justify-center text-2xl overflow-hidden">
              {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" /> : '👤'}
            </div>
            <button
              onClick={handlePhotoPick}
              aria-label="Change profile photo"
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center text-xs shadow-md border-2 border-white transition active:scale-95"
            >
              📷
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-gray-900">{name}'s Profile</div>
            {loading ? (
              <Skeleton className="h-4 w-48 mt-1" />
            ) : (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600 font-semibold">Age: {stats?.child_age ?? '—'}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  Active {formatActiveSince(stats?.member_since)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-gray-100 rounded-2xl p-5">
          <div className="text-xl font-extrabold text-purple-700 mb-2">Progress Report</div>
          {loading ? (
            <div className="space-y-2 py-1">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          ) : (
            <>
              <StatRow label="Time Spent:" value={`${stats?.time_spent_today_minutes ?? 0} minutes today`} />
              <StatRow label="Quizzes Completed:" value={`${stats?.quizzes_completed ?? 0} quizzes`} />
              <StatRow label="Average Quiz Score:" value={`${stats?.average_score_percentage ?? 0}%`} />
            </>
          )}
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

        <BottomNav />
    </PageShell>
  );
}

export default ProfilePage;
