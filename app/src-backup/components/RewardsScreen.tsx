import { useEffect, useState } from 'react';
import { Star, Sparkles, Lock } from 'lucide-react';
import { ALL_REWARDS, addRewards, getCollectedRewards } from '../game/rewards';
import type { RewardItem } from '../game/types';

interface RewardsScreenProps {
  newRewards: RewardItem[];
  onComplete: () => void;
}

export default function RewardsScreen({ newRewards, onComplete }: RewardsScreenProps) {
  const [addedRewards, setAddedRewards] = useState<RewardItem[]>([]);
  const [showIndex, setShowIndex] = useState(0);
  const [allCollected, setAllCollected] = useState<RewardItem[]>([]);

  useEffect(() => {
    const added = addRewards(newRewards);
    setAddedRewards(added);
    setAllCollected(getCollectedRewards());

    // Animate rewards appearing one by one
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setShowIndex(idx);
      if (idx >= added.length) {
        clearInterval(interval);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [newRewards]);

  const totalRewards = ALL_REWARDS.length;
  const collectedCount = allCollected.length;

  return (
    <div className="game-container uzbek-gradient-dark relative">
      <div className="absolute inset-4 border-2 border-[#d4a017]/20 rounded-2xl z-10 pointer-events-none" />

      <div className="relative z-20 h-full flex flex-col items-center justify-center p-6">
        <Sparkles className="w-10 h-10 text-[#ffd700] mb-2 animate-pulse" />
        <h2 className="title-font text-3xl font-bold uzbek-text-gold mb-1">Treasures Found!</h2>
        <p className="text-white/60 text-sm mb-6">Your Terrokand collection grows...</p>

        {/* New rewards */}
        {addedRewards.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {addedRewards.map((reward, i) => (
              <div
                key={reward.id}
                className={`glass-panel rounded-xl p-4 text-center transition-all duration-500 ${
                  i < showIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
              >
                <div className="text-5xl mb-2 animate-float">{reward.emoji}</div>
                <h3 className="text-white font-bold text-sm">{reward.name}</h3>
                <p className="text-[#d4a017] text-xs capitalize">{reward.type}</p>
                <p className="text-white/50 text-xs mt-1">{reward.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-xl p-6 text-center mb-8">
            <p className="text-white/70">You already collected these treasures!</p>
          </div>
        )}

        {/* Collection progress */}
        <div className="w-full max-w-md mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-white/70">Collection Progress</span>
            <span className="text-[#d4a017] font-bold">{collectedCount} / {totalRewards}</span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#d4a017] to-[#00ccff] transition-all duration-1000"
              style={{ width: `${(collectedCount / totalRewards) * 100}%` }}
            />
          </div>
        </div>

        {/* All rewards grid (small) */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {ALL_REWARDS.map((reward) => {
            const isCollected = allCollected.some((r) => r.id === reward.id);
            return (
              <div
                key={reward.id}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                  isCollected ? 'glass-panel' : 'bg-white/5'
                }`}
                title={isCollected ? reward.name : '???'}
              >
                {isCollected ? reward.emoji : <Lock className="w-3 h-3 text-white/20" />}
              </div>
            );
          })}
        </div>

        <button onClick={onComplete} className="uzbek-button-gold px-8 py-3 flex items-center gap-2">
          <Star className="w-5 h-5" />
          <span>Continue Journey</span>
        </button>
      </div>
    </div>
  );
}
