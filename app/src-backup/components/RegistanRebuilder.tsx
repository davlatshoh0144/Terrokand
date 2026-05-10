import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BuildSiteRing,
  NodeSprite,
  RegistanStage,
  ResourceIcon,
  SparkleBurst,
  StationSprite,
  WorkerSprite,
} from './RegistanAssets';

type ResourceType = 'stone' | 'timber' | 'clay' | 'mosaic';
type WorkerTier = 'builder' | 'craftsman' | 'architect';
type NodeKind = 'stone' | 'timber' | 'clay';
type WorkerStatus = 'Mining' | 'Carrying' | 'Depositing' | 'Crafting' | 'Waiting';
type UpgradeKey = 'inventory' | 'playerSpeed' | 'gatherSpeed' | 'workerCarry' | 'workerSpeed' | 'workerWork';

interface Node {
  id: string;
  x: number;
  y: number;
  radius: number;
  kind: NodeKind;
}

interface Bot {
  id: string;
  tier: WorkerTier;
  x: number;
  y: number;
  carrying: ResourceType | null;
  carryingQty: number;
  gatherProgress: number;
  status: WorkerStatus;
  target: 'node' | 'site';
}

interface FloatText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface BuildParticle {
  id: string;
  x: number;
  y: number;
  life: number;
  vx: number;
  vy: number;
}

const VIEW_W = 1080;
const VIEW_H = 680;
const WORLD_W = 2200;
const WORLD_H = 1500;
const BASE_PLAYER_SPEED = 220;
const STAGE_COSTS: Record<number, number> = { 0: 28, 1: 34, 2: 40, 3: 32 };
const HIRE_COSTS: Record<WorkerTier, number> = { builder: 70, craftsman: 130, architect: 220 };
const SELL_PRICES: Record<ResourceType, number> = { stone: 2, timber: 4, clay: 5, mosaic: 10 };
const stageResource: ResourceType[] = ['stone', 'timber', 'clay', 'mosaic'];
const resourceLabel: Record<ResourceType, string> = { stone: 'Stone', timber: 'Timber', clay: 'Clay', mosaic: 'Mosaic' };

const upgradeCosts = [0, 40, 90, 160];
const capByLevel = [16, 24, 32, 48];
const playerSpeedByLevel = [1, 1.1, 1.2, 1.3];
const gatherSpeedByLevel = [1, 1.15, 1.3, 1.5];
const workerCarryByLevel = [1, 2, 3, 4];
const workerSpeedByLevel = [1, 1.12, 1.24, 1.36];
const workerWorkByLevel = [1, 1.2, 1.4, 1.6];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}
function inRectWithMargin(p: { x: number; y: number }, rect: { x: number; y: number; w: number; h: number }, margin = 0) {
  return p.x >= rect.x - margin && p.x <= rect.x + rect.w + margin && p.y >= rect.y - margin && p.y <= rect.y + rect.h + margin;
}
function getStageRequirements(stageIndex: number): ResourceType[] {
  if (stageIndex <= 0) return ['stone'];
  return [stageResource[stageIndex - 1], stageResource[stageIndex]];
}

