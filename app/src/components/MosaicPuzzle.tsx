import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, FlipHorizontal2, Lightbulb, RefreshCw, RotateCw, Undo2, X } from 'lucide-react';

type MosaicColor = 0 | 1 | 2 | 3 | 4;

interface PuzzlePiece {
  id: string;
  color: MosaicColor;
  cells: Array<[number, number]>;
}

interface PuzzleLevel {
  name: string;
  size: number;
  rewardTiles: number;
  rewardGold: number;
  rewardBoost: number;
  timedSeconds?: number;
  target: MosaicColor[][];
  pieces: PuzzlePiece[];
}

interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  life: number;
}

interface PlacementRecord {
  board: Array<Array<MosaicColor | null>>;
  used: Record<string, boolean>;
  order: string[];
}

interface MosaicPuzzleProps {
  level: number;
  onClose: () => void;
  onComplete: (rewardTiles: number) => void;
}

const colorMap: Record<MosaicColor, string> = {
  0: '#2fb8bd',
  1: '#174f9b',
  2: '#d8a83e',
  3: '#efe8d8',
  4: '#a84b3f',
};

const darkMap: Record<MosaicColor, string> = {
  0: '#14767f',
  1: '#102f72',
  2: '#9b6c1f',
  3: '#cfc2a9',
  4: '#6f2925',
};

const faintMap: Record<MosaicColor, string> = {
  0: 'rgba(47,184,189,0.28)',
  1: 'rgba(23,79,155,0.28)',
  2: 'rgba(216,168,62,0.26)',
  3: 'rgba(239,232,216,0.24)',
  4: 'rgba(168,75,63,0.26)',
};

