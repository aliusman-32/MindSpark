import React from 'react';
import SparkleBackground from './SparkleBackground';
import { useTheme } from './ThemeContext';

function PageShell({ children, maxWidth = 'max-w-5xl', rounded = 'rounded-[28px]' }) {
  const { theme } = useTheme();
  return (
    <div className={`relative min-h-screen w-full bg-gradient-to-b ${theme.gradient} p-6 lg:p-10`}>
      <SparkleBackground />
      <div className={`relative z-10 mx-auto ${maxWidth} bg-white ${rounded} p-6 sm:p-8 lg:p-10 shadow-xl animate-page-fade`}>
        {children}
      </div>
    </div>
  );
}

export default PageShell;
