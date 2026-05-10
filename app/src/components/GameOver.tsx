import { useState, useEffect } from 'react';
import { RotateCcw, Home, Heart } from 'lucide-react';
import type { LevelConfig } from '../game/types';

interface GameOverProps {
  level: LevelConfig;
  score: number;
  coins: number;
  maxCombo: number;
  onRetry: () => void;
  onMenu: () => void;
}

export default function GameOver({ level, score, coins, maxCombo, onRetry, onMenu }: GameOverProps) {
  const [showContent, setShowContent] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);
  
  useEffect(() => {
    setTimeout(() => setShowContent(true), 300);
    
    // Animate score counting up
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayedScore(score);
        clearInterval(timer);
      } else {
        setDisplayedScore(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [score]);
  
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1a0a0a] via-[#2a0a0a] to-[#1a0a33]" />
      
      {/* Content */}
      <div className={`relative z-10 glass-panel rounded-2xl p-8 w-[450px] max-w-[90vw] transition-all duration-700 ${showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
        
        {/* Hearts */}
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3].map((i) => (
            <Heart 
              key={i} 
              className="w-8 h-8 text-red-500/50 fill-red-500/30"
            />
          ))}
        </div>
        
        {/* Title */}
        <h2 className="title-font text-3xl font-bold text-center text-red-400 mb-1">
          Journey Paused
        </h2>
        <p className="text-white/50 text-center text-sm mb-6">
          Don&apos;t give up, young adventurer!
        </p>
        
        {/* Score */}
        <div className="text-center mb-6">
          <p className="text-white/60 text-sm uppercase tracking-wider mb-1">Score</p>
          <p className="title-font text-5xl font-bold text-white">
            {displayedScore.toLocaleString()}
          </p>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="text-center glass-panel-light rounded-lg p-3">
            <p className="text-[#ffd700] text-xl font-bold">{coins}</p>
            <p className="text-white/60 text-xs">Coins Collected</p>
          </div>
          <div className="text-center glass-panel-light rounded-lg p-3">
            <p className="text-[#00ccff] text-xl font-bold">{maxCombo}x</p>
            <p className="text-white/60 text-xs">Best Combo</p>
          </div>
        </div>
        
        {/* Level info */}
        <div className="text-center mb-6">
          <p className="text-[#d4a017] text-sm font-semibold">{level.name}</p>
          <p className="text-white/40 text-xs">{level.location}</p>
        </div>
        
        {/* Motivational message */}
        <p className="text-white/60 text-sm text-center italic mb-6">
          &ldquo;Every great traveler faces challenges. Try again and soar higher!&rdquo;
        </p>
        
        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="uzbek-button-gold flex items-center justify-center gap-3 py-4"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          
          <button
            onClick={onMenu}
            className="uzbek-button flex items-center justify-center gap-3"
          >
            <Home className="w-5 h-5" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
