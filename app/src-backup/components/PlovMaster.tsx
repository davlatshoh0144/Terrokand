import { useEffect, useRef, useState, useCallback } from 'react';
import { Home, RotateCcw } from 'lucide-react';

interface FallingItem {
  x: number;
  y: number;
  speed: number;
  emoji: string;
  type: 'good' | 'bad';
  active: boolean;
}

interface PlovMasterProps {
  onComplete: (score: number, stars: number) => void;
  onQuit: () => void;
}

const GOOD_ITEMS = ['🍚', '🥕', '🥩', '🧅', '🫒'];
const BAD_ITEMS = ['🗑️', '🐛', '🧼', '🔥'];

export default function PlovMaster({ onComplete, onQuit }: PlovMasterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<FallingItem[]>([]);
  const potXRef = useRef(640);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const timeLeftRef = useRef(60);
  const spawnTimerRef = useRef(0);
  const animFrameRef = useRef(0);
  const gameOverRef = useRef(false);

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);

  const startGame = useCallback(() => {
    itemsRef.current = [];
    potXRef.current = 640;
    scoreRef.current = 0;
    livesRef.current = 3;
    timeLeftRef.current = 60;
    spawnTimerRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setLives(3);
    setTimeLeft(60);
    setGameOver(false);
  }, []);

  useEffect(() => {
    startGame();
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

    const finalScore = scoreRef.current;
    const stars = finalScore >= 1500 ? 3 : finalScore >= 800 ? 2 : finalScore >= 300 ? 1 : 0;
    setTimeout(() => onComplete(finalScore, stars), 1500);
  }, [onComplete]);

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

    const POT_W = 120;
    const POT_H = 80;

    const loop = () => {
      if (gameOverRef.current) return;
      ctx.clearRect(0, 0, W, H);

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#2a1810');
      grad.addColorStop(1, '#1a0a05');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Spawn items
      spawnTimerRef.current++;
      const spawnRate = Math.max(20, 50 - Math.floor((60 - timeLeftRef.current) / 3));
      if (spawnTimerRef.current >= spawnRate) {
        spawnTimerRef.current = 0;
        const isBad = Math.random() < 0.3;
        itemsRef.current.push({
          x: 80 + Math.random() * (W - 160),
          y: -40,
          speed: 3 + Math.random() * 4 + (60 - timeLeftRef.current) * 0.05,
          emoji: isBad ? BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)] : GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)],
          type: isBad ? 'bad' : 'good',
          active: true,
        });
      }

      // Update & draw items
      for (const item of itemsRef.current) {
        if (!item.active) continue;
        item.y += item.speed;

        // Draw
        ctx.font = '36px serif';
        ctx.textAlign = 'center';
        ctx.fillText(item.emoji, item.x, item.y);

        // Collision with pot
        const potY = H - 100;
        if (
          item.y >= potY - 20 &&
          item.y <= potY + POT_H &&
          item.x >= potXRef.current - POT_W / 2 &&
          item.x <= potXRef.current + POT_W / 2
        ) {
          item.active = false;
          if (item.type === 'good') {
            scoreRef.current += 100;
            setScore(scoreRef.current);
          } else {
            livesRef.current -= 1;
            setLives(livesRef.current);
            if (livesRef.current <= 0) {
              endGame();
              return;
            }
          }
        }

        // Missed good items
        if (item.y > H + 40 && item.type === 'good' && item.active) {
          item.active = false;
          scoreRef.current = Math.max(0, scoreRef.current - 50);
          setScore(scoreRef.current);
        }
      }

      // Remove inactive
      itemsRef.current = itemsRef.current.filter((i) => i.active && i.y < H + 50);

      // Draw pot
      ctx.font = '80px serif';
      ctx.textAlign = 'center';
      ctx.fillText('🍲', potXRef.current, H - 40);

      // Draw ground
      ctx.fillStyle = '#3d2817';
      ctx.fillRect(0, H - 20, W, 20);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [gameOver, endGame]);

  // Pointer controls
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas || gameOverRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 1280 / rect.width;
    potXRef.current = Math.max(80, Math.min(1200, (e.clientX - rect.left) * scaleX));
  }, []);

  return (
    <div className="game-container bg-black relative" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="block mx-auto"
        style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain', cursor: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
      />

      {/* HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between pointer-events-none">
        <div className="glass-panel-light rounded-lg px-4 py-2">
          <p className="text-[#ffd700] text-xl font-bold">Score: {score}</p>
        </div>
        <div className="glass-panel-light rounded-lg px-4 py-2">
          <p className={`text-xl font-bold ${timeLeft < 10 ? 'text-red-400' : 'text-white'}`}>
            Time: {timeLeft}s
          </p>
        </div>
        <div className="glass-panel-light rounded-lg px-4 py-2">
          <p className="text-red-400 text-xl font-bold">{'❤'.repeat(lives)}</p>
        </div>
      </div>

      {/* Game Over overlay */}
      {gameOver && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="glass-panel rounded-2xl p-8 text-center animate-float">
            <h3 className="title-font text-3xl font-bold uzbek-text-gold mb-2">Plov Served!</h3>
            <p className="text-white text-2xl font-bold mb-4">Score: {score.toLocaleString()}</p>
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