const levels: Record<number, PuzzleLevel> = {
  1: {
    name: 'Gur-e Amir Star',
    size: 4,
    rewardTiles: 3,
    rewardGold: 8,
    rewardBoost: 2,
    target: [
      [0, 0, 1, 1],
      [0, 2, 2, 1],
      [1, 2, 2, 0],
      [1, 1, 0, 0],
    ],
    pieces: [
      { id: 'Aqua L', color: 0, cells: [[0, 0], [1, 0], [0, 1]] },
      { id: 'Aqua Turn', color: 0, cells: [[0, 0], [1, 0], [1, 1]] },
      { id: 'Blue L', color: 1, cells: [[0, 0], [1, 0], [0, 1]] },
      { id: 'Blue Turn', color: 1, cells: [[0, 0], [1, 0], [1, 1]] },
      { id: 'Gold Core', color: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    ],
  },
  2: {
    name: 'Sherdor Medallion',
    size: 5,
    rewardTiles: 5,
    rewardGold: 14,
    rewardBoost: 4,
    target: [
      [0, 0, 1, 1, 1],
      [0, 2, 2, 4, 1],
      [3, 2, 2, 4, 4],
      [3, 2, 2, 4, 1],
      [3, 3, 1, 1, 1],
    ],
    pieces: [
      { id: 'Aqua Corner', color: 0, cells: [[0, 0], [1, 0], [0, 1]] },
      { id: 'Blue Arch', color: 1, cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
      { id: 'Blue Base', color: 1, cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
      { id: 'Gold Path', color: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]] },
      { id: 'Red Flame', color: 4, cells: [[0, 0], [0, 1], [1, 1], [0, 2]] },
      { id: 'White Gate', color: 3, cells: [[0, 0], [0, 1], [0, 2], [1, 2]] },
    ],
  },
  3: {
    name: 'Ulugh Beg Portal',
    size: 6,
    rewardTiles: 7,
    rewardGold: 20,
    rewardBoost: 6,
    timedSeconds: 150,
    target: [
      [0, 0, 1, 1, 2, 2],
      [0, 0, 1, 1, 2, 2],
      [3, 3, 4, 4, 0, 0],
      [3, 3, 4, 4, 0, 0],
      [1, 1, 2, 2, 3, 3],
      [1, 1, 2, 2, 3, 3],
    ],
    pieces: [
      { id: 'Aqua Top', color: 0, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
      { id: 'Aqua Mid', color: 0, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
      { id: 'Blue Top', color: 1, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
      { id: 'Blue Base', color: 1, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
      { id: 'Gold Top', color: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
      { id: 'Gold Base', color: 2, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
      { id: 'White Left', color: 3, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
      { id: 'White Right', color: 3, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
      { id: 'Red Seal', color: 4, cells: [[0, 0], [1, 0], [0, 1], [1, 1]] },
    ],
  },
};

function cloneBoard(board: Array<Array<MosaicColor | null>>) {
  return board.map((line) => [...line]);
}

function normalizeCells(cells: Array<[number, number]>) {
  const minX = Math.min(...cells.map((c) => c[0]));
  const minY = Math.min(...cells.map((c) => c[1]));
  return cells.map(([x, y]) => [x - minX, y - minY] as [number, number]);
}

function rotateCells(cells: Array<[number, number]>) {
  const maxX = Math.max(...cells.map((c) => c[0]));
  return normalizeCells(cells.map(([x, y]) => [y, maxX - x] as [number, number]));
}

function flipCells(cells: Array<[number, number]>) {
  const maxX = Math.max(...cells.map((c) => c[0]));
  return normalizeCells(cells.map(([x, y]) => [maxX - x, y] as [number, number]));
}

function tileClipPath(row: number, col: number) {
  const n = (row * 17 + col * 29) % 9;
  const topA = 4 + (n % 3) * 2;
  const topB = 94 - (n % 4) * 2;
  const rightA = 6 + (n % 5);
  const bottomB = 92 - (n % 3) * 2;
  const leftB = 90 - (n % 4) * 2;
  return `polygon(${topA}% ${2 + (n % 2)}%, ${topB}% ${4 + (n % 3)}%, ${96 - (n % 2)}% ${rightA}%, ${bottomB}% 96%, ${8 + (n % 4)}% ${leftB}%, ${2 + (n % 3)}% ${12 + (n % 4)}%)`;
}

function playTone(audioCtxRef: React.MutableRefObject<AudioContext | null>, type: OscillatorType, freq: number, duration = 0.08) {
  const Ctx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
  const ctx = audioCtxRef.current;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;
  osc.connect(gain);
  gain.connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.065, now + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function PiecePreview({ piece, active }: { piece: PuzzlePiece; active?: boolean }) {
  const cells = normalizeCells(piece.cells);
  const width = Math.max(...cells.map((c) => c[0])) + 1;
  const height = Math.max(...cells.map((c) => c[1])) + 1;
  return (
    <div
      className="inline-grid gap-[3px] rounded-md p-1"
      style={{ gridTemplateColumns: `repeat(${width}, 10px)`, gridTemplateRows: `repeat(${height}, 10px)`, background: active ? 'rgba(255,244,212,0.55)' : 'rgba(80,50,25,0.12)' }}
    >
      {Array.from({ length: height }).map((_, y) =>
        Array.from({ length: width }).map((__, x) => {
          const has = cells.some(([cx, cy]) => cx === x && cy === y);
          return (
            <span
              key={`${piece.id}-${x}-${y}`}
              className="h-2.5 w-2.5"
              style={{
                clipPath: has ? 'polygon(8% 5%, 92% 12%, 96% 86%, 14% 96%, 2% 30%)' : undefined,
                background: has ? `linear-gradient(145deg, ${colorMap[piece.color]}, ${darkMap[piece.color]})` : 'transparent',
                boxShadow: has ? 'inset 0 1px 1px rgba(255,255,255,0.45), 0 1px 2px rgba(0,0,0,0.22)' : 'none',
              }}
            />
          );
        }),
      )}
    </div>
  );
}

export default function MosaicPuzzle({ level, onClose, onComplete }: MosaicPuzzleProps) {
  const puzzle = levels[Math.min(3, Math.max(1, level))];
  const [board, setBoard] = useState<Array<Array<MosaicColor | null>>>([]);
  const [history, setHistory] = useState<PlacementRecord[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [used, setUsed] = useState<Record<string, boolean>>({});
  const [selectedPieceId, setSelectedPieceId] = useState<string>('');
  const [hoverCell, setHoverCell] = useState<[number, number] | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [hintText, setHintText] = useState('');
  const [flashInvalid, setFlashInvalid] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(level <= 1);
  const [timeLeft, setTimeLeft] = useState(puzzle.timedSeconds ?? 0);
  const [timeEnabled, setTimeEnabled] = useState(!!puzzle.timedSeconds);
  const [placedCells, setPlacedCells] = useState<Record<string, boolean>>({});
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setBoard(Array.from({ length: puzzle.size }, () => Array.from({ length: puzzle.size }, () => null)));
    setHistory([]);
    setOrder([]);
    setUsed({});
    setSelectedPieceId(puzzle.pieces[0]?.id || '');
    setHoverCell(null);
    setRotation(0);
    setFlipped(false);
    setHintText('');
    setFlashInvalid(false);
    setParticles([]);
    setCompletedAt(null);
    setShowTutorial(level <= 1);
    setTimeLeft(puzzle.timedSeconds ?? 0);
    setTimeEnabled(!!puzzle.timedSeconds);
    setPlacedCells({});
  }, [puzzle, level]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key.toLowerCase() === 'r') setRotation((old) => (old + 1) % 4);
      if (e.key.toLowerCase() === 'f') setFlipped((old) => !old);
    };
    window.addEventListener('keydown', onDown);
    return () => window.removeEventListener('keydown', onDown);
  }, [onClose]);

  useEffect(() => {
    if (!timeEnabled || completedAt) return;
    const id = setInterval(() => {
      setTimeLeft((old) => {
        if (old <= 1) {
          setTimeEnabled(false);
          setHintText('The lamp is low, but the work can continue.');
          return 0;
        }
        return old - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timeEnabled, completedAt]);

  useEffect(() => {
    if (!particles.length) return;
    const id = setInterval(() => {
      setParticles((old) => old.map((p) => ({ ...p, life: p.life - 0.075, y: p.y - 0.45 })).filter((p) => p.life > 0));
    }, 32);
    return () => clearInterval(id);
  }, [particles.length]);

  const selectedPiece = useMemo(() => puzzle.pieces.find((p) => p.id === selectedPieceId) || null, [puzzle.pieces, selectedPieceId]);
  const transformedCells = useMemo(() => {
    if (!selectedPiece) return [];
    let cells = normalizeCells(selectedPiece.cells);
    if (flipped) cells = flipCells(cells);
    for (let i = 0; i < rotation; i += 1) cells = rotateCells(cells);
    return cells;
  }, [selectedPiece, rotation, flipped]);

  const filledCount = useMemo(() => board.flat().filter((x) => x !== null).length, [board]);
  const totalCount = puzzle.size * puzzle.size;
  const progressPct = Math.round((filledCount / totalCount) * 100);
  const revealStrength = Math.min(1, filledCount / totalCount);
  const completed = useMemo(
    () => board.length === puzzle.size && board.every((row, r) => row.length === puzzle.size && row.every((cell, c) => cell === puzzle.target[r][c])),
    [board, puzzle.size, puzzle.target],
  );

  useEffect(() => {
    if (!completed || completedAt) return;
    setCompletedAt(Date.now());
    playTone(audioCtxRef, 'triangle', 620, 0.16);
    setTimeout(() => playTone(audioCtxRef, 'triangle', 780, 0.18), 120);
    setTimeout(() => playTone(audioCtxRef, 'sine', 940, 0.2), 260);
    setHintText('Mosaic Restored');
    const rewardWithTime = puzzle.rewardTiles + (timeEnabled && timeLeft > 0 ? 1 : 0);
    setTimeout(() => onComplete(rewardWithTime), 950);
  }, [completed, completedAt, onComplete, puzzle.rewardTiles, timeEnabled, timeLeft]);

  const cellPlacementValidity = (row: number, col: number) => {
    if (!selectedPiece || used[selectedPiece.id]) return false;
    for (const [dx, dy] of transformedCells) {
      const rr = row + dy;
      const cc = col + dx;
      if (rr < 0 || cc < 0 || rr >= puzzle.size || cc >= puzzle.size) return false;
      if (board[rr][cc] !== null) return false;
      if (puzzle.target[rr][cc] !== selectedPiece.color) return false;
    }
    return true;
  };

  const placePiece = (row: number, col: number) => {
    if (!selectedPiece || used[selectedPiece.id]) return;
    if (!cellPlacementValidity(row, col)) {
      setFlashInvalid(true);
      setTimeout(() => setFlashInvalid(false), 220);
      playTone(audioCtxRef, 'sawtooth', 170, 0.07);
      setHintText('That shard does not settle there.');
      return;
    }
    const snapshot: PlacementRecord = { board: cloneBoard(board), used: { ...used }, order: [...order] };
    setHistory((old) => [...old, snapshot]);
    const next = cloneBoard(board);
    const newPlaced: Record<string, boolean> = {};
    transformedCells.forEach(([dx, dy]) => {
      const rr = row + dy;
      const cc = col + dx;
      next[rr][cc] = selectedPiece.color;
      newPlaced[`${rr}-${cc}`] = true;
    });
    setBoard(next);
    setPlacedCells(newPlaced);
    setUsed((old) => ({ ...old, [selectedPiece.id]: true }));
    setOrder((old) => [...old, selectedPiece.id]);
    setHintText('');
    playTone(audioCtxRef, 'triangle', 390 + transformedCells.length * 28, 0.1);
    setParticles((old) => [
      ...old,
      ...Array.from({ length: 12 }).map((_, i) => ({
        id: `p-${Date.now()}-${i}-${Math.random()}`,
        x: col + 0.5 + (Math.random() * 0.9 - 0.45),
        y: row + 0.5 + (Math.random() * 0.9 - 0.45),
        color: colorMap[selectedPiece.color],
        life: 1,
      })),
    ]);
  };

  const undo = () => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setBoard(cloneBoard(last.board));
    setUsed({ ...last.used });
    setOrder([...last.order]);
    setHistory((old) => old.slice(0, old.length - 1));
    setPlacedCells({});
    setHintText('');
    playTone(audioCtxRef, 'triangle', 260, 0.08);
  };

  const restart = () => {
    setBoard(Array.from({ length: puzzle.size }, () => Array.from({ length: puzzle.size }, () => null)));
    setUsed({});
    setOrder([]);
    setHistory([]);
    setPlacedCells({});
    setCompletedAt(null);
    setHintText('');
    setTimeEnabled(!!puzzle.timedSeconds);
    setTimeLeft(puzzle.timedSeconds ?? 0);
    playTone(audioCtxRef, 'triangle', 230, 0.08);
  };

  const hint = () => {
    for (let r = 0; r < puzzle.size; r += 1) {
      for (let c = 0; c < puzzle.size; c += 1) {
        if (board[r][c] !== null) continue;
        const snapshot: PlacementRecord = { board: cloneBoard(board), used: { ...used }, order: [...order] };
        const next = cloneBoard(board);
        next[r][c] = puzzle.target[r][c];
        setHistory((old) => [...old, snapshot]);
        setBoard(next);
        setPlacedCells({ [`${r}-${c}`]: true });
        setHintText('A matching fragment was revealed.');
        playTone(audioCtxRef, 'triangle', 520, 0.1);
        return;
      }
    }
  };

  const projectedCells = hoverCell ? transformedCells.map(([dx, dy]) => [hoverCell[0] + dy, hoverCell[1] + dx] as [number, number]) : [];
  const hoverValid = hoverCell ? cellPlacementValidity(hoverCell[0], hoverCell[1]) : false;

  return (
    <div className="absolute inset-0 z-[70] overflow-hidden bg-[#120b07] text-[#412815]">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 10%, rgba(252,199,114,0.28), transparent 28%), radial-gradient(circle at 92% 72%, rgba(21,70,92,0.25), transparent 32%), linear-gradient(135deg, #2b1a12 0%, #6b4429 45%, #3f2619 100%)',
        }}
      />
      <div className="absolute inset-0 opacity-[0.16]" style={{ backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(0deg, rgba(0,0,0,0.16) 1px, transparent 1px)', backgroundSize: '54px 54px' }} />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.58)]" />

      <div className="absolute left-[3%] top-[8%] h-28 w-6 rotate-[-18deg] rounded-full bg-[#4d2c18] shadow-[0_12px_24px_rgba(0,0,0,0.35)]">
        <span className="absolute -top-5 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full border border-[#b68a42] bg-[#d7b46a]" />
      </div>
      <div className="absolute left-[7%] bottom-[12%] h-20 w-24 rotate-[8deg] rounded-[46%] border border-[#6f5130] bg-[#ded0a9] shadow-[0_14px_28px_rgba(0,0,0,0.26)]" />
      <div className="absolute right-[6%] top-[9%] h-24 w-24 rounded-full border border-[#315433] bg-[#59763e]/70 shadow-[0_16px_34px_rgba(0,0,0,0.3)]">
        <span className="absolute left-4 top-3 h-7 w-4 rotate-[-25deg] rounded-full bg-[#789c52]" />
        <span className="absolute right-4 top-5 h-8 w-4 rotate-[30deg] rounded-full bg-[#6d9149]" />
        <span className="absolute left-9 bottom-4 h-8 w-4 rotate-[8deg] rounded-full bg-[#85a85a]" />
      </div>
      <div className="absolute bottom-[8%] right-[11%] h-5 w-32 rotate-[-10deg] rounded-full bg-[#7b4e2e] shadow-[0_10px_22px_rgba(0,0,0,0.3)]">
        <span className="absolute right-[-18px] top-[-4px] h-8 w-8 rounded-full border border-[#8f6b35] bg-[#d4a64c]" />
      </div>
      <div className="absolute right-[18%] bottom-[6%] flex gap-2 opacity-90">
        {[0, 1, 2, 4].map((c, i) => (
          <span key={c} className="h-7 w-8 rotate-[-12deg]" style={{ clipPath: tileClipPath(i, c), background: `linear-gradient(145deg, ${colorMap[c as MosaicColor]}, ${darkMap[c as MosaicColor]})`, boxShadow: '0 7px 15px rgba(0,0,0,0.28)' }} />
        ))}
      </div>

      <div className="relative z-10 grid h-full grid-cols-12 gap-4 p-4 md:p-6">
        <aside className="col-span-12 flex flex-col gap-3 md:col-span-2">
          <div className="rounded-[6px] border border-[#cda85e]/60 bg-[#ead8ad]/88 p-3 shadow-[0_15px_35px_rgba(0,0,0,0.26)]" style={{ transform: 'rotate(-1.2deg)' }}>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a3b2e]">Glazes</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([
                [0, 'Turquoise'],
                [1, 'Blue'],
                [2, 'Gold'],
                [3, 'White'],
                [4, 'Red'],
              ] as Array<[MosaicColor, string]>).map(([id, label]) => (
                <div key={id} title={label} className="h-9 rounded-sm border border-[#8a6537]/50" style={{ background: `linear-gradient(145deg, ${colorMap[id]}, ${darkMap[id]})`, boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.35), 0 4px 8px rgba(0,0,0,0.18)' }} />
              ))}
            </div>
          </div>
          <div className="rounded-[6px] border border-[#cda85e]/60 bg-[#efe0bb]/90 p-3 text-xs font-semibold text-[#573419] shadow-[0_15px_35px_rgba(0,0,0,0.23)]" style={{ transform: 'rotate(1deg)' }}>
            <div className="mb-2 h-1.5 rounded-full bg-[#d7bf8c]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#2fb8bd] via-[#174f9b] to-[#d8a83e]" style={{ width: `${progressPct}%` }} />
            </div>
            <div>{progressPct}% restored</div>
            {puzzle.timedSeconds && <div className={timeLeft < 25 && timeEnabled ? 'text-[#9f332d]' : ''}>Lamp: {timeLeft}s</div>}
          </div>
        </aside>

        <main className="col-span-12 flex items-center justify-center md:col-span-7">
          <section
            className={`relative w-full max-w-[650px] p-4 transition-all duration-300 ${flashInvalid ? 'translate-x-1' : ''}`}
            style={{
              filter: completedAt ? 'drop-shadow(0 0 30px rgba(218,179,75,0.45))' : 'drop-shadow(0 28px 38px rgba(0,0,0,0.34))',
            }}
          >
            <div
              className="relative mx-auto aspect-square w-full overflow-hidden"
              style={{
                clipPath: 'polygon(5% 10%, 14% 3%, 88% 5%, 97% 16%, 94% 88%, 84% 97%, 13% 94%, 3% 82%)',
                background:
                  'radial-gradient(circle at 50% 44%, rgba(248,235,198,0.98), rgba(219,194,144,0.96) 62%, rgba(128,88,49,0.96) 100%)',
                boxShadow: 'inset 0 0 0 10px rgba(96,58,28,0.38), inset 0 0 0 16px rgba(216,168,62,0.16)',
              }}
            >
              <svg className="absolute inset-[6%] h-[88%] w-[88%] opacity-80" viewBox="0 0 100 100" aria-hidden="true">
                <defs>
                  <radialGradient id="mosaic-reveal" cx="50%" cy="44%" r="58%">
                    <stop offset="0%" stopColor="#f7edd2" stopOpacity={0.18 + revealStrength * 0.45} />
                    <stop offset="45%" stopColor="#2fb8bd" stopOpacity={0.08 + revealStrength * 0.22} />
                    <stop offset="100%" stopColor="#174f9b" stopOpacity={0.08 + revealStrength * 0.18} />
                  </radialGradient>
                </defs>
                <path d="M50 5 L61 32 L90 32 L66 50 L76 79 L50 62 L24 79 L34 50 L10 32 L39 32 Z" fill="url(#mosaic-reveal)" stroke="#d8a83e" strokeOpacity={0.15 + revealStrength * 0.45} strokeWidth="1.2" />
                <circle cx="50" cy="50" r="21" fill="none" stroke="#efe8d8" strokeOpacity={0.18 + revealStrength * 0.42} strokeWidth="1.2" />
                <path d="M18 18 C32 30 32 70 18 82 M82 18 C68 30 68 70 82 82" fill="none" stroke="#a84b3f" strokeOpacity={0.12 + revealStrength * 0.34} strokeWidth="1.1" />
              </svg>

              <div
                className="absolute inset-[9%] grid"
                style={{ gridTemplateColumns: `repeat(${puzzle.size}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${puzzle.size}, minmax(0, 1fr))` }}
              >
                {board.map((line, r) =>
                  line.map((cell, c) => {
                    const cellKey = `${r}-${c}`;
                    const projected = projectedCells.some(([rr, cc]) => rr === r && cc === c);
                    const particleHere = particles.filter((p) => Math.floor(p.x) === c && Math.floor(p.y) === r);
                    const justPlaced = !!placedCells[cellKey];
                    const color = cell ?? puzzle.target[r][c];
                    return (
                      <button
                        key={cellKey}
                        className="relative m-[2px] cursor-pointer border-0 outline-none transition-all duration-150"
                        style={{
                          clipPath: tileClipPath(r, c),
                          background: cell === null
                            ? `linear-gradient(140deg, rgba(246,231,195,0.9), rgba(225,199,148,0.84)), radial-gradient(circle at 45% 38%, ${faintMap[color]} 0%, transparent 68%)`
                            : `linear-gradient(145deg, ${colorMap[cell]} 0%, #ffffff33 28%, ${darkMap[cell]} 100%)`,
                          boxShadow: [
                            'inset 0 1px 2px rgba(255,255,255,0.5)',
                            'inset 0 -3px 5px rgba(0,0,0,0.16)',
                            projected ? `0 0 0 3px ${hoverValid ? 'rgba(72,213,198,0.7)' : 'rgba(168,75,63,0.75)'}` : '',
                            projected ? '0 12px 16px rgba(0,0,0,0.25)' : '',
                            justPlaced ? `0 0 18px ${colorMap[color]}` : '',
                          ].filter(Boolean).join(', '),
                          opacity: cell === null ? 0.62 + revealStrength * 0.26 : 1,
                          transform: projected ? 'translateY(-2px) scale(1.035)' : justPlaced ? 'scale(1.04)' : 'scale(1)',
                        }}
                        onMouseEnter={() => setHoverCell([r, c])}
                        onMouseLeave={() => setHoverCell(null)}
                        onFocus={() => setHoverCell([r, c])}
                        onBlur={() => setHoverCell(null)}
                        onClick={() => placePiece(r, c)}
                        aria-label={`mosaic region ${r + 1}-${c + 1}`}
                      >
                        <span className="pointer-events-none absolute inset-0 opacity-[0.22]" style={{ backgroundImage: 'linear-gradient(38deg, transparent 43%, rgba(255,255,255,0.34) 48%, transparent 54%), radial-gradient(circle at 25% 25%, rgba(255,255,255,0.28), transparent 22%)' }} />
                        <span className="pointer-events-none absolute inset-[12%] rounded-full border border-black/10 opacity-30" />
                        {particleHere.map((p) => (
                          <span key={p.id} className="pointer-events-none absolute h-1.5 w-1.5 rounded-full" style={{ left: `${50 + (p.x - c - 0.5) * 58}%`, top: `${50 + (p.y - r - 0.5) * 58}%`, background: p.color, opacity: p.life, boxShadow: `0 0 10px ${p.color}` }} />
                        ))}
                      </button>
                    );
                  }),
                )}
              </div>
            </div>

            <div className="pointer-events-none absolute left-[9%] top-[7%] h-[86%] w-[82%] rounded-[34%] border border-[#d8a83e]/18" />
            {completedAt && <div className="pointer-events-none absolute inset-[8%] animate-pulse rounded-[32%] border-2 border-[#d8a83e]/70 shadow-[0_0_38px_rgba(216,168,62,0.55)]" />}
          </section>
        </main>

        <aside className="col-span-12 flex min-h-0 flex-col gap-3 md:col-span-3">
          <div className="rounded-[6px] border border-[#cda85e]/70 bg-[#ead8ad]/92 p-3 shadow-[0_18px_35px_rgba(0,0,0,0.28)]" style={{ transform: 'rotate(1.2deg)' }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a3b2e]">Pattern</div>
                <div className="mt-1 font-serif text-lg font-bold leading-none text-[#493018]">{puzzle.name}</div>
              </div>
              <div className="grid grid-cols-3 gap-[2px] rounded-sm border border-[#8f6938]/45 p-1">
                {[0, 1, 2, 4, 3, 1, 2, 0, 4].map((c, i) => <span key={`${c}-${i}`} className="h-2.5 w-2.5" style={{ clipPath: tileClipPath(i, c), background: colorMap[c as MosaicColor] }} />)}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {[...Array(5)].map((_, i) => <span key={i} className="h-1 rounded-full bg-[#9a7343]/35" />)}
            </div>
          </div>

          <div className="min-h-0 flex-1 rounded-[6px] border border-[#b99450]/70 bg-[#f1dfb6]/94 p-3 shadow-[0_18px_35px_rgba(0,0,0,0.25)]" style={{ transform: 'rotate(-0.6deg)' }}>
            <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#7a3b2e]">Shard Tray</div>
            <div className="max-h-[42vh] space-y-2 overflow-auto pr-1">
              {puzzle.pieces.map((piece) => {
                const active = selectedPieceId === piece.id;
                const done = !!used[piece.id];
                return (
                  <button
                    key={piece.id}
                    disabled={done}
                    onClick={() => {
                      setSelectedPieceId(piece.id);
                      playTone(audioCtxRef, 'triangle', 310, 0.04);
                    }}
                    className={`flex w-full items-center justify-between rounded-[5px] border px-2 py-2 text-left text-xs transition-all ${done ? 'opacity-35 grayscale' : active ? 'border-[#d8a83e] bg-[#fff2cc] shadow-[0_0_16px_rgba(216,168,62,0.34)]' : 'border-[#b08a4c]/55 bg-[#e5cc9b]/70 hover:-translate-y-0.5 hover:bg-[#efd9ab]'}`}
                  >
                    <span className="font-semibold text-[#4b2d16]">{piece.id}</span>
                    <PiecePreview piece={piece} active={active} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[6px] border border-[#cda85e]/70 bg-[#ead8ad]/92 p-3 text-xs font-semibold text-[#573419] shadow-[0_18px_35px_rgba(0,0,0,0.24)]" style={{ transform: 'rotate(0.8deg)' }}>
            <div className="flex items-center justify-between">
              <span>Reward</span>
              <span>+{puzzle.rewardTiles} tiles</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[#7a3b2e]">
              <span>Gold</span>
              <span>+{puzzle.rewardGold}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[#7a3b2e]">
              <span>Restoration</span>
              <span>+{puzzle.rewardBoost}%</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#d3ad60]/45 bg-[#2b1a12]/78 px-2 py-2 shadow-[0_15px_30px_rgba(0,0,0,0.34)] backdrop-blur">
        <button title="Exit" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-[#ead8ad] text-[#503119] hover:bg-[#f5e7c1]"><X className="h-4 w-4" /></button>
        <button title="Undo" onClick={undo} className="grid h-9 w-9 place-items-center rounded-full bg-[#ead8ad] text-[#503119] hover:bg-[#f5e7c1]"><Undo2 className="h-4 w-4" /></button>
        <button title="Restart" onClick={restart} className="grid h-9 w-9 place-items-center rounded-full bg-[#ead8ad] text-[#503119] hover:bg-[#f5e7c1]"><RefreshCw className="h-4 w-4" /></button>
        <button title="Rotate" onClick={() => setRotation((old) => (old + 1) % 4)} className="grid h-9 w-9 place-items-center rounded-full bg-[#ead8ad] text-[#503119] hover:bg-[#f5e7c1]"><RotateCw className="h-4 w-4" /></button>
        <button title="Flip" onClick={() => setFlipped((old) => !old)} className="grid h-9 w-9 place-items-center rounded-full bg-[#ead8ad] text-[#503119] hover:bg-[#f5e7c1]"><FlipHorizontal2 className="h-4 w-4" /></button>
        <button title="Reveal progress" onClick={() => setHintText(`${progressPct}% restored`)} className="grid h-9 w-9 place-items-center rounded-full bg-[#ead8ad] text-[#503119] hover:bg-[#f5e7c1]"><Eye className="h-4 w-4" /></button>
        <button title="Hint" onClick={hint} className="grid h-9 w-9 place-items-center rounded-full bg-[#ead8ad] text-[#503119] hover:bg-[#f5e7c1]"><Lightbulb className="h-4 w-4" /></button>
        {puzzle.timedSeconds && <button title="Toggle time challenge" onClick={() => setTimeEnabled((old) => !old)} className="h-9 rounded-full bg-[#ead8ad] px-3 text-xs font-bold text-[#503119] hover:bg-[#f5e7c1]">{timeEnabled ? 'Lamp On' : 'Lamp Off'}</button>}
      </div>

      {hintText && <div className="absolute left-1/2 top-5 z-30 -translate-x-1/2 rounded-full border border-[#d3ad60]/50 bg-[#f1dfb6]/95 px-4 py-2 text-sm font-bold text-[#58361b] shadow-[0_12px_24px_rgba(0,0,0,0.25)]">{hintText}</div>}

      {showTutorial && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#120b07]/58 backdrop-blur-[1px]">
          <div className="relative max-w-[540px] rounded-[6px] border border-[#d3ad60] bg-[#f1dfb6] p-5 text-[#4c2e17] shadow-[0_24px_55px_rgba(0,0,0,0.45)]" style={{ transform: 'rotate(-0.8deg)' }}>
            <div className="absolute -top-3 left-1/2 h-5 w-8 -translate-x-1/2 rounded-sm bg-[#9b6c1f] shadow" />
            <div className="font-serif text-2xl font-bold">Restore the fractured tilework</div>
            <div className="mt-3 grid grid-cols-[auto_1fr] gap-3 text-sm font-semibold">
              <PiecePreview piece={puzzle.pieces[0]} active />
              <span>Choose a shard, test its shadow over the design, then settle it into matching glaze.</span>
              <span className="h-8 w-8 rounded-sm" style={{ clipPath: tileClipPath(1, 2), background: `linear-gradient(145deg, ${colorMap[2]}, ${darkMap[2]})` }} />
              <span>The faint artwork beneath the fragments becomes richer as the mosaic is repaired.</span>
            </div>
            <button onClick={() => setShowTutorial(false)} className="mt-5 rounded-[5px] border border-[#8a6537] bg-[#d8a83e] px-4 py-2 text-sm font-bold text-[#3a220f] shadow hover:bg-[#e4bb55]">Begin</button>
          </div>
        </div>
      )}

      {completedAt && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#120b07]/35">
          <div className="rounded-[8px] border border-[#d8a83e] bg-[#f1dfb6]/96 px-8 py-6 text-center text-[#4c2e17] shadow-[0_0_45px_rgba(216,168,62,0.58)]">
            <div className="font-serif text-4xl font-bold">Mosaic Restored</div>
            <div className="mt-3 text-sm font-bold">+{puzzle.rewardTiles + (timeEnabled && timeLeft > 0 ? 1 : 0)} Mosaic Tiles</div>
            <div className="text-sm font-semibold text-[#7a3b2e]">+{puzzle.rewardGold} Gold / +{puzzle.rewardBoost}% Restoration</div>
          </div>
        </div>
      )}
    </div>
  );
}
