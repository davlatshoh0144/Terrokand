import { useState } from 'react';
import { X, BookOpen, Star, Lock } from 'lucide-react';
import { DISCOVERY_CARDS } from '../game/education';

interface ArtifactJugProps {
  collectedIds: string[];
}

export default function ArtifactJug({ collectedIds }: ArtifactJugProps) {
  const [open, setOpen] = useState(false);
  const collectedSet = new Set(collectedIds);
  const totalCards = DISCOVERY_CARDS.length;
  const collectedCount = collectedSet.size;

  return (
    <>
      {/* Jug Button */}
      <button
        onClick={() => setOpen(true)}
        className="relative group flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-amber-500/30 hover:border-amber-400/60 hover:bg-black/70 transition-all"
        title="Your Artifact Jug"
      >
        {/* Jug icon using CSS */}
        <div className="relative w-7 h-7">
          <svg viewBox="0 0 32 32" className="w-full h-full drop-shadow-lg">
            {/* Jug body */}
            <path
              d="M8 10 C8 6, 12 4, 16 4 C20 4, 24 6, 24 10 L24 12 C26 13, 28 16, 28 20 C28 26, 22 30, 16 30 C10 30, 4 26, 4 20 C4 16, 6 13, 8 12 Z"
              fill="url(#jugGrad)"
              stroke="#D4A843"
              strokeWidth="1.2"
            />
            {/* Jug neck highlight */}
            <ellipse cx="16" cy="10" rx="5" ry="2" fill="#E8C86A" opacity="0.6" />
            {/* Decorative band */}
            <ellipse cx="16" cy="16" rx="9" ry="1.5" fill="none" stroke="#B8942E" strokeWidth="0.8" />
            <ellipse cx="16" cy="22" rx="8" ry="1.5" fill="none" stroke="#B8942E" strokeWidth="0.8" />
            {/* Star on jug */}
            <polygon points="16,14 17,17 20,17 18,19 19,22 16,20 13,22 14,19 12,17 15,17" fill="#FFD700" opacity="0.8" />
            <defs>
              <linearGradient id="jugGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#E8C86A" />
                <stop offset="50%" stopColor="#D4A843" />
                <stop offset="100%" stopColor="#B8942E" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="flex flex-col items-start">
          <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">Jug</span>
          <span className="text-white text-sm font-bold tabular-nums">{collectedCount}/{totalCards}</span>
        </div>
        {/* Glow pulse when new discoveries available */}
        {collectedCount < totalCards && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-50" />
        )}
      </button>

      {/* Jug Gallery Overlay */}
      {open && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/70 backdrop-blur-md">
          <div className="relative max-w-2xl w-full mx-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-amber-500/20 shadow-2xl max-h-[85vh]">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/95 p-4 border-b border-white/10 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <svg viewBox="0 0 32 32" className="w-8 h-8">
                  <path
                    d="M8 10 C8 6, 12 4, 16 4 C20 4, 24 6, 24 10 L24 12 C26 13, 28 16, 28 20 C28 26, 22 30, 16 30 C10 30, 4 26, 4 20 C4 16, 6 13, 8 12 Z"
                    fill="url(#headerJugGrad)"
                    stroke="#D4A843"
                    strokeWidth="1.2"
                  />
                  <polygon points="16,14 17,17 20,17 18,19 19,22 16,20 13,22 14,19 12,17 15,17" fill="#FFD700" opacity="0.8" />
                  <defs>
                    <linearGradient id="headerJugGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E8C86A" />
                      <stop offset="50%" stopColor="#D4A843" />
                      <stop offset="100%" stopColor="#B8942E" />
                    </linearGradient>
                  </defs>
                </svg>
                <div>
                  <h2 className="text-xl font-bold text-amber-400">Artifact Jug</h2>
                  <p className="text-white/50 text-xs">{collectedCount} of {totalCards} discoveries collected</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/70 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cards Grid */}
            <div className="p-4 overflow-y-auto max-h-[70vh] space-y-3">
              {DISCOVERY_CARDS.map((card) => {
                const isCollected = collectedSet.has(card.id);
                return (
                  <div
                    key={card.id}
                    className={`rounded-xl overflow-hidden border transition-all ${
                      isCollected
                        ? 'border-amber-500/30 bg-white/5'
                        : 'border-white/5 bg-white/[0.02] opacity-50'
                    }`}
                  >
                    <div className="flex gap-3 p-3">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-black/30">
                        {isCollected ? (
                          <img src={card.image} alt={card.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Lock className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {isCollected && <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                          <h3 className={`font-bold text-sm truncate ${isCollected ? 'text-amber-300' : 'text-gray-500'}`}>
                            {isCollected ? card.title : '???'}
                          </h3>
                        </div>
                        {isCollected ? (
                          <>
                            <p className="text-white/60 text-xs leading-relaxed line-clamp-3">{card.content}</p>
                            <div className="flex items-center gap-1 mt-1.5">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                              <span className="text-yellow-400 text-xs font-bold">+{card.bonusPoints} pts</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-gray-600 text-xs italic">Discover this in Level {card.levelId}...</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
