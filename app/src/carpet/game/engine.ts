// ==========================================
// Magic Carpet Ride - Core Game Engine
// ==========================================

import type {
  Player,
  Obstacle,
  Collectible,
  PowerUpItem,
  Particle,
  ScreenShake,
  InputState,
  PowerUpType,
  ObstacleType,
  LevelConfig,
  BackgroundType,
  GameScreen,
} from './types';
import { getLevelConfig } from './levels';
import { getAllDiscoveriesForLevel } from './education';
import { audioManager } from './audio';

// ==========================================
// Constants
// ==========================================
const PLAYER_X = 0.12; // 12% from left - slightly more left so he's clearly visible
const PLAYER_SIZE = 130; // Much bigger protagonist
const PLAYER_HIT_RADIUS = 40;
const COIN_SIZE = 28;
const COIN_HIT_RADIUS = 14;
const POWERUP_SIZE = 36;
const POWERUP_HIT_RADIUS = 17;

const OBSTACLE_SIZES: Record<ObstacleType, { w: number; h: number; r: number }> = {
  arch: { w: 130, h: 240, r: 50 },
  minaret: { w: 110, h: 260, r: 45 },  // Tall Islamic tower — slightly slimmer than arch
  balloon: { w: 65, h: 85, r: 32 },
  bird: { w: 60, h: 40, r: 26 },
  cloud: { w: 100, h: 60, r: 45 },
  snake: { w: 90, h: 60, r: 35 },     // Chasing snake from behind
};

// ==========================================
// Asset Manager
// ==========================================
class AssetManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private loaded = false;

  async loadAll() {
    // NOTE: The uploaded filenames are rotated in a cycle.
    // Each file contains the content of a different asset.
    // We map the correct game key to the file that actually contains that image.
    const assets: [string, string][] = [
      // The boy on carpet is in powerup-magnet.png (rotated filenames)
      ['player', './images/powerup-magnet.png'],
      // The coin is in obstacle-arch.png (rotated filenames)
      ['coin', './images/obstacle-arch.png'],
      // The arch is in obstacle-balloon.png (rotated filenames)
      ['arch', './images/obstacle-balloon.png'],
      // The balloon is in obstacle-bird.png (rotated filenames)
      ['balloon', './images/obstacle-bird.png'],
      // The bird is in obstacle-cloud.png (rotated filenames)
      ['bird', './images/obstacle-cloud.png'],
      // The cloud is in player-carpet.png (rotated filenames)
      ['cloud', './images/player-carpet.png'],
      // The magnet is in powerup-shield.png (rotated filenames)
      ['magnet', './images/powerup-shield.png'],
      // The shield is in powerup-speed.png (rotated filenames)
      ['shield', './images/powerup-speed.png'],
      // The speed tornado is in powerup-tile.png (rotated filenames)
      ['speed', './images/powerup-tile.png'],
      ['snake', './images/obstacle-snake.png'],
      ['minaret', './images/obstacle-minaret.png'],
      ['bird_sheet', './images/falcon_spritesheet.png'],
      ['bg-samarkand', './images/bg-samarkand.jpg'],
      ['bg-desert', './images/bg-desert.jpg'],
      ['bg-khiva', './images/bg-khiva.jpg'],
      ['bg-mountains', './images/bg-mountains.jpg'],
    ];

    await Promise.all(
      assets.map(
        ([name, src]) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              this.images.set(name, img);
              resolve();
            };
            img.onerror = () => {
              console.warn(`Failed to load: ${src}`);
              resolve();
            };
            img.src = src;
          })
      )
    );

    this.loaded = true;
  }

  get(name: string): HTMLImageElement | undefined {
    return this.images.get(name);
  }

  isLoaded() {
    return this.loaded;
  }
}

export const assetManager = new AssetManager();

// ==========================================
// Particle System
// ==========================================
class ParticleSystem {
  particles: Particle[] = [];

  emit(x: number, y: number, count: number, color: string, speed: number = 100) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const velocity = speed * (0.5 + Math.random() * 0.5);
      this.particles.push({
        position: { x, y },
        velocity: {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity,
        },
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color,
        size: 3 + Math.random() * 4,
        alpha: 1,
      });
    }
  }

  emitCoinCollect(x: number, y: number) {
    this.emit(x, y, 8, '#FFD700', 120);
    this.emit(x, y, 5, '#FFA500', 80);
  }

  emitPowerUp(x: number, y: number) {
    this.emit(x, y, 12, '#9D4EDD', 150);
    this.emit(x, y, 8, '#FFD166', 100);
  }

  emitHit(x: number, y: number) {
    this.emit(x, y, 6, '#D90429', 90);
  }

  emitSparkleTrail(x: number, y: number) {
    if (Math.random() > 0.7) {
      this.particles.push({
        position: { x: x + (Math.random() - 0.5) * 20, y: y + (Math.random() - 0.5) * 10 },
        velocity: { x: -30 - Math.random() * 20, y: (Math.random() - 0.5) * 20 },
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color: Math.random() > 0.5 ? '#FFD700' : '#FFA500',
        size: 2 + Math.random() * 3,
        alpha: 0.8,
      });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.velocity.y += 30 * dt; // gravity
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
  }
}

