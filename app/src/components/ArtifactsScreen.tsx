import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, BookOpen, ScrollText } from 'lucide-react';
import { DISCOVERY_CARDS } from '../carpet/game/education';

interface ArtifactsScreenProps {
  onBack: () => void;
}

interface SaveData {
  collectedDiscoveries?: string[];
}

function loadCollectedIds(): string[] {
  try {
    const raw = localStorage.getItem('magic-carpet-save');
    if (!raw) return [];
    const data: SaveData = JSON.parse(raw);
    return data.collectedDiscoveries || [];
  } catch {
    return [];
  }
}

export default function ArtifactsScreen({ onBack }: ArtifactsScreenProps) {
  const [collectedIds, setCollectedIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setCollectedIds(loadCollectedIds());
  }, []);

  const collectedSet = new Set(collectedIds);
  const totalCards = DISCOVERY_CARDS.length;
  const collectedCount = collectedSet.size;
  const allCollected = collectedCount === totalCards;

  const selectedCard = selectedId
    ? DISCOVERY_CARDS.find((c) => c.id === selectedId) || null
    : null;
  const isSelectedCollected = selectedId ? collectedSet.has(selectedId) : false;

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#1a120a] via-[#140e08] to-[#0f0a05] flex flex-col">
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,90,43,0.06) 2px, rgba(139,90,43,0.06) 4px)',
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-amber-700/30 bg-gradient-to-b from-[#22150c] to-[#1a1008]">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-amber-400/80 hover:text-amber-300 transition-all hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-semibold tracking-wider uppercase">Back</span>
        </button>

        <div className="flex items-center gap-3">
          <ScrollText className="w-6 h-6 text-amber-500" />
          <h1
            className="text-xl md:text-2xl font-bold text-amber-400 tracking-[0.15em]"
            style={{ fontFamily: "'Cinzel', serif", textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            Artifact Gallery
          </h1>
        </div>

        <div className="text-right">
          <div className="text-amber-200 font-bold text-sm tabular-nums">
            {collectedCount}/{totalCards}
          </div>
          <div className="text-amber-400/70 text-[10px] uppercase tracking-wider">
            {allCollected ? 'Complete!' : 'Collected'}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative z-10 h-1.5 bg-amber-950/60">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
          style={{ width: `${(collectedCount / totalCards) * 100}%` }}
        />
      </div>

      {/* Main content area */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* Card grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 max-w-[1400px] mx-auto">
            {DISCOVERY_CARDS.map((card) => {
              const isCollected = collectedSet.has(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => setSelectedId(card.id)}
                  className={`group relative aspect-[3/4] rounded-xl overflow-hidden border transition-all duration-200 text-left ${
                    isCollected
                      ? 'border-amber-400/50 bg-[#1e150c] hover:border-amber-300/70 hover:scale-[1.03] hover:shadow-lg hover:shadow-amber-900/30'
                      : 'border-amber-800/30 bg-[#1a140e] hover:border-amber-700/40 hover:shadow-md hover:shadow-amber-950/20'
                  }`}
                >
                  {/* Image area */}
                  <div className="relative h-[55%] overflow-hidden">
                    {isCollected ? (
                      <>
                        <img
                          src={card.image}
                          alt={card.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1209] via-transparent to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#14100a]">
                        <Lock className="w-8 h-8 text-amber-600/50" />
                        <span className="text-amber-600/40 text-[10px] uppercase tracking-wider">
                          Level {card.levelId}
                        </span>
                      </div>
                    )}

                    {/* Collected indicator */}
                    {isCollected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500/90 flex items-center justify-center shadow-md">
                        <BookOpen className="w-3 h-3 text-[#1a1209]" />
                      </div>
                    )}
                  </div>

                  {/* Text area */}
                  <div className="p-2.5 flex flex-col h-[45%]">
                    <h3
                      className={`text-[11px] md:text-xs font-bold leading-tight mb-1 line-clamp-2 ${
                        isCollected ? 'text-amber-200' : 'text-amber-500/70'
                      }`}
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {isCollected ? card.title : '???'}
                    </h3>
                    <p
                      className={`text-[10px] leading-relaxed line-clamp-3 ${
                        isCollected ? 'text-amber-100/60' : 'text-amber-600/50 italic'
                      }`}
                    >
                      {isCollected
                        ? card.content.slice(0, 80) + '...'
                        : `Discover in Level ${card.levelId}`}
                    </p>
                    {isCollected && (
                      <div className="mt-auto pt-1.5">
                        <span className="text-[10px] text-amber-400 font-semibold">
                          +{card.bonusPoints} pts
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Completion message */}
          {allCollected && (
            <div className="mt-6 text-center pb-4">
              <p
                className="text-amber-400 text-sm md:text-base font-bold tracking-wider"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                All Artifacts Discovered!
              </p>
              <p className="text-amber-400/60 text-xs mt-1">
                You have uncovered every secret of the Silk Road.
              </p>
            </div>
          )}
        </div>

        {/* Detail panel (right side, collapsible) */}
        {selectedCard && (
          <div className="hidden md:flex w-[360px] xl:w-[400px] flex-col border-l border-amber-700/25 bg-gradient-to-b from-[#1e150c] to-[#14100a]">
            {/* Detail image */}
            <div className="relative h-48 overflow-hidden">
              {isSelectedCollected ? (
                <>
                  <img
                    src={selectedCard.image}
                    alt={selectedCard.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1108] via-transparent to-transparent" />
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#14100a]">
                  <Lock className="w-12 h-12 text-amber-600/50" />
                  <span className="text-amber-600/50 text-xs uppercase tracking-widest">
                    Locked
                  </span>
                </div>
              )}
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/40 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/60 transition-all"
              >
                ×
              </button>
            </div>

            {/* Detail content */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center gap-2 mb-3">
                {isSelectedCollected && (
                  <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <h2
                  className={`text-base font-bold leading-tight ${
                    isSelectedCollected ? 'text-amber-300' : 'text-amber-700/50'
                  }`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {isSelectedCollected ? selectedCard.title : '???'}
                </h2>
              </div>

              {isSelectedCollected ? (
                <>
                  <p className="text-amber-100/80 text-sm leading-relaxed">
                    {selectedCard.content}
                  </p>
                  <div className="mt-4 pt-3 border-t border-amber-800/20 flex items-center justify-between">
                    <span className="text-amber-500/60 text-xs uppercase tracking-wider">
                      Level {selectedCard.levelId}
                    </span>
                    <span className="text-amber-400 text-sm font-bold">
                      +{selectedCard.bonusPoints} pts
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Lock className="w-10 h-10 text-amber-600/40 mx-auto mb-3" />
                  <p className="text-amber-600/60 text-sm italic">
                    This artifact is hidden in Level {selectedCard.levelId}.
                  </p>
                  <p className="text-amber-700/40 text-xs mt-1">
                    Complete the level to unlock it!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile detail modal */}
      {selectedCard && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-md bg-gradient-to-b from-[#1e150c] to-[#140e08] rounded-t-2xl border-t border-amber-500/30 max-h-[80vh] overflow-y-auto">
            {/* Image */}
            <div className="relative h-40">
              {isSelectedCollected ? (
                <>
                  <img
                    src={selectedCard.image}
                    alt={selectedCard.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1108] via-transparent to-transparent" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#14100a]">
                  <Lock className="w-12 h-12 text-amber-600/50" />
                </div>
              )}
              <button
                onClick={() => setSelectedId(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition-all"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                {isSelectedCollected && (
                  <BookOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                )}
                <h2
                  className={`text-lg font-bold ${
                    isSelectedCollected ? 'text-amber-200' : 'text-amber-500/70'
                  }`}
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {isSelectedCollected ? selectedCard.title : '???'}
                </h2>
              </div>

              {isSelectedCollected ? (
                <>
                  <p className="text-amber-100/80 text-sm leading-relaxed">
                    {selectedCard.content}
                  </p>
                  <div className="mt-4 pt-3 border-t border-amber-800/20 flex items-center justify-between">
                    <span className="text-amber-500/60 text-xs uppercase tracking-wider">
                      Level {selectedCard.levelId}
                    </span>
                    <span className="text-amber-400 text-sm font-bold">
                      +{selectedCard.bonusPoints} pts
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-amber-600/60 text-sm italic">
                    This artifact is hidden in Level {selectedCard.levelId}.
                  </p>
                  <p className="text-amber-700/40 text-xs mt-1">
                    Complete the level to unlock it!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