export default function RegistanRebuilder({
  onExit,
  onComplete,
}: {
  onExit: () => void;
  onComplete?: (score: number, stars: number) => void;
}) {
  const [player, setPlayer] = useState({ x: 560, y: 900 });
  const [inventory, setInventory] = useState<Record<ResourceType, number>>({ stone: 0, timber: 0, clay: 0, mosaic: 0 });
  const [gold, setGold] = useState(40);
  const [progress, setProgress] = useState(0);
  const [builderHired, setBuilderHired] = useState(false);
  const [craftsmanHired, setCraftsmanHired] = useState(false);
  const [architectHired, setArchitectHired] = useState(false);
  const [bots, setBots] = useState<Bot[]>([]);
  const [message, setMessage] = useState('Gather stone with pickaxe (Hold E).');
  const [showSell, setShowSell] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [actionProgress, setActionProgress] = useState(0);
  const [activeAction, setActiveAction] = useState<'mine' | 'chop' | 'dig' | 'craft' | null>(null);
  const [levelFinished, setLevelFinished] = useState(false);
  const [stageSparkle, setStageSparkle] = useState(false);
  const [floatTexts, setFloatTexts] = useState<FloatText[]>([]);
  const [buildParticles, setBuildParticles] = useState<BuildParticle[]>([]);
  const [buildPulse, setBuildPulse] = useState(false);
  const [stageBanner, setStageBanner] = useState('');
  const [focusOnRegistan, setFocusOnRegistan] = useState(false);
  const [movementLocked, setMovementLocked] = useState(false);
  const [stageDeposited, setStageDeposited] = useState<Record<ResourceType, number>>({ stone: 0, timber: 0, clay: 0, mosaic: 0 });
  const [upgradeLevels, setUpgradeLevels] = useState<Record<UpgradeKey, number>>({
    inventory: 1,
    playerSpeed: 1,
    gatherSpeed: 1,
    workerCarry: 1,
    workerSpeed: 1,
    workerWork: 1,
  });

  const keys = useRef<Record<string, boolean>>({});
  const lastTs = useRef<number>(0);
  const interactionCooldown = useRef(0);
  const actionAssistUntil = useRef(0);
  const playerRef = useRef(player);
  const progressRef = useRef(progress);
  const inventoryRef = useRef(inventory);
  const visualStageRef = useRef<0 | 1 | 2 | 3 | 4>(0);
  const stageDepositedRef = useRef<Record<ResourceType, number>>({ stone: 0, timber: 0, clay: 0, mosaic: 0 });
  const gatherCommitRef = useRef(0);
  const craftCommitRef = useRef(0);
  const depositCommitRef = useRef(0);

  const stageIndex = Math.min(3, Math.floor(progress / 25));
  const stageNeeds = useMemo(() => getStageRequirements(stageIndex), [stageIndex]);
  const stageTarget = STAGE_COSTS[stageIndex];
  const stageDeliveredTotal = stageNeeds.reduce((sum, r) => sum + (stageDeposited[r] || 0), 0);
  const stageRemainingInt = Math.max(0, stageTarget - Math.floor(stageDeliveredTotal));
  const perResourceTarget = stageNeeds.length === 1 ? stageTarget : Math.ceil(stageTarget / 2);
  const visualStage: 0 | 1 | 2 | 3 | 4 = progress >= 100 ? 4 : progress >= 75 ? 3 : progress >= 50 ? 2 : progress >= 25 ? 1 : 0;
  const gateWorker: WorkerTier | null = stageIndex === 1 ? 'builder' : stageIndex === 2 ? 'craftsman' : stageIndex === 3 ? 'architect' : null;
  const gateOpen =
    stageIndex === 0 || (stageIndex === 1 && builderHired) || (stageIndex === 2 && craftsmanHired) || (stageIndex === 3 && architectHired);

  const inventoryCap = capByLevel[upgradeLevels.inventory - 1];
  const playerSpeedMult = playerSpeedByLevel[upgradeLevels.playerSpeed - 1];
  const gatherSpeedMult = gatherSpeedByLevel[upgradeLevels.gatherSpeed - 1];
  const workerCarry = workerCarryByLevel[upgradeLevels.workerCarry - 1];
  const workerSpeedMult = workerSpeedByLevel[upgradeLevels.workerSpeed - 1];
  const workerWorkMult = workerWorkByLevel[upgradeLevels.workerWork - 1];
  const architectAuraMult = architectHired ? 1.12 + (upgradeLevels.workerWork - 1) * 0.06 : 1;

  const nodes = useMemo<Node[]>(() => {
    const base: Node[] = [
      { id: 's1', x: 210, y: 280, radius: 34, kind: 'stone' },
      { id: 's2', x: 350, y: 990, radius: 34, kind: 'stone' },
      { id: 's3', x: 760, y: 430, radius: 34, kind: 'stone' },
      { id: 's4', x: 980, y: 1020, radius: 34, kind: 'stone' },
    ];
    if (progress >= 25) base.push({ id: 't1', x: 1820, y: 210, radius: 36, kind: 'timber' }, { id: 't2', x: 1920, y: 920, radius: 36, kind: 'timber' });
    if (progress >= 50) base.push({ id: 'c1', x: 1540, y: 740, radius: 34, kind: 'clay' }, { id: 'c2', x: 1320, y: 1170, radius: 34, kind: 'clay' });
    return base;
  }, [progress]);

  const buildSite = { x: 780, y: 760, r: 84 };
  const market = { x: 340, y: 1040, w: 130, h: 72 };
  const hireBoard = { x: 560, y: 1040, w: 130, h: 72 };
  const upgradeStall = { x: 710, y: 1040, w: 130, h: 72 };
  const kiln = { x: 900, y: 1040, w: 130, h: 72 };

  const cameraTargetX = focusOnRegistan ? buildSite.x : player.x;
  const cameraTargetY = focusOnRegistan ? buildSite.y : player.y;
  const cameraX = clamp(cameraTargetX - VIEW_W / 2, 0, WORLD_W - VIEW_W);
  const cameraY = clamp(cameraTargetY - VIEW_H / 2, 0, WORLD_H - VIEW_H);
  const nearBuild = dist(player.x, player.y, buildSite.x, buildSite.y) < buildSite.r + 16;
  const nearMarket = inRectWithMargin(player, market, 16);
  const nearHire = inRectWithMargin(player, hireBoard, 16);
  const nearUpgrade = inRectWithMargin(player, upgradeStall, 16);
  const nearKiln = progress >= 75 && inRectWithMargin(player, kiln, 16);

  const nearGatherNode = useMemo(() => {
    const unlockedKinds = new Set<NodeKind>(['stone']);
    if (progress >= 25) unlockedKinds.add('timber');
    if (progress >= 50) unlockedKinds.add('clay');
    return nodes.find((n) => unlockedKinds.has(n.kind) && dist(player.x, player.y, n.x, n.y) < n.radius + 18) || null;
  }, [nodes, progress, player]);

  const actionPrompt = showSell
    ? 'Sell resources'
    : showUpgrade
      ? 'Upgrade your tools and workforce'
      : nearGatherNode
        ? nearGatherNode.kind === 'stone'
          ? 'Hold E to mine stone'
          : nearGatherNode.kind === 'timber'
            ? 'Hold E to chop timber'
            : 'Hold E to dig clay'
        : nearKiln
          ? 'Hold E to craft mosaic'
          : nearHire
            ? 'Press E to hire'
            : nearUpgrade
              ? 'Press E to upgrade'
              : nearMarket
                ? 'Press E to sell'
                : nearBuild
                  ? gateOpen
                    ? 'Auto depositing...'
                    : `Build locked. Hire ${gateWorker}.`
                  : '';

  const addFloatText = (x: number, y: number, text: string, color = '#ffd76b') => {
    setFloatTexts((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, x, y, text, color, life: 1.2 }]);
  };
  const triggerBuildFx = () => {
    setBuildPulse(true);
    setTimeout(() => setBuildPulse(false), 260);
    setBuildParticles((prev) => [
      ...prev,
      ...Array.from({ length: 10 }).map((_, i) => ({
        id: `bp-${Date.now()}-${i}-${Math.random()}`,
        x: buildSite.x + (Math.random() * 56 - 28),
        y: buildSite.y + (Math.random() * 36 - 18),
        life: 0.9,
        vx: Math.random() * 1.2 - 0.6,
        vy: -0.8 - Math.random() * 1.2,
      })),
    ]);
  };

  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  useEffect(() => {
    inventoryRef.current = inventory;
  }, [inventory]);
  useEffect(() => {
    stageDepositedRef.current = stageDeposited;
  }, [stageDeposited]);

  const applyStageProgressFromDeposits = (updated: Record<ResourceType, number>) => {
    const liveStage = Math.min(3, Math.floor(progressRef.current / 25));
    const needs = getStageRequirements(liveStage);
    const cost = STAGE_COSTS[liveStage] || STAGE_COSTS[3];
    const targetEach = needs.length === 1 ? cost : Math.ceil(cost / 2);
    const stageRatio = needs.reduce((sum, r) => sum + Math.min(1, (updated[r] || 0) / targetEach), 0) / needs.length;
    const nextProgress = clamp(liveStage * 25 + stageRatio * 25, 0, 100);
    setProgress((prev) => {
      if (Math.floor(prev / 25) !== Math.floor(nextProgress / 25) && nextProgress < 100) setMessage('Milestone reached!');
      if (nextProgress >= 100 && !levelFinished) { setLevelFinished(true); setMessage('Registan fully restored!'); }
      return nextProgress;
    });
  };

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keys.current[k] = true;
      if (k === 'e') actionAssistUntil.current = Date.now() + 700;
      if (k !== 'e') return;
      const now = Date.now();
      if (now - interactionCooldown.current < 180) return;
      interactionCooldown.current = now;

      if (nearHire) {
        if (progress < 25) setMessage('Reach 25% first.');
        else if (!builderHired) {
          if (gold >= HIRE_COSTS.builder) { setGold((g) => g - HIRE_COSTS.builder); setBuilderHired(true); setMessage('Builder hired.'); }
          else setMessage('Need more gold.');
        } else if (progress < 50) setMessage('Reach 50% first.');
        else if (!craftsmanHired) {
          if (gold >= HIRE_COSTS.craftsman) { setGold((g) => g - HIRE_COSTS.craftsman); setCraftsmanHired(true); setMessage('Craftsman hired.'); }
          else setMessage('Need more gold.');
        } else if (progress < 75) setMessage('Reach 75% first.');
        else if (!architectHired) {
          if (gold >= HIRE_COSTS.architect) { setGold((g) => g - HIRE_COSTS.architect); setArchitectHired(true); setMessage('Architect hired.'); }
          else setMessage('Need more gold.');
        } else setMessage('All workers already hired.');
        return;
      }
      if (nearMarket) { setShowSell((s) => !s); setShowUpgrade(false); return; }
      if (nearUpgrade) { setShowUpgrade((s) => !s); setShowSell(false); }
    };
    const onUp = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, [nearHire, nearMarket, nearUpgrade, builderHired, craftsmanHired, architectHired, progress, gold]);

  useEffect(() => {
    let raf = 0;
    const tick = (ts: number) => {
      const dt = Math.min(0.033, (ts - lastTs.current) / 1000 || 0.016);
      lastTs.current = ts;
      const move = BASE_PLAYER_SPEED * playerSpeedMult * dt;
      setPlayer((p) => {
        let nx = p.x; let ny = p.y;
        if (!movementLocked) {
          if (keys.current.w || keys.current.arrowup) ny -= move;
          if (keys.current.s || keys.current.arrowdown) ny += move;
          if (keys.current.a || keys.current.arrowleft) nx -= move;
          if (keys.current.d || keys.current.arrowright) nx += move;
        }
        return { x: clamp(nx, 24, WORLD_W - 24), y: clamp(ny, 24, WORLD_H - 24) };
      });
      setFloatTexts((prev) => prev.map((f) => ({ ...f, y: f.y - 0.5, life: f.life - dt })).filter((f) => f.life > 0));
      setBuildParticles((prev) =>
        prev
          .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - dt }))
          .filter((p) => p.life > 0),
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerSpeedMult, movementLocked]);

  useEffect(() => {
    setStageSparkle(true);
    const id = setTimeout(() => setStageSparkle(false), 850);
    return () => clearTimeout(id);
  }, [visualStage]);

  useEffect(() => {
    const prev = visualStageRef.current;
    if (visualStage > prev) {
      setMovementLocked(true);
      setFocusOnRegistan(true);
      setStageBanner('Stage Complete!');
      setStageSparkle(true);
      setTimeout(() => setMovementLocked(false), 1000);
      setTimeout(() => setFocusOnRegistan(false), 1050);
      setTimeout(() => setStageBanner(''), 1750);
      if (visualStage === 1) setTimeout(() => setMessage('Timber unlocked'), 220);
      else if (visualStage === 2) setTimeout(() => setMessage('Clay unlocked'), 220);
      else if (visualStage === 3) setTimeout(() => setMessage('Kiln + Mosaic unlocked'), 220);
      else if (visualStage === 4) setTimeout(() => setMessage('Registan Restored!'), 220);
    }
    visualStageRef.current = visualStage;
    const resetDeposits = { stone: 0, timber: 0, clay: 0, mosaic: 0 };
    setStageDeposited(resetDeposits);
    stageDepositedRef.current = resetDeposits;
  }, [visualStage]);

  useEffect(() => {
    const id = setInterval(() => {
      const p = playerRef.current;
      const holdingE = !!keys.current.e;
      const assistedHold = Date.now() < actionAssistUntil.current;
      let action: typeof activeAction = null;
      let tx = p.x;
      let ty = p.y;
      if ((holdingE || assistedHold) && nearGatherNode && !showSell && !showUpgrade) {
        action = nearGatherNode.kind === 'stone' ? 'mine' : nearGatherNode.kind === 'timber' ? 'chop' : 'dig';
        tx = nearGatherNode.x; ty = nearGatherNode.y - 26;
      }
      if ((holdingE || assistedHold) && nearKiln && !showSell && !showUpgrade) {
        action = 'craft'; tx = kiln.x + kiln.w / 2; ty = kiln.y - 10;
      }
      setActiveAction(action);

      if (action) {
        setActionProgress((pr) => {
          const speed = 0.085 * gatherSpeedMult * (action === 'craft' ? 0.75 : 1);
          const next = pr + speed;
          if (next < 1) return next;
          if (action === 'craft') {
            const now = Date.now();
            if (now - craftCommitRef.current < 80) return 0;
            craftCommitRef.current = now;
            setInventory((old) => {
              if (old.clay < 2 || gold < 4) { setMessage(old.clay < 2 ? 'Need 2 clay for kiln.' : 'Need 4 gold for kiln.'); addFloatText(tx, ty, 'Missing materials', '#ff9d9d'); return old; }
              setGold((g) => g - 4);
              addFloatText(tx, ty, '+1 Mosaic', '#9fe8ff');
              setMessage('Crafted +1 Mosaic');
              return { ...old, clay: old.clay - 2, mosaic: old.mosaic + 1 };
            });
          } else if (nearGatherNode) {
            const now = Date.now();
            if (now - gatherCommitRef.current < 80) return 0;
            gatherCommitRef.current = now;
            setInventory((old) => {
              const total = old.stone + old.timber + old.clay + old.mosaic;
              if (total >= inventoryCap) { setMessage('Inventory Full'); addFloatText(tx, ty, 'Inventory Full', '#ffb3b3'); return old; }
              const key = nearGatherNode.kind;
              addFloatText(tx, ty, `+1 ${resourceLabel[key as ResourceType]}`, '#b9ffd0');
              return { ...old, [key]: old[key] + 1 };
            });
          }
          return 0;
        });
      } else setActionProgress(0);

      if (nearBuild) {
        if (!gateOpen) setMessage(`Build locked. Hire ${gateWorker} first.`);
        else {
          const now = Date.now();
          if (now - depositCommitRef.current < 70) return;
          depositCommitRef.current = now;

          const liveStage = Math.min(3, Math.floor(progressRef.current / 25));
          const needs = getStageRequirements(liveStage);
          const current = inventoryRef.current;
          const next = { ...current };
          let deposited = 0; let left = 1;
          const perNeed: Partial<Record<ResourceType, number>> = {};
          for (const need of needs) {
            if (left <= 0) break;
            const take = Math.min(left, next[need]);
            next[need] -= take; left -= take; deposited += take;
            if (take > 0) perNeed[need] = (perNeed[need] || 0) + take;
          }
          if (deposited <= 0) return;

          setInventory(next);
          const updatedDeposits = { ...stageDepositedRef.current };
          Object.entries(perNeed).forEach(([k, qty]) => {
            if (!qty) return;
            const key = k as ResourceType;
            updatedDeposits[key] = (updatedDeposits[key] || 0) + qty;
          });
          stageDepositedRef.current = updatedDeposits;
          setStageDeposited(updatedDeposits);

          const activeEntries = Object.entries(perNeed).filter(([, qty]) => !!qty);
          if (activeEntries.length === 1) {
            const [k] = activeEntries[0];
            addFloatText(buildSite.x - 34, buildSite.y - 56, `+${deposited} ${resourceLabel[k as ResourceType]} to Build`, '#b7f5ff');
          } else {
            activeEntries.forEach(([k, qty], idx) => {
              addFloatText(buildSite.x - 34 + idx * 22, buildSite.y - 56 - idx * 4, `+${qty} ${resourceLabel[k as ResourceType]} to Build`, '#b7f5ff');
            });
          }
          triggerBuildFx();
          applyStageProgressFromDeposits(updatedDeposits);
        }
      }
    }, 90);
    return () => clearInterval(id);
  }, [nearGatherNode, nearKiln, showSell, showUpgrade, gatherSpeedMult, inventoryCap, gold, nearBuild, gateOpen, gateWorker, levelFinished]);

  useEffect(() => {
    const list: Bot[] = [];
    if (builderHired) list.push({ id: 'builder', tier: 'builder', x: buildSite.x - 45, y: buildSite.y + 140, carrying: null, carryingQty: 0, gatherProgress: 0, status: 'Waiting', target: 'node' });
    if (craftsmanHired) list.push({ id: 'craftsman', tier: 'craftsman', x: buildSite.x + 20, y: buildSite.y + 140, carrying: null, carryingQty: 0, gatherProgress: 0, status: 'Waiting', target: 'node' });
    if (architectHired) list.push({ id: 'architect', tier: 'architect', x: buildSite.x + 90, y: buildSite.y + 130, carrying: null, carryingQty: 0, gatherProgress: 0, status: 'Waiting', target: 'site' });
    setBots((old) => {
      const kept = old.filter((o) => list.some((n) => n.id === o.id));
      for (const n of list) if (!kept.find((k) => k.id === n.id)) kept.push(n);
      return kept;
    });
  }, [builderHired, craftsmanHired, architectHired, buildSite.x, buildSite.y]);

  useEffect(() => {
    const id = setInterval(() => {
      setBots((old) => old.map((bot) => {
        if (bot.tier === 'architect') return { ...bot, status: 'Waiting' };
        const liveStage = Math.min(3, Math.floor(progressRef.current / 25));
        const workerGateOpen = liveStage === 0 || (liveStage === 1 && builderHired) || (liveStage === 2 && craftsmanHired) || (liveStage === 3 && architectHired);
        if (!workerGateOpen) return { ...bot, status: 'Waiting' };
        const needs = getStageRequirements(liveStage);
        const cost = STAGE_COSTS[liveStage] || STAGE_COSTS[3];
        const targetEach = needs.length === 1 ? cost : Math.ceil(cost / 2);
        const preferred = bot.tier === 'builder' ? needs[0] : needs[needs.length - 1];
        const depositedForPreferred = stageDepositedRef.current[preferred] || 0;
        if (depositedForPreferred >= targetEach) return { ...bot, carrying: null, carryingQty: 0, status: 'Waiting' };
        const carriedResource: ResourceType = preferred === 'mosaic' ? 'clay' : preferred;
        const nodeKind = carriedResource as NodeKind;
        const candidates = nodes.filter((n) => n.kind === nodeKind);
        if (!candidates.length) return { ...bot, status: 'Waiting' };
        const targetNode = candidates.reduce((b, n) => (dist(bot.x, bot.y, n.x, n.y) < dist(bot.x, bot.y, b.x, b.y) ? n : b), candidates[0]);
        const speed = 2.1 * workerSpeedMult * architectAuraMult;
        const carryCap = workerCarry + (bot.tier === 'builder' ? 1 : 0);
        if (bot.target === 'node') {
          const d = dist(bot.x, bot.y, targetNode.x, targetNode.y);
          if (d > 8) return { ...bot, x: bot.x + ((targetNode.x - bot.x) / d) * speed, y: bot.y + ((targetNode.y - bot.y) / d) * speed, status: 'Mining' };
          const gp = bot.gatherProgress + 0.06 * workerWorkMult * (bot.tier === 'craftsman' ? 1.15 : 1);
          if (gp < 1) return { ...bot, gatherProgress: gp, status: 'Mining' };
          return { ...bot, gatherProgress: 0, carrying: carriedResource, carryingQty: carryCap, target: 'site', status: 'Carrying' };
        }
        const dSite = dist(bot.x, bot.y, buildSite.x, buildSite.y);
        if (dSite > 16) return { ...bot, x: bot.x + ((buildSite.x - bot.x) / dSite) * speed, y: bot.y + ((buildSite.y - bot.y) / dSite) * speed, status: 'Carrying' };
        if (bot.carrying && stageNeeds.includes(bot.carrying)) {
          const qty = Math.max(1, bot.carryingQty);
          const updatedDeposits = { ...stageDepositedRef.current, [bot.carrying as ResourceType]: (stageDepositedRef.current[bot.carrying as ResourceType] || 0) + qty };
          stageDepositedRef.current = updatedDeposits;
          setStageDeposited(updatedDeposits);
          applyStageProgressFromDeposits(updatedDeposits);
          return { ...bot, carrying: null, carryingQty: 0, target: 'node', status: 'Depositing' };
        }
        return { ...bot, carrying: null, carryingQty: 0, target: 'node', status: 'Waiting' };
      }));
    }, 140);
    return () => clearInterval(id);
  }, [nodes, builderHired, craftsmanHired, architectHired, workerSpeedMult, workerWorkMult, workerCarry, architectAuraMult, stageNeeds, buildSite.x, buildSite.y]);

  const sellResource = (res: ResourceType) => {
    setInventory((old) => {
      const amount = old[res];
      if (!amount) return old;
      const gained = amount * SELL_PRICES[res];
      setGold((g) => g + gained);
      addFloatText(player.x, player.y - 40, `+${gained} Gold`, '#ffe28c');
      setMessage(`Sold ${amount} ${resourceLabel[res]}`);
      return { ...old, [res]: 0 };
    });
  };
  const sellAllSurplus = () => {
    setInventory((old) => {
      const next = { ...old };
      let gained = 0;
      for (const r of ['stone', 'timber', 'clay', 'mosaic'] as ResourceType[]) {
        const qty = Math.max(0, next[r]);
        next[r] -= qty;
        gained += qty * SELL_PRICES[r];
      }
      if (gained > 0) { setGold((g) => g + gained); addFloatText(player.x, player.y - 40, `+${gained} Gold`, '#ffe28c'); setMessage('Sold all surplus.'); }
      return next;
    });
  };

  const buyUpgrade = (key: UpgradeKey) => {
    setUpgradeLevels((prev) => {
      const lvl = prev[key];
      if (lvl >= 4) return prev;
      const cost = upgradeCosts[lvl];
      if (gold < cost) return prev;
      setGold((g) => g - cost);
      addFloatText(player.x, player.y - 40, 'Upgrade Purchased', '#9ff8d6');
      setMessage(`${key} upgraded.`);
      return { ...prev, [key]: lvl + 1 };
    });
  };

  const handleRestart = () => {
    setPlayer({ x: 560, y: 900 });
    setInventory({ stone: 0, timber: 0, clay: 0, mosaic: 0 });
    setGold(40);
    setProgress(0);
    setBuilderHired(false);
    setCraftsmanHired(false);
    setArchitectHired(false);
    setBots([]);
    setMessage('Gather stone with pickaxe (Hold E).');
    setLevelFinished(false);
    setShowSell(false);
    setShowUpgrade(false);
    setActionProgress(0);
    setActiveAction(null);
    setBuildParticles([]);
    setBuildPulse(false);
    setStageBanner('');
    setFocusOnRegistan(false);
    setMovementLocked(false);
    const resetDeposits = { stone: 0, timber: 0, clay: 0, mosaic: 0 };
    setStageDeposited(resetDeposits);
    stageDepositedRef.current = resetDeposits;
    visualStageRef.current = 0;
  };

  const invTotal = inventory.stone + inventory.timber + inventory.clay + inventory.mosaic;
  const upgradeMeta: Record<UpgradeKey, { label: string; curr: string; next: string }> = {
    inventory: { label: 'Inventory Capacity', curr: `${capByLevel[upgradeLevels.inventory - 1]}`, next: `${capByLevel[Math.min(3, upgradeLevels.inventory)]}` },
    playerSpeed: { label: 'Player Speed', curr: `${Math.round((playerSpeedByLevel[upgradeLevels.playerSpeed - 1] - 1) * 100)}%`, next: `${Math.round((playerSpeedByLevel[Math.min(3, upgradeLevels.playerSpeed)] - 1) * 100)}%` },
    gatherSpeed: { label: 'Gather Speed', curr: `${Math.round((gatherSpeedByLevel[upgradeLevels.gatherSpeed - 1] - 1) * 100)}%`, next: `${Math.round((gatherSpeedByLevel[Math.min(3, upgradeLevels.gatherSpeed)] - 1) * 100)}%` },
    workerCarry: { label: 'Worker Carry', curr: `${workerCarryByLevel[upgradeLevels.workerCarry - 1]}`, next: `${workerCarryByLevel[Math.min(3, upgradeLevels.workerCarry)]}` },
    workerSpeed: { label: 'Worker Speed', curr: `${Math.round((workerSpeedByLevel[upgradeLevels.workerSpeed - 1] - 1) * 100)}%`, next: `${Math.round((workerSpeedByLevel[Math.min(3, upgradeLevels.workerSpeed)] - 1) * 100)}%` },
    workerWork: { label: 'Worker Work', curr: `${Math.round((workerWorkByLevel[upgradeLevels.workerWork - 1] - 1) * 100)}%`, next: `${Math.round((workerWorkByLevel[Math.min(3, upgradeLevels.workerWork)] - 1) * 100)}%` },
  };

  return (
    <div className="game-container relative overflow-hidden text-white" style={{ background: 'radial-gradient(circle at 30% 10%, #4a3424 0%, #2a1c14 45%, #18110d 100%)' }}>
      <div className="absolute inset-0 pointer-events-none opacity-35" style={{ background: 'linear-gradient(120deg, rgba(255,220,150,0.06), transparent 35%, rgba(0,0,0,0.25) 100%)' }} />
      <div className="relative z-20 p-4 flex items-center justify-between">
        <button onClick={onExit} className="terraria-btn px-4 py-2 text-sm">Back</button>
        <div className="glass-panel px-4 py-2 rounded-lg text-sm">Progress {progress.toFixed(1)}% | Stage {stageIndex + 1}/4 | Need {stageNeeds.map((r) => resourceLabel[r]).join(' + ')}</div>
        <div className="flex items-center gap-2">
          <button className="terraria-btn px-3 py-2 text-xs" onClick={() => setPlayer({ x: 560, y: 900 })}>Center Hub</button>
          <button className="terraria-btn px-3 py-2 text-xs" onClick={handleRestart}>Restart</button>
          <div className="glass-panel px-4 py-2 rounded-lg text-sm">Gold {gold}</div>
        </div>
      </div>
      <div className="absolute left-4 top-20 z-30 glass-panel rounded-xl px-3 py-2 flex items-center gap-3">
        {(['stone', 'timber', 'clay', 'mosaic'] as ResourceType[]).map((r) => (
          <div key={r} className="flex items-center gap-1.5 min-w-[50px]">
            <ResourceIcon type={r} size={r === 'stone' ? 20 : 16} />
            <span className="text-xs font-bold text-white">{inventory[r]}</span>
          </div>
        ))}
      </div>

      <div className="relative z-20 -mt-1 mb-2 h-8 flex items-center justify-center pointer-events-none">
        <span
          className="glass-panel rounded px-3 py-1 text-xs transition-opacity duration-200"
          style={{ opacity: actionPrompt ? 1 : 0 }}
        >
          {actionPrompt || '\u00A0'}
        </span>
      </div>

      <div className="relative z-10 mx-auto overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]" style={{ width: VIEW_W, height: VIEW_H, maxWidth: '96vw', maxHeight: '82vh', border: '3px solid #3f2b1d', borderRadius: 14, background: '#6ea85a' }}>
        <div className="absolute" style={{ width: WORLD_W, height: WORLD_H, transform: `translate(${-cameraX}px, ${-cameraY}px)` }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #97ce76 0%, #8ac267 58%, #7eb95e 100%)' }} />
          <div
            className="absolute inset-0 opacity-26"
            style={{
              backgroundImage:
                'radial-gradient(circle at 16% 24%, rgba(122,178,92,0.34) 0 11%, transparent 30%), radial-gradient(circle at 78% 22%, rgba(106,163,79,0.30) 0 10%, transparent 31%), radial-gradient(circle at 28% 72%, rgba(116,171,86,0.32) 0 12%, transparent 33%), radial-gradient(circle at 86% 68%, rgba(102,154,75,0.28) 0 10%, transparent 31%), radial-gradient(circle at 52% 48%, rgba(136,192,104,0.24) 0 11%, transparent 32%)',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div
            className="absolute inset-0 opacity-18"
            style={{
              backgroundImage:
                'radial-gradient(circle at 12% 18%, rgba(72,135,54,0.22) 0 1.2px, transparent 2.4px), radial-gradient(circle at 24% 31%, rgba(66,124,50,0.2) 0 1.1px, transparent 2.2px), radial-gradient(circle at 37% 22%, rgba(95,160,71,0.2) 0 1.3px, transparent 2.6px), radial-gradient(circle at 52% 34%, rgba(56,110,42,0.18) 0 1.2px, transparent 2.3px), radial-gradient(circle at 66% 27%, rgba(106,170,79,0.18) 0 1.2px, transparent 2.4px), radial-gradient(circle at 81% 36%, rgba(68,128,50,0.2) 0 1.1px, transparent 2.2px), radial-gradient(circle at 18% 62%, rgba(74,138,56,0.19) 0 1.2px, transparent 2.3px), radial-gradient(circle at 36% 72%, rgba(62,118,48,0.18) 0 1.2px, transparent 2.4px), radial-gradient(circle at 54% 66%, rgba(90,152,69,0.2) 0 1.3px, transparent 2.5px), radial-gradient(circle at 74% 74%, rgba(64,122,48,0.19) 0 1.2px, transparent 2.4px), radial-gradient(circle at 88% 62%, rgba(80,146,60,0.18) 0 1.1px, transparent 2.2px)',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div
            className="absolute inset-0 opacity-18"
            style={{
              backgroundImage:
                'radial-gradient(ellipse at 22% 72%, rgba(138,117,74,0.15) 0 12%, transparent 30%), radial-gradient(ellipse at 40% 76%, rgba(145,123,79,0.16) 0 11%, transparent 30%), radial-gradient(ellipse at 58% 75%, rgba(136,114,72,0.14) 0 12%, transparent 31%), radial-gradient(ellipse at 73% 70%, rgba(146,124,82,0.15) 0 10%, transparent 29%)',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div
            className="absolute inset-0 opacity-16"
            style={{
              backgroundImage:
                'radial-gradient(circle at 22% 30%, rgba(184,222,128,0.45) 0 1.2px, transparent 2.8px), radial-gradient(circle at 68% 40%, rgba(170,214,115,0.4) 0 1px, transparent 2.6px), radial-gradient(circle at 42% 62%, rgba(160,205,108,0.38) 0 0.9px, transparent 2.4px), radial-gradient(circle at 82% 58%, rgba(153,199,102,0.36) 0 0.9px, transparent 2.3px), radial-gradient(circle at 12% 54%, rgba(148,192,98,0.34) 0 0.9px, transparent 2.4px), radial-gradient(circle at 34% 42%, rgba(188,226,132,0.38) 0 0.9px, transparent 2.3px), radial-gradient(circle at 57% 24%, rgba(176,218,122,0.34) 0 0.8px, transparent 2.1px), radial-gradient(circle at 76% 78%, rgba(164,210,112,0.36) 0 0.9px, transparent 2.2px)',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, transparent 52%, rgba(28,63,25,0.14) 100%), radial-gradient(circle at 50% 8%, rgba(255,230,168,0.10) 0, transparent 42%)',
            }}
          />
          <div
            className={`absolute ${inventory[stageNeeds[stageNeeds.length - 1]] > 0 ? 'registan-glow' : ''}`}
            style={{
              left: buildSite.x - buildSite.r,
              top: buildSite.y - buildSite.r,
              transform: buildPulse ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 220ms ease',
            }}
          ><BuildSiteRing size={buildSite.r * 2} active={inventory[stageNeeds[stageNeeds.length - 1]] > 0} /></div>
          <div className="absolute" style={{ left: buildSite.x - 80, top: buildSite.y - 64, transform: buildPulse ? 'scale(1.03)' : 'scale(1)', transition: 'transform 240ms ease' }}><RegistanStage stage={visualStage} /></div>
          <div
            className="absolute text-center"
            style={{ left: buildSite.x - 140, top: buildSite.y + 74, width: 280, pointerEvents: 'none' }}
          >
            <div className="text-[26px] font-extrabold leading-none text-[#f6f2df]" style={{ textShadow: '0 2px 6px rgba(0,0,0,0.45)' }}>
              {stageRemainingInt}
            </div>
            <div className="mt-1 flex items-center justify-center gap-3 text-sm font-bold text-[#f0f4ff]" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {stageNeeds.map((r) => {
                const delivered = Math.min(perResourceTarget, stageDeposited[r]);
                const remaining = Math.max(0, perResourceTarget - delivered);
                return (
                  <span key={r} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/25">
                    <ResourceIcon type={r} size={14} />
                    <span>{remaining}</span>
                  </span>
                );
              })}
            </div>
          </div>
          {stageSparkle && <SparkleBurst />}
          {buildParticles.map((p) => (
            <span
              key={p.id}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: p.x,
                top: p.y,
                width: 4,
                height: 4,
                background: 'rgba(230,206,145,0.9)',
                opacity: p.life,
              }}
            />
          ))}

          {nodes.map((n) => (
            <div key={n.id} className="absolute" style={{ left: n.x - n.radius, top: n.y - n.radius }}>
              <NodeSprite kind={n.kind} size={n.radius * 2} locked={(n.kind === 'timber' && progress < 25) || (n.kind === 'clay' && progress < 50)} />
              {nearGatherNode?.id === n.id && activeAction && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/30 rounded"><div className="h-full bg-[#4dd0e1] rounded" style={{ width: `${Math.round(actionProgress * 100)}%` }} /></div>
              )}
            </div>
          ))}

          <div className="absolute" style={{ left: market.x, top: market.y }}><StationSprite kind="market" width={market.w} height={market.h} /></div>
          <div className="absolute text-xs font-bold" style={{ left: market.x + 28, top: market.y + 24 }}>Market</div>
          <div className="absolute" style={{ left: hireBoard.x, top: hireBoard.y }}><StationSprite kind="hiring" width={hireBoard.w} height={hireBoard.h} /></div>
          <div className="absolute text-xs font-bold" style={{ left: hireBoard.x + 14, top: hireBoard.y + 24 }}>Hiring</div>
          <div className="absolute" style={{ left: upgradeStall.x, top: upgradeStall.y }}><StationSprite kind="market" width={upgradeStall.w} height={upgradeStall.h} /></div>
          <div className="absolute text-xs font-bold" style={{ left: upgradeStall.x + 8, top: upgradeStall.y + 24 }}>Upgrades</div>
          {progress >= 75 && (
            <>
              <div className="absolute" style={{ left: kiln.x, top: kiln.y }}><StationSprite kind="kiln" width={kiln.w} height={kiln.h} /></div>
              <div className="absolute text-xs font-bold" style={{ left: kiln.x + 38, top: kiln.y + 24 }}>Kiln</div>
              {nearKiln && activeAction === 'craft' && <div className="absolute" style={{ left: kiln.x + 24, top: kiln.y - 12, width: 80, height: 8 }}><div className="w-full h-full bg-black/30 rounded"><div className="h-full bg-orange-400 rounded" style={{ width: `${Math.round(actionProgress * 100)}%` }} /></div></div>}
            </>
          )}

          <div className="absolute" style={{ left: player.x - 15, top: player.y - 18 }}><WorkerSprite kind="player" size={30} carrying={activeAction === 'mine' ? 'stone' : activeAction === 'chop' ? 'timber' : activeAction === 'dig' ? 'clay' : null} /></div>
          {(nearGatherNode || activeAction) && (
            <div className="absolute text-sm" style={{ left: player.x + 10, top: player.y - 34, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.45))' }}>
              {activeAction === 'mine' || nearGatherNode?.kind === 'stone'
                ? '⛏️'
                : activeAction === 'chop' || nearGatherNode?.kind === 'timber'
                  ? '🪓'
                  : '🪠'}
            </div>
          )}
          {bots.map((bot) => (
            <div key={bot.id} className="absolute" style={{ left: bot.x - 10, top: bot.y - 12 }}>
              <WorkerSprite kind={bot.tier === 'builder' ? 'builder' : bot.tier === 'craftsman' ? 'craftsman' : 'architect'} size={20} carrying={bot.carrying} />
              {dist(player.x, player.y, bot.x, bot.y) < 130 && <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] bg-black/40 px-1 rounded whitespace-nowrap">{bot.tier}: {bot.status}</div>}
            </div>
          ))}
          {floatTexts.map((f) => <div key={f.id} className="absolute text-xs font-bold" style={{ left: f.x - 20, top: f.y, color: f.color, opacity: f.life }}>{f.text}</div>)}
        </div>
      </div>

      <div className="relative z-20 mt-2 mx-auto max-w-6xl px-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="glass-panel rounded px-3 py-2">Inventory {invTotal}/{inventoryCap}<br />Stone {inventory.stone} | Timber {inventory.timber} | Clay {inventory.clay} | Mosaic {inventory.mosaic}</div>
        <div className="glass-panel rounded px-3 py-2">Hire Costs<br />Builder {HIRE_COSTS.builder} | Craftsman {HIRE_COSTS.craftsman} | Architect {HIRE_COSTS.architect}</div>
        <div className="glass-panel rounded px-3 py-2">Workers<br />Builder {builderHired ? 'Yes' : 'No'} | Craftsman {craftsmanHired ? 'Yes' : 'No'} | Architect {architectHired ? 'Yes' : 'No'}</div>
        <div className="glass-panel rounded px-3 py-2">Tools<br />Stone=Pickaxe | Timber=Axe | Clay=Shovel | Kiln=Craft</div>
      </div>

      <div className="relative z-20 mt-2 h-12 flex flex-col items-center justify-start pointer-events-none">
        <div className="h-6 text-center text-sm font-semibold text-[#1f2432] leading-6 transition-opacity duration-200" style={{ opacity: message ? 1 : 0 }}>
          {message || '\u00A0'}
        </div>
        <div className="h-5 text-center text-xs text-[#2e2e2e] leading-5">Stage load {Math.floor(stageDeliveredTotal)} / {stageTarget}</div>
      </div>

      <div className="absolute inset-x-0 top-20 z-40 flex justify-center pointer-events-none">
        <div className="glass-panel rounded-lg px-4 py-2 text-sm font-bold transition-opacity duration-200" style={{ opacity: stageBanner ? 1 : 0 }}>
          {stageBanner || '\u00A0'}
        </div>
      </div>

      {showSell && (
        <div className="absolute inset-0 z-40 bg-black/45 flex items-center justify-center">
          <div className="glass-panel rounded-xl p-4 w-[440px] max-w-[92vw]">
            <h3 className="title-font text-xl uzbek-text-gold mb-3">Market Sell Menu</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {(['stone', 'timber', 'clay', 'mosaic'] as ResourceType[]).map((r) => (
                <button key={r} onClick={() => sellResource(r)} className="uzbek-button text-sm">Sell {resourceLabel[r]} ({SELL_PRICES[r]}g)</button>
              ))}
            </div>
            <button onClick={sellAllSurplus} className="uzbek-button-gold w-full mt-3">Sell All Surplus</button>
            <button onClick={() => setShowSell(false)} className="uzbek-button w-full mt-2">Close</button>
          </div>
        </div>
      )}

      {showUpgrade && (
        <div className="absolute inset-0 z-40 bg-black/45 flex items-center justify-center">
          <div className="glass-panel rounded-xl p-4 w-[620px] max-w-[95vw]">
            <h3 className="title-font text-xl uzbek-text-gold mb-3">Upgrade Stall</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(Object.keys(upgradeMeta) as UpgradeKey[]).map((k) => {
                const lvl = upgradeLevels[k];
                const maxed = lvl >= 4;
                const cost = maxed ? 0 : upgradeCosts[lvl];
                const canBuy = !maxed && gold >= cost;
                return (
                  <div key={k} className="glass-panel-light rounded p-2 text-xs">
                    <p className="font-bold text-white">{upgradeMeta[k].label} Lv.{lvl}</p>
                    <p className="text-white/80">Current: {upgradeMeta[k].curr} | Next: {upgradeMeta[k].next}</p>
                    <button disabled={!canBuy} onClick={() => buyUpgrade(k)} className={`mt-1 px-2 py-1 rounded ${canBuy ? 'bg-[#d4a017] text-black font-bold' : 'bg-gray-600 text-gray-300'}`}>
                      {maxed ? 'Max' : `Upgrade (${cost}g)`}
                    </button>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowUpgrade(false)} className="uzbek-button w-full mt-3">Close</button>
          </div>
        </div>
      )}

      {levelFinished && onComplete && (
        <div className="relative z-20 mt-3 text-center">
          <button
            className="uzbek-button-gold"
            onClick={() => {
              const score = Math.round(1200 + gold * 5 + progress * 6 + (builderHired ? 250 : 0) + (craftsmanHired ? 300 : 0) + (architectHired ? 350 : 0));
              const stars = score >= 3200 ? 3 : score >= 2200 ? 2 : 1;
              onComplete(score, stars);
            }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}


