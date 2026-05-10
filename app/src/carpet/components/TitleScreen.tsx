import { useState, useEffect } from 'react';
import { Play, BookOpen, Volume2, VolumeX, Music, Music2 } from 'lucide-react';
import { audioManager } from '../game/audio';

interface TitleScreenProps {
  onShowTutorial: () => void;
  onShowLevelSelect: () => void;
  highScore: number;
}

export default function TitleScreen({ onShowTutorial, onShowLevelSelect, highScore }: TitleScreenProps) {
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number; speed: number; opacity: number }>>([]);

  useEffect(() => {
    audioManager.playBGM('menu');
    audioManager.setSoundEnabled(soundOn);
    audioManager.setMusicEnabled(musicOn);
  }, [soundOn, musicOn]);

  useEffect(() => {
    // Create floating particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      speed: 0.3 + Math.random() * 0.7,
      opacity: 0.3 + Math.random() * 0.5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(./images/title-screen.jpg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
      </div>

      {/* Floating Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: `rgba(255, 215, 0, ${p.opacity})`,
            animation: `float ${3 + p.speed * 2}s ease-in-out infinite`,
            animationDelay: `${p.id * 0.2}s`,
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4">
        {/* Title */}
        <div className="text-center">
          <h1
            className="text-5xl md:text-7xl font-extrabold tracking-tight"
            style={{
              background: 'linear-gradient(180deg, #FFD166 0%, #FF9F1C 50%, #E76F51 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
            }}
          >
            Magic Carpet
          </h1>
          <h2
            className="text-2xl md:text-3xl font-bold mt-1 tracking-widest uppercase"
            style={{
              background: 'linear-gradient(90deg, #87CEEB, #48CAE4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
            }}
          >
            Silk Road Adventure
          </h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-400/60" />
            <span className="text-yellow-200/80 text-sm tracking-wider uppercase">Uzbekistan</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-400/60" />
          </div>
        </div>

        {/* Character Preview */}
        <div className="relative">
          <img
            src="./images/powerup-magnet.png"
            alt="Boy on Magic Carpet"
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl animate-bounce"
            style={{ animationDuration: '3s' }}
          />
          <div
            className="absolute -inset-4 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, rgba(157,78,221,0.3) 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-3 w-64">
          <button
            onClick={onShowLevelSelect}
            className="group relative w-full py-4 px-6 rounded-xl font-bold text-lg text-white overflow-hidden transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #E63946 0%, #D90429 100%)',
              boxShadow: '0 4px 0 #8B0000, 0 6px 20px rgba(217,4,41,0.4)',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
            <div className="flex items-center justify-center gap-3">
              <Play className="w-6 h-6 fill-white" />
              <span>Play Adventure</span>
            </div>
          </button>

          <button
            onClick={onShowTutorial}
            className="group w-full py-3 px-6 rounded-xl font-bold text-white overflow-hidden transition-all hover:scale-105 active:scale-95 bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
          >
            <div className="flex items-center justify-center gap-3">
              <BookOpen className="w-5 h-5" />
              <span>How to Play</span>
            </div>
          </button>

          {/* Audio Controls */}
          <div className="flex gap-2 justify-center mt-2">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className={`p-2 rounded-lg transition-all ${
                soundOn ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
              }`}
            >
              {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMusicOn(!musicOn)}
              className={`p-2 rounded-lg transition-all ${
                musicOn ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50'
              }`}
            >
              {musicOn ? <Music className="w-5 h-5" /> : <Music2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* High Score */}
        {highScore > 0 && (
          <div className="text-center">
            <div className="text-yellow-200/60 text-sm uppercase tracking-wider">Best Score</div>
            <div className="text-yellow-300 text-xl font-bold">{highScore.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Floating animation keyframes */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }
      `}</style>
    </div>
  );
}
