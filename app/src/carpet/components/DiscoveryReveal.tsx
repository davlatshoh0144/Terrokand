import { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Star, Zap } from 'lucide-react';
import { DISCOVERY_CARDS } from '../game/education';
import { audioManager } from '../game/audio';

interface DiscoveryRevealProps {
  discoveryIds: string[];
  onDone: () => void;
}

export default function DiscoveryReveal({ discoveryIds, onDone }: DiscoveryRevealProps) {
  const [phase, setPhase] = useState<'intro' | 'cards' | 'done'>('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);

  const cards = DISCOVERY_CARDS.filter((c) => discoveryIds.includes(c.id));
  const newDiscoveryCount = cards.length;

  // Auto-play intro → cards → done
  useEffect(() => {
    if (newDiscoveryCount === 0) {
      onDone();
      return;
    }

    // Phase 1: Intro (1.5s)
    const introTimer = setTimeout(() => {
      audioManager.play('discovery');
      setPhase('cards');
    }, 1500);

    return () => clearTimeout(introTimer);
  }, [newDiscoveryCount, onDone]);

  // Auto-advance cards every 4 seconds
  useEffect(() => {
    if (phase !== 'cards') return;

    if (currentIndex < newDiscoveryCount) {
      const cardTimer = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        if (currentIndex < newDiscoveryCount - 1) {
          audioManager.play('discovery');
        }
      }, 4000); // Each card shows for 4 seconds
      return () => clearTimeout(cardTimer);
    } else {
      // All cards shown
      const total = cards.reduce((sum, c) => sum + c.bonusPoints, 0);
      setTotalPoints(total);
      setPhase('done');
    }
  }, [phase, currentIndex, newDiscoveryCount, cards]);

  // Auto-close "done" phase after 3 seconds
  useEffect(() => {
    if (phase !== 'done') return;
    const doneTimer = setTimeout(onDone, 3000);
    return () => clearTimeout(doneTimer);
  }, [phase, onDone]);

  // Click to skip current card
  const handleSkip = () => {
    if (phase === 'intro') {
      setPhase('cards');
      audioManager.play('discovery');
    } else if (phase === 'cards' && currentIndex < newDiscoveryCount) {
      setCurrentIndex((prev) => prev + 1);
    } else if (phase === 'done') {
      onDone();
    }
  };

  if (newDiscoveryCount === 0) return null;

  const currentCard = cards[Math.min(currentIndex, newDiscoveryCount - 1)];

  // INTRO PHASE
  if (phase === 'intro') {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center z-50 cursor-pointer"
        onClick={handleSkip}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
        <div className="relative text-center animate-pulse">
          <h2
            className="text-3xl font-bold mb-2"
            style={{
              background: 'linear-gradient(90deg, #FFD166, #FF9F1C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {newDiscoveryCount} New Artifact{newDiscoveryCount > 1 ? 's' : ''} Found!
          </h2>
          <p className="text-white/60 text-sm">Opening your jug...</p>
          <p className="text-white/30 text-xs mt-4">(click to skip)</p>
        </div>
      </div>
    );
  }

  // CARDS PHASE
  if (phase === 'cards' && currentCard) {
    const isLastCard = currentIndex >= newDiscoveryCount - 1;

    return (
      <div
        className="absolute inset-0 flex items-center justify-center z-50 cursor-pointer"
        onClick={handleSkip}
      >
        {/* Semi-transparent overlay so results screen is visible behind */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

        <div
          key={currentCard.id}
          className="relative max-w-lg w-full mx-4 bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {/* Card counter */}
          <div className="bg-black/30 px-4 py-2 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                {Math.min(currentIndex + 1, newDiscoveryCount)} of {newDiscoveryCount}
              </span>
            </div>
            {/* Auto-play progress bar */}
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
              <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-1000"
                  style={{ width: `${((currentIndex + 1) / newDiscoveryCount) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative h-40 overflow-hidden">
            <img
              src={currentCard.image}
              alt={currentCard.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-amber-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-amber-500/30">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 text-xs font-bold uppercase tracking-wider">
                {isLastCard ? 'Last Artifact!' : 'Artifact Found!'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h3
              className="text-xl font-bold mb-2"
              style={{
                background: 'linear-gradient(90deg, #FFD166, #FF9F1C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {currentCard.title}
            </h3>
            <p className="text-white/80 text-sm leading-relaxed mb-4">{currentCard.content}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 text-sm font-bold">+{currentCard.bonusPoints} pts</span>
              </div>
              <span className="text-white/30 text-xs">(click to skip)</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DONE PHASE
  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-50 cursor-pointer"
      onClick={handleSkip}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
      <div className="relative max-w-sm w-full mx-4 bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-2xl border border-amber-500/30 shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-500">
        <h2
          className="text-2xl font-bold mb-2"
          style={{
            background: 'linear-gradient(90deg, #FFD166, #FF9F1C)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          All Collected!
        </h2>
        <p className="text-white/60 text-sm mb-3">
          {newDiscoveryCount} artifact{newDiscoveryCount > 1 ? 's' : ''} saved to your jug
        </p>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-yellow-400 font-bold text-lg">+{totalPoints} bonus points</span>
        </div>
        <p className="text-white/30 text-xs mt-2">(click to continue)</p>
      </div>
    </div>
  );
}
