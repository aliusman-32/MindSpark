import React, { useMemo } from 'react';

const COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function Confetti({ count = 50 }) {
  const pieces = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: `${randomBetween(0, 100)}%`,
      color: COLORS[i % COLORS.length],
      delay: randomBetween(0, 0.4),
      duration: randomBetween(1.8, 3),
      rotate: randomBetween(0, 720),
      drift: randomBetween(-60, 60),
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--rotate': `${p.rotate}deg`,
            '--drift': `${p.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export default Confetti;
