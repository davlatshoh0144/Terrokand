import { useState, useCallback, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import TitleScreen from './components/TitleScreen';
import LevelSelect from './components/LevelSelect';
import PauseOverlay from './components/PauseOverlay';
import GameOverScreen from './components/GameOverScreen';
import LevelCompleteScreen from './components/LevelCompleteScreen';
import DiscoveryReveal from './components/DiscoveryReveal';
import OnboardingOverlay from './components/OnboardingOverlay';
import TutorialOverlay from './components/TutorialOverlay';
import SettingsModal from './components/SettingsModal';
import { GameEngine } from './game/engine';
import { audioManager } from './game/audio';
import { addSharedGold } from '../game/sharedWallet';

import { getLevelConfig } from './game/levels';
import type { GameScreen } from './game/types';
import './CarpetApp.css';

// ==========================================
// Save/Load Helpers
// ==========================================
const STORAGE_KEY = 'magic-carpet-save';

interface SaveData {
  highScore: number;
  unlockedLevels: number;
  levelStars: Record<number, number>;
  collectedDiscoveries: string[];
  soundEnabled: boolean;
  musicEnabled: boolean;
}

function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    highScore: 0,
    unlockedLevels: 1,
    levelStars: {},
    collectedDiscoveries: [],
    soundEnabled: true,
    musicEnabled: true,
  };
}

