import { RotateCcw, Home, Frown } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  distance: number;
  maxCombo: number;
  level: number;
  onRestart: () => void;
  onMenu: () => void;
}

export default function GameOverScreen({ score, highScore, distance, maxCombo, level, onRestart, onMenu }: GameOverScreenProps) {
  const isNewHighScore = score >= highScore && score > 0;

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-2xl p-8 border border-red-500/20 shadow-2xl max-w-sm w-full mx-4">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
            <Frown className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center text-red-400 mb-2">Game Over</h2>
        <p className="text-center text-white/50 text-sm mb-6">Level {level} - Keep trying!</p>

        {/* Stats */}
        <div className="bg-black/30 rounded-xl p-4 mb-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Final Score</span>
            <span className="text-white font-bold">{score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Distance</span>
            <span className="text-white font-bold">{distance}m</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/60">Max Combo</span>
            <span className="text-orange-400 font-bold">x{maxCombo}</span>
          </div>
          {isNewHighScore && (
            <div className="text-center py-2">
              <span className="text-yellow-400 font-bold text-sm animate-pulse">New High Score!</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #E63946, #D90429)',
              boxShadow: '0 4px 0 #8B0000',
            }}
          >
            <RotateCcw className="w-5 h-5" />
            Try Again
          </button>

          <button
            onClick={onMenu}
            className="flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all hover:scale-105 active:scale-95 border border-white/10"
          >
            <Home className="w-5 h-5" />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
