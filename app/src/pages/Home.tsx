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
import ArtifactsScreen from '../components/ArtifactsScreen';
import SettingsScreen from '../components/SettingsScreen';
import HowToPlay from '../components/HowToPlay';
import IntroCinematic from '../components/IntroCinematic';
import TravelAnimation from '../components/TravelAnimation';
import RewardsScreen from '../components/RewardsScreen';
import GuideCharacter from '../components/GuideCharacter';
import RegistanRebuilder from '../components/RegistanRebuilder';
import MosaicPuzzleMode from '../components/MosaicPuzzleMode';
import CarpetApp from '../carpet/CarpetApp';
import { audioManager } from '../carpet/game/audio';

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  musicEnabled: true,
  musicVolume: 0.5,
  difficulty: 'normal',
  showTutorial: true,
};

export default function Home() {
  const [screen, setScreen] = useState<GameState['screen'] | 'carpetGame'>('title');
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
  const [gameSession] = useState(0);
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false);

  // Check if carpet game has saved progress
  const [hasCarpetSave, setHasCarpetSave] = useState(() => {
    return !!localStorage.getItem('magic-carpet-save');
  });

  // Re-check save status whenever returning to title screen
  useEffect(() => {
    if (screen === 'title') {
      setHasCarpetSave(!!localStorage.getItem('magic-carpet-save'));
    }
  }, [screen]);

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem('silkroad_settings', JSON.stringify(gameSettings));
    audioManager.setMusicEnabled(gameSettings.musicEnabled);
    audioManager.setVolume(gameSettings.musicVolume);
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

  const handleNewGame = useCallback(() => {
    if (!hasCarpetSave) {
      setScreen('carpetGame');
      return;
    }
    setShowNewGameConfirm(true);
  }, [hasCarpetSave]);

  const handleConfirmNewGame = useCallback(() => {
    localStorage.removeItem('magic-carpet-save');
    setHasCarpetSave(false);
    setShowNewGameConfirm(false);
    setScreen('carpetGame');
  }, []);

  const handleContinue = useCallback(() => {
    setScreen('carpetGame');
  }, []);

  const handleQuitGame = useCallback(() => {
    if (window.electronAPI?.quitGame) {
      void window.electronAPI.quitGame();
      return;
    }
    window.close();
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

  const handleCarpetSettingsChange = useCallback((settings: { soundEnabled: boolean; musicEnabled: boolean; musicVolume?: number }) => {
    setGameSettings(prev => ({ ...prev, ...settings }));
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
          onPlay={handleNewGame}
          onContinue={handleContinue}
          showContinue={hasCarpetSave}
          onRegistan={() => setScreen('registan')}
          onArtifacts={() => setScreen('artifacts')}
          onSettings={() => setScreen('settings')}
          onHowToPlay={() => setScreen('howToPlay')}
          onQuit={handleQuitGame}
        />
      )}

      {screen === 'registan' && (
        <RegistanRebuilder
          onExit={handleMenu}
          onComplete={handleMiniGameComplete}
          onGoToDashboard={() => setScreen('carpetGame')}
        />
      )}

      {screen === 'mosaic' && (
        <MosaicPuzzleMode onExit={handleMenu} />
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

      {/* Artifacts Gallery */}
      {screen === 'artifacts' && (
        <ArtifactsScreen onBack={handleMenu} />
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

      {/* Carpet Flying Game */}
      {screen === 'carpetGame' && (
        <CarpetApp
          key={`carpet-${gameSession}`}
          initialScreen="levelSelect"
          onExit={handleMenu}
          sharedSoundEnabled={gameSettings.soundEnabled}
          sharedMusicEnabled={gameSettings.musicEnabled}
          sharedMusicVolume={gameSettings.musicVolume}
          onSettingsChange={handleCarpetSettingsChange}
        />
      )}

      {/* How to Play */}
      {screen === 'howToPlay' && (
        <HowToPlay onBack={handleMenu} />
      )}

      {/* New Game Confirmation */}
      {showNewGameConfirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className="mx-4 w-full max-w-md rounded-2xl border p-8 text-center shadow-2xl"
            style={{
              borderColor: 'rgba(212, 160, 23, 0.35)',
              background: 'linear-gradient(180deg, #1e1238 0%, #0f0a14 100%)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
            }}
          >
            <h2
              className="mb-3 text-2xl font-bold tracking-wider text-[#f0e6d8]"
              style={{ fontFamily: "'Cinzel', serif", textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
            >
              Start Fresh Flight?
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-[#b8b0a8]">
              This will erase all current progress, unlocked levels, and stars.
              <br />
              <span className="text-[#e76f51]">This cannot be undone.</span>
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowNewGameConfirm(false)}
                className="rounded-xl border border-white/10 px-6 py-3 font-bold text-[#b8b0a8] transition-all hover:bg-white/10 hover:text-[#f0e6d8]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNewGame}
                className="rounded-xl px-6 py-3 font-bold text-white transition-all hover:scale-105"
                style={{
                  fontFamily: "'Cinzel', serif",
                  background: 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)',
                  boxShadow: '0 4px 0 #8b0000, 0 6px 20px rgba(231,76,60,0.35)',
                }}
              >
                Start Fresh Flight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guide Character - shows during gameplay */}
      {screen === 'playing' && (
        <GuideCharacter />
      )}
    </div>
  );
}
