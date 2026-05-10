import { useEffect, useRef, useState, useCallback } from 'react';
import { Home, RotateCcw, Search } from 'lucide-react';

interface GameItem {
  x: number;
  y: number;
  emoji: string;
  name: string;
  type: 'target' | 'distractor';
  collected: boolean;
  scale: number;
  bobOffset: number;
}

interface SamarkandHuntProps {
  onComplete: (score: number, stars: number) => void;
  onQuit: () => void;
}

const TARGETS = [
  { emoji: '🟦', name: 'Blue Tile' },
  { emoji: '📜', name: 'Ancient Scroll' },
  { emoji: '🏺', name: 'Ceramic Vase' },
  { emoji: '🌿', name: 'Silk Thread' },
  { emoji: '🪙', name: 'Gold Coin' },
];

const DISTRACTORS = [
  { emoji: '🍎', name: 'Apple' },
  { emoji: '🪨', name: 'Rock' },
  { emoji: '🧱', name: 'Brick' },
  { emoji: '📦', name: 'Box' },
  { emoji: '🍂', name: 'Leaf' },
  { emoji: '🧹', name: 'Broom' },
];

const FACTS = [
  'The Registan Square has three massive madrasahs built in the 15th-17th centuries!',
  'Samarkand\'s blue tiles are made with lapis lazuli pigment!',
  'The Ulugh Beg Madrasah in Registan was one of the best universities in the Muslim world!',
  'Amir Timur made Samarkand the capital of his empire in the 14th century!',
  'The name Samarkand means "Stone Fort" in old Persian!',
];

