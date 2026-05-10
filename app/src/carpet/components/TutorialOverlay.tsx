import { X, Mouse, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Coins, Heart, Zap, Shield, Magnet, Star } from 'lucide-react';

interface TutorialOverlayProps {
  onClose: () => void;
}

export default function TutorialOverlay({ onClose }: TutorialOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/70 backdrop-blur-md">
      <div className="relative max-w-lg w-full mx-4 bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-slate-900 to-slate-900/95 p-4 border-b border-white/10 flex items-center justify-between z-10">
          <h2
            className="text-2xl font-bold"
            style={{
              background: 'linear-gradient(90deg, #FFD166, #FF9F1C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            How to Play
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Controls */}
          <section>
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Mouse className="w-5 h-5 text-cyan-400" />
              Controls — Fly Anywhere!
            </h3>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <Mouse className="w-5 h-5 text-white/60" />
                </div>
                <span className="text-white/70 text-sm">Move mouse anywhere to fly the carpet freely</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  <ArrowUp className="w-5 h-5 text-white/60" />
                  <ArrowDown className="w-5 h-5 text-white/60" />
                  <ArrowLeft className="w-5 h-5 text-white/60" />
                  <ArrowRight className="w-5 h-5 text-white/60" />
                </div>
                <span className="text-white/70 text-sm">Arrow Keys or WASD to move in all directions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1 bg-white/10 rounded">
                  <span className="text-white/60 text-xs">Touch</span>
                </div>
                <span className="text-white/70 text-sm">Touch and drag anywhere on mobile devices</span>
              </div>
            </div>
          </section>

          {/* Objective */}
          <section>
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Objective
            </h3>
            <div className="bg-white/5 rounded-xl p-4 space-y-2 text-white/70 text-sm">
              <p>Collect enough coins to reach the target score for each level!</p>
              <p>Dodge obstacles like arches, minarets, balloons, birds, and clouds.</p>
              <p>Collect power-ups to help you on your journey.</p>
              <p>Discover educational cards about Uzbekistan&apos;s rich history and culture!</p>
            </div>
          </section>

          {/* Items */}
          <section>
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              Game Elements
            </h3>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <img src="./images/obstacle-arch.png" alt="Coin" className="w-10 h-10 object-contain" />
                <div>
                  <div className="text-yellow-400 font-bold text-sm">Gold Coins</div>
                  <div className="text-white/60 text-xs">Collect for points. Chain combos for multipliers!</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Heart className="w-8 h-8 text-red-400 mt-1" />
                <div>
                  <div className="text-red-400 font-bold text-sm">Lives</div>
                  <div className="text-white/60 text-xs">You start with 3 hearts. Losing all means game over!</div>
                </div>
              </div>
            </div>
          </section>

          {/* Power-ups */}
          <section>
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-400" />
              Power-ups
            </h3>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <img src="./images/powerup-speed.png" alt="Shield" className="w-10 h-10 object-contain" />
                <div>
                  <div className="text-cyan-400 font-bold text-sm flex items-center gap-1"><Shield className="w-4 h-4" /> Shield</div>
                  <div className="text-white/60 text-xs">Protects you from one hit for 7 seconds</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <img src="./images/powerup-shield.png" alt="Magnet" className="w-10 h-10 object-contain" />
                <div>
                  <div className="text-purple-400 font-bold text-sm flex items-center gap-1"><Magnet className="w-4 h-4" /> Magnet</div>
                  <div className="text-white/60 text-xs">Automatically attracts nearby coins for 6 seconds</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <img src="./images/powerup-tile.png" alt="Speed" className="w-10 h-10 object-contain" />
                <div>
                  <div className="text-yellow-400 font-bold text-sm flex items-center gap-1"><Zap className="w-4 h-4" /> Slow Time</div>
                  <div className="text-white/60 text-xs">Slows down the world for 6 seconds</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <img src="./images/obstacle-arch.png" alt="Tile" className="w-10 h-10 object-contain" />
                <div>
                  <div className="text-blue-400 font-bold text-sm flex items-center gap-1"><Star className="w-4 h-4" /> Magic Tile</div>
                  <div className="text-white/60 text-xs">Restores one lost life instantly!</div>
                </div>
              </div>
            </div>
          </section>

          {/* Obstacles */}
          <section>
            <h3 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <X className="w-5 h-5 text-red-400" />
              Obstacles
            </h3>
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              {[
                { img: './images/obstacle-balloon.png', name: 'Islamic Arch', desc: 'Tall stone arch walls with narrow gaps. Thread the needle!' },
                { img: './images/obstacle-minaret.png', name: 'Minaret', desc: 'A slender tower blocking your path. Fly around it!' },
                { img: './images/obstacle-bird.png', name: 'Magic Balloon', desc: 'Floats up and down. Watch its pattern!' },
                { img: './images/obstacle-cloud.png', name: 'Desert Falcon', desc: 'Hunts in flocks! Tracks your position!' },
                { img: './images/player-carpet.png', name: 'Storm Cloud', desc: 'Large and slow, but blocks your path!' },
              ].map((obs) => (
                <div key={obs.name} className="flex items-start gap-3">
                  <img src={obs.img} alt={obs.name} className="w-10 h-10 object-contain" />
                  <div>
                    <div className="text-red-300 font-bold text-sm">{obs.name}</div>
                    <div className="text-white/60 text-xs">{obs.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gradient-to-t from-slate-950 to-slate-950/95 p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #E63946, #D90429)',
              boxShadow: '0 4px 0 #8B0000',
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
