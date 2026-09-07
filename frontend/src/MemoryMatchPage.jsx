import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Confetti from './Confetti';

const EMOJI_POOL = ['🍇', '🍐', '🍎', '🍓', '🥑', '🍦', '🍕', '🥪', '🍔', '🎂'];

function shuffledDeck() {
  const deck = [...EMOJI_POOL, ...EMOJI_POOL].map((emoji, i) => ({ id: i, emoji }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function MemoryMatchPage() {
  const navigate = useNavigate();
  const [deck, setDeck] = useState(shuffledDeck);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);

  const allMatched = matched.length === deck.length;

  const handleFlip = (index) => {
    if (busy || flipped.includes(index) || matched.includes(index)) return;
    const next = [...flipped, index];
    setFlipped(next);

    if (next.length === 2) {
      setBusy(true);
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (deck[a].emoji === deck[b].emoji) {
        setTimeout(() => {
          setMatched((prev) => [...prev, a, b]);
          setFlipped([]);
          setBusy(false);
        }, 400);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 800);
      }
    }
  };

  const handleReset = () => {
    setDeck(shuffledDeck());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setBusy(false);
  };

  return (
    <PageShell maxWidth="max-w-2xl">
      <AppHeader />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/games')}
          aria-label="Back to games"
          className="shrink-0 w-11 h-11 rounded-full bg-white shadow-md border border-purple-100 hover:bg-purple-50 active:scale-95 flex items-center justify-center text-2xl text-purple-600 transition"
        >
          ←
        </button>
        <h1 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-purple-600">Memory Match</h1>
        <div className="w-11 shrink-0" />
      </div>

      <div className="mt-4 flex justify-center gap-6 text-sm font-bold text-gray-600">
        <span>Moves: {moves}</span>
        <span>Pairs: {matched.length / 2} / {EMOJI_POOL.length}</span>
      </div>

      {allMatched ? (
        <div className="relative overflow-hidden mt-8 text-center py-10">
          <Confetti count={50} />
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-extrabold text-purple-700">You found them all!</h2>
          <p className="mt-2 text-gray-600 font-semibold">You did it in {moves} moves.</p>
          <button
            onClick={handleReset}
            className="mt-6 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 active:scale-95 text-white font-extrabold px-8 py-3.5 shadow-lg transition-all"
          >
            Play Again
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-4 gap-3 mx-auto max-w-md">
            {deck.map((card, i) => {
              const isVisible = flipped.includes(i) || matched.includes(i);
              return (
                <button
                  key={card.id}
                  onClick={() => handleFlip(i)}
                  className={`relative aspect-square rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center overflow-visible ${matched.includes(i)
                    ? 'bg-green-200'
                    : isVisible
                      ? 'bg-purple-200'
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 hover:brightness-105'
                    }`}
                >
                  <span
                    className={`pointer-events-none leading-none ${isVisible ? 'text-[3.25rem] sm:text-[4.25rem]' : 'text-2xl sm:text-3xl text-white/80'
                      }`}
                  >
                    {isVisible ? card.emoji : '❓'}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleReset}
              className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-6 py-2.5 shadow transition-colors"
            >
              Shuffle &amp; Restart
            </button>
          </div>
        </>
      )}

      <BottomNav />
    </PageShell>
  );
}

export default MemoryMatchPage;