// ==========================================
// Main Game Engine
// ==========================================
export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;

  // Game state
  screen: GameScreen = 'menu';
  score: number = 0;
  level: number = 1;
  distance: number = 0;
  isPaused: boolean = false;
  isPlaying: boolean = false;

  // Entities
  player!: Player;
  obstacles: Obstacle[] = [];
  collectibles: Collectible[] = [];
  powerUpItems: PowerUpItem[] = [];
  particles = new ParticleSystem();
  screenShake: ScreenShake = { intensity: 0, duration: 0, timer: 0, offsetX: 0, offsetY: 0 };

  // Snake danger zone — sits on left edge, punishes player for going too far left
  snakeDanger: {
    active: boolean;
    warningPhase: boolean; // warning before bite
    warningTimer: number;
    biteCooldown: number;
    eyeOffset: number;
  } = {
    active: false,
    warningPhase: false,
    warningTimer: 0,
    biteCooldown: 0,
    eyeOffset: 0,
  };

  // Snake delayed vertical tracking
  snakeYHistory: { time: number; y: number }[] = [];
  snakeRenderDelay: number = 2.5;

  // Input
  input: InputState = { mouseX: 150, mouseY: 360, mouseActive: false, upPressed: false, downPressed: false, leftPressed: false, rightPressed: false, clicked: false };

  // Level
  levelConfig: LevelConfig = getLevelConfig(1);
  spawnTimer: number = 0;
  coinSpawnTimer: number = 0;
  powerUpSpawnTimer: number = 0;
  shieldCoinsSpawned: number = 0;
  speedRampTimer: number = 0;
  backgroundOffset: number = 0;

  // Background transition
  currentBg: BackgroundType = 'samarkand';
  nextBg: BackgroundType | null = null;
  bgTransitionAlpha: number = 0;

  // Timing
  lastTime: number = 0;
  animFrameId: number = 0;
  gameTime: number = 0;

  // Combo
  maxCombo: number = 0;

  // Discovery - multiple per level
  shownDiscoveries: Set<string> = new Set();
  discoveryMilestones: number[] = []; // Distance milestones where discoveries trigger
  onDiscovery: ((id: string) => void) | null = null;

  // Finish line (racing-style checkered flag)
  finishLine: { active: boolean; x: number; crossed: boolean; countdown: number } = {
    active: false,
    x: -100,
    crossed: false,
    countdown: 0,
  };
  onLevelComplete: (() => void) | null = null;
  onGameOver: (() => void) | null = null;
  onScoreUpdate: ((score: number, combo: number) => void) | null = null;
  onLivesUpdate: ((lives: number) => void) | null = null;
  onPowerUpUpdate: ((type: PowerUpType | null, timer: number) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    this.initPlayer();
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (parent) {
      this.width = parent.clientWidth;
      this.height = parent.clientHeight;
      this.canvas.width = this.width;
      this.canvas.height = this.height;
    }
  }

  initPlayer() {
    this.player = {
      id: 'player',
      position: { x: this.width * PLAYER_X, y: this.height / 2 },
      velocity: { x: 0, y: 0 },
      width: PLAYER_SIZE,
      height: PLAYER_SIZE,
      active: true,
      type: 'player',
      lives: 3,
      maxLives: 3,
      invincible: false,
      invincibleTimer: 0,
      targetX: this.width * PLAYER_X,
      targetY: this.height / 2,
      bobOffset: 0,
      powerUp: null,
      powerUpTimer: 0,
      shieldActive: false,
      magnetActive: false,
      speedActive: false,
      combo: 0,
      comboTimer: 0,
      hitFlashTimer: 0,
    };
  }

  startLevel(levelId: number) {
    this.level = levelId;
    this.levelConfig = getLevelConfig(levelId);
    this.currentBg = this.levelConfig.background;
    this.score = 0;
    this.distance = 0;
    this.gameTime = 0;
    this.spawnTimer = 0;
    this.coinSpawnTimer = 0;
    this.powerUpSpawnTimer = 0;
    this.shieldCoinsSpawned = 0;
    this.speedRampTimer = 2.0; // 2-second speed ramp at level start
    this.shownDiscoveries.clear();
    this.discoveryMilestones = [200, 450, 700]; // Three discovery points per level
    this.maxCombo = 0;

    // Reset finish line
    this.finishLine = { active: false, x: -100, crossed: false, countdown: 0 };

    // Initialize snake danger zone (levels 4+)
    this.snakeDanger.active = this.level >= 4;
    this.snakeYHistory = [];
    this.snakeRenderDelay = 1 + Math.random() * 3; // 1 to 4 seconds
    this.snakeDanger.warningPhase = false;
    this.snakeDanger.warningTimer = 0;
    this.snakeDanger.biteCooldown = 0;
    this.snakeDanger.eyeOffset = 0;

    this.obstacles = [];
    this.collectibles = [];
    this.powerUpItems = [];
    this.particles.clear();

    this.initPlayer();
    this.player.position.x = this.width * PLAYER_X;
    this.player.position.y = this.height / 2;
    this.player.targetX = this.width * PLAYER_X;
    this.player.targetY = this.height / 2;

    this.screen = 'playing';
    this.isPlaying = true;
    this.isPaused = false;
    this.lastTime = performance.now();

    try {
      audioManager.playBGM('gameplay');
    } catch {
      // Audio is non-critical; gameplay must continue even if playback is blocked.
    }
    this.onScoreUpdate?.(0, 0);
    this.onLivesUpdate?.(3);
    this.onPowerUpUpdate?.(null, 0);

    this.loop(performance.now());
  }

  pause() {
    this.isPaused = true;
    this.isPlaying = false;
    audioManager.pauseBGM();
    cancelAnimationFrame(this.animFrameId);
  }

  resume() {
    if (this.screen !== 'playing') return;
    this.isPaused = false;
    this.isPlaying = true;
    this.lastTime = performance.now();
    audioManager.resumeBGM();
    this.loop(performance.now());
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    cancelAnimationFrame(this.animFrameId);
    audioManager.stopBGM();
  }

  // ==========================================
  // Main Game Loop
  // ==========================================
  private loop = (time: number) => {
    if (!this.isPlaying) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.05); // Cap delta
    this.lastTime = time;
    this.gameTime += dt;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  // ==========================================
  // Update
  // ==========================================
  update(dt: number) {
    if (this.isPaused) return;

    // Decrement speed ramp timer
    if (this.speedRampTimer > 0) {
      this.speedRampTimer -= dt;
    }

    this.updatePlayer(dt);
    this.updateObstacles(dt);
    this.updateSnake(dt);
    this.updateCollectibles(dt);
    this.updatePowerUpItems(dt);
    this.updateParticles(dt);
    this.updateScreenShake(dt);
    this.spawnEntities(dt);
    this.checkCollisions();
    this.updateDistance(dt);
    this.updateFinishLine(dt);
    this.updatePowerUpTimers(dt);
    this.updateCombo(dt);
    this.checkWinCondition();
    this.updateBackgroundTransition(dt);
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    const moveSpeed = 420; // pixels per second

    // === HORIZONTAL + VERTICAL MOVEMENT ===
    if (this.input.mouseActive) {
      // Mouse controls both X and Y
      p.targetX = this.input.mouseX;
      p.targetY = this.input.mouseY;
    } else {
      // Keyboard 4-directional movement
      if (this.input.leftPressed) {
        p.targetX -= moveSpeed * dt;
      }
      if (this.input.rightPressed) {
        p.targetX += moveSpeed * dt;
      }
      if (this.input.upPressed) {
        p.targetY -= moveSpeed * dt;
      }
      if (this.input.downPressed) {
        p.targetY += moveSpeed * dt;
      }
    }

    // === CLAMP TARGETS to screen bounds ===
    const xMargin = p.width * 0.55;
    const yMargin = p.height * 0.55;
    p.targetX = Math.max(xMargin, Math.min(this.width - xMargin, p.targetX));
    p.targetY = Math.max(yMargin, Math.min(this.height - yMargin, p.targetY));

    // === SMOOTH LERP to target position ===
    const lerpFactor = 1 - Math.pow(0.01, dt);
    p.position.x += (p.targetX - p.position.x) * lerpFactor;
    p.position.y += (p.targetY - p.position.y) * lerpFactor;

    // === Bob animation (only on Y) ===
    p.bobOffset += dt * 3;
    p.position.y += Math.sin(p.bobOffset) * 0.5;

    // === Invincibility ===
    if (p.invincible) {
      p.invincibleTimer -= dt;
      if (p.invincibleTimer <= 0) {
        p.invincible = false;
      }
    }

    // === Hit flash ===
    if (p.hitFlashTimer > 0) {
      p.hitFlashTimer -= dt;
    }

    // === Sparkle trail when powered up ===
    if (p.shieldActive || p.magnetActive || p.speedActive) {
      this.particles.emitSparkleTrail(p.position.x, p.position.y);
    }
  }

  private getSpeedMultiplier(): number {
    const levelMult = this.level >= 6 ? Math.pow(1.05, this.level - 5) : 1.0;
    // Speed ramp: first 2 seconds start at 50% speed and ease up to 100%
    const rampMult = this.speedRampTimer > 0
      ? 0.5 + 0.5 * (1 - Math.min(1, this.speedRampTimer / 2.0))
      : 1.0;
    return levelMult * rampMult;
  }

  private getShieldCoinTarget(): number {
    if (this.level === 6) return 1;
    if (this.level === 7) return 2;
    if (this.level >= 8 && this.level <= 9) return 3;
    if (this.level >= 10) return 5;
    return 0;
  }

  private updateObstacles(dt: number) {
    const speed = this.levelConfig.scrollSpeed * this.getSpeedMultiplier() * (this.player.speedActive ? 0.5 : 1);

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.position.x -= speed * dt * 60;

      // Oscillation for balloons and clouds
      if (obs.oscillationAmplitude > 0) {
        obs.oscillationOffset += dt * obs.oscillationSpeed;
        obs.position.y += Math.sin(obs.oscillationOffset) * obs.oscillationAmplitude * dt * 2;
      }

      // Bird tracking - gentle vertical following
      if (obs.trackingPlayer) {
        const trackSpeed = 0.6 + this.level * 0.12; // Level 4: 1.08x, Level 10: 1.8x
        const dy = this.player.position.y - obs.position.y;
        obs.position.y += dy * dt * trackSpeed;
      }

      if (obs.position.x < -200) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private updateCollectibles(dt: number) {
    const speed = this.levelConfig.scrollSpeed * this.getSpeedMultiplier() * (this.player.speedActive ? 0.5 : 1);

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      c.position.x -= speed * dt * 60;
      c.rotation += dt * 2;
      c.bobOffset += dt * 3;
      c.position.y += Math.sin(c.bobOffset) * 0.3;

      // Magnet attraction - smaller radius since game is harder now
      if (this.player.magnetActive && !c.collected) {
        const dx = this.player.position.x - c.position.x;
        const dy = this.player.position.y - c.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          c.attracted = true;
          const attractSpeed = 280 * dt * (1 - dist / 140);
          c.position.x += (dx / dist) * attractSpeed;
          c.position.y += (dy / dist) * attractSpeed;
        }
      }

      if (c.position.x < -50) {
        this.collectibles.splice(i, 1);
      }
    }
  }

  private updatePowerUpItems(dt: number) {
    const speed = this.levelConfig.scrollSpeed * this.getSpeedMultiplier() * (this.player.speedActive ? 0.5 : 1);

    for (let i = this.powerUpItems.length - 1; i >= 0; i--) {
      const pu = this.powerUpItems[i];
      pu.position.x -= speed * dt * 60;
      pu.rotation += dt * 1.5;
      pu.pulsePhase += dt * 4;

      if (pu.position.x < -50) {
        this.powerUpItems.splice(i, 1);
      }
    }
  }

  private updateParticles(dt: number) {
    this.particles.update(dt);
  }

  private updateSnake(dt: number) {
    if (!this.snakeDanger.active) return;

    const sd = this.snakeDanger;
    const p = this.player;

    // Record player Y for delayed snake rendering
    this.snakeYHistory.push({ time: this.gameTime, y: p.position.y });
    const cutoff = this.gameTime - 10;
    while (this.snakeYHistory.length > 0 && this.snakeYHistory[0].time < cutoff) {
      this.snakeYHistory.shift();
    }

    // === DANGER ZONE LOGIC ===
    // The snake lurks on the far left. The player can fly left, but
    // if they go too far left (past the danger line), the snake bites.
    // This creates a "soft left boundary" — punishing without walls.

    // Snake reach expands at level 6+ — danger zone creeps further right
    const extraReach = this.level >= 6 ? Math.min(50, (this.level - 5) * 15) : 0;
    const DANGER_LINE_X = 90 + extraReach;   // player X below this = in danger zone
    const WARNING_ZONE_X = 140 + extraReach; // player X below this = warning shown
    const BITE_COOLDOWN_MAX = this.level >= 6
      ? Math.max(0.8, 1.8 - (this.level - 5) * 0.2)
      : 1.8; // seconds between bites

    // Count down bite cooldown
    if (sd.biteCooldown > 0) sd.biteCooldown -= dt;

    // Animate snake eyes
    sd.eyeOffset += dt * 3;

    // Check if player is in warning zone
    if (p.position.x < WARNING_ZONE_X) {
      // Player is getting close to the left edge — show warning
      if (!sd.warningPhase) {
        sd.warningPhase = true;
        sd.warningTimer = 0;
      }
      sd.warningTimer += dt;

      // Warning particles
      if (Math.random() > 0.85) {
        this.particles.particles.push({
          position: { x: 10 + Math.random() * 30, y: p.position.y + (Math.random() - 0.5) * 40 },
          velocity: { x: 20 + Math.random() * 30, y: (Math.random() - 0.5) * 20 },
          life: 0.3 + Math.random() * 0.2,
          maxLife: 0.5,
          color: '#DC143C',
          size: 2 + Math.random() * 2,
          alpha: 0.6,
        });
      }
    } else {
      sd.warningPhase = false;
      sd.warningTimer = 0;
    }

    // BITE: player crossed into the danger zone
    if (p.position.x < DANGER_LINE_X && sd.biteCooldown <= 0 && !p.invincible) {
      sd.biteCooldown = BITE_COOLDOWN_MAX;
      this.handlePlayerHit();
      // Push player away from the edge
      p.targetX = WARNING_ZONE_X + 30;
      p.position.x = WARNING_ZONE_X + 20;
      this.triggerScreenShake(10, 0.4);
    }
  }

  private updateScreenShake(dt: number) {
    if (this.screenShake.timer > 0) {
      this.screenShake.timer -= dt;
      const intensity = this.screenShake.intensity * (this.screenShake.timer / this.screenShake.duration);
      this.screenShake.offsetX = (Math.random() - 0.5) * intensity * 2;
      this.screenShake.offsetY = (Math.random() - 0.5) * intensity * 2;
    } else {
      this.screenShake.offsetX = 0;
      this.screenShake.offsetY = 0;
    }
  }

  private updateDistance(dt: number) {
    this.distance += this.levelConfig.scrollSpeed * this.getSpeedMultiplier() * dt * 10;

    // Activate finish line right AFTER crossing the distance threshold
    // The level won check happens in checkWinCondition, but we also
    // trigger the visual celebration when distance first exceeds target
    if (
      !this.finishLine.active &&
      !this.finishLine.crossed &&
      this.distance >= this.levelConfig.targetDistance
    ) {
      this.finishLine.active = true;
      this.finishLine.x = this.width + 50;
    }

    // Check for discovery milestones - collect SILENTLY during gameplay
    // Cards are revealed AFTER the level is complete
    for (let i = 0; i < this.discoveryMilestones.length; i++) {
      const milestone = this.discoveryMilestones[i];
      if (milestone > 0 && this.distance > milestone) {
        this.discoveryMilestones[i] = -1; // Mark as triggered

        // Find an undiscovered card for this level
        const availableCards = getAllDiscoveriesForLevel(this.level).filter(
          (c) => !this.shownDiscoveries.has(c.id)
        );

        if (availableCards.length > 0) {
          const card = availableCards[Math.floor(Math.random() * availableCards.length)];
          this.shownDiscoveries.add(card.id);
          this.score += card.bonusPoints;

          // Visual "Artifact Found!" notification at player's position (does NOT pause)
          const px = this.player.position.x;
          const py = this.player.position.y;
          this.particles.emit(px, py, 20, '#FFD700', 150);
          this.particles.emit(px, py, 15, '#9D4EDD', 120);
          audioManager.play('discovery');
          audioManager.play('coin-collect');

          // Notify App.tsx about the discovery (for saving to jug)
          this.onDiscovery?.(card.id);

          // Brief screen flash in gold (non-blocking)
          this.triggerScreenShake(3, 0.15);
        }
      }
    }
  }

  private updatePowerUpTimers(dt: number) {
    const p = this.player;
    if (p.powerUpTimer > 0) {
      p.powerUpTimer -= dt;
      this.onPowerUpUpdate?.(p.powerUp, p.powerUpTimer);
      if (p.powerUpTimer <= 0) {
        const hadShield = p.shieldActive;
        p.shieldActive = false;
        p.magnetActive = false;
        p.speedActive = false;
        p.powerUp = null;
        this.onPowerUpUpdate?.(null, 0);
        // Sound feedback when shield expires naturally
        if (hadShield) {
          audioManager.playRate('shield', 0.6);
        }
      }
    }
  }

  private updateCombo(dt: number) {
    if (this.player.comboTimer > 0) {
      this.player.comboTimer -= dt;
      if (this.player.comboTimer <= 0) {
        this.player.combo = 0;
        this.onScoreUpdate?.(this.score, 0);
      }
    }
  }

  private updateBackgroundTransition(dt: number) {
    if (this.nextBg) {
      this.bgTransitionAlpha += dt * 0.5;
      if (this.bgTransitionAlpha >= 1) {
        this.currentBg = this.nextBg;
        this.nextBg = null;
        this.bgTransitionAlpha = 0;
      }
    }
  }

  // ==========================================
  // Spawning - Formations for real challenge
  // ==========================================
  private spawnEntities(dt: number) {
    // Level 1: tutorial - only coins, no obstacles
    if (this.level === 1) {
      this.spawnCoins(dt, 2.5);
      return;
    }

    this.spawnTimer += dt;
    const spawnInterval = this.levelConfig.obstacleDensity / (this.levelConfig.scrollSpeed * this.getSpeedMultiplier() * 60);

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnFormation();
    }

    // Very rare coins - only every 3-4 seconds
    this.spawnCoins(dt, this.level <= 3 ? 3.0 : 4.0);
    this.spawnPowerUps(dt);
  }

  /** Spawn a challenging obstacle formation instead of a single obstacle */
  private spawnFormation() {
    const types = this.levelConfig.obstacles;
    if (types.length === 0) return;

    const roll = Math.random();
    const hasArch = types.includes('arch');
    const hasMinaret = types.includes('minaret');
    const hasBird = types.includes('bird');
    const hasBalloon = types.includes('balloon');
    const hasCloud = types.includes('cloud');

    // Formation probabilities change by difficulty
    const wallChance = (hasArch || hasMinaret) ? 0.35 : 0;
    // Bird flock chance: reduced at level 6+, even lower at level 7+
    let flockChance = 0;
    if (hasBird) {
      if (this.level >= 7) {
        flockChance = Math.min(0.10, 0.03 + (this.level - 7) * 0.015);
      } else if (this.level >= 6) {
        flockChance = 0.05;
      } else {
        flockChance = 0.25;
      }
    }
    const mixedChance = ((hasArch || hasMinaret) && (hasBalloon || hasCloud)) ? 0.25 : 0;

    let cumulative = 0;
    if (roll < (cumulative += wallChance)) {
      this.spawnWallFormation();
    } else if (roll < (cumulative += flockChance)) {
      this.spawnBirdFlock();
    } else if (roll < (cumulative += mixedChance)) {
      this.spawnMixedFormation();
    } else {
      this.spawnSingleObstacle();
    }
  }

  /** Wall: two static structures with a narrow gap between them (Flappy Bird style) */
  private spawnWallFormation() {
    const types = this.levelConfig.obstacles;
    const staticTypes = types.filter(t => t === 'arch' || t === 'minaret');
    const wallType = staticTypes.length > 0
      ? staticTypes[Math.floor(Math.random() * staticTypes.length)]
      : 'arch';

    const gapSize = 110 - Math.min(40, this.level * 4); // Gap shrinks as levels progress
    const gapCenter = 90 + Math.random() * (this.height - 180);

    // Top structure - hanging from top
    const topY = gapCenter - gapSize / 2 - OBSTACLE_SIZES[wallType].h / 2;
    this.obstacles.push(this.createObstacle(wallType, this.width + 100, topY, false));

    // Bottom structure - standing from bottom
    const bottomY = gapCenter + gapSize / 2 + OBSTACLE_SIZES[wallType].h / 2;
    this.obstacles.push(this.createObstacle(wallType, this.width + 100, bottomY, false));

    // Occasional third obstacle in the gap for higher levels (rare bird)
    if (this.level >= 9 && Math.random() > 0.75) {
      const midY = gapCenter + (Math.random() - 0.5) * gapSize * 0.3;
      this.obstacles.push(this.createObstacle('bird', this.width + 100, midY, false));
    }
  }

  /** Flock: 1-2 birds flying in formation at different heights */
  private spawnBirdFlock() {
    const baseY = 100 + Math.random() * (this.height - 200);
    // Level 6+: only 1 bird per flock
    const count = this.level >= 6 ? 1 : 2;
    const spacingX = 40 + Math.random() * 30;
    const spacingY = 50 + Math.random() * 60;

    for (let i = 0; i < count; i++) {
      const yOffset = (i === 0) ? -spacingY * 0.5 : spacingY * 0.5;
      // Level 6+: mixed tracking — some birds chase, some fly their own path
      const tracking = this.level < 6 || (this.level >= 6 && Math.random() > 0.5);
      this.obstacles.push(this.createObstacle(
        'bird',
        this.width + 100 + i * spacingX,
        baseY + yOffset,
        tracking
      ));
    }
  }

  /** Mixed: static structure + moving obstacle at same X, different Y */
  private spawnMixedFormation() {
    const allTypes = this.levelConfig.obstacles;
    let types = allTypes.filter(t => t !== 'arch' && t !== 'minaret');
    // Level 6+: reduce birds in mixed formations
    if (this.level >= 6) {
      types = types.filter(t => t !== 'bird');
    }
    const secondaryType = types.length > 0 ? types[Math.floor(Math.random() * types.length)] : 'balloon';

    const staticTypes = allTypes.filter(t => t === 'arch' || t === 'minaret');
    const staticType = staticTypes.length > 0 ? staticTypes[Math.floor(Math.random() * staticTypes.length)] : 'arch';

    const staticY = OBSTACLE_SIZES[staticType].h * 0.5 + 20 + Math.random() * (this.height * 0.3);
    const secondaryY = this.height - OBSTACLE_SIZES[secondaryType].h * 0.5 - 20 - Math.random() * (this.height * 0.3);

    this.obstacles.push(this.createObstacle(staticType, this.width + 100, staticY, false));
    this.obstacles.push(this.createObstacle(secondaryType, this.width + 100, secondaryY, false));
  }

  /** Single obstacle - the basic case */
  private spawnSingleObstacle() {
    let types = this.levelConfig.obstacles;
    // Level 6+: filter birds from single spawns (stronger at level 7+)
    const birdFilterChance = this.level >= 7 ? 0.80 : this.level >= 6 ? 0.60 : 0;
    if (this.level >= 6 && types.includes('bird') && Math.random() < birdFilterChance) {
      const nonBird = types.filter(t => t !== 'bird');
      if (nonBird.length > 0) types = nonBird;
    }
    const type = types[Math.floor(Math.random() * types.length)];
    const size = OBSTACLE_SIZES[type];
    // Level 6+: birds randomly track or fly independently
    const tracking = type === 'bird'
      ? (this.level < 6 || (this.level >= 6 && Math.random() > 0.5))
      : false;
    this.obstacles.push(this.createObstacle(type, this.width + 100, this.getRandomY(size.h), tracking));
  }

  /** Helper to create an obstacle */
  private createObstacle(type: ObstacleType, x: number, y: number, tracking: boolean): Obstacle {
    const size = OBSTACLE_SIZES[type];
    return {
      id: `obs_${Date.now()}_${Math.random()}`,
      position: { x, y },
      velocity: { x: 0, y: 0 },
      width: size.w,
      height: size.h,
      active: true,
      type: 'obstacle',
      obstacleType: type,
      oscillationOffset: Math.random() * Math.PI * 2,
      oscillationSpeed: type === 'balloon' ? 2 : type === 'cloud' ? 1 : type === 'bird' ? 2.5 : 0,
      oscillationAmplitude: type === 'balloon' ? 30 : type === 'cloud' ? 15 : type === 'bird' ? 45 : 0,
      trackingPlayer: tracking,
    };
  }

  private spawnCoins(dt: number, interval: number) {
    this.coinSpawnTimer += dt;

    if (this.coinSpawnTimer >= interval) {
      this.coinSpawnTimer = 0;

      // Place coins IN the gap of the most recent wall formation, or randomly
      const recentStatics = this.obstacles.filter(o => (o.obstacleType === 'arch' || o.obstacleType === 'minaret') && o.position.x > this.width * 0.3);
      let baseY: number;

      if (recentStatics.length >= 2 && Math.random() > 0.3) {
        // Place coins between two static structures (in the gap)
        const ys = recentStatics.map(a => a.position.y).sort((a, b) => a - b);
        baseY = (ys[0] + ys[1]) / 2;
      } else {
        baseY = this.getRandomY(COIN_SIZE);
      }

      // Determine if we should spawn a shield coin (fixed count per level)
      const shieldTarget = this.getShieldCoinTarget();
      const canSpawnShield = this.shieldCoinsSpawned < shieldTarget && Math.random() < 0.4;

      if (canSpawnShield) {
        // Spawn a single shield coin
        this.shieldCoinsSpawned++;
        this.collectibles.push({
          id: `shield_coin_${Date.now()}`,
          position: { x: this.width + 60, y: baseY },
          velocity: { x: 0, y: 0 },
          width: COIN_SIZE,
          height: COIN_SIZE,
          active: true,
          type: 'collectible',
          value: 0,
          rotation: 0,
          bobOffset: Math.random() * Math.PI * 2,
          collected: false,
          attracted: false,
          isShieldCoin: true,
        });
      } else {
        // Spawn regular coins (1-2), worth 30 points each
        const count = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
          this.collectibles.push({
            id: `coin_${Date.now()}_${i}`,
            position: { x: this.width + 60 + i * 45, y: baseY + (i - count / 2) * 30 },
            velocity: { x: 0, y: 0 },
            width: COIN_SIZE,
            height: COIN_SIZE,
            active: true,
            type: 'collectible',
            value: 30,
            rotation: 0,
            bobOffset: Math.random() * Math.PI * 2,
            collected: false,
            attracted: false,
            isShieldCoin: false,
          });
        }
      }
    }
  }

  private spawnPowerUps(dt: number) {
    const powerUpTypes = this.levelConfig.powerUps;
    if (powerUpTypes.length === 0) return;

    this.powerUpSpawnTimer += dt;
    const powerUpInterval = 35; // Every 35 seconds - very rare

    if (this.powerUpSpawnTimer >= powerUpInterval) {
      this.powerUpSpawnTimer = 0;
      const type = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
      this.powerUpItems.push({
        id: `pu_${Date.now()}`,
        position: { x: this.width + 100, y: this.getRandomY(POWERUP_SIZE) },
        velocity: { x: 0, y: 0 },
        width: POWERUP_SIZE,
        height: POWERUP_SIZE,
        active: true,
        type: 'powerup',
        powerUpType: type,
        rotation: 0,
        pulsePhase: 0,
      });
    }
  }

  private getRandomY(entityHeight: number): number {
    const padding = 90;
    return padding + Math.random() * (this.height - padding * 2 - entityHeight) + entityHeight / 2;
  }

  // ==========================================
  // Collision Detection
  // ==========================================
  private checkCollisions() {
    const p = this.player;

    // Player vs Obstacles
    if (!p.invincible) {
      for (const obs of this.obstacles) {
        if (this.circleCollision(p.position, PLAYER_HIT_RADIUS, obs.position, OBSTACLE_SIZES[obs.obstacleType].r)) {
          this.handlePlayerHit();
          break;
        }
      }
    }

    // Player vs Collectibles
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      if (c.collected) continue;
      if (this.circleCollision(p.position, PLAYER_HIT_RADIUS + (p.magnetActive ? 20 : 0), c.position, COIN_HIT_RADIUS)) {
        c.collected = true;
        if (c.isShieldCoin) {
          this.activatePowerUp('shield');
          this.particles.emitPowerUp(c.position.x, c.position.y);
          audioManager.play('powerup');
        } else {
          this.collectCoin(c);
        }
        this.collectibles.splice(i, 1);
      }
    }

    // Player vs Power-ups
    for (let i = this.powerUpItems.length - 1; i >= 0; i--) {
      const pu = this.powerUpItems[i];
      if (this.circleCollision(p.position, PLAYER_HIT_RADIUS, pu.position, POWERUP_HIT_RADIUS)) {
        this.activatePowerUp(pu.powerUpType);
        this.particles.emitPowerUp(pu.position.x, pu.position.y);
        audioManager.play('powerup');
        this.powerUpItems.splice(i, 1);
      }
    }

    // Snake bite is handled in updateSnake (danger zone logic)
  }

  private circleCollision(pos1: { x: number; y: number }, r1: number, pos2: { x: number; y: number }, r2: number): boolean {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < r1 + r2;
  }

  private handlePlayerHit() {
    const p = this.player;

    if (p.shieldActive) {
      p.shieldActive = false;
      p.powerUp = null;
      p.powerUpTimer = 0;
      this.onPowerUpUpdate?.(null, 0);
      this.particles.emit(p.position.x, p.position.y, 10, '#48CAE4', 100);
      audioManager.play('shield');
      // Brief i-frames so the player doesn't instantly get hit again
      // by the same obstacle on the next frame
      p.invincible = true;
      p.invincibleTimer = 0.8;
      return;
    }

    p.lives--;
    p.invincible = true;
    p.invincibleTimer = 1.3; // Shorter i-frames = more punishing
    p.hitFlashTimer = 0.3;
    // Knockback: push player back and slightly random vertical displacement
    p.targetX -= 25;
    p.targetY += (Math.random() - 0.5) * 40;
    // Clamp after knockback
    p.targetX = Math.max(p.width * 0.55, Math.min(this.width - p.width * 0.55, p.targetX));
    p.targetY = Math.max(p.height * 0.55, Math.min(this.height - p.height * 0.55, p.targetY));

    // Reset combo
    p.combo = 0;
    p.comboTimer = 0;

    this.onLivesUpdate?.(p.lives);
    this.particles.emitHit(p.position.x, p.position.y);
    audioManager.play('hit');
    this.triggerScreenShake(8, 0.3);

    if (p.lives <= 0) {
      this.gameOver();
    }
  }

  private collectCoin(c: Collectible) {
    this.player.combo++;
    this.player.comboTimer = 2;
    if (this.player.combo > this.maxCombo) {
      this.maxCombo = this.player.combo;
    }

    const multiplier = Math.min(this.player.combo, 10);
    const points = c.value * multiplier;
    this.score += points;

    this.particles.emitCoinCollect(c.position.x, c.position.y);
    audioManager.play('coin-collect');
    this.onScoreUpdate?.(this.score, this.player.combo);
  }

  private activatePowerUp(type: PowerUpType) {
    const p = this.player;
    p.powerUp = type;
    p.powerUpTimer = type === 'shield' ? 7 : type === 'magnet' ? 6 : type === 'speed' ? 6 : 0;

    p.shieldActive = type === 'shield';
    p.magnetActive = type === 'magnet';
    p.speedActive = type === 'speed';

    if (type === 'tile') {
      // Extra life
      p.lives = Math.min(p.maxLives, p.lives + 1);
      this.onLivesUpdate?.(p.lives);
      p.powerUp = null;
      p.powerUpTimer = 0;
      this.particles.emit(p.position.x, p.position.y, 15, '#FF6B6B', 120);
    }

    this.onPowerUpUpdate?.(p.powerUp, p.powerUpTimer);
  }

  private triggerScreenShake(intensity: number, duration: number) {
    this.screenShake = {
      intensity,
      duration,
      timer: duration,
      offsetX: 0,
      offsetY: 0,
    };
  }

  private updateFinishLine(dt: number) {
    const fl = this.finishLine;
    if (!fl.active || fl.crossed) return;

    const scrollSpeed = this.levelConfig.scrollSpeed * this.getSpeedMultiplier() * (this.player.speedActive ? 0.5 : 1);
    fl.x -= scrollSpeed * dt * 60 * 1.2; // Slightly faster than scroll for drama

    // Countdown text
    if (fl.x > this.width * 0.3 && fl.x < this.width * 0.8) {
      fl.countdown += dt;
    }

    // Check if player crossed the finish line
    if (fl.x < this.player.position.x && !fl.crossed) {
      fl.crossed = true;
      // Big celebration burst when player physically crosses the line
      this.particles.emit(this.player.position.x, this.player.position.y, 40, '#FFD700', 250);
      this.particles.emit(this.player.position.x, this.player.position.y, 25, '#22c55e', 180);
      this.triggerScreenShake(8, 0.4);
      audioManager.play('level-complete');
      this.levelComplete();
    }

    // Despawn if off screen
    if (fl.x < -100) {
      fl.active = false;
    }
  }

  private renderFinishLine() {
    const fl = this.finishLine;
    if (!fl.active) return;

    const ctx = this.ctx;
    const t = this.gameTime;

    ctx.save();

    // === CHECKERED FLAG PATTERN ===
    const squareSize = 16;
    const cols = 4;
    const bannerHeight = this.height;

    for (let row = 0; row < bannerHeight / squareSize + 1; row++) {
      for (let col = 0; col < cols; col++) {
        const isWhite = (row + col) % 2 === 0;
        ctx.fillStyle = isWhite ? '#FFFFFF' : '#111111';
        ctx.fillRect(
          fl.x + col * squareSize,
          row * squareSize,
          squareSize,
          squareSize
        );
      }
    }

    // === GLOWING EDGE ===
    const edgeGlow = ctx.createLinearGradient(fl.x - 20, 0, fl.x + cols * squareSize + 20, 0);
    edgeGlow.addColorStop(0, 'rgba(255, 215, 0, 0.6)');
    edgeGlow.addColorStop(0.3, 'rgba(255, 215, 0, 0)');
    edgeGlow.addColorStop(0.7, 'rgba(255, 215, 0, 0)');
    edgeGlow.addColorStop(1, 'rgba(255, 215, 0, 0.6)');
    ctx.fillStyle = edgeGlow;
    ctx.fillRect(fl.x - 20, 0, cols * squareSize + 40, this.height);

    // === FINISH TEXT ===
    const textAlpha = 0.5 + Math.sin(t * 8) * 0.5;
    ctx.fillStyle = `rgba(255, 215, 0, ${textAlpha})`;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.save();
    // Rotated text along the finish line
    ctx.translate(fl.x + cols * squareSize / 2, this.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('F I N I S H', 0, 0);
    ctx.restore();

    ctx.restore();
  }

  private checkWinCondition() {
    const reachedScore = this.score >= this.levelConfig.targetScore;
    if (reachedScore) {
      this.levelComplete();
    }
    // Distance-based win is handled when the player physically crosses the finish line
  }

  private gameOver() {
    this.isPlaying = false;
    this.screen = 'gameOver';
    audioManager.stopBGM();
    cancelAnimationFrame(this.animFrameId);
    this.onGameOver?.();
  }

  private levelComplete() {
    this.isPlaying = false;
    this.screen = 'levelComplete';
    audioManager.play('level-complete');
    cancelAnimationFrame(this.animFrameId);
    this.onLevelComplete?.();
  }

  // ==========================================
  // Rendering
  // ==========================================
  render() {
    const ctx = this.ctx;
    ctx.save();

    // Apply screen shake
    ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);

    // Background
    this.renderBackground();

    // Entities
    this.renderCollectibles();
    this.renderPowerUpItems();
    this.renderObstacles();
    this.renderFinishLine();
    this.renderSnake();
    this.renderPlayer();
    this.particles.render(ctx);

    ctx.restore();
  }

  private renderBackground() {
    const ctx = this.ctx;
    const bgName = `bg-${this.currentBg}`;
    const bgImg = assetManager.get(bgName);

    if (bgImg) {
      const segmentWidth = this.width;
      const segmentCount = Math.max(2, Math.ceil(this.levelConfig.targetDistance / 1000) + 1);
      const progress = Math.max(0, Math.min(1, this.distance / this.levelConfig.targetDistance));
      const totalScroll = segmentWidth * (segmentCount - 1);
      const scrollX = progress * totalScroll;
      const firstSegment = Math.floor(scrollX / segmentWidth);
      const localOffset = scrollX - firstSegment * segmentWidth;

      const drawCoverSegment = (img: HTMLImageElement, x: number, mirrored = false) => {
        const targetRatio = segmentWidth / this.height;
        const imageRatio = img.naturalWidth / img.naturalHeight;
        let sx = 0;
        let sy = 0;
        let sw = img.naturalWidth;
        let sh = img.naturalHeight;

        if (imageRatio > targetRatio) {
          sw = img.naturalHeight * targetRatio;
          sx = (img.naturalWidth - sw) / 2;
        } else {
          sh = img.naturalWidth / targetRatio;
          sy = (img.naturalHeight - sh) / 2;
        }

        if (mirrored) {
          ctx.save();
          ctx.translate(x + segmentWidth, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, segmentWidth, this.height);
          ctx.restore();
        } else {
          ctx.drawImage(img, sx, sy, sw, sh, x, 0, segmentWidth, this.height);
        }
      };

      for (let segment = firstSegment; segment <= firstSegment + 1 && segment < segmentCount; segment++) {
        const x = (segment - firstSegment) * segmentWidth - localOffset;
        const mirrored = segment % 2 === 1;
        drawCoverSegment(bgImg, x, mirrored);

        if (this.nextBg) {
          const nextBgImg = assetManager.get(`bg-${this.nextBg}`);
          if (nextBgImg) {
            ctx.save();
            ctx.globalAlpha = this.bgTransitionAlpha;
            drawCoverSegment(nextBgImg, x, mirrored);
            ctx.restore();
          }
        }
      }
    } else {
      // Fallback gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.5, '#E6C288');
      gradient.addColorStop(1, '#C4956A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  private renderSnake() {
    if (!this.snakeDanger.active) return;
    const ctx = this.ctx;
    const sd = this.snakeDanger;
    const t = this.gameTime;
    const py = this.player.position.y;

    // Danger zone shifts right at higher levels — must match updateSnake()
    const extraReach = this.level >= 6 ? Math.min(50, (this.level - 5) * 15) : 0;
    const DANGER_ZONE_X = 90 + extraReach;
    const WARNING_ZONE_X = 140 + extraReach;

    // How close is the player to the danger zone?
    const playerProximity = Math.max(0, Math.min(1, (WARNING_ZONE_X - this.player.position.x) / (WARNING_ZONE_X - DANGER_ZONE_X)));

    // === DELAYED VERTICAL TRACKING ===
    // Snake follows where the player was 1-4 seconds ago
    const targetTime = this.gameTime - this.snakeRenderDelay;
    let delayedPy = py;
    for (let i = this.snakeYHistory.length - 1; i >= 0; i--) {
      if (this.snakeYHistory[i].time <= targetTime) {
        delayedPy = this.snakeYHistory[i].y;
        break;
      }
    }

    // === DANGER ZONE GLOW ===
    // Pulsing red glow on the left edge that intensifies as player approaches
    ctx.save();
    const glowAlpha = 0.08 + playerProximity * 0.25;
    const pulse = 1 + Math.sin(t * 4) * 0.15;
    const zoneGlow = ctx.createLinearGradient(0, 0, WARNING_ZONE_X * 1.5, 0);
    zoneGlow.addColorStop(0, `rgba(220, 20, 60, ${glowAlpha * pulse})`);
    zoneGlow.addColorStop(0.6, `rgba(220, 20, 60, ${glowAlpha * 0.4})`);
    zoneGlow.addColorStop(1, 'rgba(220, 20, 60, 0)');
    ctx.fillStyle = zoneGlow;
    ctx.fillRect(0, 0, WARNING_ZONE_X * 1.5, this.height);
    ctx.restore();

    // === SNAKE CREATURE — only visible when player is close ===
    if (playerProximity > 0) {
      const snakeHeadY = delayedPy + Math.sin(t * 2) * 8;
      const peekAmount = playerProximity * 55; // Peeks in proportionally as player gets closer
      const snakeAlpha = Math.min(1, playerProximity / 0.3); // Fade in over first 30% of proximity
      ctx.save();
      ctx.globalAlpha = snakeAlpha;

      // Snake body (coiled, partially off-screen)
      ctx.fillStyle = '#1a0a00';
      ctx.beginPath();
      ctx.ellipse(-10, snakeHeadY, 50, 35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Scales pattern
      for (let i = 0; i < 6; i++) {
        const sx = -5 + (i % 3) * 12;
        const sy = snakeHeadY - 20 + Math.floor(i / 3) * 20;
        ctx.fillStyle = `rgba(212, 175, 55, ${0.4 + Math.sin(t * 3 + i) * 0.15})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Snake head shape (partially visible)
      ctx.fillStyle = '#2a1000';
      ctx.beginPath();
      ctx.ellipse(peekAmount - 10, snakeHeadY, 30, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // === GLOWING EYES ===
      // Left eye
      const eyeGlow = 0.6 + Math.sin(t * 5) * 0.4;
      const eyeY = snakeHeadY - 8 + Math.sin(sd.eyeOffset) * 2;

      // Eye glow
      ctx.save();
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 15 + playerProximity * 20;
      ctx.fillStyle = `rgba(255, 50, 50, ${eyeGlow})`;
      ctx.beginPath();
      ctx.ellipse(peekAmount + 2, eyeY - 5, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Right eye
      ctx.save();
      ctx.shadowColor = '#FF0000';
      ctx.shadowBlur = 15 + playerProximity * 20;
      ctx.fillStyle = `rgba(255, 50, 50, ${eyeGlow})`;
      ctx.beginPath();
      ctx.ellipse(peekAmount + 2, eyeY + 5, 5, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Pupils (slits)
      ctx.fillStyle = `rgba(139, 0, 0, ${0.8 + playerProximity * 0.2})`;
      ctx.fillRect(peekAmount + 4, eyeY - 6, 3, 3);
      ctx.fillRect(peekAmount + 4, eyeY + 4, 3, 3);

      // === FANGS (visible when close) ===
      if (playerProximity > 0.5) {
        const fangAlpha = (playerProximity - 0.5) * 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${fangAlpha * 0.8})`;
        // Top fang
        ctx.beginPath();
        ctx.moveTo(peekAmount + 15, snakeHeadY - 12);
        ctx.lineTo(peekAmount + 18, snakeHeadY - 4);
        ctx.lineTo(peekAmount + 12, snakeHeadY - 4);
        ctx.fill();
        // Bottom fang
        ctx.beginPath();
        ctx.moveTo(peekAmount + 15, snakeHeadY + 12);
        ctx.lineTo(peekAmount + 18, snakeHeadY + 4);
        ctx.lineTo(peekAmount + 12, snakeHeadY + 4);
        ctx.fill();
      }

      ctx.restore();
    }

    // === WARNING TEXT ===
    if (sd.warningPhase && playerProximity > 0.3) {
      ctx.save();
      const warningAlpha = Math.min(1, sd.warningTimer * 3) * (0.5 + Math.sin(t * 8) * 0.5);
      ctx.fillStyle = `rgba(255, 80, 80, ${warningAlpha})`;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DANGER!  FLY RIGHT!', WARNING_ZONE_X + 50, py - 45);
      ctx.restore();
    }

    // === LEFT EDGE DANGER BAR ===
    if (playerProximity > 0.15) {
      ctx.save();
      const barAlpha = playerProximity * 0.6;
      const barGrad = ctx.createLinearGradient(0, 0, 8, 0);
      barGrad.addColorStop(0, `rgba(220, 20, 60, ${barAlpha})`);
      barGrad.addColorStop(1, 'rgba(220, 20, 60, 0)');
      ctx.fillStyle = barGrad;
      ctx.fillRect(0, 0, 8, this.height);
      ctx.restore();
    }
  }

  private renderPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    const t = this.gameTime;
    const px = p.position.x;
    const py = p.position.y;

    // === GOLDEN HERO AURA - makes the boy clearly the protagonist ===
    ctx.save();
    // Large outer glow
    const outerGlow = ctx.createRadialGradient(px, py + 10, 20, px, py + 10, 100);
    outerGlow.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    outerGlow.addColorStop(0.5, 'rgba(255, 165, 0, 0.15)');
    outerGlow.addColorStop(1, 'rgba(255, 140, 0, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(px, py + 10, 100, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing golden ring
    const pulseScale = 1 + Math.sin(t * 4) * 0.08;
    ctx.beginPath();
    ctx.arc(px, py + 10, 60 * pulseScale, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 215, 0, ${0.35 + Math.sin(t * 4) * 0.15})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Sparkle dots orbiting the player
    for (let i = 0; i < 5; i++) {
      const angle = t * 2.5 + (i * Math.PI * 2) / 5;
      const sx = px + Math.cos(angle) * 75;
      const sy = py + 10 + Math.sin(angle) * 55;
      const ss = 2.5 + Math.sin(t * 6 + i) * 1.5;
      ctx.fillStyle = `rgba(255, 255, 220, ${0.6 + Math.sin(t * 3 + i) * 0.3})`;
      ctx.beginPath();
      ctx.arc(sx, sy, ss, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // === ENERGY SHIELD (when active) ===
    if (p.shieldActive) {
      ctx.save();

      const shieldRadius = 66;
      const timeLeft = p.powerUpTimer;
      const isExpiring = timeLeft < 2;

      // Expiration warning: rapid flash when almost done
      const flashAlpha = isExpiring
        ? (Math.floor(t * 8) % 2 === 0 ? 1 : 0.25)
        : 1;

      // --- Layer 1: Outer pulsing glow ---
      const pulse = 1 + Math.sin(t * 5) * 0.14;
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 30 + Math.sin(t * 4) * 18;
      ctx.beginPath();
      ctx.arc(px, py + 10, shieldRadius * pulse, 0, Math.PI * 2);
      const outerGlow = ctx.createRadialGradient(px, py + 10, 32, px, py + 10, shieldRadius * pulse);
      outerGlow.addColorStop(0, `rgba(0, 229, 255, ${0.1 * flashAlpha})`);
      outerGlow.addColorStop(0.5, `rgba(72, 202, 228, ${0.3 * flashAlpha})`);
      outerGlow.addColorStop(1, `rgba(72, 202, 228, 0)`);
      ctx.fillStyle = outerGlow;
      ctx.fill();
      ctx.shadowBlur = 0;

      // --- Layer 2: Rotating hexagonal energy ring ---
      ctx.save();
      ctx.translate(px, py + 10);
      ctx.rotate(t * 1.8); // slow CW rotation
      const hexRadius = shieldRadius * 0.88;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = Math.cos(angle) * hexRadius;
        const hy = Math.sin(angle) * hexRadius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(0, 229, 255, ${0.7 * flashAlpha})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Corner nodes on the hexagon
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = Math.cos(angle) * hexRadius;
        const hy = Math.sin(angle) * hexRadius;
        const nodePulse = 2 + Math.sin(t * 6 + i) * 1.5;
        ctx.fillStyle = `rgba(200, 255, 255, ${(0.6 + Math.sin(t * 4 + i) * 0.3) * flashAlpha})`;
        ctx.beginPath();
        ctx.arc(hx, hy, nodePulse, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner hexagon (rotates opposite direction, faster)
      ctx.rotate(-t * 3.5);
      const innerHexRadius = hexRadius * 0.55;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const hx = Math.cos(angle) * innerHexRadius;
        const hy = Math.sin(angle) * innerHexRadius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(144, 224, 239, ${0.45 * flashAlpha})`;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // --- Layer 3: Inner bright core ---
      ctx.beginPath();
      ctx.arc(px, py + 10, 30, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(px, py + 10, 6, px, py + 10, 30);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${0.35 * flashAlpha})`);
      coreGrad.addColorStop(0.5, `rgba(0, 229, 255, ${0.15 * flashAlpha})`);
      coreGrad.addColorStop(1, `rgba(0, 229, 255, 0)`);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // --- Layer 4: Orbiting edge sparkles ---
      for (let i = 0; i < 10; i++) {
        const angle = t * 2.2 + (i * Math.PI * 2) / 10;
        const sparkleR = shieldRadius * (0.92 + Math.sin(t * 3 + i * 0.7) * 0.08);
        const sx = px + Math.cos(angle) * sparkleR;
        const sy = py + 10 + Math.sin(angle) * sparkleR * 0.85;
        const ss = 1.8 + Math.sin(t * 5 + i * 1.3) * 1.2;
        ctx.fillStyle = `rgba(220, 255, 255, ${(0.6 + Math.sin(t * 4 + i) * 0.35) * flashAlpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, ss, 0, Math.PI * 2);
        ctx.fill();
      }

      // --- Layer 5: Thin outer ring pulse ---
      const ringPulse = 1 + Math.sin(t * 3) * 0.06;
      ctx.beginPath();
      ctx.arc(px, py + 10, shieldRadius * ringPulse, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0, 229, 255, ${(0.35 + Math.sin(t * 5) * 0.2) * flashAlpha})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }

    // === Shadow under the carpet ===
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.beginPath();
    ctx.ellipse(px + 5, py + p.height / 2 + 6, p.width * 0.42, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // === PLAYER SPRITE - always draw a visible backing shape + the image ===
    ctx.save();

    // Invincibility blink
    if (p.invincible && Math.floor(p.invincibleTimer * 6) % 2 === 0) {
      ctx.globalAlpha = 0.35;
    }

    // ALWAYS draw a visible golden backing ellipse first (so player is visible even if image fails)
    ctx.fillStyle = 'rgba(255, 200, 50, 0.3)';
    ctx.beginPath();
    ctx.ellipse(px, py + 10, p.width * 0.48, p.height * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    const playerImg = assetManager.get('player');
    if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
      // Draw the boy on carpet with bob + tilt based on both axes
      const bobY = Math.sin(t * 3.5) * 4;
      const tiltY = (p.targetY - py) * 0.004;
      const tiltX = (p.targetX - px) * 0.003; // Lean when moving left/right
      ctx.translate(px, py + bobY);
      ctx.rotate(Math.max(-0.3, Math.min(0.3, tiltY + tiltX)));
      const lifePulse = 1 + Math.sin(t * 3) * 0.02;
      ctx.scale(lifePulse, lifePulse);
      ctx.drawImage(playerImg, -p.width / 2, -p.height / 2, p.width, p.height);
    } else {
      // Bright fallback: golden orb with 'P' letter
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = '#FF8C00';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(px, py + 10, PLAYER_HIT_RADIUS + 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#8B4513';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('P', px, py + 10);
    }

    ctx.restore();
  }

  private renderObstacles() {
    const ctx = this.ctx;

    for (const obs of this.obstacles) {
      // Bird uses a real frame-based sprite sheet animation
      if (obs.obstacleType === 'bird') {
        ctx.save();
        ctx.translate(obs.position.x, obs.position.y);
        const sheet = assetManager.get('bird_sheet');
        if (sheet) {
          const frames = 8;
          const frameW = sheet.width / frames;
          const frameH = sheet.height;
          const frame = Math.floor((this.gameTime * 12) % frames);
          ctx.drawImage(
            sheet,
            frame * frameW, 0, frameW, frameH,
            -obs.width / 2, -obs.height / 2, obs.width, obs.height
          );
        } else {
          const img = assetManager.get(obs.obstacleType);
          if (img) {
            const flap = Math.sin(this.gameTime * 12) * 0.15;
            ctx.scale(1, 1 + flap);
            ctx.drawImage(img, -obs.width / 2, -obs.height / 2, obs.width, obs.height);
          } else {
            ctx.fillStyle = '#D90429';
            ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
          }
        }
        ctx.restore();
        continue;
      }

      const img = assetManager.get(obs.obstacleType);
      if (img) {
        ctx.save();
        ctx.translate(obs.position.x, obs.position.y);

        if (obs.obstacleType === 'balloon') {
          // Slight sway for balloons
          ctx.rotate(Math.sin(obs.oscillationOffset) * 0.05);
        }

        // Make clouds slightly translucent so they don't dominate visually
        if (obs.obstacleType === 'cloud') {
          ctx.globalAlpha = 0.85;
        }
        ctx.drawImage(img, -obs.width / 2, -obs.height / 2, obs.width, obs.height);
        ctx.restore();
      } else {
        ctx.fillStyle = obs.obstacleType === 'cloud' ? 'rgba(255,255,255,0.85)' : '#D90429';
        ctx.fillRect(obs.position.x - obs.width / 2, obs.position.y - obs.height / 2, obs.width, obs.height);
      }
    }
  }

  private renderCollectibles() {
    const ctx = this.ctx;

    for (const c of this.collectibles) {
      if (c.collected) continue;

      ctx.save();
      ctx.translate(c.position.x, c.position.y);

      // Scale bounce animation based on rotation
      const scaleX = Math.abs(Math.cos(c.rotation));
      ctx.scale(scaleX, 1);

      if (c.isShieldCoin) {
        // === SHIELD COIN ===
        // Pulsing cyan aura
        const pulse = 1 + Math.sin(this.gameTime * 5 + c.bobOffset) * 0.2;
        ctx.beginPath();
        ctx.arc(0, 0, 24 * pulse, 0, Math.PI * 2);
        const auraGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 24 * pulse);
        auraGrad.addColorStop(0, 'rgba(72, 202, 228, 0.5)');
        auraGrad.addColorStop(1, 'rgba(72, 202, 228, 0)');
        ctx.fillStyle = auraGrad;
        ctx.fill();

        // Shield coin body — hexagonal shape
        ctx.fillStyle = '#48CAE4';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const rx = Math.cos(angle) * 14;
          const ry = Math.sin(angle) * 14;
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = '#90E0EF';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const rx = Math.cos(angle) * 9;
          const ry = Math.sin(angle) * 9;
          if (i === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        ctx.fill();

        // Small shield 'S' mark
        ctx.fillStyle = '#023E8A';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('S', 0, 1);
      } else {
        // === REGULAR COIN ===
        const img = assetManager.get('coin');
        if (img) {
          ctx.drawImage(img, -c.width / 2, -c.height / 2, c.width, c.height);
        } else {
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(0, 0, COIN_HIT_RADIUS, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }
  }

  private renderPowerUpItems() {
    const ctx = this.ctx;

    for (const pu of this.powerUpItems) {
      const img = assetManager.get(pu.powerUpType);
      ctx.save();
      ctx.translate(pu.position.x, pu.position.y);

      // Glow pulse
      const pulse = 1 + Math.sin(pu.pulsePhase) * 0.15;
      ctx.scale(pulse, pulse);

      // Aura
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      const auraGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 30);
      auraGrad.addColorStop(0, 'rgba(157, 78, 221, 0.4)');
      auraGrad.addColorStop(1, 'rgba(157, 78, 221, 0)');
      ctx.fillStyle = auraGrad;
      ctx.fill();

      if (img) {
        ctx.rotate(Math.sin(pu.rotation) * 0.1);
        ctx.drawImage(img, -pu.width / 2, -pu.height / 2, pu.width, pu.height);
      } else {
        ctx.fillStyle = '#9D4EDD';
        ctx.fillRect(-pu.width / 2, -pu.height / 2, pu.width, pu.height);
      }

      ctx.restore();
    }
  }

  // ==========================================
  // Input Handlers
  // ==========================================
  handleMouseMove(x: number, y: number) {
    this.input.mouseX = x;
    this.input.mouseY = y;
    this.input.mouseActive = true;
  }

  handleMouseLeave() {
    this.input.mouseActive = false;
  }

  handleKeyDown(key: string) {
    if (key === 'ArrowUp' || key === 'w') {
      this.input.upPressed = true;
      this.input.mouseActive = false;
    }
    if (key === 'ArrowDown' || key === 's') {
      this.input.downPressed = true;
      this.input.mouseActive = false;
    }
    if (key === 'ArrowLeft' || key === 'a') {
      this.input.leftPressed = true;
      this.input.mouseActive = false;
    }
    if (key === 'ArrowRight' || key === 'd') {
      this.input.rightPressed = true;
      this.input.mouseActive = false;
    }
  }

  handleKeyUp(key: string) {
    if (key === 'ArrowUp' || key === 'w') this.input.upPressed = false;
    if (key === 'ArrowDown' || key === 's') this.input.downPressed = false;
    if (key === 'ArrowLeft' || key === 'a') this.input.leftPressed = false;
    if (key === 'ArrowRight' || key === 'd') this.input.rightPressed = false;
  }

  handleTouch(x: number, y: number) {
    this.input.mouseX = x;
    this.input.mouseY = y;
    this.input.mouseActive = true;
  }

  destroy() {
    this.stop();
    this.particles.clear();
  }

  // ==========================================
  // Getters for UI
  // ==========================================
  getStats() {
    return {
      score: this.score,
      lives: this.player.lives,
      maxLives: this.player.maxLives,
      distance: Math.floor(this.distance),
      level: this.level,
      targetScore: this.levelConfig?.targetScore || 0,
      combo: this.player.combo,
      powerUp: this.player.powerUp,
      powerUpTimer: this.player.powerUpTimer,
      shieldActive: this.player.shieldActive,
      magnetActive: this.player.magnetActive,
      speedActive: this.player.speedActive,
      maxCombo: this.maxCombo,
      snakeProximity: this.snakeDanger.active
        ? Math.max(0, Math.min(1, (140 - this.player.position.x) / 50))
        : 0,
    };
  }
}
