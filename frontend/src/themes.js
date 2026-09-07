// Background color themes. Only the outer gradient + floating blobs change —
// every card, text color, and button keeps the app's existing look.
//
// NOTE: Tailwind scans this file's literal strings to know which gradient
// utility classes to generate, so these must stay written out in full
// (not built from template pieces) — e.g. "from-purple-200 to-purple-300",
// not `from-${color}-200`.

export const THEMES = {
  purple: {
    label: 'Purple',
    swatch: '#a78bfa',
    gradient: 'from-purple-200 to-purple-300',
    authBg: 'bg-violet-100',
    blobs: [
      { color: '#c084fc', top: '-10%', left: '-8%', size: 380, duration: 16 },
      { color: '#f472b6', top: '55%', left: '65%', size: 340, duration: 20 },
      { color: '#60a5fa', top: '10%', left: '70%', size: 300, duration: 18 },
      { color: '#fbbf24', top: '70%', left: '5%', size: 260, duration: 22 },
    ],
  },

  ocean: {
    label: 'Ocean',
    swatch: '#38bdf8',
    gradient: 'from-sky-200 to-blue-300',
    authBg: 'bg-sky-100',
    blobs: [
      { color: '#38bdf8', top: '-10%', left: '-8%', size: 380, duration: 16 },
      { color: '#22d3ee', top: '55%', left: '65%', size: 340, duration: 20 },
      { color: '#818cf8', top: '10%', left: '70%', size: 300, duration: 18 },
      { color: '#2dd4bf', top: '70%', left: '5%', size: 260, duration: 22 },
    ],
  },

  sunset: {
    label: 'Sunset',
    swatch: '#fb923c',
    gradient: 'from-orange-200 to-pink-300',
    authBg: 'bg-orange-100',
    blobs: [
      { color: '#fb923c', top: '-10%', left: '-8%', size: 380, duration: 16 },
      { color: '#f472b6', top: '55%', left: '65%', size: 340, duration: 20 },
      { color: '#facc15', top: '10%', left: '70%', size: 300, duration: 18 },
      { color: '#f87171', top: '70%', left: '5%', size: 260, duration: 22 },
    ],
  },

  forest: {
    label: 'Forest',
    swatch: '#4ade80',
    gradient: 'from-green-200 to-emerald-300',
    authBg: 'bg-green-100',
    blobs: [
      { color: '#4ade80', top: '-10%', left: '-8%', size: 380, duration: 16 },
      { color: '#2dd4bf', top: '55%', left: '65%', size: 340, duration: 20 },
      { color: '#a3e635', top: '10%', left: '70%', size: 300, duration: 18 },
      { color: '#facc15', top: '70%', left: '5%', size: 260, duration: 22 },
    ],
  },

  // NEW THEMES

  candy: {
    label: 'Candy',
    swatch: '#f472b6',
    gradient: 'from-pink-200 to-fuchsia-300',
    authBg: 'bg-pink-100',
    blobs: [
      { color: '#f472b6', top: '-10%', left: '-8%', size: 380, duration: 16 },
      { color: '#c084fc', top: '55%', left: '65%', size: 340, duration: 20 },
      { color: '#fb7185', top: '10%', left: '70%', size: 300, duration: 18 },
      { color: '#facc15', top: '70%', left: '5%', size: 260, duration: 22 },
    ],
  },

  // sky: {
  //   label: 'Sky',
  //   swatch: '#60a5fa',
  //   gradient: 'from-blue-200 to-cyan-300',
  //   authBg: 'bg-blue-100',
  //   blobs: [
  //     { color: '#60a5fa', top: '-10%', left: '-8%', size: 380, duration: 16 },
  //     { color: '#67e8f9', top: '55%', left: '65%', size: 340, duration: 20 },
  //     { color: '#93c5fd', top: '10%', left: '70%', size: 300, duration: 18 },
  //     { color: '#a7f3d0', top: '70%', left: '5%', size: 260, duration: 22 },
  //   ],
  // },

  // lavender: {
  //   label: 'Lavender',
  //   swatch: '#c4b5fd',
  //   gradient: 'from-violet-200 to-fuchsia-200',
  //   authBg: 'bg-violet-100',
  //   blobs: [
  //     { color: '#c4b5fd', top: '-10%', left: '-8%', size: 380, duration: 16 },
  //     { color: '#e879f9', top: '55%', left: '65%', size: 340, duration: 20 },
  //     { color: '#a5b4fc', top: '10%', left: '70%', size: 300, duration: 18 },
  //     { color: '#f9a8d4', top: '70%', left: '5%', size: 260, duration: 22 },
  //   ],
  // },

  sunshine: {
    label: 'Sunshine',
    swatch: '#facc15',
    gradient: 'from-yellow-200 to-orange-300',
    authBg: 'bg-yellow-100',
    blobs: [
      { color: '#facc15', top: '-10%', left: '-8%', size: 380, duration: 16 },
      { color: '#fb923c', top: '55%', left: '65%', size: 340, duration: 20 },
      { color: '#fde047', top: '10%', left: '70%', size: 300, duration: 18 },
      { color: '#fbbf24', top: '70%', left: '5%', size: 260, duration: 22 },
    ],
  },

  // mint: {
  //   label: 'Mint',
  //   swatch: '#34d399',
  //   gradient: 'from-emerald-200 to-teal-300',
  //   authBg: 'bg-emerald-100',
  //   blobs: [
  //     { color: '#34d399', top: '-10%', left: '-8%', size: 380, duration: 16 },
  //     { color: '#2dd4bf', top: '55%', left: '65%', size: 340, duration: 20 },
  //     { color: '#5eead4', top: '10%', left: '70%', size: 300, duration: 18 },
  //     { color: '#a3e635', top: '70%', left: '5%', size: 260, duration: 22 },
  //   ],
  // },

  // berry: {
  //   label: 'Berry',
  //   swatch: '#e11d48',
  //   gradient: 'from-rose-200 to-purple-300',
  //   authBg: 'bg-rose-100',
  //   blobs: [
  //     { color: '#fb7185', top: '-10%', left: '-8%', size: 380, duration: 16 },
  //     { color: '#e879f9', top: '55%', left: '65%', size: 340, duration: 20 },
  //     { color: '#c084fc', top: '10%', left: '70%', size: 300, duration: 18 },
  //     { color: '#f43f5e', top: '70%', left: '5%', size: 260, duration: 22 },
  //   ],
  // },
};
export const DEFAULT_THEME_KEY = 'purple';
