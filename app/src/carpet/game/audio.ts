// ==========================================
// Audio System - Howler.js
// ==========================================

import { Howl } from 'howler';

interface SoundMap {
  [key: string]: Howl;
}

class AudioManager {
  private sounds: SoundMap = {};
  private bgm: Howl | null = null;
  private currentBgm: string = '';
  private soundEnabled: boolean = true;
  private musicEnabled: boolean = true;
  private volume: number = 0.5;
  private initialized: boolean = false;

  private soundFiles: Record<string, string> = {
    'coin-collect': './sounds/coin-collect.mp3',
    'powerup': './sounds/powerup.mp3',
    'hit': './sounds/hit.mp3',
    'discovery': './sounds/discovery.mp3',
    'level-complete': './sounds/level-complete.mp3',
    'shield': './sounds/shield.mp3',
  };

  private bgmFiles: Record<string, string> = {
    'menu': './sounds/bgm-menu.mp3',
    'gameplay': './sounds/bgm-gameplay.mp3',
  };

  async init() {
    if (this.initialized) return;
    
    const loadPromises: Promise<void>[] = [];
    
    for (const [name, path] of Object.entries(this.soundFiles)) {
      loadPromises.push(
        new Promise((resolve) => {
          this.sounds[name] = new Howl({
            src: [path],
            html5: true,
            volume: name === 'hit' ? 0.6 : name === 'coin-collect' ? 0.5 : 0.7,
            onload: () => resolve(),
            onloaderror: () => {
              console.warn(`Failed to load sound: ${name}`);
              resolve();
            },
          });
        })
      );
    }

    await Promise.all(loadPromises);
    this.initialized = true;
  }

  play(name: string) {
    if (!this.soundEnabled || !this.initialized) return;
    const sound = this.sounds[name];
    if (sound) {
      sound.play();
    }
  }

  playRate(name: string, rate: number) {
    if (!this.soundEnabled || !this.initialized) return;
    const sound = this.sounds[name];
    if (sound) {
      const oldRate = sound.rate();
      sound.rate(rate);
      sound.play();
      sound.rate(oldRate);
    }
  }

  playBGM(name: string) {
    if (!this.musicEnabled) return;
    if (this.currentBgm === name && this.bgm?.playing()) return;
    
    if (this.bgm) {
      this.bgm.stop();
    }

    const bgmPath = this.bgmFiles[name];
    if (!bgmPath) return;

    this.bgm = new Howl({
      src: [bgmPath],
      html5: true,
      loop: true,
      volume: (name === 'menu' ? 0.25 : 0.35) * this.volume,
    });
    this.bgm.play();
    this.currentBgm = name;
  }

  stopBGM() {
    if (this.bgm) {
      this.bgm.stop();
      this.currentBgm = '';
    }
  }

  pauseBGM() {
    if (this.bgm) {
      this.bgm.pause();
    }
  }

  resumeBGM() {
    if (this.bgm && this.musicEnabled) {
      this.bgm.play();
    }
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.bgm) {
      this.bgm.volume((this.currentBgm === 'menu' ? 0.25 : 0.35) * this.volume);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.stopBGM();
    }
  }

  isSoundEnabled() {
    return this.soundEnabled;
  }

  isMusicEnabled() {
    return this.musicEnabled;
  }
}

export const audioManager = new AudioManager();
