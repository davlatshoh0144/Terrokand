import { useState } from 'react';
import { ArrowLeft, Lock, Star, MapPin } from 'lucide-react';
import { LEVELS } from '../game/levels';

interface LevelSelectProps {
  onSelectLevel: (levelId: number) => void;
  onBack: () => void;
  unlockedLevels: number[];
  levelStars: Record<number, number>;
  levelScores: Record<number, number>;
}

export default function LevelSelect({
  onSelectLevel,
  onBack,
  unlockedLevels,
  levelStars,
  levelScores,
}: LevelSelectProps) {
  const [hoveredLevel, setHoveredLevel] = useState<number | null>(null);
  
  const getLevelPosition = (index: number) => {
    const positions = [
      { x: '25%', y: '65%' },  // Samarkand
      { x: '50%', y: '45%' },  // Bukhara
      { x: '75%', y: '30%' },  // Khiva
    ];
    return positions[index] || { x: '50%', y: '50%' };
  };
  
  return (
    <div className="game-container relative overflow-hidden">
      <style>{`
        @keyframes caravanWalk {
          0% { transform: translateX(-30vw); }
          100% { transform: translateX(130vw); }
        }
      `}</style>

      {/* Silk Road desert sunset sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1e1238] via-[#3d2818] to-[#5a3a1a]" />

      {/* Distant mountains */}
      <div className="absolute bottom-[18%] left-0 right-0 h-[30%] z-0 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
          <polygon points="0,200 0,90 80,70 150,100 220,60 300,85 380,55 450,75 520,50 600,70 680,45 750,65 820,40 900,60 1000,45 1000,200" fill="#1a0f1c" opacity="0.5" />
        </svg>
      </div>

      {/* Mid mountains */}
      <div className="absolute bottom-[10%] left-0 right-0 h-[22%] z-0 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 160">
          <polygon points="0,160 0,100 60,75 130,95 200,65 280,85 350,55 420,80 500,50 580,75 650,45 720,70 800,40 880,65 950,50 1000,70 1000,160" fill="#140c18" opacity="0.7" />
        </svg>
      </div>

      {/* Sand dunes */}
      <div className="absolute bottom-0 left-0 right-0 h-[12%] z-0 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 100">
          <path d="M0,100 Q80,40 180,70 Q280,30 400,60 Q520,20 640,55 Q760,25 880,60 Q950,35 1000,50 L1000,100 Z" fill="#0f0a14" opacity="0.8" />
        </svg>
      </div>

      {/* Mosque silhouettes — on the horizon */}
      <div className="absolute bottom-[32%] left-[8%] z-0 opacity-50 pointer-events-none">
        <div className="flex items-end gap-1">
          <div className="w-1.5 h-14 bg-[#1a0f1c]" />
          <div className="w-7 h-7 rounded-t-full bg-[#1a0f1c]" />
          <div className="w-1.5 h-18 bg-[#1a0f1c]" />
          <div className="w-9 h-9 rounded-t-full bg-[#1a0f1c]" />
          <div className="w-1.5 h-12 bg-[#1a0f1c]" />
        </div>
      </div>
      <div className="absolute bottom-[30%] right-[12%] z-0 opacity-40 pointer-events-none">
        <div className="flex items-end gap-1">
          <div className="w-1.5 h-10 bg-[#1a0f1c]" />
          <div className="w-5 h-5 rounded-t-full bg-[#1a0f1c]" />
          <div className="w-1.5 h-14 bg-[#1a0f1c]" />
        </div>
      </div>
      <div className="absolute bottom-[28%] left-[55%] z-0 opacity-35 pointer-events-none">
        <div className="flex items-end gap-0.5">
          <div className="w-1 h-8 bg-[#1a0f1c]" />
          <div className="w-4 h-4 rounded-t-full bg-[#1a0f1c]" />
          <div className="w-1 h-10 bg-[#1a0f1c]" />
        </div>
      </div>

      {/* Caravan — golden silhouettes walking across the desert */}
      <div className="absolute bottom-[20%] left-0 w-full z-30 pointer-events-none overflow-hidden">
        <div className="flex items-end gap-14" style={{ animation: 'caravanWalk 50s linear infinite' }}>
          {[0.7, 0.5, 0.7, 0.5, 0.7].map((op, i) => (
            <div key={i} className="relative" style={{ opacity: op, width: '72px', height: '50px', filter: 'drop-shadow(0 0 6px rgba(212,160,23,0.4))' }}>
              <div className="absolute bottom-[9px] left-[9px] w-[38px] h-[20px] bg-[#c4956a] rounded-full" />
              <div className="absolute bottom-[20px] left-[18px] w-[18px] h-[18px] bg-[#c4956a] rounded-full" />
              <div className="absolute bottom-[18px] left-[40px] w-[6px] h-[20px] bg-[#c4956a] rounded-sm" style={{ transform: 'rotate(15deg)' }} />
              <div className="absolute bottom-[32px] left-[45px] w-[11px] h-[10px] bg-[#c4956a] rounded-full" />
              <div className="absolute bottom-0 left-[14px] w-[3px] h-[11px] bg-[#c4956a] rounded-sm" />
              <div className="absolute bottom-0 left-[24px] w-[3px] h-[11px] bg-[#c4956a] rounded-sm" />
              <div className="absolute bottom-0 left-[32px] w-[3px] h-[11px] bg-[#c4956a] rounded-sm" />
              <div className="absolute bottom-0 left-[42px] w-[3px] h-[11px] bg-[#c4956a] rounded-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Subtle stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#ffeaa7] animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 40}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
              opacity: 0.4,
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
          
          <h1 className="title-font text-3xl md:text-4xl font-bold uzbek-text-gold text-center">
            Choose Your Journey
          </h1>
          
          <div className="w-20" /> {/* Spacer */}
        </div>
        
        {/* Map Area */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Stylized map background */}
          <div className="absolute inset-4 rounded-xl overflow-hidden">
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `
                  radial-gradient(ellipse at 20% 65%, rgba(0, 102, 161, 0.4) 0%, transparent 50%),
                  radial-gradient(ellipse at 35% 50%, rgba(212, 160, 23, 0.3) 0%, transparent 50%),
                  radial-gradient(ellipse at 55% 35%, rgba(0, 168, 204, 0.4) 0%, transparent 50%),
                  radial-gradient(ellipse at 70% 55%, rgba(201, 160, 40, 0.5) 0%, transparent 50%),
                  radial-gradient(ellipse at 85% 25%, rgba(74, 124, 89, 0.4) 0%, transparent 50%)
                `,
              }}
            />
            
            {/* Connection lines between levels */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#d4a017" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#c4956a" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <path
                d="M 25 65 Q 37 55 50 45 Q 62 37 75 30"
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="0.5"
                strokeDasharray="2 1"
                className="animate-pulse"
              />
            </svg>
          </div>
          
          {/* Level Pins */}
          {LEVELS.map((level, index) => {
            const pos = getLevelPosition(index);
            const isUnlocked = unlockedLevels.includes(level.id);
            const stars = levelStars[level.id] || 0;
            const score = levelScores[level.id] || 0;
            const isHovered = hoveredLevel === level.id;
            
            return (
              <div
                key={level.id}
                className="absolute"
                style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                onMouseEnter={() => setHoveredLevel(level.id)}
                onMouseLeave={() => setHoveredLevel(null)}
              >
                {/* Pin button */}
                <button
                  onClick={() => isUnlocked && onSelectLevel(level.id)}
                  disabled={!isUnlocked}
                  className={`
                    relative w-14 h-14 rounded-full flex items-center justify-center
                    font-bold text-lg transition-all duration-300
                    ${isUnlocked 
                      ? 'bg-gradient-to-br from-[#d4a017] to-[#ffd700] text-[#001a33] border-3 border-[#0066a1] shadow-lg shadow-[#d4a017]/40 hover:scale-125 cursor-pointer' 
                      : 'bg-gradient-to-br from-gray-600 to-gray-500 text-gray-300 border-3 border-gray-700 cursor-not-allowed'
                    }
                    ${isHovered && isUnlocked ? 'scale-125 shadow-xl shadow-[#d4a017]/60' : ''}
                  `}
                >
                  {isUnlocked ? (
                    <span>{level.id}</span>
                  ) : (
                    <Lock className="w-6 h-6" />
                  )}
                  
                  {/* Glow effect for unlocked */}
                  {isUnlocked && (
                    <div className="absolute inset-0 rounded-full bg-[#d4a017]/20 animate-ping" style={{ animationDuration: '3s' }} />
                  )}
                </button>
                
                {/* Level info card on hover */}
                {isHovered && (
                  <div 
                    className={`
                      absolute left-1/2 -translate-x-1/2 mt-3 w-64 rounded-xl
                      shadow-xl z-50 overflow-hidden
                      transition-all duration-300
                    `}
                    style={{ top: '100%' }}
                  >
                    {/* Background image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${level.backgroundImage})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/40" />
                    
                    <div className="relative z-10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-[#d4a017]" />
                      <h3 className="title-font text-lg font-bold text-white">{level.name}</h3>
                    </div>
                    <p className="text-[#00a8cc] text-sm font-semibold mb-1">{level.location}</p>
                    <p className="text-white/80 text-xs mb-3">{level.description}</p>
                    
                    {isUnlocked && (
                      <>
                        {/* Stars */}
                        <div className="flex gap-1 mb-2">
                          {[1, 2, 3].map((s) => (
                            <Star
                              key={s}
                              className={`w-5 h-5 ${s <= stars ? 'text-[#ffd700] fill-[#ffd700]' : 'text-white/30'}`}
                            />
                          ))}
                        </div>
                        
                        {score > 0 && (
                          <p className="text-[#d4a017] text-sm font-semibold">
                            Best: {score.toLocaleString()} pts
                          </p>
                        )}
                      </>
                    )}
                    
                    {!isUnlocked && (
                      <p className="text-white/50 text-xs italic">
                        Complete previous level to unlock
                      </p>
                    )}
                    </div>
                  </div>
                )}
                
                {/* Level name label */}
                <div className={`
                  absolute left-1/2 -translate-x-1/2 mt-1 text-center whitespace-nowrap
                  transition-all duration-300
                  ${isHovered ? 'opacity-0' : 'opacity-100'}
                `}
                style={{ top: '100%' }}
                >
                  <p className="text-white text-xs font-semibold drop-shadow-lg">{level.name}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Level Cards at bottom */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {LEVELS.map((level) => {
            const isUnlocked = unlockedLevels.includes(level.id);
            const stars = levelStars[level.id] || 0;
            
            return (
              <button
                key={level.id}
                onClick={() => isUnlocked && onSelectLevel(level.id)}
                disabled={!isUnlocked}
                className={`
                  level-card relative overflow-hidden h-28
                  ${!isUnlocked ? 'locked' : ''}
                `}
              >
                {/* Background image */}
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${level.backgroundImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
                
                <div className="relative z-10 h-full flex flex-col items-center justify-center p-2">
                  <span className={`
                    text-2xl font-bold title-font
                    ${isUnlocked ? 'text-[#d4a017]' : 'text-white/30'}
                  `}>
                    {level.id}
                  </span>
                  <p className={`text-xs mt-0.5 font-semibold ${isUnlocked ? 'text-white' : 'text-white/30'}`}>
                    {level.name}
                  </p>
                  <div className="flex justify-center gap-0.5 mt-1">
                    {[1, 2, 3].map((s) => (
                      <Star
                        key={s}
                        className={`w-3 h-3 ${s <= stars ? 'text-[#ffd700] fill-[#ffd700]' : 'text-white/20'}`}
                      />
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
