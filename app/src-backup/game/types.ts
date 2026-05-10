export interface Vector2D {
  x: number;
  y: number;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  active: boolean;
}

export interface Player extends Entity {
  velocity: Vector2D;
  targetY: number;
  animationState: 'idle' | 'running' | 'hit' | 'collect' | 'victory';
  animationTimer: number;
  shielded: boolean;
  magnetActive: boolean;
  doubleCoinsActive: boolean;
  speedBoost: boolean;
  shieldTimer: number;
  magnetTimer: number;
  doubleCoinsTimer: number;
  speedTimer: number;
  invincible: boolean;
  invincibleTimer: number;
}

export interface Obstacle extends Entity {
  type: 'bird' | 'cloud' | 'arch' | 'balloon';
  worldAffinity?: 'present' | 'ancient' | 'both';
  oscillating: boolean;
  oscillationOffset: number;
  oscillationSpeed: number;
  passed: boolean;
}

export interface Collectible extends Entity {
  type: 'coin' | 'gem' | 'mission';
  worldAffinity?: 'present' | 'ancient' | 'both';
  value: number;
  collected: boolean;
  bobOffset: number;
  emoji?: string;
  name?: string;
}

export interface PowerUp extends Entity {
  type: 'shield' | 'magnet' | 'speed' | 'doubleCoins';
  worldAffinity?: 'present' | 'ancient' | 'both';
  collected: boolean;
  bobOffset: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
  text?: string;
}

export type MiniGameType = 'puzzle' | 'plov' | 'runner';
export type MissionType = 'distance' | 'collect' | 'survive';

export interface MissionItem {
  emoji: string;
  name: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  nameUz: string;
  location: string;
  description: string;
  backgroundImage: string;
  groundColor: string;
  skyColor: string;
  obstacleTypes: ('bird' | 'cloud' | 'arch' | 'balloon')[];
  obstacleFrequency: number;
  collectibleFrequency: number;
  powerUpFrequency: number;
  scrollSpeed: number;
  distance: number;
  facts: string[];
  unlocked: boolean;
  stars: number;
  highScore: number;
  miniGame: MiniGameType;
  missionType: MissionType;
  missionTarget: number;
  missionItems: MissionItem[];
  missionDescription: string;
  duration: number; // for survive missions (seconds)
}

export interface GameState {
  screen: 'title' | 'levelSelect' | 'playing' | 'paused' | 'levelComplete' | 'gameOver' | 'leaderboard' | 'settings' | 'howToPlay' | 'intro' | 'travel' | 'rewards' | 'samarkandIntro' | 'registan';
  currentLevel: number;
  score: number;
  coins: number;
  distance: number;
  lives: number;
  combo: number;
  maxCombo: number;
  elapsedTime: number;
  isRunning: boolean;
  isPaused: boolean;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  level: string;
  date: string;
  stars: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
  showTutorial: boolean;
}

export interface StarThreshold {
  one: number;
  two: number;
  three: number;
}

export type RewardType = 'sticker' | 'hat' | 'instrument' | 'food' | 'gem';

export interface RewardItem {
  id: string;
  name: string;
  emoji: string;
  city: string;
  type: RewardType;
  description: string;
}

export interface MiniGameResult {
  score: number;
  stars: number;
  maxCombo: number;
}
