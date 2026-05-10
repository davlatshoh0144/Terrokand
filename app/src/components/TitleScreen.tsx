import { useState, useEffect, useRef } from 'react';

interface TitleScreenProps {
  onPlay: () => void;
  onContinue?: () => void;
  showContinue?: boolean;
  onRegistan: () => void;
  onArtifacts: () => void;
  onSettings: () => void;
  onHowToPlay: () => void;
  onQuit: () => void;
}

interface FloatingParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export default function TitleScreen({
  onPlay,
  onContinue,
  showContinue,
  onRegistan,
  onArtifacts,
  onSettings,
  onHowToPlay,
  onQuit,
}: TitleScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<FloatingParticle[]>([]);
  const [showContent] = useState(true);

  // Soft hover tick for menu buttons
  const playHoverSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(260, audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.035, audioCtx.currentTime + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {}
  };

  useEffect(() => {
    const particles: FloatingParticle[] = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight * 0.5,
        size: Math.random() < 0.8 ? 1 + Math.random() * 2 : 2 + Math.random() * 2,
        speed: 0.02 + Math.random() * 0.05,
        opacity: 0.3 + Math.random() * 0.7,
      });
    }
    particlesRef.current = particles;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationId: number;
    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw stars (subtle at dawn/dusk)
      for (const p of particlesRef.current) {
        p.y -= p.speed;
        if (p.y < -5) {
          p.y = h * 0.5 + 5;
          p.x = Math.random() * w;
        }
        ctx.save();
        ctx.globalAlpha = p.opacity * 0.5 * (0.5 + Math.sin(Date.now() / 2000 + p.x) * 0.5);
        ctx.fillStyle = '#ffeaa7';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'rgba(255,234,167,0.3)';
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="game-container relative overflow-hidden">
      <style>{`
        @keyframes balloonFloat {
          /* L-shaped trajectory with a tiny hump at the middle */
          0%   { transform: translateX(-20vw) translateY(35px)  rotate(-2deg); }
          20%  { transform: translateX(5vw)   translateY(-30px) rotate(-1deg); }
          25%  { transform: translateX(15vw)  translateY(-35px) rotate(0deg); }
          50%  { transform: translateX(50vw)  translateY(-40px) rotate(1deg); }
          75%  { transform: translateX(85vw)  translateY(-35px) rotate(0deg); }
          80%  { transform: translateX(95vw)  translateY(-15px) rotate(-1deg); }
          100% { transform: translateX(120vw) translateY(35px)  rotate(-2deg); }
        }
        @keyframes titleSign {
          0%   { transform: perspective(800px) rotateX(8deg) rotateY(-4deg) skewX(-2deg) scale(1)   translateX(0px); }
          25%  { transform: perspective(800px) rotateX(8deg) rotateY(-4deg) skewX(-2deg) scale(1.03) translateX(6px); }
          50%  { transform: perspective(800px) rotateX(8deg) rotateY(-4deg) skewX(-2deg) scale(1)   translateX(0px); }
          75%  { transform: perspective(800px) rotateX(8deg) rotateY(-4deg) skewX(-2deg) scale(0.97) translateX(-6px); }
          100% { transform: perspective(800px) rotateX(8deg) rotateY(-4deg) skewX(-2deg) scale(1)   translateX(0px); }
        }
      `}</style>

      {/* Title background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(./images/title-bg.jpg)' }}
      />
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Balloon — background decoration */}
      <img
        src="./assets/balloon.png"
        alt=""
        className="absolute z-0 pointer-events-none"
        style={{
          top: '34%',
          width: 'clamp(48px, 7vw, 90px)',
          animation: 'balloonFloat 50s linear infinite',
          opacity: 0.8,
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))',
        }}
      />

      {/* Stars canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Floating pixel clouds */}
      <div className="absolute top-16 left-[25%] opacity-20 animate-float" style={{ animationDuration: '10s' }}>
        <div className="flex">
          <div className="w-8 h-4 bg-white/30" />
          <div className="w-6 h-6 bg-white/30 -mt-2" />
          <div className="w-10 h-4 bg-white/30" />
          <div className="w-4 h-4 bg-white/30" />
        </div>
      </div>
      <div className="absolute top-24 right-[15%] opacity-15 animate-float" style={{ animationDuration: '14s', animationDelay: '3s' }}>
        <div className="flex">
          <div className="w-6 h-3 bg-white/20" />
          <div className="w-8 h-5 bg-white/20 -mt-2" />
          <div className="w-5 h-3 bg-white/20" />
        </div>
      </div>

      {/* PIXEL-ART MOUNTAINS — Terraria-style stepped silhouettes */}
      <div className="absolute bottom-0 left-0 right-0 h-[38%] z-0 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 300">
          <path d="M0,300 L0,180 L20,180 L20,160 L40,160 L40,140 L60,140 L60,150 L80,150 L80,130 L100,130 L100,110 L130,110 L130,130 L150,130 L150,100 L180,100 L180,120 L200,120 L200,90 L230,90 L230,110 L260,110 L260,80 L290,80 L290,100 L320,100 L320,120 L350,120 L350,90 L380,90 L380,110 L410,110 L410,130 L440,130 L440,100 L470,100 L470,120 L500,120 L500,80 L530,80 L530,100 L560,100 L560,120 L590,120 L590,90 L620,90 L620,110 L650,110 L650,130 L680,130 L680,100 L710,100 L710,120 L740,120 L740,90 L770,90 L770,110 L800,110 L800,130 L830,130 L830,100 L860,100 L860,120 L890,120 L890,140 L920,140 L920,120 L950,120 L950,140 L1000,140 L1000,300 Z" fill="#1e0f2e" opacity="0.55" />
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[28%] z-0 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 240">
          <path d="M0,240 L0,150 L15,150 L15,130 L30,130 L30,110 L50,110 L50,120 L65,120 L65,100 L85,100 L85,80 L110,80 L110,100 L130,100 L130,70 L155,70 L155,90 L175,90 L175,110 L200,110 L200,80 L225,80 L225,100 L250,100 L250,120 L275,120 L275,90 L300,90 L300,110 L325,110 L325,130 L350,130 L350,100 L375,100 L375,120 L400,120 L400,140 L425,140 L425,110 L450,110 L450,130 L475,130 L475,150 L500,150 L500,120 L525,120 L525,140 L550,140 L550,160 L575,160 L575,130 L600,130 L600,150 L625,150 L625,170 L650,170 L650,140 L675,140 L675,160 L700,160 L700,180 L725,180 L725,150 L750,150 L750,170 L775,170 L775,190 L800,190 L800,160 L825,160 L825,180 L850,180 L850,200 L875,200 L875,170 L900,170 L900,190 L925,190 L925,210 L950,210 L950,190 L975,190 L975,210 L1000,210 L1000,240 Z" fill="#14081f" opacity="0.8" />
        </svg>
      </div>

      {/* FOREGROUND DUNES — dark, dramatic */}
      <div className="absolute bottom-0 left-0 right-0 h-[16%] z-0 pointer-events-none">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 150">
          <path d="M0,150 L0,80 L30,80 L30,70 L60,70 L60,60 L100,60 L100,70 L140,70 L140,55 L180,55 L180,65 L220,65 L220,50 L260,50 L260,60 L300,60 L300,70 L340,70 L340,55 L380,55 L380,65 L420,65 L420,50 L460,50 L460,60 L500,60 L500,70 L540,70 L540,55 L580,55 L580,65 L620,65 L620,50 L660,50 L660,60 L700,60 L700,70 L740,70 L740,55 L780,55 L780,65 L820,65 L820,50 L860,50 L860,60 L900,60 L900,70 L940,70 L940,60 L1000,60 L1000,150 Z" fill="#0a0510" opacity="0.95" />
        </svg>
      </div>

      {/* CARAVAN — big, visible camels with warm lantern glow */}
      <div className="absolute bottom-[5%] left-[8%] z-0 pointer-events-none">
        <div className="flex items-end gap-8">
          {[1, 0.7, 1, 0.7].map((op, i) => (
            <div key={i} className="relative" style={{ opacity: op, width: '64px', height: '44px' }}>
              {/* Body */}
              <div className="absolute bottom-[7px] left-[7px] w-[34px] h-[16px] bg-[#1a0f08] rounded-full" />
              {/* Hump */}
              <div className="absolute bottom-[16px] left-[15px] w-[16px] h-[16px] bg-[#1a0f08] rounded-full" />
              {/* Neck */}
              <div className="absolute bottom-[14px] left-[36px] w-[5px] h-[18px] bg-[#1a0f08] rounded-sm" style={{ transform: 'rotate(12deg)' }} />
              {/* Head */}
              <div className="absolute bottom-[26px] left-[40px] w-[10px] h-[9px] bg-[#1a0f08] rounded-full" />
              {/* Legs */}
              <div className="absolute bottom-0 left-[11px] w-[3px] h-[9px] bg-[#1a0f08] rounded-sm" />
              <div className="absolute bottom-0 left-[21px] w-[3px] h-[9px] bg-[#1a0f08] rounded-sm" />
              <div className="absolute bottom-0 left-[28px] w-[3px] h-[9px] bg-[#1a0f08] rounded-sm" />
              <div className="absolute bottom-0 left-[38px] w-[3px] h-[9px] bg-[#1a0f08] rounded-sm" />
              {/* Lantern glow on lead camel */}
              {i === 0 && (
                <div className="absolute bottom-[28px] left-[44px] w-3 h-3 bg-[#d4a017] rounded-full" style={{ boxShadow: '0 0 8px 3px rgba(212,160,23,0.6)', opacity: 0.8 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECOND CARAVAN — smaller, farther back on right */}
      <div className="absolute bottom-[12%] right-[15%] z-0 pointer-events-none opacity-40">
        <div className="flex items-end gap-5">
          {[0.8, 0.6, 0.8].map((op, i) => (
            <div key={i} className="relative" style={{ opacity: op, width: '44px', height: '30px' }}>
              <div className="absolute bottom-[5px] left-[5px] w-[24px] h-[11px] bg-[#1a0f08] rounded-full" />
              <div className="absolute bottom-[11px] left-[11px] w-[11px] h-[11px] bg-[#1a0f08] rounded-full" />
              <div className="absolute bottom-[10px] left-[25px] w-[4px] h-[12px] bg-[#1a0f08] rounded-sm" style={{ transform: 'rotate(12deg)' }} />
              <div className="absolute bottom-[18px] left-[28px] w-[7px] h-[6px] bg-[#1a0f08] rounded-full" />
              <div className="absolute bottom-0 left-[8px] w-[2.5px] h-[6px] bg-[#1a0f08] rounded-sm" />
              <div className="absolute bottom-0 left-[15px] w-[2.5px] h-[6px] bg-[#1a0f08] rounded-sm" />
              <div className="absolute bottom-0 left-[20px] w-[2.5px] h-[6px] bg-[#1a0f08] rounded-sm" />
              <div className="absolute bottom-0 left-[27px] w-[2.5px] h-[6px] bg-[#1a0f08] rounded-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className={`relative z-10 flex flex-col items-center justify-center h-full transition-all duration-1000 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

        {/* Game Title — Gravity Falls style */}
        <div className="absolute top-[6%] left-0 right-0 text-center pointer-events-none">
          <h1
            className="text-[7rem] md:text-[9rem] lg:text-[11rem] tracking-wider leading-none"
            style={{
              fontFamily: "'Bangers', cursive",
              WebkitTextStroke: '3px #1a0f08',
              background: 'linear-gradient(180deg, #e8d5a3 0%, #c4a35a 40%, #a67c3b 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              textShadow: '4px 4px 0 #8B4513, 8px 8px 0 #2a1506, 12px 12px 18px rgba(0,0,0,0.6)',
            }}
          >
            TERROKAND
          </h1>
        </div>

        {/* Menu Buttons */}
        <div className="flex flex-col gap-2">
          {showContinue && onContinue && (
            <button onClick={onContinue} onMouseEnter={playHoverSound} className="text-2xl md:text-3xl font-bold text-[#b8b0a8] hover:text-[#f0e6d8] hover:scale-110 transition-all duration-200 tracking-[0.18em]" style={{ fontFamily: "'Cinzel', serif", textShadow: '2px 2px 0 #2a1a0f' }}>
              Continue
            </button>
          )}

          <button onClick={onPlay} onMouseEnter={playHoverSound} className="text-2xl md:text-3xl font-bold text-[#f0e6d8] hover:text-white hover:scale-110 transition-all duration-200 tracking-[0.18em]" style={{ fontFamily: "'Cinzel', serif", textShadow: '2px 2px 0 #2a1a0f' }}>
            Start Flying
          </button>

          <button onClick={onRegistan} onMouseEnter={playHoverSound} className="text-2xl md:text-3xl font-bold text-[#b8b0a8] hover:text-[#f0e6d8] hover:scale-110 transition-all duration-200 tracking-[0.18em]" style={{ fontFamily: "'Cinzel', serif", textShadow: '2px 2px 0 #2a1a0f' }}>
            Registan
          </button>

          <button onClick={onArtifacts} onMouseEnter={playHoverSound} className="text-2xl md:text-3xl font-bold text-[#b8b0a8] hover:text-[#f0e6d8] hover:scale-110 transition-all duration-200 tracking-[0.18em]" style={{ fontFamily: "'Cinzel', serif", textShadow: '2px 2px 0 #2a1a0f' }}>
            Artifacts
          </button>

          <button onClick={onSettings} onMouseEnter={playHoverSound} className="text-2xl md:text-3xl font-bold text-[#b8b0a8] hover:text-[#f0e6d8] hover:scale-110 transition-all duration-200 tracking-[0.18em]" style={{ fontFamily: "'Cinzel', serif", textShadow: '2px 2px 0 #2a1a0f' }}>
            Settings
          </button>

          <button onClick={onHowToPlay} onMouseEnter={playHoverSound} className="text-2xl md:text-3xl font-bold text-[#b8b0a8] hover:text-[#f0e6d8] hover:scale-110 transition-all duration-200 tracking-[0.18em]" style={{ fontFamily: "'Cinzel', serif", textShadow: '2px 2px 0 #2a1a0f' }}>
            How to Play
          </button>

          <button onClick={onQuit} onMouseEnter={playHoverSound} className="text-xl md:text-2xl font-bold text-[#9f958b] hover:text-[#f0e6d8] hover:scale-110 transition-all duration-200 tracking-[0.18em]" style={{ fontFamily: "'Cinzel', serif", textShadow: '2px 2px 0 #2a1a0f' }}>
            Quit Game
          </button>
        </div>
      </div>
    </div>
  );
}
