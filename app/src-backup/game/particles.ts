import type { Particle } from './types';

export class ParticleSystem {
  particles: Particle[] = [];
  
  spawnSparkle(x: number, y: number, count: number = 1, color?: string) {
    for (let i = 0; i < count; i++) {
      const colors = ['#ffd700', '#ffec8b', '#d4a017', '#00ccff', '#ff6b9d', '#c9a227'];
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1,
        life: 1,
        maxLife: 0.5 + Math.random() * 1,
        size: 2 + Math.random() * 4,
        color: color || colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
  }
  
  spawnTrail(x: number, y: number, count: number = 2) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 5,
        vx: -2 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 1,
        life: 1,
        maxLife: 0.3 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        color: '#ffd700',
        alpha: 0.8,
      });
    }
  }
  
  spawnCollectEffect(x: number, y: number, type: 'coin' | 'gem' | 'powerup') {
    const count = type === 'powerup' ? 20 : 12;
    const colors = type === 'coin' 
      ? ['#ffd700', '#ffec8b', '#d4a017']
      : type === 'gem'
      ? ['#00ccff', '#0099ff', '#66ddff']
      : ['#ff6b9d', '#ff8fab', '#ffd700', '#00ccff'];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.8,
        size: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
  }
  
  spawnLevelComplete(x: number, y: number) {
    for (let i = 0; i < 50; i++) {
      const angle = (Math.PI * 2 * i) / 50;
      const speed = 3 + Math.random() * 6;
      const colors = ['#ffd700', '#00ccff', '#ff6b9d', '#7fff00', '#ff4500', '#da70d6'];
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        life: 1,
        maxLife: 1.5 + Math.random() * 2,
        size: 3 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
  }
  
  spawnHitEffect(x: number, y: number) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 1,
        maxLife: 0.4 + Math.random() * 0.4,
        size: 3 + Math.random() * 4,
        color: '#ff4444',
        alpha: 1,
      });
    }
  }
  
  spawnShieldEffect(x: number, y: number) {
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 2,
        vy: Math.sin(angle) * 2,
        life: 1,
        maxLife: 0.8 + Math.random() * 0.5,
        size: 3 + Math.random() * 4,
        color: '#00ccff',
        alpha: 1,
      });
    }
  }
  
  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // slight gravity
      p.life -= dt / p.maxLife;
      p.alpha = Math.max(0, p.life);
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  render(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  
  clear() {
    this.particles = [];
  }
  
  get count(): number {
    return this.particles.length;
  }
}
