import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const sampleQuestions = [
  {
    id: 1,
    text: 'What happens in the water cycle after evaporation?',
    options: [
      { id: 'a', label: 'Condensation forms clouds', color: 'bg-green-400' },
      { id: 'b', label: 'It rains', color: 'bg-red-400' },
      { id: 'c', label: 'The sun melts it', color: 'bg-yellow-300' },
      { id: 'd', label: 'It freezes', color: 'bg-lime-300' },
    ],
    correct: 'a',
  },
  {
    id: 2,
    text: 'Which process turns liquid water into vapor?',
    options: [
      { id: 'a', label: 'Precipitation', color: 'bg-green-400' },
      { id: 'b', label: 'Condensation', color: 'bg-red-400' },
      { id: 'c', label: 'Evaporation', color: 'bg-yellow-300' },
      { id: 'd', label: 'Collection', color: 'bg-lime-300' },
    ],
    correct: 'c',
  },
];

function AssessmentPage() {
  const questions = useMemo(() => sampleQuestions, []);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  const current = questions[index];
  const total = questions.length;

  function next() {
    if (selected) {
      if (selected === current.correct) {
        setScore((s) => s + 1);
      }
    }
    if (index + 1 < total) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      setCompleted(true);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-purple-200 to-purple-300 p-6 lg:p-10">
      <div className="mx-auto max-w-4xl bg-white rounded-[28px] p-6 sm:p-8 lg:p-10 shadow-xl">
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">Quiz Time! ✏️</h1>

        {!completed ? (
          <>
            <p className="text-center mt-4 text-gray-600 font-semibold">Question {index + 1} of {total}</p>

            <div className="mt-6">
              <div className="rounded-2xl bg-purple-100 px-6 py-5 text-center text-lg font-extrabold text-purple-700">
                {current.text}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {current.options.map((opt) => {
                const isSelected = selected === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setSelected(opt.id)}
                    className={`rounded-full px-6 py-4 font-extrabold text-white shadow-md transition-transform active:scale-[0.99] ${opt.color} ${isSelected ? 'ring-4 ring-purple-400' : ''}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <button
                onClick={next}
                disabled={!selected}
                className="w-full rounded-full bg-purple-500 hover:bg-purple-600 disabled:opacity-60 text-white font-extrabold py-4 shadow-lg"
              >
                Next Question
              </button>
            </div>
          </>
        ) : (
          <div className="mt-16 sm:mt-20 text-center">
            <div className="text-5xl mb-6">🎉</div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-purple-700">You did great!</h2>
            <p className="mt-3 text-lg text-gray-700 font-semibold">You scored {score} out of {total}!</p>
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => { setIndex(0); setSelected(null); setCompleted(false); setScore(0); }}
                className="rounded-full bg-purple-500 hover:bg-purple-600 text-white font-bold px-8 py-4 shadow-lg"
              >
                Play Again
              </button>
              <Link to="/home" className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-8 py-4 shadow">Home</Link>
            </div>
          </div>
        )}

        <nav className="mt-10 grid grid-cols-4 gap-4 text-center text-gray-600">
          <Link to="/home" className="rounded-2xl bg-gray-100 py-3 font-semibold">Home</Link>
          <Link to="/history" className="rounded-2xl bg-gray-100 py-3 font-semibold">History</Link>
          <Link to="/assessment" className="rounded-2xl bg-purple-100 py-3 font-semibold text-purple-700">Assessment</Link>
          <Link to="/settings" className="rounded-2xl bg-gray-100 py-3 font-semibold">Settings</Link>
        </nav>
      </div>
    </div>
  );
}

export default AssessmentPage;


