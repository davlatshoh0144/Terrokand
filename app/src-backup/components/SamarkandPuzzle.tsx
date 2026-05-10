import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Home, Star } from 'lucide-react';

interface SamarkandPuzzleProps {
  onComplete: (score: number, stars: number) => void;
  onQuit: () => void;
}

// 3x3 sliding puzzle: 0 represents empty tile
function getSolvedState(): number[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 0];
}

function isSolved(state: number[]): boolean {
  const solved = getSolvedState();
  return state.every((val, i) => val === solved[i]);
}

function shuffleState(): number[] {
  // Start solved, then do random valid moves to ensure solvability
  let state = getSolvedState();
  let emptyIdx = 8;
  const moves = [-3, 3, -1, 1]; // up, down, left, right

  for (let i = 0; i < 150; i++) {
    const validMoves = moves.filter((m) => {
      const newIdx = emptyIdx + m;
      if (newIdx < 0 || newIdx > 8) return false;
      if (m === 1 && emptyIdx % 3 === 2) return false; // can't move right from right edge
      if (m === -1 && emptyIdx % 3 === 0) return false; // can't move left from left edge
      return true;
    });
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    const newIdx = emptyIdx + move;
    [state[emptyIdx], state[newIdx]] = [state[newIdx], state[emptyIdx]];
    emptyIdx = newIdx;
  }
  return state;
}

export default function SamarkandPuzzle({ onComplete, onQuit }: SamarkandPuzzleProps) {
  const [tiles, setTiles] = useState<number[]>(shuffleState);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);
  const [completed, setCompleted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (completed) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [completed]);

  useEffect(() => {
    if (!completed && isSolved(tiles)) {
      setCompleted(true);
      const timeBonus = timeLeft * 10;
      const movePenalty = moves * 5;
      const finalScore = Math.max(100, 3000 + timeBonus - movePenalty);
      const stars = finalScore >= 3500 ? 3 : finalScore >= 2500 ? 2 : 1;
      setScore(finalScore);
      setTimeout(() => onComplete(finalScore, stars), 1500);
    }
  }, [tiles, completed, timeLeft, moves, onComplete]);

  const handleTimeUp = useCallback(() => {
    if (!completed) {
      setCompleted(true);
      const finalScore = Math.max(100, 1000 - moves * 5);
      const stars = finalScore >= 2000 ? 2 : 1;
      setScore(finalScore);
      setTimeout(() => onComplete(finalScore, stars), 1000);
    }
  }, [completed, moves, onComplete]);

  const handleTileClick = (index: number) => {
    if (completed) return;
    const emptyIdx = tiles.indexOf(0);
    const diff = Math.abs(index - emptyIdx);
    const sameRow = Math.floor(index / 3) === Math.floor(emptyIdx / 3);

    if ((diff === 3) || (diff === 1 && sameRow)) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[index]];
      setTiles(newTiles);
      setMoves((m) => m + 1);
    }
  };

  const handleReset = () => {
    setTiles(shuffleState());
    setMoves(0);
    setTimeLeft(120);
    setCompleted(false);
    setScore(0);
  };

  const tileColors: Record<number, string> = {
    1: 'bg-gradient-to-br from-[#0066a1] to-[#004d7a]',
    2: 'bg-gradient-to-br from-[#0077b6] to-[#005a8c]',
    3: 'bg-gradient-to-br from-[#0088c9] to-[#006ba1]',
    4: 'bg-gradient-to-br from-[#0066a1] to-[#004d7a]',
    5: 'bg-gradient-to-br from-[#d4a017] to-[#b3860f]',
    6: 'bg-gradient-to-br from-[#0077b6] to-[#005a8c]',
    7: 'bg-gradient-to-br from-[#0088c9] to-[#006ba1]',
    8: 'bg-gradient-to-br from-[#0066a1] to-[#004d7a]',
  };

  return (
    <div className="game-container uzbek-gradient-dark relative">
      {/* Decorative border */}
      <div className="absolute inset-4 border-2 border-[#d4a017]/20 rounded-2xl z-10 pointer-events-none" />

      <div className="relative z-20 h-full flex flex-col items-center justify-center p-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="title-font text-3xl font-bold uzbek-text-gold">Build the Registan</h2>
          <p className="text-white/70 text-sm mt-1">Slide the blue tiles to restore the pattern!</p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 mb-4">
          <div className="glass-panel-light rounded-lg px-4 py-2 text-center">
            <p className="text-[#00ccff] text-xl font-bold">{moves}</p>
            <p className="text-white/50 text-xs">Moves</p>
          </div>
          <div className="glass-panel-light rounded-lg px-4 py-2 text-center">
            <p className={`text-xl font-bold ${timeLeft < 20 ? 'text-red-400' : 'text-[#ffd700]'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-white/50 text-xs">Time</p>
          </div>
        </div>

        {/* Puzzle Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 glass-panel rounded-xl">
          {tiles.map((tile, i) => (
            <button
              key={i}
              onClick={() => handleTileClick(i)}
              disabled={completed}
              className={`
                w-20 h-20 md:w-24 md:h-24 rounded-lg flex items-center justify-center
                text-2xl font-bold transition-all duration-200
                ${tile === 0
                  ? 'bg-transparent'
                  : `${tileColors[tile]} text-white shadow-lg hover:scale-105 active:scale-95 border border-white/20`
                }
              `}
            >
              {tile !== 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-lg">🕌</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Completed overlay */}
        {completed && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
            <div className="glass-panel rounded-2xl p-8 text-center animate-float">
              <Star className="w-12 h-12 text-[#ffd700] mx-auto mb-2 fill-[#ffd700]" />
              <h3 className="title-font text-2xl font-bold uzbek-text-gold mb-1">Registan Restored!</h3>
              <p className="text-white text-lg font-bold">Score: {score.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 mt-6">
          <button onClick={handleReset} className="uzbek-button flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Shuffle</span>
          </button>
          <button onClick={onQuit} className="uzbek-button flex items-center gap-2">
            <Home className="w-4 h-4" />
            <span>Quit</span>
          </button>
        </div>
      </div>
    </div>
  );
}
