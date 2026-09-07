import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Skeleton from './Skeleton';
import { useModal } from './Modal';

function HistoryPage() {
  const navigate = useNavigate();
  const modal = useModal();
  const childId = 1; // TODO: replace with actual childId from authentication
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('Newest');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(`http://localhost:8000/history/${childId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to fetch history');
        setHistory(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [childId]);

  const sorted = useMemo(() => {
    const filtered = filter === 'all' ? history : history.filter((item) => item.item_type === filter);
    const copy = [...filtered];
    if (sort === 'Newest') return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else return copy.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [history, sort, filter]);

  const filterButtonClass = (value) =>
    `rounded-full px-4 py-2 font-semibold transition-colors ${
      filter === value ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    }`;

  const getColor = (type) => (type === 'lesson' ? '#CFF3FB' : '#EAD9FE');
  const getBadge = (type) => (type === 'lesson' ? '📘' : '📝');

  const handlePlay = async (item) => {
    if (!item.lesson_id) {
      await modal.alert('This item has no lesson content to play.');
      return;
    }
    navigate('/lesson', { state: { viewLessonId: item.lesson_id } });
  };

  return (
    <PageShell maxWidth="max-w-5xl" rounded="rounded-3xl">
        <AppHeader />
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">My Learning History</h1>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-3">
            <button className={filterButtonClass('all')} onClick={() => setFilter('all')}>All</button>
            <button className={filterButtonClass('lesson')} onClick={() => setFilter('lesson')}>Lessons</button>
            <button className={filterButtonClass('assessment')} onClick={() => setFilter('assessment')}>Assessments</button>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full bg-gray-100 px-4 py-2 font-semibold"
          >
            <option>Newest</option>
            <option>Oldest</option>
          </select>
        </div>

        <div className="mt-6 space-y-5">
          {loading && (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          )}
          {error && <div className="text-center text-red-600">{error}</div>}
          {!loading && !error && sorted.length === 0 && (
            <div className="text-center text-gray-600">
              {history.length === 0 ? 'No history yet. Start a lesson!' : 'No items match this filter.'}
            </div>
          )}
          {sorted.map((item, idx) => (
            <div
              key={idx}
              className="rounded-3xl p-5 shadow-sm flex items-center justify-between"
              style={{ background: getColor(item.item_type) }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center text-2xl">
                  {getBadge(item.item_type)}
                </div>
                <div>
                  <div className="text-xl font-extrabold text-purple-700">{item.title}</div>
                  <div className="text-sm text-gray-700 font-semibold">{item.subtitle}</div>
                  <div className="text-xs text-gray-500">
                    Completed: {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handlePlay(item)}
                disabled={!item.lesson_id}
                aria-label={`Play ${item.title}`}
                className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-lg font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition"
              >
                ▶
              </button>
            </div>
          ))}
        </div>

        <BottomNav />
    </PageShell>
  );
}

export default HistoryPage;