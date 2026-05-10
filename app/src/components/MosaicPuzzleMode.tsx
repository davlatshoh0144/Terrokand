import { useMemo, useState } from 'react';
import MosaicPuzzle from './MosaicPuzzle';

interface MosaicPuzzleModeProps {
  onExit: () => void;
}

export default function MosaicPuzzleMode({ onExit }: MosaicPuzzleModeProps) {
  const [lastReward, setLastReward] = useState<number | null>(null);
  const [level, setLevel] = useState<number>(() => {
    const saved = Number(localStorage.getItem('mosaic_puzzle_level') || '1');
    return Math.min(3, Math.max(1, Number.isFinite(saved) ? saved : 1));
  });
  const [goldEarned, setGoldEarned] = useState(0);
  const [restorationBoost, setRestorationBoost] = useState(0);

  const rewardSummary = useMemo(() => {
    const gold = level === 1 ? 8 : level === 2 ? 14 : 20;
    const boost = level === 1 ? 2 : level === 2 ? 4 : 6;
    return { gold, boost };
  }, [level]);

  return (
    <div className="game-container relative overflow-hidden bg-[#1c3126]">
      <div className="absolute top-4 left-4 z-50">
        <button onClick={onExit} className="terraria-btn px-4 py-2 text-sm">Back</button>
      </div>
      <div className="absolute top-4 right-4 z-50 rounded-lg border border-[#b89456]/70 bg-[#102f42]/90 px-3 py-2 text-xs font-semibold text-[#e9f7ff]">
        Level {level} / Calm Atelier Mode
      </div>
      {lastReward !== null && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-[#b89456]/70 bg-[#102f42]/90 px-4 py-2 text-sm font-bold text-[#e9f7ff]">
          Restored: +{lastReward} Tiles / +{rewardSummary.gold} Gold / +{rewardSummary.boost}% Boost
        </div>
      )}
      <MosaicPuzzle
        key={`mosaic-level-${level}`}
        level={level}
        onClose={() => {
          if (lastReward !== null && level < 3) {
            const nextLevel = level + 1;
            setLevel(nextLevel);
            localStorage.setItem('mosaic_puzzle_level', String(nextLevel));
            setLastReward(null);
            return;
          }
          onExit();
        }}
        onComplete={(reward) => {
          setLastReward(reward);
          setGoldEarned((old) => old + rewardSummary.gold);
          setRestorationBoost((old) => old + rewardSummary.boost);
          if (level < 3) localStorage.setItem('mosaic_puzzle_level', String(level + 1));
        }}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-[#b89456]/70 bg-[#102f42]/90 px-4 py-2 text-xs font-semibold text-[#e9f7ff]">
        Session Rewards: {goldEarned} Gold / {restorationBoost}% Boost
      </div>
    </div>
  );
}
