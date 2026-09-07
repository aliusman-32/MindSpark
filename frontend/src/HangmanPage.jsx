import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from './PageShell';
import AppHeader from './AppHeader';
import BottomNav from './BottomNav';
import Confetti from './Confetti';

const WORDS = [
  { word: 'ELEPHANT', hint: 'A large animal with a trunk' },
  { word: 'RAINBOW', hint: 'Colorful arc in the sky after rain' },
  { word: 'VOLCANO', hint: 'A mountain that can erupt with lava' },
  { word: 'DINOSAUR', hint: 'A giant creature that lived long ago' },
  { word: 'GALAXY', hint: 'A huge group of stars in space' },
  { word: 'BUTTERFLY', hint: 'An insect with colorful wings' },
  { word: 'PYRAMID', hint: 'An ancient triangular structure in Egypt' },
  { word: 'OCEAN', hint: 'A huge body of salty water' },
  { word: 'TELESCOPE', hint: 'Used to see faraway stars and planets' },
  { word: 'PENGUIN', hint: 'A bird that cannot fly but loves to swim' },
  { word: 'PLANET', hint: 'A large body that orbits a star' },
  { word: 'LIBRARY', hint: 'A place full of books' },
  { word: 'GUITAR', hint: 'A musical instrument with strings' },
  { word: 'WATERFALL', hint: 'Water falling from a high place' },
  { word: 'ASTRONAUT', hint: 'A person who travels to space' },
  { word: 'KANGAROO', hint: 'An animal that hops and carries babies in a pouch' },
  { word: 'SUNFLOWER', hint: 'A tall yellow flower that follows the sun' },
  { word: 'CASTLE', hint: 'A large building where kings and queens lived' },
  { word: 'ROCKET', hint: 'A vehicle that travels into space' },
  { word: 'CHOCOLATE', hint: 'A sweet treat made from cocoa' },
  { word: 'DOLPHIN', hint: 'A smart sea animal that can jump out of water' },
  { word: 'RAINCOAT', hint: 'Clothing that keeps you dry in the rain' },
  { word: 'TREASURE', hint: 'Something valuable that people search for' },
  { word: 'JUNGLE', hint: 'A thick forest filled with plants and animals' },
  { word: 'FIREFIGHTER', hint: 'A person who puts out fires and rescues people' },
  { word: 'ICEBERG', hint: 'A huge piece of ice floating in the ocean' },
  { word: 'UNICORN', hint: 'A magical horse with one horn' },
  { word: 'SANDCASTLE', hint: 'A castle made from wet sand' },
  { word: 'DINNER', hint: 'The evening meal you eat at the end of the day' },
  { word: 'CARNIVAL', hint: 'A fun event with rides, games, and food' },
  { word: 'BALLOON', hint: 'A colorful object that floats in the air' },
  { word: 'MOUNTAIN', hint: 'A very tall natural elevation of the earth' },
  { word: 'RAINSTORM', hint: 'A heavy fall of rain with thunder and lightning' },
  { word: 'FIREWORKS', hint: 'Explosions of light and color in the sky' },
  { word: 'CIRCUS', hint: 'A show with acrobats, clowns, and animals' },
  { word: 'SNOWMAN', hint: 'A figure made of snow, often with a carrot nose' },
  { word: 'TREES', hint: 'Tall plants with trunks and branches' },
  { word: 'BICYCLE', hint: 'A vehicle with two wheels that you pedal to move' },
  { word: 'CATERPILLAR', hint: 'A small creature that can become a butterfly' },
];

const MAX_LIVES = 6;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function pickWord(excludeWord) {
  const choices = WORDS.filter((w) => w.word !== excludeWord);
  return choices[Math.floor(Math.random() * choices.length)];
}

function HangmanPage() {
  const navigate = useNavigate();
  const [entry, setEntry] = useState(() => pickWord());
  const [guessed, setGuessed] = useState([]);

  const wrongGuesses = guessed.filter((l) => !entry.word.includes(l));
  const livesLeft = MAX_LIVES - wrongGuesses.length;
  const isWinner = entry.word.split('').every((l) => guessed.includes(l));
  const isLoser = livesLeft <= 0;
  const gameOver = isWinner || isLoser;

  const handleGuess = (letter) => {
    if (gameOver || guessed.includes(letter)) return;
    setGuessed((prev) => [...prev, letter]);
  };

  const handleNewWord = () => {
    setEntry(pickWord(entry.word));
    setGuessed([]);
  };

  return (
    <PageShell maxWidth="max-w-2xl">
      <AppHeader />
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/games')}
          aria-label="Back to games"
          className="shrink-0 w-11 h-11 rounded-full bg-white shadow-md border border-purple-100 hover:bg-purple-50 active:scale-95 flex items-center justify-center text-2xl text-purple-600 transition"
        >
          ←
        </button>
        <h1 className="flex-1 text-center text-2xl sm:text-3xl font-extrabold text-purple-600">Hangman</h1>
        <div className="w-11 shrink-0" />
      </div>

      <p className="mt-4 text-center text-lg">
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <span key={i}>{i < livesLeft ? '❤️' : '🤍'}</span>
        ))}
      </p>

      <div className="mt-4 rounded-2xl bg-purple-50 border border-purple-100 px-5 py-3 text-center">
        <span className="text-xs font-extrabold text-purple-500 uppercase tracking-wide">Hint: </span>
        <span className="text-purple-700 font-semibold">{entry.hint}</span>
      </div>

      <div className="relative overflow-hidden mt-6 text-center">
        {isWinner && <Confetti count={40} />}
        <div className="flex flex-wrap justify-center gap-2">
          {entry.word.split('').map((letter, i) => (
            <div
              key={i}
              className="w-9 h-11 sm:w-11 sm:h-14 rounded-lg bg-white border-2 border-purple-300 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-purple-700"
            >
              {guessed.includes(letter) || isLoser ? letter : ''}
            </div>
          ))}
        </div>

        {gameOver && (
          <div className="mt-6">
            <p className={`text-xl font-extrabold ${isWinner ? 'text-green-600' : 'text-rose-600'}`}>
              {isWinner ? 'You got it! 🎉' : `So close! The word was "${entry.word}"`}
            </p>
            <button
              onClick={handleNewWord}
              className="mt-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 active:scale-95 text-white font-extrabold px-8 py-3.5 shadow-lg transition-all"
            >
              New Word
            </button>
          </div>
        )}
      </div>

      {!gameOver && (
        <div className="mt-8 grid grid-cols-7 sm:grid-cols-9 gap-2 max-w-lg mx-auto">
          {ALPHABET.map((letter) => {
            const used = guessed.includes(letter);
            const correct = used && entry.word.includes(letter);
            return (
              <button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={used}
                className={`aspect-square rounded-lg font-bold text-sm sm:text-base shadow-sm transition-all active:scale-95 ${used
                    ? correct
                      ? 'bg-green-200 text-green-700'
                      : 'bg-gray-200 text-gray-400'
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                  }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}

      <BottomNav />
    </PageShell>
  );
}

export default HangmanPage;
