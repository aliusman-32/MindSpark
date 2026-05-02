import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Category({ color, label }) {
  return (
    <button
      className="flex-1 min-w-[140px] rounded-2xl px-6 py-8 text-white font-bold shadow-md"
      style={{ background: color }}
    >
      {label}
    </button>
  );
}

function Card({ title, subtitle, color }) {
  return (
    <div className="flex gap-4 items-center bg-pink-100 rounded-3xl p-6 shadow-sm" style={{ background: color }}>
      <div className="w-20 h-20 rounded-2xl bg-white/60 text-center flex items-center justify-center text-sm font-semibold text-gray-700">
        {subtitle}
      </div>
      <div>
        <h3 className="text-xl font-extrabold text-purple-700 leading-6">{title}</h3>
        <p className="mt-1 text-gray-700 max-w-prose">Learn how water moves around the world!</p>
      </div>
    </div>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [displayName, setDisplayName] = useState('Aliza');

  React.useEffect(() => {
    try {
      const item = localStorage.getItem('mindspark_user');
      if (!item) return;
      const parsed = JSON.parse(item);
      if (parsed) {
        // Prefer full name if stored, else derive from email local-part
        if (parsed.fullName) {
          setDisplayName(parsed.fullName);
        } else if (parsed.email) {
          const namePart = parsed.email.split('@')[0];
          // Capitalize first letter
          setDisplayName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
        }
      }
    } catch (e) {
      // keep default
    }
  }, []);

  const handleSend = () => {
    if (!prompt.trim()) {
      alert('Please enter a topic');
      return;
    }
    // Navigate to lesson page, passing the prompt via state
    navigate('/lesson', { state: { prompt } });
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-200 to-purple-300 p-6 lg:p-10">
      <div className="mx-auto max-w-6xl bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 shadow-xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-purple-600 rounded"></div>
            <div className="text-xl sm:text-2xl font-extrabold text-purple-700">MindSpark</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm sm:text-base text-gray-700 font-semibold">Hello, {displayName}!</div>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-extrabold text-rose-700 shadow-sm hover:bg-rose-100 hover:border-rose-300 transition-colors"
            >
              Logout
            </button>
            <div className="w-9 h-9 rounded-full bg-amber-200 border border-amber-300 flex items-center justify-center">🟡</div>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-5">
          <Category color="linear-gradient(135deg,#9b5de5,#7a3bd6)" label="Stories" />
          <Category color="linear-gradient(135deg,#4cc9f0,#4895ef)" label="Science" />
          <Category color="linear-gradient(135deg,#f4a261,#e76f51)" label="History" />
          <Category color="linear-gradient(135deg,#80ed99,#38b000)" label="Fun Facts" />
        </div>

        <h2 className="mt-10 text-2xl sm:text-3xl font-extrabold text-purple-700">Recommended for You!</h2>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link to="/lesson">
            <Card title="The Thirsty Crow" subtitle="Thirsty Crow" color="#EBC2FA" />
          </Link>
          <Link to="/lesson">
            <Card title="The Water Cycle" subtitle="Water Cycle" color="#FAD0E4" />
          </Link>
        </div>

        <div className="mt-8">
          <div className="w-full rounded-full bg-gray-100 shadow-inner flex items-center pl-5 pr-2 py-3">
            <div className="text-xl text-purple-500">🔍</div>
            <input
              type="text"
              placeholder="What do you want to learn today?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 bg-transparent outline-none px-3 text-gray-700 font-medium"
            />
            <button
              onClick={handleSend}
              className="ml-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2"
            >
              ➤
            </button>
          </div>
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

export default HomePage;