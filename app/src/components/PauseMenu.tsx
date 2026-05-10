import { Play, RotateCcw, Settings, LogOut } from 'lucide-react';
import { playClickSfx } from '../lib/sfx';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

export default function PauseMenu({ onResume, onRestart, onSettings, onQuit }: PauseMenuProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-panel rounded-2xl p-8 w-80 animate-pulse-glow">
        <h2 className="title-font text-3xl font-bold text-center uzbek-text-gold mb-6">
          Paused
        </h2>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => { playClickSfx(); onResume(); }}
            className="uzbek-button-gold flex items-center justify-center gap-3 py-4"
          >
            <Play className="w-5 h-5" />
            <span>Resume</span>
          </button>
          
          <button
            onClick={() => { playClickSfx(); onRestart(); }}
            className="uzbek-button flex items-center justify-center gap-3"
          >
            <RotateCcw className="w-5 h-5" />
            <span>Restart</span>
          </button>
          
          <button
            onClick={() => { playClickSfx(); onSettings(); }}
            className="uzbek-button flex items-center justify-center gap-3"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          
          <button
            onClick={() => { playClickSfx(); onQuit(); }}
            className="flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-bold
                       bg-red-600/80 hover:bg-red-500 text-white transition-all
                       border border-red-400/50"
          >
            <LogOut className="w-5 h-5" />
            <span>Back to Map</span>
          </button>
        </div>
        
        <p className="text-white/40 text-xs text-center mt-4">
          Press ESC or P to resume
        </p>
      </div>
    </div>
  );
}
