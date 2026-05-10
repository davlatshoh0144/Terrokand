import { useState, useEffect } from 'react';
import { Star, ArrowRight, RotateCcw, Home, Sparkles } from 'lucide-react';
import type { LevelConfig } from '../game/types';
import { playClickSfx } from '../lib/sfx';

interface LevelCompleteProps {
  level: LevelConfig;
  score: number;
  stars: number;
  coins: number;
  maxCombo: number;
  elapsedTime: number;
  onNextLevel: () => void;
  onReplay: () => void;
  onMenu: () => void;
}

export default function LevelComplete({
  level,
  score,
  stars,
  coins,
  maxCombo,
  elapsedTime,
  onNextLevel,
  onReplay,
  onMenu,
}: LevelCompleteProps) {
  const [showStars, setShowStars] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [currentFact, setCurrentFact] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  
  useEffect(() => {
    // Animate stars appearing
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= stars; i++) {
      timers.push(setTimeout(() => setShowStars(i), 500 + i * 400));
    }
    
    timers.push(setTimeout(() => setShowScore(true), 300));
    timers.push(setTimeout(() => setShowButtons(true), 2000 + stars * 400));
    
    return () => timers.forEach(clearTimeout);
  }, [stars]);
  
  // Cycle through facts
  useEffect(() => {
    if (level.facts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentFact((prev) => (prev + 1) % level.facts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [level.facts]);
  
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${level.backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" />
      </div>
      
      {/* Sparkle particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          >
            <Sparkles className="w-4 h-4 text-[#ffd700]/50" />
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="relative z-10 glass-panel rounded-2xl p-8 w-[500px] max-w-[90vw]">
        {/* Title */}
        <h2 className="title-font text-3xl font-bold text-center uzbek-text-gold mb-2">
          Level Complete!
        </h2>
        <p className="text-[#00a8cc] text-center font-semibold mb-6">
          {level.name} - {level.location}
        </p>
        
        {/* Stars */}
        <div className="flex justify-center gap-4 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`transition-all duration-500 ${
                s <= showStars 
                  ? 'scale-100 opacity-100 star-animate' 
                  : 'scale-50 opacity-30'
              }`}
              style={{ animationDelay: `${s * 0.4}s` }}
            >
              <Star
                className={`w-14 h-14 ${
                  s <= showStars 
                    ? 'text-[#ffd700] fill-[#ffd700] drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]' 
                    : 'text-white/30'
                }`}
              />
            </div>
          ))}
        </div>
        
        {/* Score */}
        {showScore && (
          <div className="text-center mb-6 animate-float">
            <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Final Score</p>
            <p className="title-font text-5xl font-black uzbek-text-gold">
              {score.toLocaleString()}
            </p>
          </div>
        )}
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center glass-panel-light rounded-lg p-3">
            <p className="text-[#ffd700] text-2xl font-bold">{coins}</p>
            <p className="text-white/60 text-xs">Coins</p>
          </div>
          <div className="text-center glass-panel-light rounded-lg p-3">
            <p className="text-[#00ccff] text-2xl font-bold">{maxCombo}x</p>
            <p className="text-white/60 text-xs">Max Combo</p>
          </div>
          <div className="text-center glass-panel-light rounded-lg p-3">
            <p className="text-[#ff6b9d] text-2xl font-bold">{stars}/3</p>
            <p className="text-white/60 text-xs">Stars</p>
          </div>
        </div>

        <div className="text-center mb-4">
          <p className="text-white/70 text-sm">Time: {Math.max(0, elapsedTime).toFixed(1)}s</p>
        </div>
        
        {/* Fun Fact */}
        <div className="glass-panel-light rounded-lg p-4 mb-6">
          <p className="text-[#d4a017] text-xs font-semibold uppercase tracking-wider mb-1">
            Did You Know?
          </p>
          <p className="text-white/80 text-sm italic transition-opacity duration-500">
            {level.facts[currentFact]}
          </p>
        </div>
        
        {/* Buttons */}
        {showButtons && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { playClickSfx(); onNextLevel(); }}
              className="uzbek-button-gold flex items-center justify-center gap-3 py-4"
            >
              <span>Next City</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={() => { playClickSfx(); onReplay(); }}
                className="uzbek-button flex-1 flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay</span>
              </button>
              
              <button
                onClick={() => { playClickSfx(); onMenu(); }}
                className="uzbek-button flex-1 flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Menu</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
