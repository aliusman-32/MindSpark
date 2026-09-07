import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Confetti from './Confetti';

function AssessmentPage() {
  const location = useLocation();
  const childId = location.state?.childId || 1;
  const lessonId = location.state?.lessonId || null;
  const topicTitle = location.state?.topicTitle || 'General Topic';

  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    // Load quiz from localStorage (stored by LessonPage after quiz generation)
    const stored = localStorage.getItem(`lesson_${lessonId}_quiz`);
    if (stored) {
      try {
        const quiz = JSON.parse(stored);
        if (quiz.questions && Array.isArray(quiz.questions)) {
          // Convert to internal format, with answer options shuffled so the
          // correct answer isn't always first / always a giveaway color.
          const converted = quiz.questions.map((q, idx) => {
            const options = [
              { id: 'correct', label: q.correct_answer },
              ...(q.wrong_options || []).slice(0, 3).map((w, i) => ({ id: `wrong${i}`, label: w })),
            ];
            for (let i = options.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [options[i], options[j]] = [options[j], options[i]];
            }
            return {
              id: idx,
              text: q.question,
              options,
              correct: 'correct',
            };
          });
          setQuestions(converted);
        }
      } catch (e) {
        console.error('Failed to parse quiz', e);
      }
    }
    setLoading(false);
  }, [lessonId]);

  async function saveAssessment(finalScore) {
    if (hasSaved) return;
    try {
      const response = await fetch('http://localhost:8000/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: childId,
          lesson_id: lessonId,
          topic_title: topicTitle,
          score: finalScore,
          total_questions: questions.length
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to save');
      setSaveStatus('Score saved to history');
      setHasSaved(true);
    } catch (err) {
      setSaveStatus(err.message);
    }
  }

  const current = questions[index];
  const total = questions.length;

  function next() {
    let newScore = score;
    if (selected) {
      if (selected === current.correct) {
        newScore++;
        setScore(newScore);
      }
    }
    if (index + 1 < total) {
      setIndex(index + 1);
      setSelected(null);
    } else {
      setCompleted(true);
      saveAssessment(newScore);
    }
  }

  if (loading || !questions.length) {
    return (
      <PageShell maxWidth="max-w-4xl" rounded="rounded-3xl">
          <AppHeader />
          <div className="py-16 text-center text-gray-600 font-semibold">
            {loading ? 'Loading quiz...' : 'No quiz available. Go back and generate one.'}
          </div>
          <BottomNav />
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="max-w-4xl" rounded="rounded-3xl">
        <AppHeader />
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">Quiz Time! ✏️</h1>

        {!completed ? (
          <>
            <p className="text-center mt-4 text-gray-600 font-semibold">Question {index + 1} of {total}</p>

            <div className="mt-6 rounded-2xl bg-purple-100 px-6 py-5 text-center text-lg font-extrabold text-purple-700">
              {current.text}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {current.options.map((opt) => {
                const isSelected = selected === opt.id;
                const isCorrect = opt.id === current.correct;
                let colorClass = 'bg-purple-500 hover:bg-purple-600';
                if (selected) {
                  if (isCorrect) colorClass = 'bg-green-500';
                  else if (isSelected) colorClass = 'bg-red-500';
                  else colorClass = 'bg-gray-300';
                }
                return (
                  <button
                    key={opt.id}
                    onClick={() => !selected && setSelected(opt.id)}
                    disabled={!!selected}
                    className={`rounded-full px-6 py-4 font-extrabold text-white shadow-md transition-colors active:scale-[0.99] disabled:cursor-not-allowed ${colorClass} ${isSelected ? 'ring-4 ring-purple-400' : ''}`}
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
          <div className="relative overflow-hidden mt-16 text-center">
            <Confetti />
            <div className="text-5xl mb-6">🎉</div>
            <h2 className="text-3xl font-extrabold text-purple-700">You did great!</h2>
            <p className="mt-3 text-lg font-semibold text-gray-700">You scored {score} out of {total}!</p>
            <p className="mt-2 text-purple-700 font-semibold">Topic: {topicTitle}</p>
            {saveStatus && <p className="mt-2 text-sm text-gray-600">{saveStatus}</p>}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => {
                  setIndex(0);
                  setSelected(null);
                  setCompleted(false);
                  setScore(0);
                  setHasSaved(false);
                  setSaveStatus('');
                }}
                className="rounded-full bg-purple-500 hover:bg-purple-600 text-white font-bold px-8 py-4 shadow-lg"
              >
                Play Again
              </button>
              <Link to="/home" className="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-8 py-4 shadow">
                Home
              </Link>
            </div>
          </div>
        )}

        <BottomNav />
    </PageShell>
  );
}

export default AssessmentPage;