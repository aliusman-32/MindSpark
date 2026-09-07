import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import { useModal } from './Modal';
import { getStoredToken } from './authStorage';

const GENERATION_STEPS = [
  { key: 'script', label: 'Script' },
  { key: 'audio', label: 'Audio' },
  { key: 'video', label: 'Video' },
];

function GenerationSteps({ currentStep, hasScript, hasAudio, hasVideo }) {
  const doneMap = { script: hasScript, audio: hasAudio, video: hasVideo };
  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      {GENERATION_STEPS.map((step, i) => {
        const isActive = currentStep === step.key;
        const isDone = doneMap[step.key];
        const prevDone = i === 0 || doneMap[GENERATION_STEPS[i - 1].key];
        return (
          <React.Fragment key={step.key}>
            {i > 0 && (
              <div className={`h-1 w-10 rounded transition-colors ${prevDone ? 'bg-purple-400' : 'bg-gray-200'}`} />
            )}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  isDone ? 'bg-green-500 text-white' : isActive ? 'bg-purple-600 text-white animate-pulse' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {isDone ? '✓' : i + 1}
              </div>
              <span className={`text-xs font-semibold ${isActive ? 'text-purple-700' : 'text-gray-500'}`}>{step.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function LessonPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const modal = useModal();
  const [progress, setProgress] = useState(20);

  // State for integration
  const [prompt, setPrompt] = useState('');
  const [rawScript, setRawScript] = useState('');
  const [displayScript, setDisplayScript] = useState('');
  const [lessonId, setLessonId] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(''); // 'script', 'audio', 'video'
  const [viewLoading, setViewLoading] = useState(false);
  const viewedLessonKeyRef = useRef(null);
  const autoGenKeyRef = useRef(null);

  // Load a previously-generated lesson (from History "play") instead of generating a new one
  useEffect(() => {
    const viewLessonId = location.state?.viewLessonId;
    if (!viewLessonId) return;
    if (viewedLessonKeyRef.current === viewLessonId) return; // StrictMode double-invoke guard
    viewedLessonKeyRef.current = viewLessonId;

    (async () => {
      setViewLoading(true);
      setError('');
      try {
        const response = await fetch(`http://localhost:8000/lesson/${viewLessonId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Failed to load lesson');

        setPrompt(data.title);
        setRawScript(data.script);
        setDisplayScript(data.display_script);
        setLessonId(data.lesson_id);
        setAudioUrl(data.audio_url ? `http://localhost:8000${data.audio_url}` : '');
      } catch (err) {
        setError(err.message);
      } finally {
        setViewLoading(false);
      }
    })();
  }, [location.state]);

  // Auto‑start generation if a prompt was passed from HomePage
  useEffect(() => {
    if (location.state?.viewLessonId) return; // viewing an existing lesson, don't auto-generate
    const statePrompt = location.state?.prompt;
    const stateCategoryId = location.state?.category_id ?? 1;
    if (!statePrompt) return;

    // Guard against React StrictMode's dev-only double-invoke of effects, which
    // would otherwise fire this (paid, non-idempotent) generation twice per visit.
    const key = `${statePrompt}::${stateCategoryId}`;
    if (autoGenKeyRef.current === key) return;
    autoGenKeyRef.current = key;

    setPrompt(statePrompt);
    // Automatically trigger the full generation pipeline
    (async () => {
        setLoading(true);
        setError('');
        try {
          // Step 1: Generate script
          setCurrentStep('script');
          const scriptResponse = await fetch('http://localhost:8000/generate-script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              child_id: 1,
              prompt_text: statePrompt,
              chapters: [
                { title: 'Intro', allocated_duration_minutes: 1.0 },
                { title: 'Main Content', allocated_duration_minutes: 3.0 },
                { title: 'Conclusion', allocated_duration_minutes: 1.0 }
              ],
              target_duration_minutes: 5.0,
              category_id: stateCategoryId,
              difficulty_level: 'beginner'
            })
          });
          const scriptData = await scriptResponse.json();
          if (!scriptResponse.ok) throw new Error(scriptData.detail || 'Script generation failed');

          setRawScript(scriptData.script);
          setDisplayScript(scriptData.display_script);
          setLessonId(scriptData.lesson_id);
          const currentLessonId = scriptData.lesson_id;

          // Step 2: Generate audio
          setCurrentStep('audio');
          const audioResponse = await fetch('http://localhost:8000/generate-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              child_id: 1,
              lesson_id: currentLessonId,
              script_text: scriptData.script,
              audio_filename: `lesson_${currentLessonId}`
            })
          });
          const audioData = await audioResponse.json();
          if (!audioResponse.ok) throw new Error(audioData.detail || 'Audio generation failed');

          setAudioUrl(`http://localhost:8000${audioData.audio_url}`);

          // Step 3: Generate video
          setCurrentStep('video');
          const videoResponse = await fetch('http://localhost:8000/generate-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lesson_id: currentLessonId,
              project_name: `lesson_${currentLessonId}`
            })
          });
          const videoData = await videoResponse.json();
          if (!videoResponse.ok) throw new Error(videoData.detail || 'Video generation failed');

          setVideoUrl(`http://localhost:8000${videoData.video_url}`);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
          setCurrentStep('');
        }
      })();
  }, [location.state]);

  // Manual script generation
  const generateScript = async () => {
    if (!prompt.trim()) {
      await modal.alert('Please enter a prompt');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: 1,
          prompt_text: prompt,
          chapters: [
            { title: 'Intro', allocated_duration_minutes: 1.0 },
            { title: 'Main Content', allocated_duration_minutes: 3.0 },
            { title: 'Conclusion', allocated_duration_minutes: 1.0 }
          ],
          target_duration_minutes: 5.0,
          category_id: 1,
          difficulty_level: 'beginner'
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to generate script');
      setRawScript(data.script);
      setDisplayScript(data.display_script);
      setLessonId(data.lesson_id);
    } catch (error) {
      console.error('Error generating script:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Manual audio generation
  const generateAudio = async () => {
    if (!rawScript || !lessonId) {
      await modal.alert('Generate a script first!');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          child_id: 1,
          lesson_id: lessonId,
          script_text: rawScript,
          audio_filename: `lesson_${lessonId}`
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to generate audio');
      setAudioUrl(`http://localhost:8000${data.audio_url}`);
    } catch (error) {
      console.error('Error generating audio:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Manual video generation
  const generateVideo = async () => {
    if (!lessonId) {
      await modal.alert('No lesson available. Generate a script first.');
      return;
    }
    setVideoLoading(true);
    setError('');
    try {
      const response = await fetch('http://localhost:8000/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: lessonId,
          project_name: `lesson_${lessonId}`
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to generate video');
      setVideoUrl(`http://localhost:8000${data.video_url}`);
    } catch (error) {
      console.error('Error generating video:', error);
      setError(error.message);
    } finally {
      setVideoLoading(false);
    }
  };

  // Progress bar and quiz generation
  function handleNext() {
    if (progress < 100) {
      setProgress((p) => Math.min(100, p + 20));
    } else {
      navigate('/assessment', {
        state: {
          childId: 1,
          lessonId: lessonId,
          topicTitle: prompt || 'Untitled Topic'
        }
      });
    }
  }

  const generateQuiz = async () => {
    if (!lessonId) {
      await modal.alert('No lesson available. Generate a script first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = getStoredToken();
      const response = await fetch('http://localhost:8000/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ lesson_id: lessonId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to generate quiz');
      // Store quiz in localStorage for the Assessment page
      localStorage.setItem(`lesson_${lessonId}_quiz`, JSON.stringify(data.quiz));
      await modal.alert('Quiz generated successfully. Open Assessment to view it.');
      navigate('/assessment', {
        state: {
          childId: 1,
          lessonId: lessonId,
          topicTitle: prompt || 'Untitled Topic'
        }
      });
    } catch (err) {
      console.error('Error generating quiz:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadingMessage =
    viewLoading ? 'Loading lesson...'
    : currentStep === 'script' ? 'Generating script...'
    : currentStep === 'audio' ? 'Generating audio...'
    : currentStep === 'video' ? 'Generating video...'
    : '';

  return (
    <PageShell maxWidth="max-w-4xl">
        <AppHeader />
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-6 p-4 border-2 border-purple-300 rounded-xl bg-purple-50">
          <h2 className="text-lg font-bold text-purple-800 mb-3">Generate New Lesson</h2>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Enter a topic (e.g., 'The Solar System')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && !videoLoading && generateScript()}
              className="w-full p-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black placeholder-gray-500"
            />
            <div className="flex gap-3">
              <button
                onClick={generateScript}
                disabled={loading || videoLoading}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
              >
                {loading && currentStep === 'script' ? 'Working...' : 'Generate Script'}
              </button>
              {displayScript && (
                <button
                  onClick={generateAudio}
                  disabled={loading || videoLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  {loading && currentStep === 'audio' ? 'Working...' : 'Generate Audio'}
                </button>
              )}
            </div>
            {lessonId && (
              <div className="mt-2">
                <button
                  onClick={generateVideo}
                  disabled={videoLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                >
                  {videoLoading ? 'Generating Video...' : 'Generate Video'}
                </button>
              </div>
            )}
          </div>
          {(loading || viewLoading) && (
            <>
              <GenerationSteps
                currentStep={viewLoading ? 'script' : currentStep}
                hasScript={!!rawScript}
                hasAudio={!!audioUrl}
                hasVideo={!!videoUrl}
              />
              {loadingMessage && (
                <div className="mt-2 text-center text-purple-600 font-semibold text-sm animate-pulse">
                  {loadingMessage}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="shrink-0 w-11 h-11 rounded-full bg-white shadow-md border border-purple-100 hover:bg-purple-50 active:scale-95 flex items-center justify-center text-2xl text-purple-600 transition"
          >
            ←
          </button>
          <h1 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-purple-600">
            {displayScript ? prompt : 'New Lesson'}
          </h1>
          <div className="w-11 shrink-0" />
        </div>

        <div className="mt-6 rounded-2xl bg-gray-100 p-10 text-center text-gray-500 font-extrabold">
          {videoUrl ? (
            <video controls src={videoUrl} className="mx-auto w-full max-h-96" />
          ) : audioUrl ? (
            <audio controls src={audioUrl} className="mx-auto" />
          ) : (
            <>
              <div className="text-5xl mb-3">🎬</div>
              <div className="text-gray-600 font-semibold">Your audio and video will appear here</div>
              <div className="text-gray-400 text-sm font-medium mt-1">once your lesson is generated</div>
            </>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-purple-100 p-5 text-purple-800 font-extrabold text-lg leading-relaxed prose prose-purple max-w-none">
          {displayScript ? (
            <ReactMarkdown>{displayScript}</ReactMarkdown>
          ) : (
            <span className="text-purple-400 font-semibold">
              Type a topic above and hit "Generate Script" — your lesson will appear here! ✨
            </span>
          )}
        </div>

        <div className="mt-4 h-2 rounded-full bg-purple-200">
          <div className="h-full rounded-full bg-purple-600" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="mt-6">
          {progress >= 100 ? (
            <button
              onClick={generateQuiz}
              disabled={loading || videoLoading}
              className="w-full rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-4 shadow-lg"
            >
              {loading ? 'Generating Quiz...' : 'Generate Quiz'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="w-full rounded-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold py-4 shadow-lg"
            >
              Next ▶
            </button>
          )}
        </div>

        <BottomNav />
    </PageShell>
  );
}

export default LessonPage;