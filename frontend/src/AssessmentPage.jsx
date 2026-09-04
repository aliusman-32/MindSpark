import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SparkleBackground from './SparkleBackground';

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
          // Convert to internal format
          const converted = quiz.questions.map((q, idx) => ({
            id: idx,
            text: q.question,
            options: (() => {
              const opts = [{ id: 'a', label: q.correct_answer, color: 'bg-green-400' }];
              (q.wrong_options || []).slice(0,3).forEach((w, i) => {
                opts.push({ id: String.fromCharCode(98+i), label: w, color: 'bg-red-400' });
              });
              return opts;
            })(),
            correct: 'a'
          }));
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

  if (loading) return <div className="p-10 text-center">Loading quiz...</div>;
  if (!questions.length) return <div className="p-10 text-center">No quiz available. Go back and generate one.</div>;

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-purple-200 to-purple-300 p-6 lg:p-10">
      <SparkleBackground />
      <div className="relative z-10 mx-auto max-w-4xl bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl">
        <h1 className="text-center text-3xl sm:text-4xl font-extrabold text-purple-600">Quiz Time! ✏️</h1>

        {!completed ? (
          <>
            <p className="text-center mt-4 text-gray-600 font-semibold">Question {index + 1} of {total}</p>

            <div className="mt-6 rounded-2xl bg-purple-100 px-6 py-5 text-center text-lg font-extrabold text-purple-700">
              {current.text}
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {current.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`rounded-full px-6 py-4 font-extrabold text-white shadow-md transition-transform active:scale-[0.99] ${opt.color} ${selected === opt.id ? 'ring-4 ring-purple-400' : ''}`}
                >
                  {opt.label}
                </button>
              ))}
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
          <div className="mt-16 text-center">
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