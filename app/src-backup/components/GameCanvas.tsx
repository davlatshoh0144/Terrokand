import { useEffect, useRef, useCallback, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import type { LevelConfig, GameSettings, GameState } from '../game/types';

interface GameCanvasProps {
  level: LevelConfig;
  settings: GameSettings;
  onStateChange: (state: GameState) => void;
  onLevelComplete: (score: number, stars: number) => void;
  onGameOver: (score: number) => void;
  onPause: () => void;
  isPaused: boolean;
}

export default function GameCanvas({
  level,
  settings,
  onStateChange,
  onLevelComplete,
  onGameOver,
  onPause,
  isPaused,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const joystickRef = useRef<HTMLDivElement>(null);
  const [countdown, setCountdown] = useState(3);
  const [objectiveText, setObjectiveText] = useState('');
  const [echoWorld, setEchoWorld] = useState<'present' | 'ancient'>('present');
  
  // Initialize game engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      canvas.width = 1280;
      canvas.height = 720;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Create engine
    const engine = new GameEngine(canvas, level, settings);
    engine.onStateChange = onStateChange;
    engine.onLevelComplete = onLevelComplete;
    engine.onGameOver = onGameOver;
    engineRef.current = engine;
    
    // Wait for assets then start
    engine.loadAssets().then(() => {
      engine.start();
    });

    const countdownTimer = setInterval(() => {
      const c = engine.getCountdown();
      setCountdown(c);
      setEchoWorld(engine.getEchoWorld());
      if (c <= 0) clearInterval(countdownTimer);
    }, 120);
    
    return () => {
      clearInterval(countdownTimer);
      engine.destroy();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [level, settings]);

  useEffect(() => {
    const gateHint = level.missionType === 'collect' ? 'Collect items and reach the gate' : level.missionDescription;
    setObjectiveText(gateHint);
  }, [level]);
  
  // Handle pause/resume
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    
    if (isPaused) {
      engine.pause();
    } else {
      engine.resume();
    }
  }, [isPaused]);
  
  // Mouse/touch controls
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const engine = engineRef.current;
    if (!engine || isPaused) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const y = (e.clientY - rect.top) * scaleY;
    
    engine.setTargetY(y - engine.player.height / 2);
  }, [isPaused]);
  
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const engine = engineRef.current;
    if (!engine || isPaused) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    const y = (e.clientY - rect.top) * scaleY;
    
    engine.setTargetY(y - engine.player.height / 2);
  }, [isPaused]);
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      
      switch (e.key) {
        case 'Escape':
        case 'p':
        case 'P':
          onPause();
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          engine.setTargetY(engine.player.y - 50);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          engine.setTargetY(engine.player.y + 50);
          break;
        case ' ':
        case 'Spacebar':
          e.preventDefault();
          engine.toggleEchoWorld();
          setEchoWorld(engine.getEchoWorld());
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPause]);
  
  return (
    <div ref={containerRef} className="game-container bg-black">
      <canvas
        ref={canvasRef}
        className="block mx-auto"
        style={{ 
          maxWidth: '100%', 
          maxHeight: '100vh',
          objectFit: 'contain',
          cursor: 'none',
        }}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
      />

      {countdown > 0 && (
        <div className="absolute inset-0 z-40 bg-black/55 flex items-center justify-center pointer-events-none">
          <div className="glass-panel rounded-2xl px-8 py-6 text-center max-w-[80%]">
            <p className="title-font text-3xl uzbek-text-gold">{level.name}</p>
            <p className="text-white/80 mt-2">{objectiveText}</p>
            <p className="text-[#ffd700] text-5xl font-black mt-3">{countdown}</p>
          </div>
        </div>
      )}

      <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded border ${echoWorld === 'ancient' ? 'bg-amber-300/30 border-amber-200 text-amber-100' : 'bg-stone-700/40 border-stone-300 text-stone-100'}`}>
          {echoWorld === 'ancient' ? 'Ancient World' : 'Present World'}
        </span>
        <button
          className="uzbek-button px-3 py-1 text-xs"
          onClick={() => {
            const engine = engineRef.current;
            if (!engine || isPaused) return;
            engine.toggleEchoWorld();
            setEchoWorld(engine.getEchoWorld());
          }}
        >
          Ancient Echo (Space)
        </button>
      </div>

      <div className="md:hidden absolute left-4 bottom-6 z-30">
        <div
          ref={joystickRef}
          className="w-24 h-24 rounded-full border border-white/30 bg-black/30 backdrop-blur-sm touch-none"
          onTouchStart={(e) => {
            const engine = engineRef.current;
            if (!engine) return;
            const t = e.touches[0];
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const dy = t.clientY - (rect.top + rect.height / 2);
            engine.setTargetY(engine.player.y + dy * 2.2);
          }}
          onTouchMove={(e) => {
            const engine = engineRef.current;
            if (!engine) return;
            const t = e.touches[0];
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const dy = t.clientY - (rect.top + rect.height / 2);
            engine.setTargetY(engine.player.y + dy * 2.2);
          }}
        />
      </div>
    </div>
  );
}
