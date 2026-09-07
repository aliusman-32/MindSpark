import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';

const GAMES = [
  {
    to: '/games/tic-tac-toe',
    label: 'Tic Tac Toe',
    icon: '❌⭕',
    color: 'linear-gradient(135deg,#9b5de5,#7a3bd6)',
    blurb: 'Outsmart the computer!',
  },
  {
    to: '/games/memory-match',
    label: 'Memory Match',
    icon: '🧠',
    color: 'linear-gradient(135deg,#4cc9f0,#4895ef)',
    blurb: 'Find all the pairs!',
  },
  {
    to: '/games/hangman',
    label: 'Hangman',
    icon: '🔤',
    color: 'linear-gradient(135deg,#f4a261,#e76f51)',
    blurb: 'Guess the word!',
  },
  {
    to: '/games/rock-paper-scissors',
    label: 'Rock Paper Scissors',
    icon: '✂️',
    color: 'linear-gradient(135deg,#ff9a8b,#ff6a88)',
    blurb: 'Best of luck, best of hands!',
  },
  {
    to: '/games/simon-says',
    label: 'Simon Says',
    icon: '🎨',
    color: 'linear-gradient(135deg,#80ed99,#38b000)',
    blurb: 'Remember the pattern!',
  },
];

function GamesHubPage() {
  const navigate = useNavigate();

  return (
    <PageShell maxWidth="max-w-4xl">
      <AppHeader />
      <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">Games Zone! 🎮</h1>
      <p className="mt-2 text-center text-gray-600 font-medium">Pick a game and have some fun!</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {GAMES.map((game) => (
          <button
            key={game.to}
            onClick={() => navigate(game.to)}
            className="rounded-3xl p-8 shadow-md text-center hover:brightness-105 active:scale-95 transition text-white"
            style={{ background: game.color }}
          >
            <div className="text-5xl mb-3">{game.icon}</div>
            <div className="text-xl font-extrabold">{game.label}</div>
            <div className="mt-1 text-sm font-medium text-white/90">{game.blurb}</div>
          </button>
        ))}
      </div>

      <BottomNav />
    </PageShell>
  );
}

export default GamesHubPage;
