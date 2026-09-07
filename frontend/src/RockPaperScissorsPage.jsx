import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Confetti from './Confetti';

const CHOICES = [
  { key: 'rock', emoji: '🪨', label: 'Rock' },
  { key: 'paper', emoji: '📝', label: 'Paper' },
  { key: 'scissors', emoji: '✂️', label: 'Scissors' },
];

const BEATS = { rock: 'scissors', paper: 'rock', scissors: 'paper' };

function decideWinner(player, computer) {
  if (player === computer) return 'draw';
  return BEATS[player] === computer ? 'win' : 'lose';
}

function RockPaperScissorsPage() {
  const navigate = useNavigate();
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });

  const handlePick = (key) => {
    if (thinking) return;
    setPlayerChoice(key);
    setComputerChoice(null);
    setOutcome(null);
    setThinking(true);
    setTimeout(() => {
      const computerKey = CHOICES[Math.floor(Math.random() * CHOICES.length)].key;
      const result = decideWinner(key, computerKey);
      setComputerChoice(computerKey);
      setOutcome(result);
      setThinking(false);
      setScore((prev) => {
        if (result === 'win') return { ...prev, wins: prev.wins + 1 };
        if (result === 'lose') return { ...prev, losses: prev.losses + 1 };
        return { ...prev, draws: prev.draws + 1 };
      });
    }, 700);
  };

  const handleReset = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setOutcome(null);
    setThinking(false);
  };

  const resultText = thinking
    ? 'Rock, paper, scissors... 🤔'
    : outcome === 'win'
      ? 'You win! 🎉'
      : outcome === 'lose'
        ? 'Computer wins! 🤖'
        : outcome === 'draw'
          ? "It's a draw! 🤝"
          : 'Pick rock, paper, or scissors!';

  const find = (key) => CHOICES.find((c) => c.key === key);

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
        <h1 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-purple-600">Rock Paper Scissors</h1>
        <div className="w-11 shrink-0" />
      </div>

      <div className="mt-4 flex justify-center gap-6 text-sm font-bold text-gray-600">
        <span>Wins: {score.wins}</span>
        <span>Losses: {score.losses}</span>
        <span>Draws: {score.draws}</span>
      </div>

      <div className="relative overflow-hidden mt-6 auth-card-glow px-6 py-10 text-center">
        {outcome === 'win' && <Confetti count={40} />}
        <div className="flex items-center justify-center gap-8 sm:gap-16">
          <div className="text-6xl sm:text-7xl">{playerChoice ? find(playerChoice).emoji : '❓'}</div>
          <div className="text-2xl font-extrabold text-purple-400">VS</div>
          <div className="text-6xl sm:text-7xl">{thinking ? '🤖' : computerChoice ? find(computerChoice).emoji : '❓'}</div>
        </div>
        <p className="mt-6 text-lg sm:text-xl font-extrabold text-purple-700">{resultText}</p>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        {CHOICES.map((c) => (
          <button
            key={c.key}
            onClick={() => handlePick(c.key)}
            disabled={thinking}
            className="rounded-3xl bg-purple-100 hover:bg-purple-200 active:scale-95 disabled:opacity-50 transition-all shadow-md px-6 py-5 sm:px-8 sm:py-6 text-4xl sm:text-5xl"
          >
            <span style={{ fontSize: '3rem' }}>{c.emoji}</span>
          </button>
        ))}
      </div>

      {outcome && !thinking && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleReset}
            className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 active:scale-95 text-white font-extrabold px-8 py-3.5 shadow-lg transition-all"
          >
            Play Again
          </button>
        </div>
      )}

      <BottomNav />
    </PageShell>
  );
}

export default RockPaperScissorsPage;
