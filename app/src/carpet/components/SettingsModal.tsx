import { X, Volume2, VolumeX, Music, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SettingsModalProps {
  soundOn: boolean;
  musicOn: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export default function SettingsModal({
  soundOn,
  musicOn,
  onToggleSound,
  onToggleMusic,
  onResetProgress,
  onClose,
}: SettingsModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/70 backdrop-blur-md">
      <div className="relative max-w-sm w-full mx-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-6 border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(90deg, #FFD166, #FF9F1C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Sound */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              {soundOn ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
              <span className="text-white font-medium">Sound Effects</span>
            </div>
            <button
              onClick={onToggleSound}
              className={`w-12 h-6 rounded-full transition-all ${
                soundOn ? 'bg-cyan-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  soundOn ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Music */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              {musicOn ? <Music className="w-5 h-5 text-purple-400" /> : <Music className="w-5 h-5 text-gray-500" />}
              <span className="text-white font-medium">Music</span>
            </div>
            <button
              onClick={onToggleMusic}
              className={`w-12 h-6 rounded-full transition-all ${
                musicOn ? 'bg-purple-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  musicOn ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Reset */}
          <div className="pt-4 border-t border-white/10">
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-all border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                Reset All Progress
              </button>
            ) : (
              <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                <p className="text-red-300 text-sm text-center mb-3">Are you sure? This will erase all progress!</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-2 rounded-lg font-bold text-white bg-white/10 hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onResetProgress();
                      setShowConfirm(false);
                    }}
                    className="flex-1 py-2 rounded-lg font-bold text-white bg-red-500 hover:bg-red-600 transition-all"
                  >
                    Reset
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
