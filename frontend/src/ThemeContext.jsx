import React, { createContext, useContext, useState } from 'react';
import { THEMES, DEFAULT_THEME_KEY } from './themes';

const STORAGE_KEY = 'mindspark_theme';
const ThemeContext = createContext(null);

function readStoredThemeKey() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && THEMES[stored] ? stored : DEFAULT_THEME_KEY;
  } catch (e) {
    return DEFAULT_THEME_KEY;
  }
}

export function ThemeProvider({ children }) {
  const [themeKey, setThemeKeyState] = useState(readStoredThemeKey);

  const setThemeKey = (key) => {
    if (!THEMES[key]) return;
    setThemeKeyState(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch (e) {}
  };

  const theme = THEMES[themeKey];

  return (
    <ThemeContext.Provider value={{ themeKey, theme, setThemeKey, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
