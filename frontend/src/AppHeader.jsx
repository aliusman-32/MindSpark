import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearSession } from './authStorage';
import { getProfilePhoto, onProfilePhotoChange } from './profilePhoto';
import logoIcon from './assets/new_logo.jpg';

function AppHeader({ children }) {
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(() => getProfilePhoto());

  useEffect(() => onProfilePhotoChange(setPhoto), []);

  const handleLogout = () => {
    clearSession();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex items-center justify-between mb-6">
      <Link to="/home" className="flex items-center gap-2">
        <img src={logoIcon} alt="MindSpark" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
        <span className="text-lg sm:text-xl font-extrabold text-purple-700">MindSpark</span>
      </Link>
      <div className="flex items-center gap-3">
        {children}
        <button
          onClick={handleLogout}
          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-extrabold text-rose-700 shadow-sm hover:bg-rose-100 hover:border-rose-300 transition-colors"
        >
          Logout
        </button>
        <Link
          to="/profile"
          aria-label="View profile"
          className="w-9 h-9 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center hover:bg-purple-200 transition-colors shrink-0 overflow-hidden"
        >
          {photo ? (
            <img src={photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-600">
              <path d="M12 12.75c2.9 0 5.25-2.35 5.25-5.25S14.9 2.25 12 2.25 6.75 4.6 6.75 7.5s2.35 5.25 5.25 5.25Zm0 2.25c-3.87 0-9.75 1.94-9.75 5.81V22.5h19.5v-1.69c0-3.87-5.88-5.81-9.75-5.81Z" />
            </svg>
          )}
        </Link>
      </div>
    </header>
  );
}

export default AppHeader;
