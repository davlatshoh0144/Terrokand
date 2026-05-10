import { useEffect, useState } from 'react';
import { Star, ArrowRight, Home, RotateCcw, BookOpen, Sparkles } from 'lucide-react';
import { DISCOVERY_CARDS } from '../game/education';

interface LevelCompleteScreenProps {
  score: number;
  targetScore: number;
  lives: number;
  maxLives: number;
  distance: number;
  maxCombo: number;
  hasNextLevel: boolean;
  discoveryIds: string[]; // IDs of discoveries found during this level
  onNextLevel: () => void;
  onRestart: () => void;
  onMenu: () => void;
}

export default function LevelCompleteScreen({
  score,
  targetScore,
  lives,
  maxLives,
  distance,
  maxCombo,
  hasNextLevel,
  discoveryIds,
  onNextLevel,
  onRestart,
  onMenu,
}: LevelCompleteScreenProps) {
  const [displayedStars, setDisplayedStars] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showDiscoveries, setShowDiscoveries] = useState(false);
  const [revealedDiscoveryIndex, setRevealedDiscoveryIndex] = useState(-1);

  // Calculate stars
  const coinPercent = score / targetScore;
  let stars = 1; // Complete = 1 star
  if (lives >= 2) stars = 2;
  if (lives === maxLives && coinPercent >= 0.9) stars = 3;

  // Get discovery cards for this level
  const levelDiscoveries = DISCOVERY_CARDS.filter((c) => discoveryIds.includes(c.id));
  const newDiscoveryCount = levelDiscoveries.length;

  useEffect(() => {
    const timer1 = setTimeout(() => setDisplayedStars(1), 500);
    const timer2 = setTimeout(() => { if (stars >= 2) setDisplayedStars(2); }, 1000);
    const timer3 = setTimeout(() => { if (stars >= 3) setDisplayedStars(3); }, 1500);
    const timer4 = setTimeout(() => setShowStats(true), 1800);
    const timer5 = setTimeout(() => {
      if (newDiscoveryCount > 0) setShowDiscoveries(true);
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [stars, newDiscoveryCount]);

  // Reveal discoveries one by one
  useEffect(() => {
    if (!showDiscoveries || newDiscoveryCount === 0) return;
    if (revealedDiscoveryIndex < newDiscoveryCount - 1) {
      const timer = setTimeout(() => {
        setRevealedDiscoveryIndex((prev) => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showDiscoveries, revealedDiscoveryIndex, newDiscoveryCount]);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70 backdrop-blur-sm overflow-y-auto py-8">
      <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-2xl p-8 border border-yellow-500/20 shadow-2xl max-w-md w-full mx-4 my-auto">
        {/* Title */}
        <h2
          className="text-3xl font-bold text-center mb-4"
          style={{
            background: 'linear-gradient(90deg, #FFD166, #FF9F1C)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Level Complete!
        </h2>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`transition-all duration-500 ${
                s <= displayedStars ? 'scale-100 opacity-100' : 'scale-50 opacity-30'
              }`}
              style={{
                transitionDelay: `${s * 200}ms`,
              }}
            >
              <Star
                className={`w-12 h-12 ${
                  s <= displayedStars
                    ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]'
                    : 'text-gray-600'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Stats */}
        {showStats && (
          <div className="bg-black/30 rounded-xl p-4 mb-6 space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Score</span>
              <span className="text-yellow-400 font-bold">{score.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Distance</span>
              <span className="text-white font-bold">{distance}m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Lives Remaining</span>
              <span className="text-red-400 font-bold">{lives}/{maxLives}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Max Combo</span>
              <span className="text-orange-400 font-bold">x{maxCombo}</span>
            </div>
          </div>
        )}

        {/* Discovery Reveal Section */}
        {showDiscoveries && newDiscoveryCount > 0 && (
          <div className="mb-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-amber-400 font-bold text-lg">
                {newDiscoveryCount} Artifact{newDiscoveryCount > 1 ? 's' : ''} Added to Jug!
              </h3>
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {levelDiscoveries.map((card, index) => (
                <div
                  key={card.id}
                  className={`rounded-xl overflow-hidden border border-amber-500/30 bg-white/5 transition-all duration-700 ${
                    index <= revealedDiscoveryIndex
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4'
                  }`}
                >
                  <div className="flex gap-3 p-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <BookOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Discovery</span>
                      </div>
                      <h4 className="text-amber-300 font-bold text-sm truncate">{card.title}</h4>
                      <p className="text-white/50 text-xs leading-relaxed line-clamp-2 mt-0.5">{card.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {hasNextLevel && (
            <button
              onClick={onNextLevel}
              className="flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                boxShadow: '0 4px 0 #14532d',
              }}
            >
              Next Level
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all hover:scale-105 active:scale-95 border border-white/10"
          >
            <RotateCcw className="w-5 h-5" />
            Replay
          </button>

          <button
            onClick={onMenu}
            className="flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all hover:scale-105 active:scale-95 border border-white/10"
          >
            <Home className="w-5 h-5" />
            Level Select
          </button>
        </div>
      </div>
    </div>
  );
}
