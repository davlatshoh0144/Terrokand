import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, MousePointer } from 'lucide-react';

interface OnboardingOverlayProps {
  onStart: () => void;
}

export default function OnboardingOverlay({ onStart }: OnboardingOverlayProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-yellow-500/30 bg-slate-950 shadow-2xl">
        <div className="relative h-40">
          <img
            src="./images/bg-samarkand.jpg"
            alt="Samarkand skyline"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
          <img
            src="./images/powerup-magnet.png"
            alt="Boy on magic carpet"
            className="absolute bottom-[-28px] left-1/2 h-28 w-28 -translate-x-1/2 object-contain drop-shadow-2xl"
          />
        </div>

        <div className="px-6 pb-6 pt-10 text-center">
          <h3 className="text-2xl font-black text-yellow-300">Fly, Collect, Survive</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/75">
            Reach the score or distance goal. Collect coins, avoid obstacles, and discover Uzbekistan facts.
          </p>

          <div className="mt-5 grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/75 sm:grid-cols-2">
            <div className="flex items-center justify-center gap-2">
              <MousePointer className="h-5 w-5 text-cyan-300" />
              Mouse or touch to steer
            </div>
            <div className="flex items-center justify-center gap-1">
              <ArrowUp className="h-5 w-5" />
              <ArrowLeft className="h-5 w-5" />
              <ArrowDown className="h-5 w-5" />
              <ArrowRight className="h-5 w-5" />
              <span className="ml-1">or WASD</span>
            </div>
          </div>

          <button
            onClick={onStart}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 text-lg font-black text-white shadow-[0_5px_0_#14532d] transition-all hover:scale-[1.02] active:translate-y-1 active:shadow-none"
          >
            Start Flying
          </button>
        </div>
      </div>
    </div>
  );
}