function generateItems(canvasW: number, canvasH: number): GameItem[] {
  const items: GameItem[] = [];
  const padding = 80;

  // Add targets
  for (let i = 0; i < TARGETS.length; i++) {
    items.push({
      x: padding + Math.random() * (canvasW - padding * 2),
      y: padding + Math.random() * (canvasH - padding * 2 - 100),
      emoji: TARGETS[i].emoji,
      name: TARGETS[i].name,
      type: 'target',
      collected: false,
      scale: 0.8 + Math.random() * 0.4,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }

  // Add distractors
  const numDistractors = 6 + Math.floor(Math.random() * 4);
  for (let i = 0; i < numDistractors; i++) {
    const d = DISTRACTORS[i % DISTRACTORS.length];
    let x = 0, y = 0, tooClose = false;
    let attempts = 0;
    do {
      x = padding + Math.random() * (canvasW - padding * 2);
      y = padding + Math.random() * (canvasH - padding * 2 - 100);
      tooClose = items.some((it) => Math.hypot(it.x - x, it.y - y) < 60);
      attempts++;
    } while (tooClose && attempts < 50);

    items.push({
      x,
      y,
      emoji: d.emoji,
      name: d.name,
      type: 'distractor',
      collected: false,
      scale: 0.8 + Math.random() * 0.4,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }

  return items;
}

export default function SamarkandHunt({ onComplete, onQuit }: SamarkandHuntProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<GameItem[]>([]);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; emoji: string }[]>([]);
  const scoreRef = useRef(0);
  const timeLeftRef = useRef(60);
  const targetsFoundRef = useRef(0);
  const animFrameRef = useRef(0);
  const gameOverRef = useRef(false);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [targetsFound, setTargetsFound] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [fact, setFact] = useState('');
  const [showFact, setShowFact] = useState(false);
  const [wrongItem, setWrongItem] = useState('');
  const [showWrong, setShowWrong] = useState(false);

  const startGame = useCallback(() => {
    itemsRef.current = generateItems(1280, 720);
    particlesRef.current = [];
    scoreRef.current = 0;
    timeLeftRef.current = 60;
    targetsFoundRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setTimeLeft(60);
    setTargetsFound(0);
    setGameOver(false);
    setShowFact(false);
    setShowWrong(false);
  }, []);

  useEffect(() => {
    startGame();
    const img = new Image();
    img.src = './assets/bg-samarkand.jpg';
    img.onload = () => { bgImageRef.current = img; };
  }, [startGame]);

  useEffect(() => {
    if (gameOver) return;
    const timer = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timer);
        endGame();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [gameOver]);

  const endGame = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameOver(true);
    cancelAnimationFrame(animFrameRef.current);
    const finalScore = scoreRef.current + targetsFoundRef.current * 200;
    const stars = finalScore >= 1200 ? 3 : finalScore >= 700 ? 2 : finalScore >= 300 ? 1 : 0;
    setTimeout(() => onComplete(finalScore, stars), 2000);
  }, [onComplete]);

  // Canvas game loop
  useEffect(() => {
    if (gameOver) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const W = 1280;
    const H = 720;
    canvas.width = W;
    canvas.height = H;

    const resize = () => {
      const c = containerRef.current;
      if (!c) return;
      const r = c.getBoundingClientRect();
      canvas.style.width = `${r.width}px`;
      canvas.style.height = `${r.height}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      if (gameOverRef.current) return;
      ctx.clearRect(0, 0, W, H);

      // Background
      const bg = bgImageRef.current;
      if (bg) {
        const scale = H / bg.height;
        const sw = bg.width * scale;
        ctx.drawImage(bg, (W - sw) / 2, 0, sw, H);
      } else {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1a0a4a');
        grad.addColorStop(1, '#c9a855');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      // Darken background slightly
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(0, 0, W, H);

      const time = performance.now() / 1000;

      // Draw items
      for (const item of itemsRef.current) {
        if (item.collected) continue;
        const bob = Math.sin(time * 2 + item.bobOffset) * 5;
        const s = item.scale * (1 + Math.sin(time * 3 + item.bobOffset) * 0.05);

        ctx.save();
        ctx.translate(item.x, item.y + bob);
        ctx.scale(s, s);

        // Glow for targets
        if (item.type === 'target') {
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 15;
        }

        ctx.font = '40px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.emoji, 0, 0);
        ctx.restore();

        // Label
        ctx.save();
        ctx.font = '12px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(item.name, item.x, item.y + bob + 30);
        ctx.restore();
      }

      // Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life -= 0.02;
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.font = '24px serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.emoji, p.x, p.y);
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [gameOver]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || gameOverRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    const scaleY = 720 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    for (const item of itemsRef.current) {
      if (item.collected) continue;
      const dist = Math.hypot(item.x - clickX, item.y - clickY);
      if (dist < 40) {
        item.collected = true;

        // Spawn particles
        for (let i = 0; i < 6; i++) {
          particlesRef.current.push({
            x: item.x,
            y: item.y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6 - 2,
            life: 1,
            emoji: item.type === 'target' ? '✨' : '💨',
          });
        }

        if (item.type === 'target') {
          scoreRef.current += 150;
          targetsFoundRef.current += 1;
          setScore(scoreRef.current);
          setTargetsFound(targetsFoundRef.current);
          setFact(FACTS[Math.min(targetsFoundRef.current - 1, FACTS.length - 1)]);
          setShowFact(true);
          setShowWrong(false);
          setTimeout(() => setShowFact(false), 3000);

          if (targetsFoundRef.current >= TARGETS.length) {
            endGame();
          }
        } else {
          scoreRef.current = Math.max(0, scoreRef.current - 50);
          setScore(scoreRef.current);
          setWrongItem(`That's a ${item.name}! Not what we need.`);
          setShowWrong(true);
          setShowFact(false);
          setTimeout(() => setShowWrong(false), 2000);
        }
        break;
      }
    }
  }, [endGame]);

  return (
    <div className="game-container bg-black relative" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="block mx-auto"
        style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain', cursor: 'crosshair' }}
        onPointerDown={handlePointerDown}
      />

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
        <div className="glass-panel-light rounded-lg px-4 py-2">
          <p className="text-[#ffd700] text-lg font-bold">Score: {score}</p>
        </div>
        <div className="glass-panel-light rounded-lg px-4 py-2 flex items-center gap-2">
          <Search className="w-5 h-5 text-[#00ccff]" />
          <p className="text-white text-lg font-bold">{targetsFound} / {TARGETS.length}</p>
        </div>
        <div className="glass-panel-light rounded-lg px-4 py-2">
          <p className={`text-lg font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>
            Time: {timeLeft}s
          </p>
        </div>
      </div>

      {/* Mission text */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="glass-panel rounded-lg px-4 py-2 text-center">
          <p className="text-[#d4a017] text-sm font-bold">🦜 Find the lost treasures of Registan!</p>
        </div>
      </div>

      {/* Fact popup */}
      {showFact && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 animate-float">
          <div className="glass-panel rounded-xl p-4 max-w-md text-center border-2 border-[#d4a017]/50">
            <p className="text-[#ffd700] text-sm font-bold mb-1">🎓 Did you know?</p>
            <p className="text-white text-sm">{fact}</p>
          </div>
        </div>
      )}

      {/* Wrong item popup */}
      {showWrong && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <div className="glass-panel rounded-xl px-4 py-2 text-center border border-red-400/50">
            <p className="text-red-300 text-sm">{wrongItem}</p>
          </div>
        </div>
      )}

      {/* Game Over overlay */}
      {gameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="glass-panel rounded-2xl p-8 text-center animate-float max-w-sm">
            <h3 className="title-font text-3xl font-bold uzbek-text-gold mb-2">
              {targetsFound >= TARGETS.length ? 'Registan Restored!' : 'Time\'s Up!'}
            </h3>
            <p className="text-white text-lg font-bold mb-1">Score: {score.toLocaleString()}</p>
            <p className="text-[#00a8cc] text-sm mb-4">
              Found {targetsFound} of {TARGETS.length} treasures
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={startGame} className="uzbek-button flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span>Replay</span>
              </button>
              <button onClick={onQuit} className="uzbek-button flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span>Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
