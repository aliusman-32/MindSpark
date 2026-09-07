import React, { useState } from 'react';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Confetti from './Confetti';
import { useTypewriter } from './useTypewriter';
import { getRandomEntry } from './funFacts';

const ICONS = ['🎉', '🤩', '🌟', '🎈', '🧠', '💡'];

function TypedText({ text }) {
  const typed = useTypewriter([text], { loop: false, typingSpeed: 28 });
  return (
    <>
      {typed}
      <span className="inline-block w-0.5 h-6 sm:h-8 bg-purple-500 ml-1 align-middle animate-pulse" />
    </>
  );
}

function FunFactPage() {
  const [entry, setEntry] = useState(() => getRandomEntry());
  const [refreshKey, setRefreshKey] = useState(0);
  const [icon, setIcon] = useState(ICONS[0]);
  const [burst, setBurst] = useState(0);

  const handleNewFact = () => {
    setEntry((prev) => getRandomEntry(prev.text));
    setRefreshKey((k) => k + 1);
    setIcon(ICONS[Math.floor(Math.random() * ICONS.length)]);
    setBurst((b) => b + 1);
  };

  const displayText = entry.type === 'quote' ? `"${entry.text}"` : entry.text;

  return (
    <PageShell maxWidth="max-w-3xl">
      <AppHeader />
      <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">Fun Facts &amp; Quotes! 🎉</h1>
      <p className="mt-2 text-center text-gray-600 font-medium">Tap the button for a brand new one every time.</p>

      <div className="relative overflow-hidden mt-8 auth-card-glow px-6 sm:px-10 py-10 sm:py-14 text-center">
        {burst > 0 && <Confetti key={burst} count={30} />}

        <div className="text-6xl sm:text-7xl animate-float">{icon}</div>

        <div className="mt-6 min-h-[110px] flex items-center justify-center">
          <p
            key={refreshKey}
            className={`text-xl sm:text-2xl font-bold leading-relaxed ${
              entry.type === 'quote' ? 'italic text-purple-700' : 'text-pink-600'
            }`}
          >
            <TypedText text={displayText} />
          </p>
        </div>

        {entry.type === 'quote' && (
          <p className="mt-4 text-gray-500 font-semibold">— {entry.author}</p>
        )}

        <button
          onClick={handleNewFact}
          className="mt-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 active:scale-95 text-white font-extrabold px-8 py-4 shadow-lg shadow-purple-200 transition-all hover:scale-[1.03]"
        >
          🎲 New Fact!
        </button>
      </div>

      <BottomNav />
    </PageShell>
  );
}

export default FunFactPage;
