import { useEffect, useRef, useCallback } from 'react';
import { GameEngine, assetManager } from '../game/engine';
import { audioManager } from '../game/audio';

interface GameCanvasProps {
  onEngineReady: (engine: GameEngine) => void;
}

export default function GameCanvas({ onEngineReady }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const onEngineReadyRef = useRef(onEngineReady);

  useEffect(() => {
    onEngineReadyRef.current = onEngineReady;
  }, [onEngineReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const init = async () => {
      await assetManager.loadAll();
      await audioManager.init();

      const engine = new GameEngine(canvas);
      engineRef.current = engine;
      onEngineReadyRef.current(engine);

      // Initial render
      engine.render();
    };

    init();

    return () => {
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    const rect = canvas.getBoundingClientRect();
    engineRef.current.handleMouseMove(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const handleMouseLeave = useCallback(() => {
    engineRef.current?.handleMouseLeave();
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    engineRef.current.handleTouch(touch.clientX - rect.left, touch.clientY - rect.top);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    engineRef.current.handleTouch(touch.clientX - rect.left, touch.clientY - rect.top);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      engineRef.current?.handleKeyDown(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current?.handleKeyUp(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      engineRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
    />
  );
}
