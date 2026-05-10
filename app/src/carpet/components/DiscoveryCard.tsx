import { useState } from 'react';
import { BookOpen, X, Star, MapPin } from 'lucide-react';
import type { DiscoveryCard as DiscoveryCardType } from '../game/types';
import { audioManager } from '../game/audio';

interface DiscoveryCardProps {
  card: DiscoveryCardType;
  onCollect: (bonusPoints: number) => void;
  onSkip: () => void;
}

export default function DiscoveryCard({ card, onCollect, onSkip }: DiscoveryCardProps) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => {
    setRevealed(true);
    audioManager.play('discovery');
  };

  const handleCollect = () => {
    onCollect(card.bonusPoints);
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/70 backdrop-blur-md">
      <div
        className={`relative max-w-lg w-full mx-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-yellow-500/20 shadow-2xl transition-all duration-700 ${
          revealed ? 'scale-100 opacity-100' : 'scale-95 opacity-90'
        }`}
      >
        {/* Image Header */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={card.image}
            alt={card.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          <button
            onClick={onSkip}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-all text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-yellow-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-yellow-500/30">
            <BookOpen className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-xs font-bold uppercase tracking-wider">Discovery</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">Silk Road Journal</span>
          </div>

          <h3
            className="text-2xl font-bold mb-3"
            style={{
              background: 'linear-gradient(90deg, #FFD166, #FF9F1C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {card.title}
          </h3>

          {!revealed ? (
            <div className="text-center py-6">
              <p className="text-white/60 mb-6">Uncover a piece of Uzbekistan&apos;s rich history...</p>
              <button
                onClick={handleReveal}
                className="py-3 px-8 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #9D4EDD, #7B2CBF)',
                  boxShadow: '0 4px 0 #5A189A, 0 6px 20px rgba(157,78,221,0.4)',
                }}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Read Discovery
                </div>
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-white/80 text-sm leading-relaxed mb-6">{card.content}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="text-yellow-400 font-bold">+{card.bonusPoints} bonus points!</span>
                </div>

                <button
                  onClick={handleCollect}
                  className="py-2 px-6 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    boxShadow: '0 4px 0 #14532d',
                  }}
                >
                  Collect & Continue
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
