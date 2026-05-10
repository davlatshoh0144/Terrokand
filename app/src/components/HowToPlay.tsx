import { ArrowLeft, Mouse, Keyboard, Heart, Star, Shield, Zap, Magnet } from 'lucide-react';

interface HowToPlayProps {
  onBack: () => void;
}

export default function HowToPlay({ onBack }: HowToPlayProps) {
  const controls = [
    {
      icon: <Mouse className="w-8 h-8 text-[#00ccff]" />,
      title: 'Mouse / Touch',
      description: 'Move your mouse or finger up and down to control the flying carpet. The carpet follows your movement smoothly!',
    },
    {
      icon: <Keyboard className="w-8 h-8 text-[#d4a017]" />,
      title: 'Keyboard',
      description: 'Use Arrow Keys or W/S to move up and down. Press ESC or P to pause the game.',
    },
  ];
  
  const items = [
    {
      icon: <Star className="w-8 h-8 text-[#ffd700]" />,
      title: 'Silk Coins & Gems',
      description: 'Collect golden coins for 10 points and blue gems for 50 points. Build combos for multiplier bonuses!',
      color: 'from-[#ffd700]/20 to-transparent',
    },
    {
      icon: <Shield className="w-8 h-8 text-[#00ccff]" />,
      title: 'Shield of Amir Timur',
      description: 'Protects you from one obstacle hit. Glows with blue energy when active.',
      color: 'from-[#00ccff]/20 to-transparent',
    },
    {
      icon: <Zap className="w-8 h-8 text-[#ff6b35]" />,
      title: 'Desert Wind Speed',
      description: 'Temporarily boosts your flying speed. The carpet glows golden!',
      color: 'from-[#ff6b35]/20 to-transparent',
    },
    {
      icon: <Magnet className="w-8 h-8 text-[#ff6b9d]" />,
      title: 'Bukhara Magnet',
      description: 'Attracts nearby coins and gems automatically. Very useful!',
      color: 'from-[#ff6b9d]/20 to-transparent',
    },
    {
      icon: <Heart className="w-8 h-8 text-red-400" />,
      title: 'Lives',
      description: 'You start with 3 lives. Hitting obstacles costs a life, but the game is gentle - no instant game over for children!',
      color: 'from-red-400/20 to-transparent',
    },
  ];
  
  const tips = [
    'Collect consecutive items quickly to build combos up to 5x multiplier!',
    'Save your shields for tricky sections with many obstacles.',
    'The magnet power-up is great for grabbing hard-to-reach gems.',
    'Each level teaches you about a real place in Uzbekistan!',
    'Complete levels to unlock new destinations across Terrokand!',
  ];
  
  return (
    <div className="game-container uzbek-gradient-dark">
      {/* Decorative border */}
      <div className="absolute inset-4 border-2 border-[#d4a017]/20 rounded-2xl z-10 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-20 h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
            <span className="font-semibold">Back</span>
          </button>
          
          <h1 className="title-font text-3xl font-bold uzbek-text-gold">How to Play</h1>
          
          <div className="w-20" />
        </div>
        
        {/* Scrollable content */}
        <div className="flex-1 overflow-auto max-w-2xl mx-auto w-full space-y-6">
          
          {/* Controls */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-[#d4a017]" />
              Controls
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {controls.map((control) => (
                <div key={control.title} className="glass-panel-light rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {control.icon}
                    <h3 className="text-white font-semibold">{control.title}</h3>
                  </div>
                  <p className="text-white/60 text-sm">{control.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Items */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-white font-semibold text-xl mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#ffd700]" />
              Game Elements
            </h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.title}
                  className={`flex items-start gap-4 p-4 rounded-lg border border-white/10 bg-gradient-to-r ${item.color}`}
                >
                  <div className="flex-shrink-0 mt-1">{item.icon}</div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-white/60 text-sm">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Tips */}
          <div className="glass-panel rounded-xl p-6">
            <h2 className="text-white font-semibold text-xl mb-4">Pro Tips</h2>
            <div className="space-y-2">
              {tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#d4a017]/20 text-[#d4a017] text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-white/70 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Scoring */}
          <div className="glass-panel rounded-xl p-6 mb-6">
            <h2 className="text-white font-semibold text-xl mb-4">Scoring</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center glass-panel-light rounded-lg p-3">
                <p className="text-[#ffd700] text-2xl font-bold">10</p>
                <p className="text-white/60 text-xs">Coins</p>
              </div>
              <div className="text-center glass-panel-light rounded-lg p-3">
                <p className="text-[#00ccff] text-2xl font-bold">50</p>
                <p className="text-white/60 text-xs">Gems</p>
              </div>
              <div className="text-center glass-panel-light rounded-lg p-3">
                <p className="text-[#ff6b9d] text-2xl font-bold">5x</p>
                <p className="text-white/60 text-xs">Max Combo</p>
              </div>
              <div className="text-center glass-panel-light rounded-lg p-3">
                <p className="text-[#7fff00] text-2xl font-bold">+5</p>
                <p className="text-white/60 text-xs">Pass Obstacles</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
