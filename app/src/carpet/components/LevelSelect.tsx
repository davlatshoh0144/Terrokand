import { useEffect } from 'react';
import { ArrowLeft, Lock, Star } from 'lucide-react';
import { audioManager } from '../game/audio';
import { LEVELS } from '../game/levels';

interface LevelSelectProps {
  unlockedLevels: number;
  levelStars: Record<number, number>;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}

const bgImages: Record<string, string> = {
  samarkand: './images/bg-samarkand.jpg',
  desert: './images/bg-desert.jpg',
  khiva: './images/bg-khiva.jpg',
  mountains: './images/bg-mountains.jpg',
};

export default function LevelSelect({ unlockedLevels, levelStars, onSelectLevel, onBack }: LevelSelectProps) {
  useEffect(() => {
    audioManager.playBGM('menu');
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(./images/levelselect-bg.jpg)' }}
      />
      <div className="absolute inset-0 bg-black/25" />

      {/* Header */}
      <div className="relative z-10 flex items-center gap-4 p-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl bg-black/50 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/40 backdrop-blur-sm transition-all hover:bg-black/70 border border-white/30 hover:border-white/50"
          aria-label="Back to main menu"
          title="Back to main menu"
        >
          <ArrowLeft className="w-7 h-7" />
          Back
        </button>
        <div className="rounded-xl bg-black/45 px-4 py-2 text-white shadow-lg shadow-black/30 backdrop-blur-sm">
          <div className="text-lg font-black text-yellow-300">Choose a Flight</div>
          <div className="text-xs text-white/70">Start with Level 1 for the fastest judge path.</div>
        </div>
      </div>

      {/* Level Grid */}
      <div className="relative z-10 flex-1 flex items-center justify-center overflow-y-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
          {LEVELS.map((level) => {
            const unlocked = level.id <= unlockedLevels;
            const stars = levelStars[level.id] || 0;

            return (
              <button
                key={level.id}
                onClick={() => unlocked && onSelectLevel(level.id)}
                disabled={!unlocked}
                className={`relative group rounded-xl overflow-hidden transition-all ${
                  unlocked
                    ? 'hover:scale-105 hover:shadow-xl active:scale-95 cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }`}
                style={{
                  aspectRatio: '3/4',
                }}
              >
                {/* Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${bgImages[level.background]})` }}
                >
                  <div className={`absolute inset-0 ${unlocked ? 'bg-black/40 group-hover:bg-black/20' : 'bg-black/70'} transition-all`} />
                </div>

                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-between p-3">
                  {/* Level Number */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      unlocked
                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {unlocked ? level.id : <Lock className="w-5 h-5" />}
                  </div>

                  {/* Name */}
                  <div className="text-center">
                    <div className={`text-sm font-bold ${unlocked ? 'text-white' : 'text-gray-400'}`}>
                      {level.name}
                    </div>
                    {unlocked && level.id === 1 && (
                      <div className="mt-1 rounded-full bg-green-500/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white">
                        Start here
                      </div>
                    )}
                    <div className="text-xs text-white/50 mt-1">
                      Target: {level.targetScore.toLocaleString()}
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= stars
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Hover glow */}
                {unlocked && (
                  <div className="absolute inset-0 border-2 border-yellow-400/0 group-hover:border-yellow-400/50 rounded-xl transition-all" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
