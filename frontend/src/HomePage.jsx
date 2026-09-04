import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SparkleBackground from './SparkleBackground';
import { useModal } from './Modal';

function Category({ color, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 min-w-[140px] rounded-2xl px-6 py-8 text-white font-bold shadow-md hover:brightness-110 active:scale-95 transition"
      style={{ background: color }}
    >
      {label}
    </button>
  );
}

const CATEGORIES = [
  { id: 1, label: 'Stories', color: 'linear-gradient(135deg,#9b5de5,#7a3bd6)', prompt: 'Tell me an exciting story' },
  { id: 2, label: 'Science', color: 'linear-gradient(135deg,#4cc9f0,#4895ef)', prompt: 'Teach me an interesting science topic' },
  { id: 3, label: 'History', color: 'linear-gradient(135deg,#f4a261,#e76f51)', prompt: 'Tell me about an interesting event in history' },
  { id: 4, label: 'Fun Facts', color: 'linear-gradient(135deg,#80ed99,#38b000)', prompt: 'Share some fun facts I would love to learn' },
];

const RECOMMENDATION_COLORS = ['#EBC2FA', '#FAD0E4', '#CFF3FB', '#DDF5D0'];

function Card({ title, badge, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex gap-4 items-center rounded-3xl p-6 shadow-sm text-left hover:brightness-105 active:scale-[0.99] transition"
      style={{ background: color }}
    >
      <div className="w-20 h-20 rounded-2xl bg-white/60 text-center flex items-center justify-center text-sm font-semibold text-gray-700 shrink-0">
        {badge}
      </div>
      <div className="min-w-0">
        <h3 className="text-xl font-extrabold text-purple-700 leading-6 truncate">{title}</h3>
        <p className="mt-1 text-gray-700">Pick up where you left off</p>
      </div>
    </button>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const modal = useModal();
  const childId = 1; // TODO: replace with actual childId from authentication
  const [prompt, setPrompt] = useState('');
  const [displayName, setDisplayName] = useState('Aliza');
  const [recommended, setRecommended] = useState([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommended() {
      try {
        const response = await fetch(`http://localhost:8000/history/${childId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to load recommendations');
        const lessons = data.filter((item) => item.item_type === 'lesson' && item.lesson_id).slice(0, 2);
        setRecommended(lessons);
      } catch (e) {
        setRecommended([]);
      } finally {
        setRecommendedLoading(false);
      }
    }
    fetchRecommended();
  }, [childId]);

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

  const handleSend = async () => {
    if (!prompt.trim()) {
      await modal.alert('Please enter a topic');
      return;
    }
    // Navigate to lesson page, passing the prompt via state
    navigate('/lesson', { state: { prompt } });
  };

  const handleCategoryClick = (category) => {
    navigate('/lesson', { state: { prompt: category.prompt, category_id: category.id } });
  };

  const handleRecommendedClick = (lessonId) => {
    navigate('/lesson', { state: { viewLessonId: lessonId } });
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-purple-200 to-purple-300 p-6 lg:p-10">
      <SparkleBackground />
      <div className="relative z-10 mx-auto max-w-6xl bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 shadow-xl">
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
          {CATEGORIES.map((category) => (
            <Category
              key={category.id}
              color={category.color}
              label={category.label}
              onClick={() => handleCategoryClick(category)}
            />
          ))}
        </div>

        <h2 className="mt-10 text-2xl sm:text-3xl font-extrabold text-purple-700">Recommended for You!</h2>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {recommendedLoading ? (
            <div className="text-gray-500 font-semibold">Loading...</div>
          ) : recommended.length === 0 ? (
            <div className="sm:col-span-2 rounded-3xl bg-purple-50 p-6 text-center text-purple-700 font-semibold">
              No lessons yet — search a topic below or pick a category above to get started!
            </div>
          ) : (
            recommended.map((item, idx) => (
              <Card
                key={item.lesson_id}
                title={item.title}
                badge={item.title.slice(0, 12)}
                color={RECOMMENDATION_COLORS[idx % RECOMMENDATION_COLORS.length]}
                onClick={() => handleRecommendedClick(item.lesson_id)}
              />
            ))
          )}
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