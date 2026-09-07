import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Confetti from './Confetti';

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
];

function calculateWinner(cells) {
  for (const [a, b, c] of LINES) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return { winner: cells[a], line: [a, b, c] };
    }
  }
  if (cells.every((c) => c)) return { winner: 'draw', line: [] };
  return null;
}

function pickAiMove(cells, difficulty) {
  const empty = cells.map((c, i) => (c ? null : i)).filter((i) => i !== null);
  const randomPick = () => empty[Math.floor(Math.random() * empty.length)];

  if (difficulty === 'easy') {
    return randomPick();
  }

  // Take a winning move
  for (const i of empty) {
    const next = [...cells];
    next[i] = 'O';
    if (calculateWinner(next)?.winner === 'O') return i;
  }
  // Block the player's winning move
  for (const i of empty) {
    const next = [...cells];
    next[i] = 'X';
    if (calculateWinner(next)?.winner === 'X') return i;
  }

  if (difficulty === 'medium') {
    return randomPick();
  }

  // Hard: take the center
  if (cells[4] === null) return 4;
  // Take a corner
  const corners = [0, 2, 6, 8].filter((i) => cells[i] === null);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  // Take any remaining edge
  return randomPick();
}

const DIFFICULTIES = [
  { key: 'easy', label: 'Easy' },
  { key: 'medium', label: 'Medium' },
  { key: 'hard', label: 'Hard' },
];

function TicTacToePage() {
  const navigate = useNavigate();
  const [cells, setCells] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState('X');
  const [score, setScore] = useState({ wins: 0, losses: 0, draws: 0 });
  const [difficulty, setDifficulty] = useState('medium');

  const result = calculateWinner(cells);

  const handleDifficultyChange = (key) => {
    setDifficulty(key);
    setCells(Array(9).fill(null));
    setTurn('X');
  };

  useEffect(() => {
    if (result || turn !== 'O') return;
    const timeout = setTimeout(() => {
      const move = pickAiMove(cells, difficulty);
      if (move === undefined) return;
      setCells((prev) => {
        const next = [...prev];
        next[move] = 'O';
        return next;
      });
      setTurn('X');
    }, 500);
    return () => clearTimeout(timeout);
  }, [turn, cells, result, difficulty]);

  useEffect(() => {
    if (!result) return;
    setScore((prev) => {
      if (result.winner === 'X') return { ...prev, wins: prev.wins + 1 };
      if (result.winner === 'O') return { ...prev, losses: prev.losses + 1 };
      return { ...prev, draws: prev.draws + 1 };
    });
  }, [result?.winner]); // eslint-disable-line

  const handleClick = (i) => {
    if (cells[i] || result || turn !== 'X') return;
    const next = [...cells];
    next[i] = 'X';
    setCells(next);
    setTurn('O');
  };

  const handleReset = () => {
    setCells(Array(9).fill(null));
    setTurn('X');
  };

  const statusText = !result
    ? turn === 'X' ? 'Your turn (❌)' : 'Computer is thinking... 🤔'
    : result.winner === 'X' ? 'You win! 🎉'
    : result.winner === 'O' ? 'Computer wins! 🤖'
    : "It's a draw! 🤝";

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
        <h1 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-purple-600">Tic Tac Toe</h1>
        <div className="w-11 shrink-0" />
      </div>

      <div className="mt-4 flex justify-center gap-6 text-sm font-bold text-gray-600">
        <span>Wins: {score.wins}</span>
        <span>Losses: {score.losses}</span>
        <span>Draws: {score.draws}</span>
      </div>

      <div className="mt-4 flex justify-center gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            onClick={() => handleDifficultyChange(d.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-bold shadow-sm transition-all active:scale-95 ${
              difficulty === d.key
                ? 'bg-purple-600 text-white'
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-lg font-extrabold text-purple-700">{statusText}</p>

      <div className="relative mt-6 mx-auto w-full max-w-xs">
        {result?.winner === 'X' && <Confetti count={40} />}
        <div className="grid grid-cols-3 gap-3">
          {cells.map((cell, i) => (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={!!cell || !!result || turn !== 'X'}
              className={`aspect-square rounded-2xl text-4xl sm:text-5xl font-extrabold shadow-md transition-all active:scale-95 flex items-center justify-center ${
                result?.line.includes(i)
                  ? 'bg-purple-500 text-white'
                  : 'bg-purple-100 hover:bg-purple-200 disabled:hover:bg-purple-100'
              }`}
            >
              {cell === 'X' ? '❌' : cell === 'O' ? '⭕' : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleReset}
          className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 active:scale-95 text-white font-extrabold px-8 py-3.5 shadow-lg transition-all"
        >
          Play Again
        </button>
      </div>

      <BottomNav />
    </PageShell>
  );
}

export default TicTacToePage;
