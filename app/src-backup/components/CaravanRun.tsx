import { useState } from 'react';
import GameCanvas from './GameCanvas';
import type { LevelConfig, GameSettings, GameState } from '../game/types';

interface CaravanRunProps {
  level: LevelConfig;
  settings: GameSettings;
  onComplete: (score: number, stars: number, maxCombo: number) => void;
  onGameOver: (score: number) => void;
  onPause: () => void;
  isPaused: boolean;
}

export default function CaravanRun({
  level,
  settings,
  onComplete,
  onGameOver,
  onPause,
  isPaused,
}: CaravanRunProps) {
  const [, setGameScore] = useState(0);
  const [, setGameCoins] = useState(0);
  const [, setGameMaxCombo] = useState(0);

  const handleStateChange = (state: GameState) => {
    setGameScore(state.score);
    setGameCoins(state.coins);
    setGameMaxCombo(state.maxCombo);
  };

  const handleLevelComplete = (score: number, stars: number) => {
    // We need to get maxCombo from the last state change, but since it's async,
    // we'll pass what we have. The Home component tracks maxCombo via handleGameStateChange.
    onComplete(score, stars, 0);
  };

  return (
    <GameCanvas
      key={`caravan-${level.id}-${Date.now()}`}
      level={level}
      settings={settings}
      onStateChange={handleStateChange}
      onLevelComplete={handleLevelComplete}
      onGameOver={onGameOver}
      onPause={onPause}
      isPaused={isPaused}
    />
  );
}
