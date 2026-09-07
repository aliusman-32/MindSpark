import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Skeleton from './Skeleton';
import { useModal } from './Modal';
import { getStoredUser } from './authStorage';

function Category({ color, label, icon, onClick, index }) {
  return (
    <button
      onClick={onClick}
      style={{ background: color, animationDelay: `${index * 70}ms` }}
      className="animate-stagger group flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-3.5 sm:px-3 sm:py-4 text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-95 transition-all duration-200"
    >
      <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-[11px] sm:text-sm leading-tight">{label}</span>
    </button>
  );
}

const CATEGORIES = [
  { id: 1, label: 'Stories', icon: '📖', color: 'linear-gradient(135deg,#9b5de5,#7a3bd6)', prompt: 'Tell me an exciting story' },
  { id: 2, label: 'Science', icon: '🔬', color: 'linear-gradient(135deg,#4cc9f0,#4895ef)', prompt: 'Teach me an interesting science topic' },
  { id: 3, label: 'History', icon: '🏛️', color: 'linear-gradient(135deg,#f4a261,#e76f51)', prompt: 'Tell me about an interesting event in history' },
  { id: 4, label: 'Fun Facts', icon: '💡', color: 'linear-gradient(135deg,#80ed99,#38b000)', to: '/fun-facts' },
  { id: 5, label: 'Games', icon: '🎮', color: 'linear-gradient(135deg,#7c3aed,#db2777)', to: '/games' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

const RECOMMENDATION_COLORS = ['#EBC2FA', '#FAD0E4', '#CFF3FB', '#DDF5D0'];

const TOPIC_EMOJI_MAP = [
  { keywords: ['ocean', 'sea', 'fish', 'shark', 'water'], emoji: '🌊' },
  { keywords: ['space', 'planet', 'star', 'solar', 'astronaut', 'moon'], emoji: '🚀' },
  { keywords: ['science', 'experiment', 'chemistry', 'physics'], emoji: '🔬' },
  { keywords: ['history', 'ancient', 'king', 'queen', 'war', 'event'], emoji: '🏛️' },
  { keywords: ['story', 'tale', 'fairy', 'exciting'], emoji: '📖' },
  { keywords: ['animal', 'dog', 'cat', 'bird', 'crow'], emoji: '🐾' },
  { keywords: ['fun fact', 'fact'], emoji: '💡' },
  { keywords: ['music', 'song'], emoji: '🎵' },
  { keywords: ['math', 'number'], emoji: '🔢' },
];

function getTopicEmoji(text) {
  const t = (text || '').toLowerCase();
  const match = TOPIC_EMOJI_MAP.find(({ keywords }) => keywords.some((k) => t.includes(k)));
  return match ? match.emoji : '✨';
}

function Card({ title, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex gap-4 items-center rounded-3xl p-6 shadow-sm text-left hover:brightness-105 active:scale-[0.99] transition"
      style={{ background: color }}
    >
      <div className="w-20 h-20 rounded-2xl bg-white/60 flex items-center justify-center text-4xl shrink-0">
        {getTopicEmoji(title)}
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
  const [totalLessons, setTotalLessons] = useState(0);
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    async function fetchRecommended() {
      try {
        const response = await fetch(`http://localhost:8000/history/${childId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to load recommendations');
        const lessons = data.filter((item) => item.item_type === 'lesson' && item.lesson_id);
        setTotalLessons(lessons.length);
        setRecommended(lessons.slice(0, 2));
      } catch (e) {
        setRecommended([]);
      } finally {
        setRecommendedLoading(false);
      }
    }
    fetchRecommended();
  }, [childId]);

  useEffect(() => {
    try {
      const todayKey = new Date().toDateString();
      const lastVisit = localStorage.getItem('mindspark_last_visit');
      let nextStreak = parseInt(localStorage.getItem('mindspark_streak') || '0', 10) || 0;
      if (lastVisit === todayKey) {
        setStreak(nextStreak || 1);
        return;
      }
      if (lastVisit) {
        const diffDays = Math.round((new Date(todayKey) - new Date(lastVisit)) / 86400000);
        nextStreak = diffDays === 1 ? nextStreak + 1 : 1;
      } else {
        nextStreak = 1;
      }
      localStorage.setItem('mindspark_last_visit', todayKey);
      localStorage.setItem('mindspark_streak', String(nextStreak));
      setStreak(nextStreak);
    } catch (e) {
      setStreak(1);
    }
  }, []);

  React.useEffect(() => {
    const parsed = getStoredUser();
    if (!parsed) return;
    // Prefer full name if stored, else derive from email local-part
    if (parsed.fullName) {
      setDisplayName(parsed.fullName);
    } else if (parsed.email) {
      const namePart = parsed.email.split('@')[0];
      // Capitalize first letter
      setDisplayName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
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
    if (category.to) {
      navigate(category.to);
      return;
    }
    navigate('/lesson', { state: { prompt: category.prompt, category_id: category.id } });
  };

  const handleRecommendedClick = (lessonId) => {
    navigate('/lesson', { state: { viewLessonId: lessonId } });
  };

  return (
    <PageShell maxWidth="max-w-6xl">
        <AppHeader>
          <span className="hidden sm:flex items-center gap-1.5 text-base sm:text-lg font-bold italic font-serif text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500">
            {getGreeting()}, {displayName}!
            <span className="not-italic animate-float inline-block text-lg">👋</span>
          </span>
        </AppHeader>

        <div className="mt-6 relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 px-6 py-5 flex items-center justify-between text-white shadow-lg">
          <div className="absolute -right-6 -top-8 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute right-16 bottom-[-2.5rem] w-16 h-16 rounded-full bg-white/10" />
          <div className="relative z-10 min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">Your Journey</p>
            <p className="mt-1 text-xl sm:text-2xl font-extrabold">
              {totalLessons} {totalLessons === 1 ? 'lesson' : 'lessons'} explored!
            </p>
            <p className="mt-1 text-sm text-white/90 font-semibold">
              🔥 {streak}-day streak — keep it up, {displayName}!
            </p>
          </div>
          <div className="relative z-10 text-5xl sm:text-6xl shrink-0 animate-float">🏆</div>
        </div>

        <div className="mt-6 grid grid-cols-3 sm:grid-cols-5 gap-3">
          {CATEGORIES.map((category, index) => (
            <Category
              key={category.id}
              index={index}
              color={category.color}
              label={category.label}
              icon={category.icon}
              onClick={() => handleCategoryClick(category)}
            />
          ))}
        </div>

        <h2 className="mt-10 text-2xl sm:text-3xl font-extrabold text-purple-700">Recommended for You!</h2>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {recommendedLoading ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : recommended.length === 0 ? (
            <div className="sm:col-span-2 rounded-3xl bg-purple-50 p-6 text-center text-purple-700 font-semibold">
              No lessons yet — search a topic below or pick a category above to get started!
            </div>
          ) : (
            recommended.map((item, idx) => (
              <Card
                key={item.lesson_id}
                title={item.title}
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
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-transparent outline-none px-3 text-gray-700 font-medium"
            />
            <button
              onClick={handleSend}
              aria-label="Search"
              className="ml-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold px-4 py-2"
            >
              ➤
            </button>
          </div>
        </div>

        <BottomNav />
    </PageShell>
  );
}

export default HomePage;