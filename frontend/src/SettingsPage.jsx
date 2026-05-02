import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Row({ icon, title, subtitle, trailing, href }) {
  return (
    <div className="bg-gray-100 rounded-2xl px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-white/70 flex items-center justify-center text-2xl">{icon}</div>
        <div>
          <div className="text-lg font-extrabold text-gray-900">{title}</div>
          {subtitle ? <div className="text-sm text-gray-600 font-semibold">{subtitle}</div> : null}
        </div>
      </div>
      <div>
        {trailing ?? (
          href ? <a href={href} className="text-gray-400">↗</a> : <span className="text-gray-400">↗</span>
        )}
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-14 h-8 rounded-full p-1 transition-colors ${checked ? 'bg-purple-600' : 'bg-gray-300'}`}
    >
      <div className={`w-6 h-6 bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
    </button>
  );
}

function SettingsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(false);
  const [displayName, setDisplayName] = useState('Guest');

  React.useEffect(() => {
    try {
      const item = localStorage.getItem('mindspark_user');
      if (!item) return;
      const parsed = JSON.parse(item);
      if (parsed?.fullName) {
        setDisplayName(parsed.fullName);
      } else if (parsed?.email) {
        const namePart = parsed.email.split('@')[0];
        setDisplayName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
      }
    } catch (e) {
      setDisplayName('Guest');
    }
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem('mindspark_user');
      localStorage.removeItem('mindspark_token');
    } catch (e) {}
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-200 to-purple-300 p-6 lg:p-10">
      <div className="mx-auto max-w-5xl bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 shadow-xl">
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">Settings ⚙️</h1>

        <div className="mt-6 rounded-3xl bg-purple-50 border border-purple-100 px-5 py-4 text-center">
          <div className="text-sm font-semibold text-purple-700">Signed in as</div>
          <div className="text-xl sm:text-2xl font-extrabold text-gray-900">{displayName}</div>
        </div>

        <div className="mt-8 space-y-4">
          <Link to="/profile">
            <Row icon="👤" title="Profile" subtitle="Aliza, 7 years old" href="/profile" />
          </Link>
          <Row icon="🗂️" title="Saved Data" subtitle="Manage learning history & quizzes" />
          <Row
            icon="🔔"
            title="Notifications"
            subtitle="Enable/disable app alerts"
            trailing={<Toggle checked={notifications} onChange={setNotifications} />}
          />
          <Row icon="🌞" title="Theme/Background" subtitle="Change the look of the app" />
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogout}
            className="w-full rounded-full bg-rose-400 hover:bg-rose-500 text-white font-extrabold py-4 shadow-lg"
          >
            Logout {displayName} 🪪
          </button>
        </div>

        <nav className="mt-10 grid grid-cols-4 gap-4 text-center text-gray-600">
          <Link to="/home" className="rounded-2xl bg-gray-100 py-3 font-semibold">Home</Link>
          <Link to="/history" className="rounded-2xl bg-gray-100 py-3 font-semibold">History</Link>
          <Link to="/assessment" className="rounded-2xl bg-gray-100 py-3 font-semibold">Assessment</Link>
          <Link to="/settings" className="rounded-2xl bg-purple-100 py-3 font-semibold text-purple-700">Settings</Link>
        </nav>
      </div>
    </div>
  );
}

export default SettingsPage;