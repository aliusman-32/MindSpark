import React, { useMemo } from 'react';
import { useTheme } from './ThemeContext';

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function SparkleBackground({ count = 22 }) {
  const { theme } = useTheme();
  const sparkles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const size = randomBetween(5, 13);
      return {
        id: i,
        left: `${randomBetween(0, 100)}%`,
        size,
        duration: randomBetween(8, 18),
        delay: randomBetween(0, 18),
        drift: randomBetween(-50, 50),
      };
    });
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {theme.blobs.map((b, i) => (
        <div
          key={i}
          className="bg-blob"
          style={{
            top: b.top,
            left: b.left,
            width: b.size,
            height: b.size,
            background: b.color,
            animationDuration: `${b.duration}s`,
            animationDelay: `${-i * 3}s`,
          }}
        />
      ))}
      {sparkles.map((s) => (
        <span
          key={s.id}
          className="sparkle"
          style={{
            left: s.left,
            width: s.size,
            height: s.size,
            animationDuration: `${s.duration}s`,
            animationDelay: `${-s.delay}s`,
            '--drift': `${s.drift}px`,
          }}
        />
      ))}
    </div>
  );
}

export default SparkleBackground;
