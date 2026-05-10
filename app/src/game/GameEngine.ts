import type { Player, Obstacle, Collectible, PowerUp, GameState, GameSettings, LevelConfig } from './types';
import { ParticleSystem } from './particles';
import { getDifficultyMultiplier, getStarCount } from './levels';

const CANVAS_WIDTH = 1280;
const CANVAS_HEIGHT = 720;

interface FloatingText {
  text: string;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  font: string;
}

export class GameEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  particles: ParticleSystem;

  // Game entities
  player!: Player;
  obstacles: Obstacle[] = [];
  collectibles: Collectible[] = [];
  powerUps: PowerUp[] = [];

  // Game state
  state: GameState;
  settings: GameSettings;
  currentLevel: LevelConfig;

  // Mission tracking
  missionCollected: number = 0;
  surviveTimer: number = 0;
  missionItemsCollected: string[] = [];

  // Timing
  lastTime: number = 0;
  accumulator: number = 0;
  readonly FIXED_DT = 1 / 60;

  // Spawning
  obstacleTimer: number = 0;
  collectibleTimer: number = 0;
  powerUpTimer: number = 0;

  // Background scrolling
  bgOffset: number = 0;
  groundOffset: number = 0;

  // Assets
  images: Map<string, HTMLImageElement> = new Map();
  assetsLoaded: boolean = false;

  // Callbacks
  onStateChange?: (state: GameState) => void;
  onLevelComplete?: (score: number, stars: number) => void;
  onGameOver?: (score: number) => void;

  // Combo
  comboTimer: number = 0;
  comboMultiplier: number = 1;
  levelStartDelay: number = 3;
  reachedGate: boolean = false;
  audioCtx: AudioContext | null = null;
  echoWorld: 'present' | 'ancient' = 'present';
  echoTransition: number = 0;
  ambientOsc: OscillatorNode | null = null;
  ambientGain: GainNode | null = null;

  // Background elements
  stars: { x: number; y: number; size: number; twinkle: number }[] = [];

  // Juice effects
  shakeIntensity: number = 0;
  flashAlpha: number = 0;
  floatingTexts: FloatingText[] = [];

  constructor(
    canvas: HTMLCanvasElement,
    level: LevelConfig,
    settings: GameSettings,
    savedState?: Partial<GameState>
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.particles = new ParticleSystem();
    this.currentLevel = { ...level };
    this.settings = { ...settings };

    this.state = {
      screen: 'playing',
      currentLevel: level.id,
      score: 0,
      coins: 0,
      distance: 0,
      lives: 3,
      combo: 0,
      maxCombo: 0,
      elapsedTime: 0,
      isRunning: true,
      isPaused: false,
      ...savedState,
    };

    this.missionCollected = 0;
    this.missionItemsCollected = [];
    this.surviveTimer = level.duration;

    this.initPlayer();
    this.initStars();
    this.loadAssets();
  }

  initPlayer() {
    this.player = {
      x: 150,
      y: CANVAS_HEIGHT / 2,
      width: 80,
      height: 60,
      speed: 5,
      velocity: { x: 0, y: 0 },
      targetY: CANVAS_HEIGHT / 2,
      animationState: 'idle',
      animationTimer: 0,
      shielded: false,
      magnetActive: false,
      doubleCoinsActive: false,
      speedBoost: false,
      shieldTimer: 0,
      magnetTimer: 0,
      doubleCoinsTimer: 0,
      speedTimer: 0,
      invincible: false,
      invincibleTimer: 0,
      active: true,
    };
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT * 0.6,
        size: 1 + Math.random() * 2,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  async loadAssets() {
    const assetList = [
      { name: 'player', src: './assets/player-carpet.png' },
      { name: 'bird', src: './assets/obstacle-bird.png' },
      { name: 'cloud', src: './assets/obstacle-cloud.png' },
      { name: 'arch', src: './assets/obstacle-arch.png' },
      { name: 'balloon', src: './assets/obstacle-balloon.png' },
      { name: 'coin', src: './assets/coin.png' },
      { name: 'shield', src: './assets/powerup-shield.png' },
      { name: 'magnet', src: './assets/powerup-magnet.png' },
      { name: 'speed', src: './assets/powerup-speed.png' },
      { name: 'doubleCoins', src: './assets/powerup-tile.png' },
      { name: 'background', src: this.currentLevel.backgroundImage },
    ];

    const promises = assetList.map(
      (asset) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            this.images.set(asset.name, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = asset.src;
        })
    );

    await Promise.all(promises);
    this.assetsLoaded = true;
  }

  start() {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  gameLoop = (currentTime: number) => {
    if (this.state.screen !== 'playing') return;

    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (!this.state.isPaused) {
      this.accumulator += deltaTime;

      while (this.accumulator >= this.FIXED_DT) {
        this.update(this.FIXED_DT);
        this.accumulator -= this.FIXED_DT;
      }
    }

    this.render();
    requestAnimationFrame(this.gameLoop);
  };

  update(dt: number) {
    if (this.echoTransition > 0) {
      this.echoTransition = Math.max(0, this.echoTransition - dt * 2.2);
    }

    if (this.levelStartDelay > 0) {
      this.levelStartDelay -= dt;
      if (this.levelStartDelay < 0) this.levelStartDelay = 0;
      this.state.elapsedTime += dt;
      this.onStateChange?.({ ...this.state });
      return;
    }

    const diffMult = getDifficultyMultiplier(this.settings.difficulty);
    const scrollSpeed = this.currentLevel.scrollSpeed * (this.player.speedBoost ? 1.5 : 1);

    // Update distance
    this.state.distance += scrollSpeed;
    this.state.elapsedTime += dt;

    // Update background
    this.bgOffset += scrollSpeed * 0.3;
    this.groundOffset += scrollSpeed;

    // Update player
    this.updatePlayer(dt);

    // Update timers
    this.updateTimers(dt);

    // Spawn entities
    this.spawnEntities(dt, diffMult);

    // Update entities
    this.updateObstacles(dt);
    this.updateCollectibles(dt);
    this.updatePowerUps(dt);

    // Check collisions
    this.checkCollisions();

    // Update particles
    this.particles.update(dt);

    // Spawn trail particles
    if (Math.random() < 0.5) {
      this.particles.spawnTrail(this.player.x, this.player.y + this.player.height / 2);
    }

    // Update combo
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.state.combo = 0;
        this.comboMultiplier = 1;
      }
    }

    // Update survive timer
    if (this.currentLevel.missionType === 'survive') {
      this.surviveTimer -= dt;
      if (this.surviveTimer <= 0) {
        this.levelComplete();
        return;
      }
      // Ramp up difficulty over time
      const progress = 1 - (this.surviveTimer / this.currentLevel.duration);
      this.currentLevel.obstacleFrequency = Math.max(600, 1400 - progress * 1000);
    }

    // Check distance-based level complete
    if (this.currentLevel.missionType === 'distance' && this.state.distance >= this.currentLevel.distance) {
      this.levelComplete();
      return;
    }

    if (!this.reachedGate && this.state.distance >= this.currentLevel.distance) {
      this.reachedGate = true;
      this.floatingTexts.push({
        text: 'Gate reached!',
        x: CANVAS_WIDTH / 2,
        y: 120,
        life: 1.4,
        maxLife: 1.4,
        color: '#ffd700',
        font: 'bold 26px Cinzel, serif',
      });
      this.playSfx('win');
      if (this.currentLevel.missionType !== 'collect') {
        this.levelComplete();
        return;
      }
      if (this.missionCollected >= this.currentLevel.missionTarget) {
        this.levelComplete();
        return;
      }
    }

    // Update juice effects
    if (this.shakeIntensity > 0) {
      this.shakeIntensity *= 0.9;
      if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
    }
    if (this.flashAlpha > 0) {
      this.flashAlpha -= dt * 2;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
    for (const ft of this.floatingTexts) {
      ft.life -= dt;
      ft.y -= 30 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);

    // Score from distance
    this.state.score += Math.floor(scrollSpeed * 0.1 * this.comboMultiplier);

    // Notify state change
    this.onStateChange?.({ ...this.state });
  }

  updatePlayer(dt: number) {
    const diff = this.player.targetY - this.player.y;
    this.player.velocity.y = diff * 5;
    this.player.y += this.player.velocity.y * dt;

    const margin = 50;
    this.player.y = Math.max(margin, Math.min(CANVAS_HEIGHT - this.player.height - margin, this.player.y));

    this.player.y += Math.sin(performance.now() / 300) * 0.5;
    this.player.animationState = Math.abs(diff) > 6 ? 'running' : 'idle';
    if (this.player.animationTimer > 0) {
      this.player.animationTimer -= dt;
      if (this.player.animationTimer <= 0 && this.player.animationState !== 'running') {
        this.player.animationState = 'idle';
      }
    }
  }

  updateTimers(dt: number) {
    if (this.player.shieldTimer > 0) {
      this.player.shieldTimer -= dt;
      if (this.player.shieldTimer <= 0) this.player.shielded = false;
    }
    if (this.player.magnetTimer > 0) {
      this.player.magnetTimer -= dt;
      if (this.player.magnetTimer <= 0) this.player.magnetActive = false;
    }
    if (this.player.speedTimer > 0) {
      this.player.speedTimer -= dt;
      if (this.player.speedTimer <= 0) this.player.speedBoost = false;
    }
    if (this.player.doubleCoinsTimer > 0) {
      this.player.doubleCoinsTimer -= dt;
      if (this.player.doubleCoinsTimer <= 0) this.player.doubleCoinsActive = false;
    }
    if (this.player.invincibleTimer > 0) {
      this.player.invincibleTimer -= dt;
      if (this.player.invincibleTimer <= 0) this.player.invincible = false;
    }
  }

  spawnEntities(dt: number, diffMult: number) {
    this.obstacleTimer += dt * 1000;
    const obstacleInterval = this.currentLevel.obstacleFrequency / diffMult;
    if (this.obstacleTimer >= obstacleInterval) {
      this.obstacleTimer = 0;
      this.spawnObstacle();
    }

    this.collectibleTimer += dt * 1000;
    const collectibleInterval = this.currentLevel.collectibleFrequency;
    if (this.collectibleTimer >= collectibleInterval) {
      this.collectibleTimer = 0;
      this.spawnCollectible();
    }

    this.powerUpTimer += dt * 1000;
    const powerUpInterval = this.currentLevel.powerUpFrequency;
    if (this.powerUpTimer >= powerUpInterval) {
      this.powerUpTimer = 0;
      this.spawnPowerUp();
    }
  }

  spawnObstacle() {
    const types = this.currentLevel.obstacleTypes;
    const type = types[Math.floor(Math.random() * types.length)];

    const sizes: Record<string, { w: number; h: number }> = {
      bird: { w: 60, h: 40 },
      cloud: { w: 100, h: 60 },
      arch: { w: 120, h: 180 },
      balloon: { w: 70, h: 100 },
    };

    const size = sizes[type];
    const yPos = type === 'arch'
      ? Math.random() > 0.5 ? 100 : CANVAS_HEIGHT - 250
      : 80 + Math.random() * (CANVAS_HEIGHT - 200);

    this.obstacles.push({
      x: CANVAS_WIDTH + 50,
      y: yPos,
      width: size.w,
      height: size.h,
      speed: 3 + Math.random() * 2,
      type,
      oscillating: type === 'bird' || type === 'balloon' || type === 'cloud',
      oscillationOffset: Math.random() * Math.PI * 2,
      oscillationSpeed: 2 + Math.random() * 2,
      worldAffinity:
        type === 'arch'
          ? 'present'
          : type === 'balloon'
            ? 'ancient'
            : Math.random() < 0.25
              ? 'present'
              : Math.random() < 0.5
                ? 'ancient'
                : 'both',
      active: true,
      passed: false,
    });
  }

  spawnCollectible() {
    const level = this.currentLevel;

    if (level.missionType === 'collect') {
      // Spawn mission items
      const availableItems = level.missionItems.filter(
        mi => !this.missionItemsCollected.includes(mi.name)
      );
      const itemPool = availableItems.length > 0 ? availableItems : level.missionItems;
      const mi = itemPool[Math.floor(Math.random() * itemPool.length)];

      this.collectibles.push({
        x: CANVAS_WIDTH + 50,
        y: 100 + Math.random() * (CANVAS_HEIGHT - 200),
        width: 45,
        height: 45,
        speed: 3,
        type: 'mission',
        value: 150,
        collected: false,
        active: true,
        bobOffset: Math.random() * Math.PI * 2,
        emoji: mi.emoji,
        name: mi.name,
        worldAffinity: Math.random() < 0.65 ? 'ancient' : 'both',
      });
    } else {
      // Spawn coins/gems
      const isGem = Math.random() < 0.2;
      this.collectibles.push({
        x: CANVAS_WIDTH + 50,
        y: 100 + Math.random() * (CANVAS_HEIGHT - 200),
        width: 35,
        height: 35,
        speed: 3,
        type: isGem ? 'gem' : 'coin',
        value: isGem ? 50 : 10,
        collected: false,
        active: true,
        bobOffset: Math.random() * Math.PI * 2,
        worldAffinity: isGem ? 'ancient' : 'both',
      });
    }
  }

  spawnPowerUp() {
    const types: ('shield' | 'magnet' | 'speed' | 'doubleCoins')[] = ['shield', 'magnet', 'speed', 'doubleCoins'];
    const type = types[Math.floor(Math.random() * types.length)];

    this.powerUps.push({
      x: CANVAS_WIDTH + 50,
      y: 150 + Math.random() * (CANVAS_HEIGHT - 300),
      width: 45,
      height: 45,
      speed: 3,
      type,
      worldAffinity: type === 'doubleCoins' ? 'ancient' : 'both',
      collected: false,
      active: true,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }

  updateObstacles(dt: number) {
    const scrollSpeed = this.currentLevel.scrollSpeed;
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= (scrollSpeed + obs.speed * 0.3) * 60 * dt;
      if (obs.oscillating) {
        obs.oscillationOffset += dt * obs.oscillationSpeed;
        obs.y += Math.sin(obs.oscillationOffset) * 2;
      }
      if (obs.x + obs.width < -50) this.obstacles.splice(i, 1);
    }
  }

  updateCollectibles(dt: number) {
    const scrollSpeed = this.currentLevel.scrollSpeed;
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.x -= scrollSpeed * 60 * dt;
      col.bobOffset += dt * 3;
      col.y += Math.sin(col.bobOffset) * 0.5;

      if (this.player.magnetActive && !col.collected) {
        const dx = this.player.x - col.x;
        const dy = this.player.y - col.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          col.x += (dx / dist) * 8;
          col.y += (dy / dist) * 8;
        }
      }
      if (col.x + col.width < -50) this.collectibles.splice(i, 1);
    }
  }

  updatePowerUps(dt: number) {
    const scrollSpeed = this.currentLevel.scrollSpeed;
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const pu = this.powerUps[i];
      pu.x -= scrollSpeed * 60 * dt;
      pu.bobOffset += dt * 3;
      pu.y += Math.sin(pu.bobOffset) * 0.5;
      if (pu.x + pu.width < -50) this.powerUps.splice(i, 1);
    }
  }

  checkCollisions() {
    const px = this.player.x;
    const py = this.player.y;
    const pw = this.player.width;
    const ph = this.player.height;

    // Player vs Obstacles
    for (const obs of this.obstacles) {
      if (!obs.active || obs.passed) continue;
      if (obs.worldAffinity && obs.worldAffinity !== 'both' && obs.worldAffinity !== this.echoWorld) continue;

      const shrink = 10;
      if (
        px + shrink < obs.x + obs.width - shrink &&
        px + pw - shrink > obs.x + shrink &&
        py + shrink < obs.y + obs.height - shrink &&
        py + ph - shrink > obs.y + shrink
      ) {
        if (this.player.shielded) {
          this.player.shielded = false;
          this.player.shieldTimer = 0;
          this.player.invincible = true;
          this.player.invincibleTimer = 2;
          obs.passed = true;
          this.particles.spawnShieldEffect(obs.x + obs.width / 2, obs.y + obs.height / 2);
        } else if (!this.player.invincible) {
          this.handleHit(obs);
        }
      }

      if (obs.x + obs.width < px && !obs.passed) {
        obs.passed = true;
        this.state.score += 5;
      }
    }

    // Player vs Collectibles
    for (const col of this.collectibles) {
      if (!col.active || col.collected) continue;
      if (col.worldAffinity && col.worldAffinity !== 'both' && col.worldAffinity !== this.echoWorld) continue;

      const cx = col.x + col.width / 2;
      const cy = col.y + col.height / 2;
      const pcx = px + pw / 2;
      const pcy = py + ph / 2;
      const dist = Math.sqrt((cx - pcx) ** 2 + (cy - pcy) ** 2);

      if (dist < (pw + col.width) / 2) {
        col.collected = true;
        col.active = false;

        const points = col.value * this.comboMultiplier;
        const coinMult = this.player.doubleCoinsActive ? 2 : 1;
        this.state.score += points;
        this.state.coins += (col.type === 'coin' ? 1 : 3) * coinMult;
        this.player.animationState = 'collect';
        this.player.animationTimer = 0.22;
        this.playSfx(col.type === 'coin' ? 'coin' : 'collect');

        this.state.combo++;
        this.comboTimer = 2;
        this.comboMultiplier = Math.min(5, 1 + Math.floor(this.state.combo / 5));
        if (this.state.combo > this.state.maxCombo) this.state.maxCombo = this.state.combo;

        // Floating text
        this.floatingTexts.push({
          text: `+${points}`,
          x: col.x,
          y: col.y,
          life: 1.2,
          maxLife: 1.2,
          color: col.type === 'mission' ? '#ffd700' : '#00ccff',
          font: 'bold 24px Cinzel, serif',
        });

        if (col.type === 'mission' && col.name) {
          this.missionCollected++;
          if (!this.missionItemsCollected.includes(col.name)) {
            this.missionItemsCollected.push(col.name);
          }
          this.floatingTexts.push({
            text: `${col.name}!`,
            x: col.x,
            y: col.y - 30,
            life: 1.5,
            maxLife: 1.5,
            color: '#ffd700',
            font: 'bold 18px Nunito, sans-serif',
          });

          // Check collect mission complete (requires gate reached too)
          if (this.currentLevel.missionType === 'collect' && this.missionCollected >= this.currentLevel.missionTarget && this.reachedGate) {
            this.levelComplete();
            return;
          }
        }

        this.particles.spawnCollectEffect(col.x + col.width / 2, col.y + col.height / 2, col.type as 'coin' | 'gem');
      }
    }

    // Player vs PowerUps
    for (const pu of this.powerUps) {
      if (!pu.active || pu.collected) continue;
      if (pu.worldAffinity && pu.worldAffinity !== 'both' && pu.worldAffinity !== this.echoWorld) continue;
      const pux = pu.x + pu.width / 2;
      const puy = pu.y + pu.height / 2;
      const pcx = px + pw / 2;
      const pcy = py + ph / 2;
      const dist = Math.sqrt((pux - pcx) ** 2 + (puy - pcy) ** 2);

      if (dist < (pw + pu.width) / 2) {
        pu.collected = true;
        pu.active = false;
        this.activatePowerUp(pu.type);
        this.floatingTexts.push({
          text: pu.type.toUpperCase() + '!',
          x: pu.x,
          y: pu.y,
          life: 1.5,
          maxLife: 1.5,
          color: '#00ccff',
          font: 'bold 20px Cinzel, serif',
        });
        this.particles.spawnCollectEffect(pu.x + pu.width / 2, pu.y + pu.height / 2, 'powerup');
      }
    }
  }

  handleHit(_obs: Obstacle) {
    this.player.invincible = true;
    this.player.invincibleTimer = 2;
    this.state.lives--;
    this.state.combo = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;

    // Juice: shake + flash
    this.shakeIntensity = 15;
    this.flashAlpha = 0.4;
    this.player.animationState = 'hit';
    this.player.animationTimer = 0.35;
    this.playSfx('damage');

    this.particles.spawnHitEffect(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);

    if (this.state.lives <= 0) {
      this.gameOver();
    }
  }

  activatePowerUp(type: 'shield' | 'magnet' | 'speed' | 'doubleCoins') {
    switch (type) {
      case 'shield':
        this.player.shielded = true;
        this.player.shieldTimer = 10;
        break;
      case 'magnet':
        this.player.magnetActive = true;
        this.player.magnetTimer = 8;
        break;
      case 'speed':
        this.player.speedBoost = true;
        this.player.speedTimer = 5;
        break;
      case 'doubleCoins':
        this.player.doubleCoinsActive = true;
        this.player.doubleCoinsTimer = 8;
        break;
    }
    this.playSfx('button');
  }

  setTargetY(y: number) {
    this.player.targetY = y;
  }

  pause() {
    this.state.isPaused = true;
    this.state.screen = 'paused';
    this.onStateChange?.({ ...this.state });
  }

  resume() {
    this.state.isPaused = false;
    this.state.screen = 'playing';
    this.lastTime = performance.now();
    this.onStateChange?.({ ...this.state });
    requestAnimationFrame(this.gameLoop);
  }

  levelComplete() {
    this.state.screen = 'levelComplete';
    this.state.isRunning = false;
    const stars = getStarCount(this.state.score);
    this.particles.spawnLevelComplete(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    this.player.animationState = 'victory';
    this.player.animationTimer = 1.2;
    this.playSfx('win');
    this.saveToLeaderboard(stars);
    this.onLevelComplete?.(this.state.score, stars);
    this.onStateChange?.({ ...this.state });
  }

  gameOver() {
    this.state.screen = 'gameOver';
    this.state.isRunning = false;
    this.saveToLeaderboard(0);
    this.onGameOver?.(this.state.score);
    this.onStateChange?.({ ...this.state });
  }

  saveToLeaderboard(stars: number) {
    const entries = JSON.parse(localStorage.getItem('silkroad_leaderboard') || '[]');
    entries.push({
      name: 'Player',
      score: this.state.score,
      level: this.currentLevel.name,
      date: new Date().toISOString(),
      stars,
    });
    entries.sort((a: any, b: any) => b.score - a.score);
    localStorage.setItem('silkroad_leaderboard', JSON.stringify(entries.slice(0, 50)));
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Apply screen shake
    ctx.save();
    if (this.shakeIntensity > 0) {
      const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
      const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
      ctx.translate(sx, sy);
    }

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Draw background
    this.renderBackground(ctx, w, h);

    // Draw stars
    this.renderStars(ctx);

    // Draw ground
    this.renderGround(ctx, w, h);

    // Draw entities
    this.renderEntities(ctx);

    // Draw particles
    this.particles.render(ctx);

    // Draw player
    this.renderPlayer(ctx);

    // Draw HUD
    this.renderHUD(ctx, w);

    // Draw floating texts
    this.renderFloatingTexts(ctx);

    // Draw flash overlay
    if (this.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (this.echoTransition > 0) {
      const alpha = this.echoTransition * 0.35;
      ctx.fillStyle = this.echoWorld === 'ancient' ? `rgba(255,214,120,${alpha})` : `rgba(130,110,86,${alpha})`;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }

  renderBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const bgImg = this.images.get('background');
    if (bgImg) {
      const scale = h / bgImg.height;
      const scaledWidth = bgImg.width * scale;
      const offset = this.bgOffset % scaledWidth;
      ctx.drawImage(bgImg, -offset, 0, scaledWidth, h);
      ctx.drawImage(bgImg, scaledWidth - offset, 0, scaledWidth, h);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, this.currentLevel.skyColor);
      gradient.addColorStop(1, this.currentLevel.groundColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }

    ctx.save();
    if (this.echoWorld === 'present') {
      ctx.fillStyle = 'rgba(96, 82, 65, 0.18)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(150, 126, 96, 0.08)';
      ctx.fillRect(0, h * 0.55, w, h * 0.45);
    } else {
      ctx.fillStyle = 'rgba(251, 189, 90, 0.11)';
      ctx.fillRect(0, 0, w, h);
      const g = ctx.createRadialGradient(w * 0.78, h * 0.2, 20, w * 0.78, h * 0.2, 240);
      g.addColorStop(0, 'rgba(255,220,140,0.33)');
      g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }

  renderStars(ctx: CanvasRenderingContext2D) {
    const time = performance.now() / 1000;
    ctx.save();
    for (const star of this.stars) {
      const twinkle = Math.sin(time * 2 + star.twinkle) * 0.5 + 0.5;
      const dustFactor = this.echoWorld === 'present' ? 0.55 : 0.9;
      ctx.globalAlpha = twinkle * 0.8 * dustFactor;
      ctx.fillStyle = this.echoWorld === 'present' ? '#d8c39b' : '#ffe7a6';
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
    if (this.echoWorld === 'ancient') {
      for (let i = 0; i < 6; i++) {
        const x = (time * 30 + i * 210) % CANVAS_WIDTH;
        const y = 140 + Math.sin(time * 1.7 + i) * 35;
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ffd36a';
        ctx.fillRect(x, y, 3, 3);
      }
    }
    ctx.restore();
  }

  renderGround(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const groundHeight = 40;
    ctx.fillStyle = this.currentLevel.groundColor;
    ctx.fillRect(0, h - groundHeight, w, groundHeight);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    const offset = this.groundOffset % 40;
    for (let x = -offset; x < w; x += 40) {
      ctx.beginPath();
      ctx.arc(x, h - groundHeight, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderEntities(ctx: CanvasRenderingContext2D) {
    for (const obs of this.obstacles) {
      if (!obs.active) continue;
      if (obs.worldAffinity && obs.worldAffinity !== 'both' && obs.worldAffinity !== this.echoWorld) continue;
      const img = this.images.get(obs.type);
      if (img) {
        ctx.drawImage(img, obs.x, obs.y, obs.width, obs.height);
      } else {
        ctx.fillStyle = '#ff4444';
        ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
      }
    }

    for (const col of this.collectibles) {
      if (!col.active || col.collected) continue;
      if (col.worldAffinity && col.worldAffinity !== 'both' && col.worldAffinity !== this.echoWorld) continue;

      if (col.type === 'mission' && col.emoji) {
        ctx.save();
        ctx.translate(col.x + col.width / 2, col.y + col.height / 2);
        ctx.rotate(Math.sin(col.bobOffset) * 0.3);
        ctx.font = '36px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;
        ctx.fillText(col.emoji, 0, 0);
        ctx.restore();
      } else {
        const img = this.images.get(col.type === 'coin' ? 'coin' : 'coin');
        if (img) {
          ctx.save();
          ctx.translate(col.x + col.width / 2, col.y + col.height / 2);
          ctx.rotate(Math.sin(col.bobOffset) * 0.3);
          ctx.drawImage(img, -col.width / 2, -col.height / 2, col.width, col.height);
          ctx.restore();
        }
      }
    }

    for (const pu of this.powerUps) {
      if (!pu.active || pu.collected) continue;
      if (pu.worldAffinity && pu.worldAffinity !== 'both' && pu.worldAffinity !== this.echoWorld) continue;
      const img = this.images.get(pu.type);
      if (img) {
        ctx.save();
        ctx.translate(pu.x + pu.width / 2, pu.y + pu.height / 2);
        ctx.rotate(Math.sin(pu.bobOffset) * 0.2);
        ctx.drawImage(img, -pu.width / 2, -pu.height / 2, pu.width, pu.height);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = pu.type === 'doubleCoins' ? '#ffd700' : '#00ccff';
        ctx.beginPath();
        ctx.arc(pu.x + pu.width / 2, pu.y + pu.height / 2, pu.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#001a33';
        ctx.font = 'bold 16px Nunito, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.type === 'doubleCoins' ? 'x2' : '+', pu.x + pu.width / 2, pu.y + pu.height / 2);
        ctx.restore();
      }
    }
  }

  renderPlayer(ctx: CanvasRenderingContext2D) {
    if (this.player.invincible && Math.floor(performance.now() / 100) % 2 === 0) return;

    ctx.save();

    if (this.player.shielded) {
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.6)';
      ctx.lineWidth = 3;
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ccff';
      ctx.beginPath();
      ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.player.width * 0.8, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.player.speedBoost) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#ffd700';
      ctx.beginPath();
      ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, this.player.width * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.player.magnetActive) {
      ctx.strokeStyle = 'rgba(255, 100, 200, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, 200, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.shadowBlur = 0;

    const img = this.images.get('player');
    const bob = this.player.animationState === 'running' ? Math.sin(performance.now() / 90) * 3 : 0;
    const tilt = this.player.animationState === 'hit' ? -0.15 : this.player.animationState === 'collect' ? 0.12 : 0;
    const scale = this.player.animationState === 'victory' ? 1.08 : 1;
    if (img) {
      ctx.translate(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2 + bob);
      ctx.rotate(tilt);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -this.player.width / 2, -this.player.height / 2, this.player.width, this.player.height);
    } else {
      ctx.fillStyle = '#d4a017';
      ctx.fillRect(this.player.x, this.player.y + bob, this.player.width, this.player.height);
    }

    ctx.restore();
  }

  renderHUD(ctx: CanvasRenderingContext2D, w: number) {
    ctx.save();

    // Score
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Cinzel, serif';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${this.state.score}`, 20, 40);

    // Coins
    ctx.fillStyle = '#ffd700';
    ctx.fillText(`Coins: ${this.state.coins}`, 20, 70);

    // Mission progress
    const level = this.currentLevel;
    if (level.missionType === 'collect') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${level.missionDescription}: ${this.missionCollected}/${level.missionTarget} | Gate: ${this.reachedGate ? 'Reached' : 'Ahead'}`, w / 2, 35);

      // Progress bar
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(w / 2 - 150, 45, 300, 14);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(w / 2 - 150, 45, 300 * Math.min(1, this.missionCollected / level.missionTarget), 14);
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 2;
      ctx.strokeRect(w / 2 - 150, 45, 300, 14);
    } else if (level.missionType === 'survive') {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Cinzel, serif';
      ctx.textAlign = 'center';
      const timeText = `${Math.ceil(this.surviveTimer)}s`;
      ctx.fillText(`${level.missionDescription}: ${timeText}`, w / 2, 35);

      // Timer bar
      const progress = this.surviveTimer / level.duration;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(w / 2 - 150, 45, 300, 14);
      ctx.fillStyle = progress < 0.2 ? '#ff4444' : '#00ccff';
      ctx.fillRect(w / 2 - 150, 45, 300 * progress, 14);
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 2;
      ctx.strokeRect(w / 2 - 150, 45, 300, 14);
    } else {
      // Distance progress
      const progress = this.state.distance / this.currentLevel.distance;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(w / 2 - 150, 20, 300, 20);
      ctx.fillStyle = '#00ccff';
      ctx.fillRect(w / 2 - 150, 20, 300 * Math.min(1, progress), 20);
      ctx.strokeStyle = '#d4a017';
      ctx.lineWidth = 2;
      ctx.strokeRect(w / 2 - 150, 20, 300, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${this.currentLevel.name} - ${this.currentLevel.location}`, w / 2, 55);
    }

    // Lives
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff6b6b';
    for (let i = 0; i < this.state.lives; i++) {
      ctx.fillText('❤', w - 30 - i * 30, 45);
    }

    // Combo
    if (this.state.combo > 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 20px Cinzel, serif';
      ctx.fillText(`Combo x${this.comboMultiplier} (${this.state.combo})`, w / 2, 100);
    }

    // Power-up timers
    let timerY = 130;
    if (this.player.shielded) {
      ctx.fillStyle = '#00ccff';
      ctx.font = '14px Nunito, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Shield: ${Math.ceil(this.player.shieldTimer)}s`, 20, timerY);
      timerY += 20;
    }
    if (this.player.magnetActive) {
      ctx.fillStyle = '#ff6b9d';
      ctx.font = '14px Nunito, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Magnet: ${Math.ceil(this.player.magnetTimer)}s`, 20, timerY);
      timerY += 20;
    }
    if (this.player.speedBoost) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '14px Nunito, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`Speed: ${Math.ceil(this.player.speedTimer)}s`, 20, timerY);
      timerY += 20;
    }
    if (this.player.doubleCoinsActive) {
      ctx.fillStyle = '#ffe066';
      ctx.font = '14px Nunito, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`x2 Coins: ${Math.ceil(this.player.doubleCoinsTimer)}s`, 20, timerY);
    }

    ctx.restore();
  }

  getCountdown(): number {
    return Math.ceil(this.levelStartDelay);
  }

  getEchoWorld(): 'present' | 'ancient' {
    return this.echoWorld;
  }

  toggleEchoWorld() {
    this.echoWorld = this.echoWorld === 'present' ? 'ancient' : 'present';
    this.echoTransition = 1;
    this.playSfx('transition');
    this.updateAmbient();
    this.floatingTexts.push({
      text: this.echoWorld === 'ancient' ? 'Ancient Echo' : 'Present Ruins',
      x: CANVAS_WIDTH / 2,
      y: 150,
      life: 1.1,
      maxLife: 1.1,
      color: this.echoWorld === 'ancient' ? '#ffd97f' : '#c9b08a',
      font: 'bold 24px Cinzel, serif',
    });
  }

  private playSfx(kind: 'collect' | 'coin' | 'damage' | 'win' | 'button' | 'transition') {
    try {
      if (!this.settings.soundEnabled) return;
      if (!this.audioCtx) {
        const AC = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.audioCtx = new AC();
      }
      const ctx = this.audioCtx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      const now = ctx.currentTime;
      const cfg = {
        collect: { f: 680, t: 0.06, v: 0.05 },
        coin: { f: 920, t: 0.07, v: 0.06 },
        damage: { f: 220, t: 0.12, v: 0.07 },
        win: { f: 760, t: 0.2, v: 0.08 },
        button: { f: 540, t: 0.05, v: 0.04 },
        transition: { f: 480, t: 0.18, v: 0.07 },
      }[kind];
      o.frequency.setValueAtTime(cfg.f, now);
      g.gain.setValueAtTime(cfg.v, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + cfg.t);
      o.start(now);
      o.stop(now + cfg.t);
    } catch {
      // no-op
    }
  }

  private updateAmbient() {
    try {
      if (!this.settings.musicEnabled) return;
      if (!this.audioCtx) return;
      if (!this.ambientOsc || !this.ambientGain) {
        this.ambientOsc = this.audioCtx.createOscillator();
        this.ambientGain = this.audioCtx.createGain();
        this.ambientOsc.connect(this.ambientGain);
        this.ambientGain.connect(this.audioCtx.destination);
        this.ambientOsc.type = 'sine';
        this.ambientOsc.frequency.setValueAtTime(180, this.audioCtx.currentTime);
        this.ambientGain.gain.setValueAtTime(0.0001, this.audioCtx.currentTime);
        this.ambientOsc.start();
      }
      const now = this.audioCtx.currentTime;
      const target = this.echoWorld === 'ancient' ? 0.018 : 0.006;
      const freq = this.echoWorld === 'ancient' ? 220 : 150;
      this.ambientOsc.frequency.exponentialRampToValueAtTime(freq, now + 0.3);
      this.ambientGain.gain.exponentialRampToValueAtTime(target, now + 0.3);
    } catch {
      // no-op
    }
  }

  renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    for (const ft of this.floatingTexts) {
      const alpha = ft.life / ft.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = ft.font;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  destroy() {
    this.state.screen = 'title';
    this.particles.clear();
    this.obstacles = [];
    this.collectibles = [];
    this.powerUps = [];
    this.floatingTexts = [];
  }
}
