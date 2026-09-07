import React, { useEffect, useState } from 'react';
import SparkleBackground from './SparkleBackground';
import { useTheme } from './ThemeContext';
import { useTypewriter } from './useTypewriter';
import { FUN_FACTS } from './funFacts';
import logoFull from './assets/logo-full.jpg';

const TAGLINES = [
  'Turn any topic into a story.',
  'AI-powered lessons made just for you.',
  'Learning that sparks curiosity.',
  'Scripts, narration & quizzes — all in one spark.',
];

function AuthLayout({ children }) {
  const { theme } = useTheme();
  const [factIndex, setFactIndex] = useState(0);
  const typedText = useTypewriter(TAGLINES);

  useEffect(() => {
    const interval = setInterval(() => {
      setFactIndex((i) => (i + 1) % FUN_FACTS.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative min-h-screen w-full flex ${theme.authBg}`}>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-10">
        <SparkleBackground />
        <div className="relative z-10 text-center max-w-sm">
          <img
            src={logoFull}
            alt="MindSpark — AI Powered Multimedia Interactive Platform"
            className="w-56 sm:w-64 mx-auto rounded-3xl shadow-xl animate-float"
          />
          <p className="mt-5 min-h-[44px] text-2xl sm:text-3xl font-mono italic font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-500 bg-clip-text text-transparent">
            {typedText}
            <span className="inline-block w-0.5 h-7 bg-pink-500 ml-0.5 align-middle animate-pulse" />
          </p>
          <div className="mt-6 bg-white/70 backdrop-blur rounded-2xl px-5 py-4 shadow-md min-h-[92px] flex flex-col justify-center">
            <div className="text-xs font-extrabold text-purple-500 uppercase tracking-wide mb-1">Did you know?</div>
            <div key={factIndex} className="text-gray-700 font-semibold animate-fact-fade">
              {FUN_FACTS[factIndex]}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative overflow-hidden">
        <div className="lg:hidden absolute inset-0">
          <SparkleBackground />
        </div>
        <div className="relative z-10 w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

export default AuthLayout;
