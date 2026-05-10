import { useState, useCallback, useEffect } from 'react';
import type { GameState, GameSettings, RewardItem } from '../game/types';
import { LEVELS } from '../game/levels';
import { getRandomRewards, clearRewards } from '../game/rewards';
import TitleScreen from '../components/TitleScreen';
import LevelSelect from '../components/LevelSelect';
import GameCanvas from '../components/GameCanvas';
import PauseMenu from '../components/PauseMenu';
import LevelComplete from '../components/LevelComplete';
import GameOver from '../components/GameOver';
import Leaderboard from '../components/Leaderboard';
import SettingsScreen from '../components/SettingsScreen';
import HowToPlay from '../components/HowToPlay';
import IntroCinematic from '../components/IntroCinematic';
import TravelAnimation from '../components/TravelAnimation';
import RewardsScreen from '../components/RewardsScreen';
import GuideCharacter from '../components/GuideCharacter';
import RegistanRebuilder from '../components/RegistanRebuilder';

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  difficulty: 'normal',
  showTutorial: true,
};

export default function Home() {
  const [screen, setScreen] = useState<GameState['screen']>('title');
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [gameSettings, setGameSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('silkroad_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  const [isPaused, setIsPaused] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameCoins, setGameCoins] = useState(0);
  const [gameMaxCombo, setGameMaxCombo] = useState(0);
  const [gameTime, setGameTime] = useState(0);
  const [gameStars, setGameStars] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>(() => {
    const saved = localStorage.getItem('silkroad_unlocked');
    return saved ? JSON.parse(saved) : [1];
  });
  const [levelStars, setLevelStars] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('silkroad_stars');
    return saved ? JSON.parse(saved) : {};
  });
  const [levelScores, setLevelScores] = useState<Record<number, number>>(() => {
    const saved = localStorage.getItem('silkroad_scores');
    return saved ? JSON.parse(saved) : {};
  });
  const [, setHasSeenIntro] = useState(() => {
    return localStorage.getItem('silkroad_intro_seen') === 'true';
  });
  const [newRewards, setNewRewards] = useState<RewardItem[]>([]);

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem('silkroad_settings', JSON.stringify(gameSettings));
  }, [gameSettings]);

  // Save progress whenever it changes
  useEffect(() => {
    localStorage.setItem('silkroad_unlocked', JSON.stringify(unlockedLevels));
  }, [unlockedLevels]);

  useEffect(() => {
    localStorage.setItem('silkroad_stars', JSON.stringify(levelStars));
  }, [levelStars]);

  useEffect(() => {
    localStorage.setItem('silkroad_scores', JSON.stringify(levelScores));
  }, [levelScores]);

  const currentLevel = LEVELS.find(l => l.id === currentLevelId) || LEVELS[0];

  const handlePlay = useCallback(() => {
    // @ts-ignore
    if (window.electronAPI?.openCarpetGame) {
      // @ts-ignore
      window.electronAPI.openCarpetGame();
    } else {
      window.open('http://localhost:5173', '_blank');
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    localStorage.setItem('silkroad_intro_seen', 'true');
    setHasSeenIntro(true);
    setScreen('levelSelect');
  }, []);

  const handleSelectLevel = useCallback((levelId: number) => {
    setCurrentLevelId(levelId);
    setIsPaused(false);
    setGameScore(0);
    setGameCoins(0);
    setGameMaxCombo(0);
    setGameStars(0);
    setScreen('travel');
  }, []);

  const handleTravelComplete = useCallback(() => {
    if (currentLevelId === 1) {
      setScreen('registan');
      return;
    }
    setScreen('playing');
  }, [currentLevelId]);

  const handleGameStateChange = useCallback((state: GameState) => {
    setGameScore(state.score);
    setGameCoins(state.coins);
    setGameMaxCombo(state.maxCombo);
    setGameTime(state.elapsedTime);
  }, []);

  const handleMiniGameComplete = useCallback((score: number, stars: number) => {
    setGameScore(score);
    setGameStars(stars);

    // Update level stars (keep highest)
    setLevelStars(prev => ({
      ...prev,
      [currentLevelId]: Math.max(prev[currentLevelId] || 0, stars),
    }));

    // Update level score (keep highest)
    setLevelScores(prev => ({
      ...prev,
      [currentLevelId]: Math.max(prev[currentLevelId] || 0, score),
    }));

    // Unlock next level
    const nextLevelId = currentLevelId + 1;
    if (nextLevelId <= LEVELS.length) {
      setUnlockedLevels(prev =>
        prev.includes(nextLevelId) ? prev : [...prev, nextLevelId]
      );
    }

    // Generate rewards
    const rewards = getRandomRewards(currentLevel.name, stars);
    setNewRewards(rewards);

    setScreen('rewards');
  }, [currentLevelId, currentLevel.name]);

  const handleRunnerComplete = useCallback((score: number, stars: number) => {
    handleMiniGameComplete(score, stars);
  }, [handleMiniGameComplete]);

  const handleRunnerGameOver = useCallback((score: number) => {
    setGameScore(score);
    setScreen('gameOver');
  }, []);

  const handlePause = useCallback(() => {
    setIsPaused(prev => !prev);
    setScreen(prev => prev === 'paused' ? 'playing' : 'paused');
  }, []);

  const handleResume = useCallback(() => {
    setIsPaused(false);
    setScreen('playing');
  }, []);

  const handleRestart = useCallback(() => {
    setIsPaused(false);
    setGameScore(0);
    setGameCoins(0);
    setGameMaxCombo(0);
    setGameTime(0);
    setScreen('title');
    setTimeout(() => {
      setScreen('playing');
    }, 50);
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextId = currentLevelId + 1;
    if (nextId <= LEVELS.length) {
      setCurrentLevelId(nextId);
      setIsPaused(false);
      setGameScore(0);
      setGameCoins(0);
      setGameMaxCombo(0);
      setGameTime(0);
      setScreen('travel');
    } else {
      setScreen('levelSelect');
    }
  }, [currentLevelId]);

  const handleMenu = useCallback(() => {
    setIsPaused(false);
    setScreen('title');
  }, []);

  const handleUpdateSettings = useCallback((newSettings: GameSettings) => {
    setGameSettings(newSettings);
  }, []);

  const handleResetProgress = useCallback(() => {
    setUnlockedLevels([1]);
    setLevelStars({});
    setLevelScores({});
    localStorage.removeItem('silkroad_leaderboard');
    localStorage.removeItem('silkroad_unlocked');
    localStorage.removeItem('silkroad_stars');
    localStorage.removeItem('silkroad_scores');
    localStorage.removeItem('silkroad_intro_seen');
    localStorage.removeItem('silkroad_rewards');
    setHasSeenIntro(false);
    clearRewards();
  }, []);

  const handleRewardsComplete = useCallback(() => {
    setScreen('levelSelect');
  }, []);

  return (
    <div className="game-container">
      {/* Title Screen */}
      {screen === 'title' && (
        <TitleScreen
          onPlay={handlePlay}
          onRegistan={() => setScreen('registan')}
          onLeaderboard={() => setScreen('leaderboard')}
          onSettings={() => setScreen('settings')}
          onHowToPlay={() => setScreen('howToPlay')}
        />
      )}

      {screen === 'registan' && (
        <RegistanRebuilder
          onExit={handleMenu}
          onComplete={currentLevelId === 1 ? handleMiniGameComplete : undefined}
        />
      )}

      {/* Intro Cinematic */}
      {screen === 'intro' && (
        <IntroCinematic onComplete={handleIntroComplete} />
      )}

      {/* Level Select */}
      {screen === 'levelSelect' && (
        <LevelSelect
          onSelectLevel={handleSelectLevel}
          onBack={handleMenu}
          unlockedLevels={unlockedLevels}
          levelStars={levelStars}
          levelScores={levelScores}
        />
      )}

      {/* Travel Animation */}
      {screen === 'travel' && (
        <TravelAnimation level={currentLevel} onComplete={handleTravelComplete} />
      )}

      {/* Mini-Games */}
      {(screen === 'playing' || screen === 'paused') && (
        <div className="relative w-full h-full">
          <GameCanvas
            key={`level-${currentLevelId}`}
            level={currentLevel}
            settings={gameSettings}
            onStateChange={handleGameStateChange}
            onLevelComplete={handleRunnerComplete}
            onGameOver={handleRunnerGameOver}
            onPause={handlePause}
            isPaused={isPaused}
          />
          {screen === 'paused' && (
            <PauseMenu
              onResume={handleResume}
              onRestart={handleRestart}
              onSettings={() => setScreen('settings')}
              onQuit={handleMenu}
            />
          )}
        </div>
      )}

      {/* Level Complete */}
      {screen === 'levelComplete' && (
        <LevelComplete
          level={currentLevel}
          score={gameScore}
          stars={gameStars}
          coins={gameCoins}
          maxCombo={gameMaxCombo}
          elapsedTime={gameTime}
          onNextLevel={handleNextLevel}
          onReplay={handleRestart}
          onMenu={() => setScreen('levelSelect')}
        />
      )}

      {/* Game Over */}
      {screen === 'gameOver' && (
        <GameOver
          level={currentLevel}
          score={gameScore}
          coins={gameCoins}
          maxCombo={gameMaxCombo}
          onRetry={handleRestart}
          onMenu={() => setScreen('levelSelect')}
        />
      )}

      {/* Rewards */}
      {screen === 'rewards' && (
        <RewardsScreen
          newRewards={newRewards}
          onComplete={handleRewardsComplete}
        />
      )}

      {/* Leaderboard */}
      {screen === 'leaderboard' && (
        <Leaderboard onBack={handleMenu} />
      )}

      {/* Settings */}
      {screen === 'settings' && (
        <SettingsScreen
          settings={gameSettings}
          onUpdateSettings={handleUpdateSettings}
          onBack={() => setScreen(isPaused ? 'paused' : 'title')}
          onResetProgress={handleResetProgress}
        />
      )}

      {/* How to Play */}
      {screen === 'howToPlay' && (
        <HowToPlay onBack={handleMenu} />
      )}

      {/* Guide Character - shows during gameplay */}
      {screen === 'playing' && (
        <GuideCharacter />
      )}
    </div>
  );
}
