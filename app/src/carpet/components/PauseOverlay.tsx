import { Play, RotateCcw, Settings, Home } from 'lucide-react';

interface PauseOverlayProps {
  onResume: () => void;
  onRestart: () => void;
  onSettings: () => void;
  onQuit: () => void;
}

export default function PauseOverlay({ onResume, onRestart, onSettings, onQuit }: PauseOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-slate-900/95 to-slate-950/95 rounded-2xl p-8 border border-white/10 shadow-2xl max-w-sm w-full mx-4">
        <h2
          className="text-3xl font-bold text-center mb-6"
          style={{
            background: 'linear-gradient(90deg, #FFD166, #FF9F1C)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Paused
        </h2>

        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              boxShadow: '0 4px 0 #14532d',
            }}
          >
            <Play className="w-5 h-5 fill-white" />
            Resume
          </button>

          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all hover:scale-105 active:scale-95 border border-white/10"
          >
            <RotateCcw className="w-5 h-5" />
            Restart Level
          </button>

          <button
            onClick={onSettings}
            className="flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-all hover:scale-105 active:scale-95 border border-white/10"
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>

          <button
            onClick={onQuit}
            className="flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-bold text-white bg-red-500/20 hover:bg-red-500/30 transition-all hover:scale-105 active:scale-95 border border-red-500/30"
          >
            <Home className="w-5 h-5" />
            Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
