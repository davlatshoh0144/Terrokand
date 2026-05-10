// ==========================================
// Magic Carpet Ride: Silk Road Adventure
// Core Type Definitions
// ==========================================

export interface Vector2 {
  x: number;
  y: number;
}

export type GameScreen =
  | 'menu'
  | 'levelSelect'
  | 'playing'
  | 'paused'
  | 'gameOver'
  | 'levelComplete'
  | 'tutorial';

export type PowerUpType = 'magnet' | 'shield' | 'speed' | 'tile';

export type ObstacleType = 'arch' | 'balloon' | 'bird' | 'cloud' | 'snake' | 'minaret';

export type BackgroundType = 'samarkand' | 'desert' | 'khiva' | 'mountains';

export interface Entity {
  id: string;
  position: Vector2;
  velocity: Vector2;
  width: number;
  height: number;
  active: boolean;
  type: string;
}

export interface Player extends Entity {
  lives: number;
  maxLives: number;
  invincible: boolean;
  invincibleTimer: number;
  targetX: number;
  targetY: number;
  bobOffset: number;
  powerUp: PowerUpType | null;
  powerUpTimer: number;
  shieldActive: boolean;
  magnetActive: boolean;
  speedActive: boolean;
  combo: number;
  comboTimer: number;
  hitFlashTimer: number;
}

export interface Obstacle extends Entity {
  obstacleType: ObstacleType;
  oscillationOffset: number;
  oscillationSpeed: number;
  oscillationAmplitude: number;
  trackingPlayer: boolean;
}

export interface Collectible extends Entity {
  value: number;
  rotation: number;
  bobOffset: number;
  collected: boolean;
  attracted: boolean;
  isShieldCoin?: boolean;
}

export interface PowerUpItem extends Entity {
  powerUpType: PowerUpType;
  rotation: number;
  pulsePhase: number;
}

export interface Particle {
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
}

export interface LevelConfig {
  id: number;
  name: string;
  background: BackgroundType;
  targetScore: number;
  targetDistance: number; // Alternative win condition: reach this distance
  scrollSpeed: number;
  obstacleDensity: number;
  obstacles: ObstacleType[];
  powerUps: PowerUpType[];
  description: string;
}

export interface DiscoveryCard {
  id: string;
  title: string;
  content: string;
  image: string;
  levelId: number;
  bonusPoints: number;
}

export interface GameState {
  screen: GameScreen;
  score: number;
  highScore: number;
  level: number;
  distance: number;
  isPlaying: boolean;
  isPaused: boolean;
  soundEnabled: boolean;
  musicEnabled: boolean;
  unlockedLevels: number;
  levelStars: Record<number, number>;
  collectedDiscoveries: string[];
  showDiscovery: boolean;
  currentDiscovery: DiscoveryCard | null;
  lastDiscoveryDistance: number;
}

export interface InputState {
  mouseX: number;
  mouseY: number;
  mouseActive: boolean;
  upPressed: boolean;
  downPressed: boolean;
  leftPressed: boolean;
  rightPressed: boolean;
  clicked: boolean;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  timer: number;
  offsetX: number;
  offsetY: number;
}
