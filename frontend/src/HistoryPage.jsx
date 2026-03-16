import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const sampleHistory = [
  { id: 1, title: 'The Water Cycle', type: 'Science Lesson', when: 'Today at 2:30 PM', color: '#EAD9FE', badge: '🔔' },
  { id: 2, title: 'The Thirsty Crow', type: 'Story', when: 'Yesterday at 4:15 PM', color: '#FAD0D9', badge: '🟥' },
  { id: 3, title: 'The Solar System', type: 'Science Lesson', when: '2 days ago at 11:00 AM', color: '#CFF3FB', badge: '🟠' },
];

function FilterPill({ active, children }) {
  return (
    <button className={`${active ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'} rounded-full px-4 py-2 font-semibold`}>{children}</button>
  );
}

function Item({ title, type, when, color, badge }) {
  return (
    <div className="rounded-3xl p-5 shadow-sm flex items-center justify-between" style={{ background: color }}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-white/70 flex items-center justify-center text-2xl">{badge}</div>
        <div>
          <div className="text-xl font-extrabold text-purple-700">{title}</div>
          <div className="text-sm text-gray-700 font-semibold">{type}</div>
          <div className="text-xs text-gray-500">Completed: {when}</div>
        </div>
      </div>
      <button className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-lg font-bold shadow-md">▶</button>
    </div>
  );
}

function HistoryPage() {
  const [sort, setSort] = useState('Newest');
  const items = useMemo(() => sampleHistory, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-200 to-purple-300 p-6 lg:p-10">
      <div className="mx-auto max-w-5xl bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 shadow-xl">
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">My Learning History</h1>

        <div className="mt-6 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-3">
            <FilterPill active>All</FilterPill>
            <FilterPill>Stories</FilterPill>
            <FilterPill>Science</FilterPill>
            <FilterPill>History</FilterPill>
          </div>
          <div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-full bg-gray-100 px-4 py-2 font-semibold">
              <option>Newest</option>
              <option>Oldest</option>
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {items.map((it) => (
            <Item key={it.id} title={it.title} type={it.type} when={it.when} color={it.color} badge={it.badge} />
          ))}
        </div>

        <nav className="mt-10 grid grid-cols-4 gap-4 text-center text-gray-600">
          <Link to="/home" className="rounded-2xl bg-gray-100 py-3 font-semibold">Home</Link>
          <Link to="/history" className="rounded-2xl bg-purple-100 py-3 font-semibold text-purple-700">History</Link>
          <Link to="/assessment" className="rounded-2xl bg-gray-100 py-3 font-semibold">Assessment</Link>
          <Link to="/settings" className="rounded-2xl bg-gray-100 py-3 font-semibold">Settings</Link>
        </nav>
      </div>
    </div>
  );
}

export default HistoryPage;


