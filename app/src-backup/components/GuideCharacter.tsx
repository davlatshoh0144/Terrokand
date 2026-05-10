import { useState, useEffect } from 'react';

interface GuideCharacterProps {
  message?: string;
  show?: boolean;
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

const TIPS = [
  "Click or drag to play!",
  "Collect coins for bonus points!",
  "Avoid obstacles to keep your lives!",
  "Three stars means perfect mastery!",
  "Can you unlock all the rewards?",
  "Terrokand awaits, brave explorer!",
];

export default function GuideCharacter({
  message,
  show = true,
  position = 'bottom-right',
}: GuideCharacterProps) {
  const [currentTip, setCurrentTip] = useState(message || TIPS[0]);
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    if (message) {
      setCurrentTip(message);
      setVisible(true);
    }
  }, [message]);

  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setCurrentTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [message]);

  const posClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  if (!visible) return null;

  return (
    <div className={`absolute ${posClasses[position]} z-50 flex items-end gap-2 max-w-[260px] animate-bounce-slow`}>
      {/* Speech bubble */}
      <div className="glass-panel rounded-xl rounded-br-sm p-3 text-sm text-white shadow-lg">
        <p className="leading-snug">{currentTip}</p>
      </div>
      {/* Character */}
      <div className="text-4xl filter drop-shadow-lg cursor-pointer hover:scale-110 transition-transform"
        onClick={() => setVisible(false)}
        title="Click to dismiss"
      >
        🦜
      </div>
    </div>
  );
}
