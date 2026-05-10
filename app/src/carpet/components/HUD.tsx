import { Heart, Pause, Magnet, Shield, Zap, HelpCircle, AlertTriangle } from 'lucide-react';
import ArtifactJug from './ArtifactJug';

interface HUDProps {
  score: number;
  combo: number;
  lives: number;
  maxLives: number;
  distance: number;
  level: number;
  targetScore: number;
  targetDistance: number;
  powerUpTimer: number;
  shieldActive: boolean;
  magnetActive: boolean;
  speedActive: boolean;
  snakeProximity: number;
  collectedDiscoveries: string[];
  onPause: () => void;
  onShowTutorial: () => void;
}

export default function HUD({
  score,
  combo,
  lives,
  maxLives,
  distance,
  level,
  targetScore,
  targetDistance,
  powerUpTimer,
  shieldActive,
  magnetActive,
  speedActive,
  snakeProximity,
  collectedDiscoveries,
  onPause,
  onShowTutorial,
}: HUDProps) {
  const scoreProgress = Math.min(1, score / targetScore);
  const distanceProgress = Math.min(1, distance / targetDistance);
  const scoreDone = score >= targetScore;
  const distanceDone = distance >= targetDistance;

  const getPowerUpIcon = () => {
    if (shieldActive) return <Shield className="w-5 h-5 text-cyan-400" />;
    if (magnetActive) return <Magnet className="w-5 h-5 text-purple-400" />;
    if (speedActive) return <Zap className="w-5 h-5 text-yellow-400" />;
    return null;
  };

  const getPowerUpLabel = () => {
    if (shieldActive) return 'SHIELD';
    if (magnetActive) return 'MAGNET';
    if (speedActive) return 'SPEED';
    return '';
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Bar — pointer-events-none so mouse passes through to canvas */}
      <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-3 pointer-events-none">
        {/* Score + Jug */}
        <div className="flex flex-col gap-2">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-yellow-500/30">
            <div className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Score</div>
            <div className="text-white text-2xl font-bold tabular-nums" style={{ textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>
              {score.toLocaleString()}
            </div>
          </div>
          {combo > 1 && (
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 border border-orange-500/50 animate-bounce">
              <div className="text-orange-400 text-sm font-bold" style={{ textShadow: '0 0 8px rgba(255,165,0,0.6)' }}>
                x{combo} COMBO!
              </div>
            </div>
          )}
          {/* Artifact Jug */}
          <ArtifactJug collectedIds={collectedDiscoveries} />
        </div>

        {/* Progress Bars */}
        <div className="flex-1 mx-4 max-w-md pt-2">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-2.5 border border-white/10">
            <div className="flex justify-between text-xs text-white/70 mb-1.5">
              <span>Level {level}</span>
              <span className="text-white/50 text-xs">Reach score OR distance to win</span>
            </div>

            {/* Score Progress */}
            <div className="mb-1.5">
              <div className="flex justify-between text-xs mb-0.5">
                <span className={scoreDone ? 'text-green-400 font-bold' : 'text-yellow-400/70'}>
                  Score: {Math.floor(scoreProgress * 100)}%
                </span>
                <span className="text-white/40 text-xs">{score.toLocaleString()} / {targetScore.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${scoreProgress * 100}%`,
                    background: scoreDone
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : 'linear-gradient(90deg, #FFD166, #FF9F1C)',
                    boxShadow: scoreDone ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(255, 209, 102, 0.4)',
                  }}
                />
              </div>
            </div>

            {/* Distance Progress */}
            <div>
              <div className="flex justify-between text-xs mb-0.5">
                <span className={distanceDone ? 'text-green-400 font-bold' : 'text-cyan-400/70'}>
                  Distance: {Math.floor(distanceProgress * 100)}%
                </span>
                <span className="text-white/40 text-xs">{distance}m / {targetDistance}m</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${distanceProgress * 100}%`,
                    background: distanceDone
                      ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                      : 'linear-gradient(90deg, #48CAE4, #0077B6)',
                    boxShadow: distanceDone ? '0 0 8px rgba(34,197,94,0.5)' : '0 0 8px rgba(72, 202, 228, 0.4)',
                  }}
                />
              </div>
            </div>

            {/* Win indicator */}
            {(scoreDone || distanceDone) && (
              <div className="text-center mt-1.5 animate-pulse">
                <span className="text-green-400 text-xs font-bold">
                  {scoreDone && distanceDone ? 'Both goals reached! Level almost complete!' : 'Goal reached! Keep going!'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-col gap-2 items-end">
          {/* Lives */}
          <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-red-500/30 flex items-center gap-1">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 transition-all ${
                  i < lives
                    ? 'text-red-500 fill-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.6)]'
                    : 'text-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Snake danger warning */}
          {snakeProximity > 0.3 && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-black/50 backdrop-blur-sm animate-pulse ${
                snakeProximity > 0.7 ? 'border-red-500 bg-red-500/20' : 'border-orange-500'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 ${snakeProximity > 0.7 ? 'text-red-400' : 'text-orange-400'}`} />
              <div>
                <div className={`text-xs font-bold ${snakeProximity > 0.7 ? 'text-red-300' : 'text-orange-300'}`}>
                  {snakeProximity > 0.7 ? 'SNAKE CLOSE!' : 'Snake Near'}
                </div>
              </div>
            </div>
          )}

          {/* Power-up indicator */}
          {(shieldActive || magnetActive || speedActive) && (
            <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 border border-purple-500/30 flex items-center gap-2 animate-pulse">
              {getPowerUpIcon()}
              <div>
                <div className="text-purple-300 text-xs font-bold">{getPowerUpLabel()}</div>
                <div className="text-white text-xs tabular-nums">{Math.ceil(powerUpTimer)}s</div>
              </div>
            </div>
          )}

          {/* Buttons — only these capture pointer events */}
          <div className="flex gap-2 pointer-events-auto">
            <button
              onClick={onShowTutorial}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-xs font-bold text-white/75 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-black/70 hover:text-white"
              aria-label="Show help"
              title="Show help"
            >
              <HelpCircle className="w-5 h-5 text-white/70" />
              Help
            </button>
            <button
              onClick={onPause}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/50 px-3 py-2 text-xs font-bold text-white/75 backdrop-blur-sm transition-all hover:border-white/40 hover:bg-black/70 hover:text-white"
              aria-label="Pause game"
              title="Pause game"
            >
              <Pause className="w-5 h-5 text-white/70" />
              Pause
            </button>
          </div>
        </div>
      </div>

      {/* Distance counter at bottom */}
      <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1 border border-white/10">
        <div className="text-white/60 text-xs">
          Distance: <span className="text-white font-bold">{distance}m</span>
          <span className="text-white/40"> / {targetDistance}m</span>
        </div>
      </div>
    </div>
  );
}
