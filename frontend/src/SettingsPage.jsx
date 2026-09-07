import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import { getStoredUser, clearSession } from './authStorage';
import { useTheme } from './ThemeContext';

function Row({ icon, title, subtitle, trailing }) {
  return (
    <div className="bg-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center text-2xl">{icon}</div>
        <div>
          <div className="text-lg font-extrabold text-gray-900">{title}</div>
          {subtitle ? <div className="text-sm text-gray-600 font-semibold">{subtitle}</div> : null}
        </div>
      </div>
      <div>{trailing ?? <span className="text-gray-400">↗</span>}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`w-14 h-8 rounded-full p-1 transition-colors ${checked ? 'bg-purple-600' : 'bg-gray-300'}`}
    >
      <div className={`w-6 h-6 bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
    </button>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const { themeKey, setThemeKey, themes } = useTheme();
  const [notifications, setNotifications] = useState(() => {
    try {
      return localStorage.getItem('mindspark_notifications') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [displayName, setDisplayName] = useState('Guest');

  React.useEffect(() => {
    const parsed = getStoredUser();
    if (!parsed) {
      setDisplayName('Guest');
      return;
    }
    if (parsed.fullName) {
      setDisplayName(parsed.fullName);
    } else if (parsed.email) {
      const namePart = parsed.email.split('@')[0];
      setDisplayName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
    }
  }, []);

  const handleNotificationsChange = (value) => {
    setNotifications(value);
    try {
      localStorage.setItem('mindspark_notifications', String(value));
    } catch (e) {}
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <PageShell maxWidth="max-w-5xl">
        <AppHeader />
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">Settings ⚙️</h1>

        <div className="mt-6 rounded-3xl bg-purple-50 border border-purple-100 px-5 py-4 text-center">
          <div className="text-sm font-semibold text-purple-700">Signed in as</div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-900">{displayName}</div>
        </div>

        <div className="mt-8 space-y-4">
          <Link to="/profile">
            <Row icon="👤" title="Profile" subtitle="Aliza, 7 years old" />
          </Link>
          <Link to="/history">
            <Row icon="🗂️" title="Saved Data" subtitle="Manage learning history & quizzes" />
          </Link>
          <Row
            icon="🔔"
            title="Notifications"
            subtitle="Enable/disable app alerts"
            trailing={<Toggle checked={notifications} onChange={handleNotificationsChange} label="Enable notifications" />}
          />
          <div className="bg-gray-100 rounded-2xl px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center text-2xl">🌞</div>
              <div>
                <div className="text-lg font-extrabold text-gray-900">Theme/Background</div>
                <div className="text-sm text-gray-600 font-semibold">Choose a color theme</div>
              </div>
            </div>
            <div className="flex gap-3 mt-3 pl-16">
              {Object.entries(themes).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setThemeKey(key)}
                  aria-label={`${t.label} theme`}
                  aria-pressed={themeKey === key}
                  title={t.label}
                  className={`w-10 h-10 rounded-full border-4 transition-all hover:scale-110 ${
                    themeKey === key ? 'border-purple-600 scale-110 shadow-md' : 'border-white shadow-sm'
                  }`}
                  style={{ background: t.swatch }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white font-extrabold py-4 shadow-lg"
          >
            Logout {displayName} 🪪
          </button>
        </div>

        <BottomNav />
    </PageShell>
  );
}

export default SettingsPage;