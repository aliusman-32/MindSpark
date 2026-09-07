import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/home', label: 'Home', icon: '🏠', activeBg: 'bg-purple-600', inactiveBg: 'bg-purple-100', inactiveText: 'text-purple-700' },
  { to: '/history', label: 'History', icon: '📚', activeBg: 'bg-sky-500', inactiveBg: 'bg-sky-100', inactiveText: 'text-sky-700' },
  { to: '/assessment', label: 'Assessment', icon: '📝', activeBg: 'bg-orange-500', inactiveBg: 'bg-orange-100', inactiveText: 'text-orange-700' },
  { to: '/settings', label: 'Settings', icon: '⚙️', activeBg: 'bg-emerald-500', inactiveBg: 'bg-emerald-100', inactiveText: 'text-emerald-700' },
];

function BottomNav() {
  const location = useLocation();
  return (
    <nav className="mt-10 grid grid-cols-4 gap-4 text-center">
      {NAV_ITEMS.map((item) => {
        const isActive = location.pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center gap-1 rounded-2xl py-3 font-semibold shadow-sm hover:brightness-105 active:scale-95 transition ${
              isActive ? `${item.activeBg} text-white shadow-md` : `${item.inactiveBg} ${item.inactiveText}`
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
