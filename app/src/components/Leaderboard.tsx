import { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Star, Medal } from 'lucide-react';
import type { LeaderboardEntry } from '../game/types';

interface LeaderboardProps {
  onBack: () => void;
}

export default function Leaderboard({ onBack }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'week' | 'today'>('all');
  
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('silkroad_leaderboard') || '[]');
    
    const now = new Date();
    const filtered = stored.filter((entry: LeaderboardEntry) => {
      const entryDate = new Date(entry.date);
      
      switch (filter) {
        case 'today':
          return entryDate.toDateString() === now.toDateString();
        case 'week': {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return entryDate >= weekAgo;
        }
        default:
          return true;
      }
    });
    
    setEntries(filtered.slice(0, 20));
  }, [filter]);
  
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Medal className="w-6 h-6 text-[#ffd700]" />;
      case 1:
        return <Medal className="w-6 h-6 text-[#c0c0c0]" />;
      case 2:
        return <Medal className="w-6 h-6 text-[#cd7f32]" />;
      default:
        return <span className="text-white/50 text-sm font-bold w-6 text-center">{index + 1}</span>;
    }
  };
  
  const getRowStyle = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-gradient-to-r from-[#ffd700]/20 to-transparent border-[#ffd700]/40';
      case 1:
        return 'bg-gradient-to-r from-[#c0c0c0]/10 to-transparent border-[#c0c0c0]/30';
      case 2:
        return 'bg-gradient-to-r from-[#cd7f32]/10 to-transparent border-[#cd7f32]/30';
      default:
        return 'glass-panel-light border-white/10';
    }
  };
  
  return (
    <div className="game-container uzbek-gradient-dark">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#d4a017]/10 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${20 + Math.random() * 60}px`,
              height: `${20 + Math.random() * 60}px`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
      
      {/* Decorative border */}
      <div className="absolute inset-4 border-2 border-[#d4a017]/20 rounded-2xl z-10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-20 h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-semibold">Back</span>
          </button>
          
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#d4a017]" />
            <h1 className="title-font text-3xl font-bold uzbek-text-gold">Leaderboard</h1>
          </div>
          
          <div className="w-20" />
        </div>
        
        {/* Filter tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {(['all', 'week', 'today'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === f
                  ? 'bg-[#d4a017] text-[#001a33]'
                  : 'glass-panel-light text-white/60 hover:text-white'
              }`}
            >
              {f === 'all' ? 'All Time' : f === 'week' ? 'This Week' : 'Today'}
            </button>
          ))}
        </div>
        
        {/* Entries */}
        <div className="flex-1 overflow-auto">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40">
              <Trophy className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-semibold">No scores yet</p>
              <p className="text-sm">Complete a level to see your score here!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${getRowStyle(index)} transition-all hover:scale-[1.02]`}
                >
                  {/* Rank */}
                  <div className="w-8 flex justify-center">
                    {getRankIcon(index)}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <p className="text-white font-semibold">{entry.name}</p>
                    <p className="text-white/50 text-xs">{entry.level}</p>
                  </div>
                  
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= (entry.stars || 0)
                            ? 'text-[#ffd700] fill-[#ffd700]'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Score */}
                  <div className="text-right">
                    <p className="title-font text-xl font-bold text-[#d4a017]">
                      {entry.score.toLocaleString()}
                    </p>
                    <p className="text-white/30 text-xs">
                      {new Date(entry.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
