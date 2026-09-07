import { useEffect, useState } from 'react';

export function useTypewriter(phrases, { typingSpeed = 65, deletingSpeed = 35, pauseTime = 1600, loop = true } = {}) {
  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const current = phrases[phraseIndex % phrases.length];
    let timeout;

    if (!deleting && text === current) {
      if (!loop && phraseIndex === phrases.length - 1) {
        setDone(true);
        return;
      }
      timeout = setTimeout(() => setDeleting(true), pauseTime);
    } else if (deleting && text === '') {
      setDeleting(false);
      setPhraseIndex((i) => (i + 1) % phrases.length);
    } else {
      timeout = setTimeout(() => {
        setText((t) => (deleting ? current.slice(0, t.length - 1) : current.slice(0, t.length + 1)));
      }, deleting ? deletingSpeed : typingSpeed);
    }

    return () => clearTimeout(timeout);
  }, [text, deleting, phraseIndex, phrases, typingSpeed, deletingSpeed, pauseTime, loop, done]);

  return text;
}
