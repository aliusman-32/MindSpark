// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App


// src/App.jsx

import React from 'react';
// filepath: src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import SignUpPage from './SignUpPage';
import LoginPage from './LoginPage';
import HomePage from './HomePage';
import AssessmentPage from './AssessmentPage';
import HistoryPage from './HistoryPage';
import SettingsPage from './SettingsPage';
import LessonPage from './LessonPage';
import ProfilePage from './ProfilePage';
import FunFactPage from './FunFactPage';
import GamesHubPage from './GamesHubPage';
import TicTacToePage from './TicTacToePage';
import MemoryMatchPage from './MemoryMatchPage';
import HangmanPage from './HangmanPage';
import RockPaperScissorsPage from './RockPaperScissorsPage';
import SimonSaysPage from './SimonSaysPage';
import { getStoredUser } from './authStorage';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      {/* Protected routes */}
      <Route path="/home" element={<RequireAuth><HomePage /></RequireAuth>} />
      <Route path="/assessment" element={<RequireAuth><AssessmentPage /></RequireAuth>} />
      <Route path="/history" element={<RequireAuth><HistoryPage /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
      <Route path="/lesson" element={<RequireAuth><LessonPage /></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/fun-facts" element={<RequireAuth><FunFactPage /></RequireAuth>} />
      <Route path="/games" element={<RequireAuth><GamesHubPage /></RequireAuth>} />
      <Route path="/games/tic-tac-toe" element={<RequireAuth><TicTacToePage /></RequireAuth>} />
      <Route path="/games/memory-match" element={<RequireAuth><MemoryMatchPage /></RequireAuth>} />
      <Route path="/games/hangman" element={<RequireAuth><HangmanPage /></RequireAuth>} />
      <Route path="/games/rock-paper-scissors" element={<RequireAuth><RockPaperScissorsPage /></RequireAuth>} />
      <Route path="/games/simon-says" element={<RequireAuth><SimonSaysPage /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function RequireAuth({ children }) {
  const user = getStoredUser();
  if (!user || !user.user_id) return <Navigate to="/login" replace />;
  return children;
}

export default App;