function saveSaveData(data: SaveData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ==========================================
// Props
// ==========================================
interface CarpetAppProps {
  onExit: () => void;
  onBack?: () => void;
  initialScreen?: GameScreen;
  sharedSoundEnabled?: boolean;
  sharedMusicEnabled?: boolean;
  sharedMusicVolume?: number;
  onSettingsChange?: (settings: { soundEnabled: boolean; musicEnabled: boolean; musicVolume?: number }) => void;
}

// ==========================================
// Main App
// ==========================================
function CarpetApp({
  onExit,
  onBack,
  initialScreen = 'menu',
  sharedSoundEnabled,
  sharedMusicEnabled,
  sharedMusicVolume,
  onSettingsChange,
}: CarpetAppProps) {
  // Screen state
  const [screen, setScreen] = useState<GameScreen>(initialScreen);

  // Engine ref
  const engineRef = useRef<GameEngine | null>(null);

  // Save data
  const [saveData, setSaveData] = useState<SaveData>(loadSaveData);

  // Game stats (for overlays)
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [powerUpTimer, setPowerUpTimer] = useState(0);
  const [shieldActive, setShieldActive] = useState(false);
  const [magnetActive, setMagnetActive] = useState(false);
  const [speedActive, setSpeedActive] = useState(false);
  const [snakeProximity, setSnakeProximity] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // Discovery
  const [levelDiscoveries, setLevelDiscoveries] = useState<string[]>([]);
  const levelDiscoveriesRef = useRef<string[]>([]);
  const [showDiscoveryReveal, setShowDiscoveryReveal] = useState(false);
  const showDiscoveryRevealRef = useRef(false);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Ref for currentLevel so engine callbacks see latest value
  const currentLevelRef = useRef(1);
  const pendingStartRef = useRef<{ level: number; paused: boolean } | null>(null);
  // Ref to track last result: 'win' | 'lose' | null
  const lastResultRef = useRef<'win' | 'lose' | null>(null);
  const hasSyncedRef = useRef(false);

  // Sync incoming shared settings once on mount
  useEffect(() => {
    if (hasSyncedRef.current) return;
    hasSyncedRef.current = true;

    if (sharedSoundEnabled !== undefined || sharedMusicEnabled !== undefined || sharedMusicVolume !== undefined) {
      setSaveData((prev) => {
        const newData = { ...prev };
        if (sharedSoundEnabled !== undefined) {
          newData.soundEnabled = sharedSoundEnabled;
          audioManager.setSoundEnabled(sharedSoundEnabled);
        }
        if (sharedMusicEnabled !== undefined) {
          newData.musicEnabled = sharedMusicEnabled;
          audioManager.setMusicEnabled(sharedMusicEnabled);
        }
        if (sharedMusicVolume !== undefined) {
          audioManager.setVolume(sharedMusicVolume);
        }
        saveSaveData(newData);
        return newData;
      });
    }
  }, [sharedSoundEnabled, sharedMusicEnabled, sharedMusicVolume]);

  // Sync audio settings whenever they change
  useEffect(() => {
    audioManager.setSoundEnabled(saveData.soundEnabled);
    audioManager.setMusicEnabled(saveData.musicEnabled);
  }, [saveData.soundEnabled, saveData.musicEnabled]);

  // Notify parent when carpet settings change
  useEffect(() => {
    onSettingsChange?.({
      soundEnabled: saveData.soundEnabled,
      musicEnabled: saveData.musicEnabled,
      musicVolume: audioManager.getVolume(),
    });
  }, [saveData.soundEnabled, saveData.musicEnabled, onSettingsChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      audioManager.stopBGM();
    };
  }, []);

  // ==========================================
  // Engine Setup
  // ==========================================
  const requestEngineStart = useCallback((level: number, paused = false) => {
    const engine = engineRef.current;
    if (!engine) {
      pendingStartRef.current = { level, paused };
      return;
    }

    engine.startLevel(level);
    if (paused) engine.pause();
  }, []);

  const handleEngineReady = useCallback((engine: GameEngine) => {
    engineRef.current = engine;

    engine.onScoreUpdate = (s, c) => {
      setScore(s);
      setCombo(c);
    };
    engine.onLivesUpdate = (l) => setLives(l);
    engine.onPowerUpUpdate = (type, timer) => {
      setPowerUpTimer(timer);
      setShieldActive(type === 'shield');
      setMagnetActive(type === 'magnet');
      setSpeedActive(type === 'speed');
    };
    engine.onDiscovery = (id) => {
      handleDiscoveryFound(id);
    };
    engine.onGameOver = () => {
      const stats = engine.getStats();
      setMaxCombo(stats.maxCombo);
      setDistance(stats.distance);
      lastResultRef.current = 'lose';

      setSaveData((prev) => {
        const newData = { ...prev, highScore: Math.max(prev.highScore, stats.score) };
        saveSaveData(newData);
        return newData;
      });

      addSharedGold(stats.score);

      setScreen('gameOver');
    };
    engine.onLevelComplete = () => {
      const stats = engine.getStats();
      setMaxCombo(stats.maxCombo);
      setDistance(stats.distance);
      setLives(stats.lives);
      lastResultRef.current = 'win';

      const activeLevel = currentLevelRef.current;
      const config = getLevelConfig(activeLevel);
      const coinPercent = stats.score / config.targetScore;
      let stars = 1;
      if (stats.lives >= 2) stars = 2;
      if (stats.lives === stats.maxLives && coinPercent >= 0.9) stars = 3;

      setSaveData((prev) => {
        const newData = { ...prev };
        const currentStars = newData.levelStars[activeLevel] || 0;
        newData.levelStars[activeLevel] = Math.max(currentStars, stars);
        newData.unlockedLevels = Math.max(newData.unlockedLevels, activeLevel + 1);
        newData.highScore = Math.max(newData.highScore, stats.score);
        saveSaveData(newData);
        return newData;
      });

      addSharedGold(stats.score);

      setScreen('levelComplete');
    };

    const pendingStart = pendingStartRef.current;
    if (pendingStart) {
      pendingStartRef.current = null;
      engine.startLevel(pendingStart.level);
      if (pendingStart.paused) engine.pause();
    }
  }, []);

  // ==========================================
  // Screen Handlers
  // ==========================================
  const startLevel = useCallback((level: number) => {
    setCurrentLevel(level);
    currentLevelRef.current = level;
    setScore(0);
    setLives(3);
    setCombo(0);
    setDistance(0);
    setPowerUpTimer(0);
    setShieldActive(false);
    setMagnetActive(false);
    setSpeedActive(false);
    setMaxCombo(0);
    setLevelDiscoveries([]);
    levelDiscoveriesRef.current = [];
    setShowDiscoveryReveal(false);
    showDiscoveryRevealRef.current = false;
    setSnakeProximity(0);

    if (level === 1) {
      setScreen('playing');
      setShowOnboarding(true);
    } else {
      setScreen('playing');
      setTimeout(() => {
        requestEngineStart(level);
      }, 100);
    }
  }, [requestEngineStart]);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
    setScreen('paused');
  }, []);

  // ESC key pauses the game during gameplay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && screen === 'playing') {
        handlePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, handlePause]);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
    setScreen('playing');
  }, []);

  useEffect(() => {
    if (screen !== 'playing' || showOnboarding) return;

    const timer = window.setTimeout(() => {
      const engine = engineRef.current;
      if (!engine || (!engine.isPlaying && !engine.isPaused)) {
        requestEngineStart(currentLevelRef.current);
      }
    }, 75);

    return () => window.clearTimeout(timer);
  }, [screen, showOnboarding, requestEngineStart]);

  const handleRestart = useCallback(() => {
    setScreen('playing');
    setTimeout(() => {
      requestEngineStart(currentLevel);
    }, 100);
  }, [currentLevel, requestEngineStart]);

  const handleQuit = useCallback(() => {
    engineRef.current?.stop();
    audioManager.stopBGM();
    setScreen('levelSelect');
  }, []);

  const handleBack = useCallback(() => {
    audioManager.stopBGM();
    (onBack ?? onExit)();
  }, [onBack, onExit]);

  // Auto-trigger discovery reveal after results screen appears (2 second delay)
  useEffect(() => {
    if (
      (screen === 'levelComplete' || screen === 'gameOver') &&
      levelDiscoveriesRef.current.length > 0 &&
      !showDiscoveryRevealRef.current
    ) {
      const timer = setTimeout(() => {
        setShowDiscoveryReveal(true);
        showDiscoveryRevealRef.current = true;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handleDiscoveryFound = useCallback((discoveryId: string) => {
    setSaveData((prev) => {
      const newData = { ...prev };
      if (!newData.collectedDiscoveries.includes(discoveryId)) {
        newData.collectedDiscoveries.push(discoveryId);
      }
      saveSaveData(newData);
      return newData;
    });
    setLevelDiscoveries((prev) => {
      if (!prev.includes(discoveryId)) {
        const next = [...prev, discoveryId];
        levelDiscoveriesRef.current = next;
        return next;
      }
      return prev;
    });
  }, []);

  const handleNextLevel = useCallback(() => {
    if (currentLevel < 10) {
      startLevel(currentLevel + 1);
    } else {
      handleQuit();
    }
  }, [currentLevel, startLevel, handleQuit]);

  // ==========================================
  // HUD data polling
  // ==========================================
  useEffect(() => {
    if (screen !== 'playing') return;

    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine || !engine.isPlaying) return;

      const stats = engine.getStats();
      setScore(stats.score);
      setLives(stats.lives);
      setCombo(stats.combo);
      setDistance(stats.distance);
      setPowerUpTimer(stats.powerUpTimer);
      setShieldActive(stats.shieldActive);
      setMagnetActive(stats.magnetActive);
      setSpeedActive(stats.speedActive);
      setSnakeProximity(stats.snakeProximity);
    }, 100);

    return () => clearInterval(interval);
  }, [screen]);

  // ==========================================
  // Render
  // ==========================================
  const levelConfig = getLevelConfig(currentLevel);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950">
      {/* Game Canvas - always mounted */}
      <GameCanvas onEngineReady={handleEngineReady} />

      {/* HUD - shown during gameplay */}
      {(screen === 'playing' || screen === 'paused') && (
        <HUD
          score={score}
          combo={combo}
          lives={lives}
          maxLives={3}
          distance={distance}
          level={currentLevel}
          targetScore={levelConfig.targetScore}
          targetDistance={levelConfig.targetDistance}
          powerUpTimer={powerUpTimer}
          shieldActive={shieldActive}
          magnetActive={magnetActive}
          speedActive={speedActive}
          snakeProximity={snakeProximity}
          collectedDiscoveries={saveData.collectedDiscoveries}
          onPause={handlePause}
          onShowTutorial={() => {
            engineRef.current?.pause();
            setShowTutorial(true);
          }}
        />
      )}

      {/* Screen Overlays */}
      {screen === 'menu' && (
        <TitleScreen
          onShowTutorial={() => setShowTutorial(true)}
          onShowLevelSelect={() => setScreen('levelSelect')}
          highScore={saveData.highScore}
        />
      )}

      {screen === 'levelSelect' && (
        <LevelSelect
          unlockedLevels={saveData.unlockedLevels}
          levelStars={saveData.levelStars}
          onSelectLevel={startLevel}
          onBack={handleBack}
        />
      )}

      {screen === 'paused' && (
        <PauseOverlay
          onResume={handleResume}
          onRestart={handleRestart}
          onSettings={() => setShowSettings(true)}
          onQuit={handleQuit}
        />
      )}

      {screen === 'gameOver' && (
        <GameOverScreen
          score={score}
          highScore={saveData.highScore}
          distance={distance}
          maxCombo={maxCombo}
          level={currentLevel}
          onRestart={handleRestart}
          onMenu={handleQuit}
        />
      )}

      {screen === 'levelComplete' && (
        <LevelCompleteScreen
          score={score}
          targetScore={levelConfig.targetScore}
          lives={lives}
          maxLives={3}
          distance={distance}
          maxCombo={maxCombo}
          hasNextLevel={currentLevel < 10}
          discoveryIds={levelDiscoveries}
          onNextLevel={handleNextLevel}
          onRestart={handleRestart}
          onMenu={handleQuit}
        />
      )}

      {/* Discovery Reveal — auto-plays ON TOP of results screens */}
      {showDiscoveryReveal && (
        <DiscoveryReveal
          discoveryIds={levelDiscoveries}
          onDone={() => {
            setShowDiscoveryReveal(false);
            showDiscoveryRevealRef.current = false;
          }}
        />
      )}

      {showOnboarding && (
        <OnboardingOverlay
          onStart={() => {
            setShowOnboarding(false);
            requestEngineStart(currentLevelRef.current);
          }}
        />
      )}

      {/* Floating overlays */}
      {showTutorial && (
        <TutorialOverlay
          onClose={() => {
            setShowTutorial(false);
            if (screen === 'paused') {
              // Don't auto-resume if paused
            }
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          soundOn={saveData.soundEnabled}
          musicOn={saveData.musicEnabled}
          onToggleSound={() =>
            setSaveData((prev) => {
              const newData = { ...prev, soundEnabled: !prev.soundEnabled };
              saveSaveData(newData);
              return newData;
            })
          }
          onToggleMusic={() =>
            setSaveData((prev) => {
              const newData = { ...prev, musicEnabled: !prev.musicEnabled };
              saveSaveData(newData);
              return newData;
            })
          }
          onResetProgress={() => {
            const fresh: SaveData = {
              highScore: 0,
              unlockedLevels: 1,
              levelStars: {},
              collectedDiscoveries: [],
              soundEnabled: true,
              musicEnabled: true,
            };
            saveSaveData(fresh);
            setSaveData(fresh);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default CarpetApp;
