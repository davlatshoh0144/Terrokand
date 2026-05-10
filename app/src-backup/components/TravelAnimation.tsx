import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import type { LevelConfig } from '../game/types';

interface TravelAnimationProps {
  level: LevelConfig;
  onComplete: () => void;
}

const LEVEL_VIDEOS: Record<number, string> = {
  1: './videos/transition-samarkand.mp4',
};

export default function TravelAnimation({ level, onComplete }: TravelAnimationProps) {
  const [status, setStatus] = useState<'loading' | 'playing' | 'ended' | 'error'>('loading');

  const videoSrc = LEVEL_VIDEOS[level.id];

  if (!videoSrc) {
    // No video for this level — simple text + auto-advance
    return (
      <div className="game-container bg-black flex flex-col items-center justify-center gap-4">
        <MapPin className="w-10 h-10 text-[#d4a017] animate-bounce" />
        <h2 className="title-font text-3xl text-white">Traveling to {level.name}</h2>
        <p className="text-[#00a8cc]">{level.location}</p>
        <AutoAdvance onComplete={onComplete} delay={2500} />
      </div>
    );
  }

  return (
    <div className="game-container relative overflow-hidden bg-black">
      {/* Transition video */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src={videoSrc}
        autoPlay
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setStatus('playing')}
        onPlay={() => setStatus('playing')}
        onEnded={() => {
          setStatus('ended');
          onComplete();
        }}
        onError={() => setStatus('error')}
      />

      {/* Very light gradient so video stays visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      {/* Destination label — small, bottom left */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#d4a017]" />
        <span className="text-white/80 text-xs font-bold tracking-wider uppercase">
          {level.name}
        </span>
      </div>

      {/* DEBUG: visible status badge — tells us what's happening */}
      <div className="absolute top-4 right-4 z-50">
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
            status === 'loading'
              ? 'bg-yellow-500/80 text-black'
              : status === 'playing'
              ? 'bg-green-500/80 text-black'
              : status === 'error'
              ? 'bg-red-500/80 text-white'
              : 'bg-blue-500/80 text-white'
          }`}
        >
          VIDEO: {status.toUpperCase()}
        </div>
      </div>

      {/* If video errors, show a manual continue button */}
      {status === 'error' && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80">
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-[#d4a017] text-black font-bold rounded-lg hover:bg-[#ffd700] transition-colors"
          >
            Continue to {level.name} →
          </button>
        </div>
      )}
    </div>
  );
}

function AutoAdvance({ onComplete, delay }: { onComplete: () => void; delay: number }) {
  useEffect(() => {
    const t = setTimeout(onComplete, delay);
    return () => clearTimeout(t);
  }, [onComplete, delay]);
  return null;
}
