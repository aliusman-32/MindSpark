import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Confetti from './Confetti';

const PADS = [
  { key: 0, color: 'bg-red-400', active: 'bg-red-300 ring-4 ring-red-200 scale-95' },
  { key: 1, color: 'bg-blue-400', active: 'bg-blue-300 ring-4 ring-blue-200 scale-95' },
  { key: 2, color: 'bg-yellow-400', active: 'bg-yellow-300 ring-4 ring-yellow-200 scale-95' },
  { key: 3, color: 'bg-green-400', active: 'bg-green-300 ring-4 ring-green-200 scale-95' },
];

function SimonSaysPage() {
  const navigate = useNavigate();
  const [sequence, setSequence] = useState([]);
  const [status, setStatus] = useState('idle'); // idle | playing | input | gameover
  const [userStep, setUserStep] = useState(0);
  const [activePad, setActivePad] = useState(null);
  const [best, setBest] = useState(0);
  const timeoutsRef = useRef([]);

  const clearTimers = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  useEffect(() => clearTimers, []);

  useEffect(() => {
    if (status !== 'playing') return;
    clearTimers();
    sequence.forEach((padIndex, i) => {
      const onTime = i * 700 + 300;
      const offTime = onTime + 400;
      timeoutsRef.current.push(setTimeout(() => setActivePad(padIndex), onTime));
      timeoutsRef.current.push(setTimeout(() => setActivePad(null), offTime));
    });
    const endTime = sequence.length * 700 + 300;
    timeoutsRef.current.push(
      setTimeout(() => {
        setStatus('input');
        setUserStep(0);
      }, endTime)
    );
    return clearTimers;
  }, [sequence, status]);

  const handleStart = () => {
    clearTimers();
    setActivePad(null);
    const first = Math.floor(Math.random() * PADS.length);
    setSequence([first]);
    setStatus('playing');
  };

  const handlePadClick = (index) => {
    if (status !== 'input') return;
    setActivePad(index);
    timeoutsRef.current.push(setTimeout(() => setActivePad(null), 200));

    if (sequence[userStep] !== index) {
      setBest((prev) => Math.max(prev, sequence.length - 1));
      setStatus('gameover');
      return;
    }

    const nextStep = userStep + 1;
    if (nextStep === sequence.length) {
      timeoutsRef.current.push(
        setTimeout(() => {
          setSequence((prev) => [...prev, Math.floor(Math.random() * PADS.length)]);
          setStatus('playing');
        }, 600)
      );
    } else {
      setUserStep(nextStep);
    }
  };

  const round = sequence.length;

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
        <h1 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-purple-600">Simon Says</h1>
        <div className="w-11 shrink-0" />
      </div>

      <div className="mt-4 flex justify-center gap-6 text-sm font-bold text-gray-600">
        <span>Round: {status === 'idle' ? 0 : round}</span>
        <span>Best: {best}</span>
      </div>

      <p className="mt-4 text-center text-lg font-extrabold text-purple-700">
        {status === 'idle' && 'Watch the pattern, then repeat it!'}
        {status === 'playing' && 'Watch closely... 👀'}
        {status === 'input' && 'Your turn! Repeat the pattern 🎯'}
        {status === 'gameover' && `Game over! You reached round ${round}. 😅`}
      </p>

      <div className="relative overflow-hidden mt-6 mx-auto max-w-xs">
        {status === 'gameover' && best > 2 && <Confetti count={30} />}
        <div className="grid grid-cols-2 gap-4">
          {PADS.map((pad) => (
            <button
              key={pad.key}
              onClick={() => handlePadClick(pad.key)}
              disabled={status !== 'input'}
              className={`aspect-square rounded-3xl shadow-md transition-all duration-150 ${
                activePad === pad.key ? pad.active : pad.color
              } ${status === 'input' ? 'hover:brightness-110 active:scale-95' : 'opacity-90'}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={handleStart}
          className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 active:scale-95 text-white font-extrabold px-8 py-3.5 shadow-lg transition-all"
        >
          {status === 'idle' ? 'Start Game' : status === 'gameover' ? 'Play Again' : 'Restart'}
        </button>
      </div>

      <BottomNav />
    </PageShell>
  );
}

export default SimonSaysPage;
