import { useState, useEffect, useRef } from 'react';
import { SkipForward } from 'lucide-react';

interface IntroCinematicProps {
  onComplete: () => void;
}

export default function IntroCinematic({ onComplete }: IntroCinematicProps) {
  const [phase, setPhase] = useState(0);
  const [showSkip, setShowSkip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.muted = true;

    const attemptPlay = () => {
      video.play().catch(() => {
        setTimeout(() => video.play().catch(() => {}), 200);
      });
    };

    if (video.readyState >= 2) {
      attemptPlay();
    } else {
      video.addEventListener('canplay', attemptPlay, { once: true });
    }

    return () => {
      video.pause();
    };
  }, []);

  useEffect(() => {
    const skipTimer = setTimeout(() => setShowSkip(true), 2000);
    return () => clearTimeout(skipTimer);
  }, []);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < 4; i++) {
      timers.push(setTimeout(() => setPhase(i), i * 4000));
    }
    timers.push(setTimeout(() => onComplete(), 16000));
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const storyTexts = [
    {
      title: 'Once upon a time...',
      text: 'In the heart of Central Asia, in the magical lands of Terrokand, a flying carpet was discovered in the blue city of Samarkand.',
    },
    {
      title: 'The Magic Awakens',
      text: 'A young adventurer found the carpet glowing with golden light. As they touched it, the carpet lifted into the air!',
    },
    {
      title: 'A Journey Begins',
      text: 'Now, the magical carpet carries our hero across the beautiful lands of Uzbekistan — from blue domes to golden deserts!',
    },
    {
      title: 'Your Adventure Awaits',
      text: 'Soar through incredible destinations. Collect treasures, discover secrets, and explore this magical land!',
    },
  ];

  return (
    <div className="game-container bg-black relative overflow-hidden">
      {/* Fallback gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(to bottom, #1a0f2e 0%, #3d1b4e 30%, #7a2e3e 60%, #c45a28 100%)',
        }}
      />

      {/* Looping video background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-[1]"
        style={{ opacity: 0.5 }}
      >
        <source src="./videos/intro-cinematic.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-[2]" />

      {/* Story text */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
        {phase < 4 && (
          <div key={phase} className="max-w-2xl text-center animate-float">
            <h2 className="title-font text-3xl md:text-4xl font-bold uzbek-text-gold mb-6">
              {storyTexts[phase]?.title}
            </h2>
            <p className="text-white/90 text-lg md:text-xl leading-relaxed">
              {storyTexts[phase]?.text}
            </p>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#001a33] to-transparent" />

        {/* Progress dots */}
        <div className="absolute bottom-20 flex gap-3">
          {[0, 1, 2, 3].map((p) => (
            <div
              key={p}
              className={`w-3 h-3 rounded-full transition-all duration-500 ${
                p === phase ? 'bg-[#d4a017] scale-125' : p < phase ? 'bg-[#d4a017]/50' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Skip button */}
      {showSkip && (
        <button
          onClick={onComplete}
          className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 rounded-lg glass-panel text-white/60 hover:text-white transition-colors"
        >
          <SkipForward className="w-4 h-4" />
          <span className="text-sm">Skip</span>
        </button>
      )}
    </div>
  );
}
