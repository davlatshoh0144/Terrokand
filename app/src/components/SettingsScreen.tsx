import { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Music, AlertTriangle, RotateCcw } from 'lucide-react';
import type { GameSettings } from '../game/types';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onBack: () => void;
  onResetProgress: () => void;
}

export default function SettingsScreen({
  settings,
  onUpdateSettings,
  onBack,
  onResetProgress,
}: SettingsScreenProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  
  const difficulties: { value: 'easy' | 'normal' | 'hard'; label: string; description: string }[] = [
    { value: 'easy', label: 'Easy', description: 'More forgiving, perfect for young children' },
    { value: 'normal', label: 'Normal', description: 'Balanced challenge for all ages' },
    { value: 'hard', label: 'Hard', description: 'For experienced carpet riders!' },
  ];
  
  return (
    <div className="game-container uzbek-gradient-dark">
      {/* Decorative border */}
      <div className="absolute inset-4 border-2 border-[#d4a017]/20 rounded-2xl z-10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-20 h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-semibold">Back</span>
          </button>
          
          <h1 className="title-font text-3xl font-bold uzbek-text-gold">Settings</h1>
          
          <div className="w-20" />
        </div>
        
        <div className="flex-1 max-w-lg mx-auto w-full space-y-6">
          {/* Sound */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Audio</h3>
            
            <div className="space-y-4">
              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-[#00ccff]" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-white/40" />
                  )}
                  <span className="text-white/80">Sound Effects</span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.soundEnabled ? 'bg-[#00ccff]' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    settings.soundEnabled ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
              
              {/* Music */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Music className={`w-5 h-5 ${settings.musicEnabled ? 'text-[#d4a017]' : 'text-white/40'}`} />
                  <span className="text-white/80">Music</span>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, musicEnabled: !settings.musicEnabled })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.musicEnabled ? 'bg-[#d4a017]' : 'bg-white/20'
                  }`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                    settings.musicEnabled ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Music Volume */}
              <div className={`transition-opacity duration-200 ${settings.musicEnabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Volume</span>
                  <span className="text-white/60 text-sm font-mono">{Math.round((settings.musicVolume ?? 0.5) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume ?? 0.5}
                  onChange={(e) => onUpdateSettings({ ...settings, musicVolume: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d4a017]"
                />
              </div>
            </div>
          </div>
          
          {/* Difficulty */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Difficulty</h3>
            
            <div className="space-y-3">
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => onUpdateSettings({ ...settings, difficulty: diff.value })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    settings.difficulty === diff.value
                      ? 'border-[#d4a017] bg-[#d4a017]/10'
                      : 'border-white/10 glass-panel-light hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold ${
                      settings.difficulty === diff.value ? 'text-[#d4a017]' : 'text-white'
                    }`}>
                      {diff.label}
                    </span>
                    {settings.difficulty === diff.value && (
                      <div className="w-3 h-3 rounded-full bg-[#d4a017]" />
                    )}
                  </div>
                  <p className="text-white/50 text-sm mt-1">{diff.description}</p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Reset Progress */}
          <div className="glass-panel rounded-xl p-6">
            <h3 className="text-white font-semibold text-lg mb-4">Data</h3>
            
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reset All Progress</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Are you sure?</span>
                </div>
                <p className="text-white/60 text-sm">
                  This will erase all your scores, unlocked levels, and achievements. This cannot be undone!
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      onResetProgress();
                      setShowResetConfirm(false);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors"
                  >
                    Yes, Reset
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="px-4 py-2 glass-panel-light text-white rounded-lg font-semibold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
