import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Axe,
  Backpack,
  Coins,
  Flame,
  Gauge,
  Gem,
  Hammer,
  Pickaxe,
  RotateCcw,
  ShoppingBag,
  Shovel,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { getSharedGold, setSharedGold } from '../game/sharedWallet';

type InventoryResource = 'stone' | 'timber' | 'clay' | 'mosaic';
type ResourceType = InventoryResource | 'gold';
type WorkerRole = 'builder' | 'craftsman' | 'architect';
type StationId = 'market' | 'guild' | 'workshop' | 'kiln' | 'atelier';
type ToolId = 'pickaxe' | 'axe' | 'shovel' | 'kilnTools';
type UpgradeKey = 'movement' | 'inventory' | 'gathering' | 'workers' | 'crafting' | 'market';
type EffectKind = 'stone' | 'timber' | 'clay' | 'mosaic' | 'gold' | 'magic' | 'dust';
type SfxKind = 'stone' | 'timber' | 'clay' | 'mosaic' | 'gold' | 'build' | 'unlock' | 'deny' | 'ambient';

interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'up' | 'down' | 'left' | 'right';
  moving: boolean;
}

interface ResourceNode {
  id: string;
  resource: InventoryResource;
  tool: ToolId;
  label: string;
  x: number;
  y: number;
  radius: number;
  unlockStage: number;
}

interface Station {
  id: StationId;
  label: string;
  x: number;
  y: number;
  radius: number;
}

interface Worker {
  id: string;
  role: WorkerRole;
  x: number;
  y: number;
  phase: 'seeking' | 'working' | 'carrying' | 'supervising';
  carrying: InventoryResource | null;
  timer: number;
  seed: number;
}

interface Particle {
  id: string;
  kind: EffectKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface Floater {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface ActionState {
  label: string;
  tool: ToolId;
  resource: InventoryResource;
  progress: number;
  x: number;
  y: number;
}

interface StagePlan {
  title: string;
  mood: string;
  needs: Partial<Record<InventoryResource, number>>;
  requiredWorker?: WorkerRole;
  unlock: string;
}

interface UpgradeDefinition {
  label: string;
  detail: string;
  icon: LucideIcon;
  values: number[];
  costs: number[];
}

interface WorldProp {
  id: string;
  type: 'tree' | 'bush' | 'banner' | 'cart' | 'lantern' | 'pottery' | 'carpet' | 'rubble' | 'scaffold' | 'ruin' | 'smoke' | 'tiles';
  x: number;
  y: number;
  scale?: number;
  rotate?: number;
  unlockStage?: number;
}

interface PathShape {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
  opacity?: number;
}

interface GameWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
  render_game_to_text?: () => string;
  advanceTime?: (ms: number) => void;
}

const WORLD_W = 1900;
const WORLD_H = 1360;
const CAMERA_MIN_ZOOM = 1.14;
const CAMERA_MAX_ZOOM = 1.36;
const CAMERA_IDLE_ZOOM = 1.2;
const CAMERA_MOVE_ZOOM = 1.16;
const CAMERA_FOCUS_ZOOM = 1.32;
const START_PLAYER: PlayerState = { x: 965, y: 995, vx: 0, vy: 0, facing: 'up', moving: false };
const RESOURCE_ORDER: InventoryResource[] = ['stone', 'timber', 'clay', 'mosaic'];
const EMPTY_INVENTORY: Record<InventoryResource, number> = { stone: 0, timber: 0, clay: 0, mosaic: 0 };
const EMPTY_UPGRADES: Record<UpgradeKey, number> = { movement: 1, inventory: 1, gathering: 1, workers: 1, crafting: 1, market: 1 };
const HIRE_COSTS: Record<WorkerRole, number> = { builder: 60, craftsman: 130, architect: 230 };
const SELL_PRICES: Record<InventoryResource, number> = { stone: 5, timber: 8, clay: 10, mosaic: 24 };
const BUILD_SITE = { x: 950, y: 565, radius: 126 };
const CARPET_SITE = { x: 1150, y: 720, radius: 80 };
const TOOL_LABEL: Record<ToolId, string> = {
  pickaxe: 'Pickaxe',
  axe: 'Axe',
  shovel: 'Shovel',
  kilnTools: 'Kiln Tools',
};

const RESOURCE_META: Record<ResourceType, { label: string; short: string; color: string; dark: string; glow: string }> = {
  stone: { label: 'Stone', short: 'ST', color: '#8f9a9b', dark: '#525d60', glow: 'rgba(178, 201, 199, 0.38)' },
  timber: { label: 'Timber', short: 'TM', color: '#9b6339', dark: '#5b3522', glow: 'rgba(207, 143, 77, 0.36)' },
  clay: { label: 'Clay', short: 'CL', color: '#be6948', dark: '#733425', glow: 'rgba(225, 126, 86, 0.36)' },
  mosaic: { label: 'Mosaic', short: 'MO', color: '#2dbfc7', dark: '#174f9b', glow: 'rgba(59, 220, 227, 0.42)' },
  gold: { label: 'Gold', short: 'GD', color: '#d8aa3f', dark: '#8c611b', glow: 'rgba(255, 211, 104, 0.42)' },
};

const STAGE_PLANS: StagePlan[] = [
  {
    title: 'Cleared Foundations',
    mood: 'The old stones remember their shape.',
    needs: { stone: 20 },
    unlock: 'Timber groves and the builders guild awaken.',
  },
  {
    title: 'Courtyard Frame',
    mood: 'Scaffolds rise around the first arches.',
    needs: { stone: 12, timber: 18 },
    requiredWorker: 'builder',
    unlock: 'Clay pits and the craftsmen workshop open.',
  },
  {
    title: 'Madrasa Walls',
    mood: 'Warm brick and carved wood return to the square.',
    needs: { timber: 12, clay: 20 },
    requiredWorker: 'craftsman',
    unlock: 'The tile atelier and kiln begin to glow.',
  },
  {
    title: 'Azure Portal',
    mood: 'Blue tilework gathers the light of Samarkand.',
    needs: { clay: 12, mosaic: 16 },
    requiredWorker: 'architect',
    unlock: 'The Registan is restored.',
  },
];

const UPGRADE_DEFS: Record<UpgradeKey, UpgradeDefinition> = {
  movement: {
    label: 'Traveler Pace',
    detail: 'Smoother sprint and stronger camera lead.',
    icon: Gauge,
    values: [1, 1.12, 1.25, 1.38],
    costs: [0, 50, 105, 170],
  },
  inventory: {
    label: 'Caravan Pack',
    detail: 'Carry more material before returning.',
    icon: Backpack,
    values: [18, 28, 42, 60],
    costs: [0, 45, 95, 150],
  },
  gathering: {
    label: 'Sharpened Tools',
    detail: 'Quicker hits, chops, digs, and tile work.',
    icon: Pickaxe,
    values: [1, 1.2, 1.42, 1.68],
    costs: [0, 60, 125, 195],
  },
  workers: {
    label: 'Guild Rhythm',
    detail: 'Workers move and deliver with better timing.',
    icon: Users,
    values: [1, 1.18, 1.38, 1.62],
    costs: [0, 75, 150, 235],
  },
  crafting: {
    label: 'Kiln Mastery',
    detail: 'Mosaic rewards and kiln output improve.',
    icon: Flame,
    values: [1, 1.15, 1.35, 1.6],
    costs: [0, 70, 140, 220],
  },
  market: {
    label: 'Bazaar Favor',
    detail: 'Merchants pay more for every resource.',
    icon: ShoppingBag,
    values: [1, 1.16, 1.34, 1.55],
    costs: [0, 90, 170, 260],
  },
};

const RESOURCE_NODES: ResourceNode[] = [
  { id: 'west-stone', resource: 'stone', tool: 'pickaxe', label: 'Foundation Blocks', x: 665, y: 760, radius: 58, unlockStage: 0 },
  { id: 'north-stone', resource: 'stone', tool: 'pickaxe', label: 'Fallen Arch', x: 680, y: 370, radius: 58, unlockStage: 0 },
  { id: 'mulberry-grove', resource: 'timber', tool: 'axe', label: 'Mulberry Grove', x: 1260, y: 480, radius: 62, unlockStage: 1 },
  { id: 'cedar-stack', resource: 'timber', tool: 'axe', label: 'Cedar Stack', x: 1355, y: 760, radius: 62, unlockStage: 1 },
  { id: 'river-clay', resource: 'clay', tool: 'shovel', label: 'River Clay', x: 1150, y: 1045, radius: 58, unlockStage: 2 },
  { id: 'brick-pit', resource: 'clay', tool: 'shovel', label: 'Brick Pit', x: 795, y: 1040, radius: 58, unlockStage: 2 },
  { id: 'tile-shards', resource: 'mosaic', tool: 'kilnTools', label: 'Tile Shards', x: 260, y: 290, radius: 54, unlockStage: 3 },
  { id: 'azure-cache', resource: 'mosaic', tool: 'kilnTools', label: 'Azure Cache', x: 1640, y: 290, radius: 54, unlockStage: 3 },
];

const STATIONS: Station[] = [
  { id: 'market', label: 'Silk Road Bazaar', x: 760, y: 960, radius: 92 },
  { id: 'guild', label: 'Builders Guild', x: 950, y: 1015, radius: 92 },
  { id: 'workshop', label: 'Forge Workshop', x: 1140, y: 960, radius: 92 },
  { id: 'kiln', label: 'Tile Kiln', x: 1290, y: 855, radius: 82 },
  { id: 'atelier', label: 'Mosaic Atelier', x: 660, y: 880, radius: 82 },
];

const PATHS: PathShape[] = [];

const WORLD_PROPS: WorldProp[] = [];

const toolIcon: Record<ToolId, LucideIcon> = {
  pickaxe: Pickaxe,
  axe: Axe,
  shovel: Shovel,
  kilnTools: Gem,
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distance(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

function sumInventory(inv: Record<InventoryResource, number>) {
  return RESOURCE_ORDER.reduce((total, resource) => total + inv[resource], 0);
}

function makeEmptyInventory() {
  return { ...EMPTY_INVENTORY };
}

function makeEmptyUpgrades() {
  return { ...EMPTY_UPGRADES };
}

function stageNeedEntries(stageIndex: number) {
  const plan = STAGE_PLANS[stageIndex];
  if (!plan) return [] as Array<[InventoryResource, number]>;
  return RESOURCE_ORDER.flatMap((resource) => {
    const amount = plan.needs[resource] || 0;
    return amount > 0 ? ([[resource, amount]] as Array<[InventoryResource, number]>) : [];
  });
}

function stageProgress(stock: Record<InventoryResource, number>, stageIndex: number) {
  const entries = stageNeedEntries(stageIndex);
  if (!entries.length) return 1;
  const required = entries.reduce((sum, [, amount]) => sum + amount, 0);
  const delivered = entries.reduce((sum, [resource, amount]) => sum + Math.min(amount, stock[resource] || 0), 0);
  return clamp(delivered / required, 0, 1);
}

function stageFulfilled(stock: Record<InventoryResource, number>, stageIndex: number) {
  return stageNeedEntries(stageIndex).every(([resource, amount]) => (stock[resource] || 0) >= amount);
}

function totalProgress(stageIndex: number, stock: Record<InventoryResource, number>) {
  if (stageIndex >= STAGE_PLANS.length) return 100;
  return Math.round((stageIndex * 25 + stageProgress(stock, stageIndex) * 25) * 10) / 10;
}

function getInventoryCap(upgrades: Record<UpgradeKey, number>) {
  return UPGRADE_DEFS.inventory.values[upgrades.inventory - 1] || UPGRADE_DEFS.inventory.values[0];
}

function getMarketMultiplier(upgrades: Record<UpgradeKey, number>) {
  return UPGRADE_DEFS.market.values[upgrades.market - 1] || 1;
}

function canUseStation(station: StationId, stageIndex: number) {
  if (station === 'kiln' || station === 'atelier') return stageIndex >= 2;
  return true;
}

function screenSafeViewport() {
  if (typeof window === 'undefined') return { w: 1280, h: 720 };
  return { w: window.innerWidth, h: window.innerHeight };
}

const REGISTAN_SAVE_KEY = 'terrakand_registan';

interface RegistanSaveData {
  stageIndex: number;
  stageStock: Record<InventoryResource, number>;
  inventory: Record<InventoryResource, number>;
  upgrades: Record<UpgradeKey, number>;
  hired: Record<WorkerRole, boolean>;
  workers: Worker[];
  atelierLevel: number;
  levelFinished: boolean;
  message: string;
}

function loadRegistanSave(): RegistanSaveData | null {
  try {
    const raw = localStorage.getItem(REGISTAN_SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RegistanSaveData;
    // Basic validation
    if (typeof parsed.stageIndex !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveRegistanSave(data: RegistanSaveData) {
  try {
    localStorage.setItem(REGISTAN_SAVE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

function ResourceGlyph({ type, size = 28 }: { type: ResourceType; size?: number }) {
  const meta = RESOURCE_META[type];
  const stroke = meta.dark;
  if (type === 'stone') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <path d="M4 18 10 7l12-2 7 10-4 11H9z" fill={meta.color} stroke={stroke} strokeWidth="1.7" />
        <path d="m10 7 6 8 10-4M9 26l7-11" fill="none" stroke="#c6d4d1" strokeWidth="1.2" opacity="0.75" />
      </svg>
    );
  }
  if (type === 'timber') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect x="5" y="10" width="21" height="7" rx="3.5" fill={meta.dark} />
        <rect x="7" y="15" width="21" height="7" rx="3.5" fill={meta.color} />
        <circle cx="25" cy="18.5" r="3.1" fill="#d2a06e" stroke="#6b3d24" strokeWidth="1" />
        <path d="M11 14h9M13 19h8" stroke="#d8a66f" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'clay') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <ellipse cx="16" cy="19" rx="12" ry="8" fill={meta.color} stroke={stroke} strokeWidth="1.6" />
        <path d="M7 17c5-3 13-3 18 0M11 21c3-1.5 8-1.5 11 0" stroke="#e69b75" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'mosaic') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
        <rect x="4" y="4" width="24" height="24" rx="5" fill={meta.dark} stroke="#d9c27b" strokeWidth="1.3" />
        <path d="M9 9h6v6H9z" fill="#39d8dd" />
        <path d="M17 9h6v6h-6z" fill="#e4bf54" />
        <path d="M9 17h6v6H9z" fill="#efe8d8" />
        <path d="M17 17h6v6h-6z" fill="#2d83c8" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill={meta.color} stroke={meta.dark} strokeWidth="1.8" />
      <circle cx="16" cy="16" r="5" fill="#ffe08a" opacity="0.9" />
      <path d="M10 12c3-3 9-3 12 0" stroke="#fff1a9" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function ToolGlyph({ tool, size = 18 }: { tool: ToolId; size?: number }) {
  const Icon = toolIcon[tool];
  return <Icon size={size} strokeWidth={2.2} />;
}

const PLAYER_WALK_FRAMES = [
  './assets/character_walk_1.png',
  './assets/character_walk_2.png',
  './assets/character_walk_3.png',
  './assets/character_walk_4.png',
];

function PlayerFigure({ moving, carrying, size = 48, facing = 'right' }: { moving: boolean; carrying: InventoryResource | null; size?: number; facing?: string }) {
  const src = moving ? PLAYER_WALK_FRAMES[Math.floor(Date.now() / 150) % 4] : './assets/character.png';
  const flip = facing === 'left' ? 'scaleX(-1)' : undefined;
  return (
    <div className="rr-figure" style={{ width: size, height: size }}>
      <img src={src} alt="player" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', transform: flip }} />
      {carrying && (
        <span className="rr-carrying">
          <ResourceGlyph type={carrying} size={17} />
        </span>
      )}
    </div>
  );
}

const WORKER_FRAMES: Record<string, { idle: string; walk: string[] }> = {
  builder:   { idle: './assets/worker.png',     walk: ['./assets/worker_walk_1.png', './assets/worker_walk_2.png'] },
  craftsman: { idle: './assets/craftsman.png',  walk: ['./assets/craftsman_walk_1.png', './assets/craftsman_walk_2.png', './assets/craftsman_walk_3.png'] },
  architect: { idle: './assets/architect.png',  walk: ['./assets/architect_walk_1.png', './assets/architect_walk_2.png', './assets/architect_walk_3.png'] },
};

function WorkerFigure({ role, carrying, size = 42, moving = false }: { role: WorkerRole | 'player'; carrying?: InventoryResource | null; size?: number; moving?: boolean }) {
  const frames = WORKER_FRAMES[role] ?? WORKER_FRAMES.builder;
  const src = moving
    ? frames.walk[Math.floor(Date.now() / 200) % frames.walk.length]
    : frames.idle;
  return (
    <div className={`rr-figure ${moving ? 'rr-figure-moving' : ''}`} style={{ width: size, height: size }}>
      <img src={src} alt={role} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      {carrying && (
        <span className="rr-carrying">
          <ResourceGlyph type={carrying} size={17} />
        </span>
      )}
    </div>
  );
}

const RESOURCE_NODE_IMAGES: Partial<Record<InventoryResource, string>> = {
  stone: './assets/stone_pile.png',
  timber: './assets/tree.png',
  clay: './assets/clay_pile.png',
  mosaic: './assets/mosaic_pile.png',
};

function ResourceNodeSprite({ node, locked, active }: { node: ResourceNode; locked: boolean; active: boolean }) {
  const meta = RESOURCE_META[node.resource];
  const size = node.radius * 2;
  const img = RESOURCE_NODE_IMAGES[node.resource];
  return (
    <div
      className={`rr-node rr-node-${node.resource} ${active ? 'rr-node-active' : ''} ${locked ? 'rr-node-locked' : ''}`}
      style={{ width: size, height: size, ['--node-glow' as string]: meta.glow }}
    >
      {img ? (
        <img src={img} alt={node.resource} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      ) : (
        <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
          <ellipse cx="60" cy="101" rx="38" ry="9" fill="rgba(31,31,20,0.24)" />
          <path d="M35 34 57 24l26 11 11 28-17 27H42L24 64z" fill="#17629e" stroke="#d7b65b" strokeWidth="4" />
          <path d="M39 40h18v18H39z" fill="#36cfd5" />
          <path d="M62 38h19v18H62z" fill="#e4bf54" />
          <path d="M37 63h20v20H37z" fill="#efe8d8" />
          <path d="M63 62h19v20H63z" fill="#2d83c8" />
          <path d="M60 26v64M25 63h69" stroke="#103f70" strokeWidth="2" opacity="0.42" />
        </svg>
      )}
      {active && (
        <span className="rr-node-tool">
          <ToolGlyph tool={node.tool} size={16} />
        </span>
      )}
    </div>
  );
}

const STATION_IMAGES: Partial<Record<StationId, string>> = {
  market: './assets/market.png',
  workshop: './assets/market.png',
  kiln: './assets/kiln.png',
  guild: './assets/place_to_hire.png',
  atelier: './assets/mosaic_atelier.png',
};

function StationSprite({ station, locked, highlighted }: { station: Station; locked: boolean; highlighted: boolean }) {
  const img = STATION_IMAGES[station.id];
  return (
    <div className={`rr-station rr-station-${station.id} ${locked ? 'rr-station-locked' : ''}`}>
      {img ? (
        <img src={img} alt={station.label} style={{ width: 150, height: 112, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
      ) : (
        <svg width="150" height="112" viewBox="0 0 150 112" aria-hidden="true">
          <ellipse cx="75" cy="102" rx="52" ry="8" fill="rgba(29,27,16,0.24)" />
          <rect x="28" y="45" width="94" height="46" rx="8" fill="#d7b98a" stroke="#5b3928" strokeWidth="3" />
          <path d="M20 47 75 19l55 28v11H20z" fill="#2f91a1" stroke="#5b3928" strokeWidth="3" />
          <rect x="48" y="60" width="54" height="29" rx="5" fill="#efe8d8" stroke="#987944" strokeWidth="2" />
          <path d="M55 66h14v14H55zM72 66h14v14H72zM89 66h7v14h-7z" fill="#2dbfc7" opacity="0.9" />
          <path d="M55 83h14v4H55zM72 83h14v4H72zM89 83h7v4h-7z" fill="#174f9b" opacity="0.9" />
        </svg>
      )}
      {highlighted && <span>{station.label}</span>}
    </div>
  );
}

function PropSprite({ prop }: { prop: WorldProp }) {
  const style: CSSProperties = {
    transform: `translate(-50%, -100%) scale(${prop.scale ?? 1}) rotate(${prop.rotate ?? 0}deg)`,
  };
  if (prop.type === 'tree') {
    return (
      <div className="rr-prop rr-tree" style={style}>
        <span />
        <i />
      </div>
    );
  }
  if (prop.type === 'bush') {
    return (
      <div className="rr-prop rr-bush" style={style}>
        <span />
        <i />
      </div>
    );
  }
  if (prop.type === 'banner') {
    return (
      <div className="rr-prop rr-banner" style={style}>
        <span />
        <i />
      </div>
    );
  }
  if (prop.type === 'cart') {
    return (
      <div className="rr-prop rr-cart" style={style}>
        <span />
        <i />
      </div>
    );
  }
  if (prop.type === 'lantern') {
    return (
      <div className="rr-prop rr-lantern" style={style}>
        <span />
      </div>
    );
  }
  if (prop.type === 'pottery') {
    return (
      <div className="rr-prop rr-pottery" style={style}>
        <span />
        <i />
      </div>
    );
  }
  if (prop.type === 'carpet') {
    return <div className="rr-prop rr-carpet" style={style} />;
  }
  if (prop.type === 'rubble') {
    return (
      <div className="rr-prop rr-rubble" style={style}>
        <span />
        <i />
        <b />
      </div>
    );
  }
  if (prop.type === 'scaffold') {
    return (
      <div className="rr-prop rr-scaffold" style={style}>
        <span />
      </div>
    );
  }
  if (prop.type === 'ruin') {
    return (
      <div className="rr-prop rr-ruin" style={style}>
        <span />
      </div>
    );
  }
  if (prop.type === 'smoke') {
    return (
      <div className="rr-prop rr-smoke" style={style}>
        <span />
        <i />
      </div>
    );
  }
  return (
    <div className="rr-prop rr-tiles" style={style}>
      <span />
      <i />
    </div>
  );
}

const REGISTAN_IMAGES = [
  './assets/image 1.png',
  './assets/image 2.png',
  './assets/image 3.png',
  './assets/image 4.png',
];

function RegistanMonument({ stage, pulse }: { stage: number; pulse: boolean }) {
  const src = REGISTAN_IMAGES[Math.min(stage, REGISTAN_IMAGES.length - 1)];
  return (
    <div className={`rr-registan-stage rr-registan-stage-${stage} ${pulse ? 'rr-registan-pulse' : ''}`}>
      <img src={src} alt={`Registan stage ${stage}`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      {stage >= 3 && <span className="rr-restoration-glow" />}
    </div>
  );
}

function MiniProgress({ value }: { value: number }) {
  return (
    <span className="rr-mini-progress">
      <i style={{ width: `${clamp(value, 0, 1) * 100}%` }} />
    </span>
  );
}

function ActionPrompt({ action, fallback }: { action: ActionState | null; fallback: string }) {
  return (
    <div className="rr-action-prompt" style={{ opacity: action || fallback ? 1 : 0 }}>
      {action ? (
        <>
          <ToolGlyph tool={action.tool} size={18} />
          <span>{action.label}</span>
          <MiniProgress value={action.progress} />
        </>
      ) : (
        <span>{fallback || '\u00A0'}</span>
      )}
    </div>
  );
}

function MosaicAtelierPanel({ level, onClose, onReward }: { level: number; onClose: () => void; onReward: (mosaic: number, gold: number) => void }) {
  const palette: InventoryResource[] = ['mosaic', 'stone', 'clay', 'timber'];
  const colors = ['mosaic', 'stone', 'clay', 'timber'] as const;
  const target = useMemo(() => {
    const patterns = [
      [0, 0, 1, 1, 0, 0, 2, 3, 3, 2, 1, 3, 0, 3, 1, 1, 3, 3, 3, 1, 0, 0, 2, 0, 0],
      [0, 1, 1, 1, 0, 2, 0, 3, 0, 2, 2, 3, 0, 3, 2, 2, 0, 3, 0, 2, 0, 1, 1, 1, 0],
      [1, 0, 2, 0, 1, 0, 3, 0, 3, 0, 2, 0, 0, 0, 2, 0, 3, 0, 3, 0, 1, 0, 2, 0, 1],
    ];
    return patterns[level % patterns.length];
  }, [level]);
  const [selected, setSelected] = useState(0);
  const [tiles, setTiles] = useState<Array<number | null>>(() => Array.from({ length: 25 }, () => null));
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    if (complete) return;
    const solved = tiles.every((value, index) => value === target[index]);
    if (!solved) return;
    setComplete(true);
    const rewardMosaic = 3 + Math.min(3, Math.floor(level / 2));
    const rewardGold = 18 + level * 4;
    const id = window.setTimeout(() => onReward(rewardMosaic, rewardGold), 550);
    return () => window.clearTimeout(id);
  }, [complete, level, onReward, target, tiles]);

  return (
    <div className="rr-modal-backdrop">
      <section className="rr-atelier-panel" aria-label="Mosaic atelier">
        <button className="rr-close-button" onClick={onClose} aria-label="Close mosaic atelier">
          <X size={19} />
        </button>
        <div className="rr-atelier-heading">
          <Gem size={24} />
          <div>
            <h2>Mosaic Atelier</h2>
            <p>Place ceramic shards into the Registan pattern.</p>
          </div>
        </div>
        <div className="rr-atelier-layout">
          <div className="rr-mosaic-board">
            {target.map((targetColor, index) => {
              const value = tiles[index];
              const valid = value === targetColor;
              return (
                <button
                  key={`tile-${index}`}
                  className={`rr-mosaic-cell ${value !== null ? 'rr-mosaic-cell-filled' : ''} ${valid ? 'rr-mosaic-cell-valid' : ''}`}
                  onClick={() => {
                    if (complete) return;
                    setTiles((old) => {
                      const next = [...old];
                      next[index] = selected;
                      return next;
                    });
                  }}
                  aria-label={`Mosaic cell ${index + 1}`}
                >
                  <span
                    className="rr-mosaic-guide"
                    style={{ background: RESOURCE_META[colors[targetColor]].color }}
                  />
                  {value !== null && <i style={{ background: RESOURCE_META[colors[value]].color }} />}
                </button>
              );
            })}
          </div>
          <div className="rr-atelier-tools">
            {palette.map((resource, index) => (
              <button
                key={resource}
                className={`rr-palette-button ${selected === index ? 'rr-palette-button-active' : ''}`}
                onClick={() => setSelected(index)}
                aria-label={`Select ${RESOURCE_META[resource].label}`}
              >
                <ResourceGlyph type={resource} size={24} />
                <span>{RESOURCE_META[resource].label}</span>
              </button>
            ))}
            <button
              className="rr-secondary-command"
              onClick={() => {
                setTiles(Array.from({ length: 25 }, () => null));
                setComplete(false);
              }}
            >
              <RotateCcw size={17} />
              Reset Pattern
            </button>
            {complete && (
              <div className="rr-atelier-complete">
                <Sparkles size={18} />
                Pattern restored
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function RegistanRebuilder({
  onExit,
  onComplete: _onComplete,
  onGoToDashboard,
}: {
  onExit: () => void;
  onComplete?: (score: number, stars: number) => void;
  onGoToDashboard?: () => void;
}) {
  const saved = loadRegistanSave();
  const [viewport, setViewport] = useState(screenSafeViewport);
  const [player, setPlayer] = useState<PlayerState>(START_PLAYER);
  const [camera, setCamera] = useState({ x: START_PLAYER.x, y: START_PLAYER.y, zoom: CAMERA_IDLE_ZOOM, shake: 0 });
  const [inventory, setInventory] = useState<Record<InventoryResource, number>>(saved?.inventory ?? makeEmptyInventory());
  const [gold, setGold] = useState(getSharedGold);
  const [stageIndex, setStageIndex] = useState(saved?.stageIndex ?? 0);
  const [stageStock, setStageStock] = useState<Record<InventoryResource, number>>(saved?.stageStock ?? makeEmptyInventory());
  const [upgrades, setUpgrades] = useState<Record<UpgradeKey, number>>(saved?.upgrades ?? makeEmptyUpgrades());
  const [hired, setHired] = useState<Record<WorkerRole, boolean>>(saved?.hired ?? { builder: false, craftsman: false, architect: false });
  const [workers, setWorkers] = useState<Worker[]>(saved?.workers ?? []);
  const workersRef = useRef<Worker[]>(saved?.workers ?? []);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [action, setAction] = useState<ActionState | null>(null);
  const [activePanel, setActivePanel] = useState<StationId | null>(null);
  const [message, setMessage] = useState(saved?.message ?? 'Restore the foundation stones.');
  const [cinematicText, setCinematicText] = useState('');
  const [buildPulse, setBuildPulse] = useState(false);
  const [movementLocked, setMovementLocked] = useState(false);
  const [levelFinished, setLevelFinished] = useState(saved?.levelFinished ?? false);
  const [atelierLevel, setAtelierLevel] = useState(saved?.atelierLevel ?? 1);

  const keysRef = useRef<Record<string, boolean>>({});
  const playerRef = useRef(player);
  const inventoryRef = useRef(inventory);
  const goldRef = useRef(gold);
  const stageIndexRef = useRef(stageIndex);
  const stageStockRef = useRef(stageStock);
  const upgradesRef = useRef(upgrades);
  const hiredRef = useRef(hired);
  const activePanelRef = useRef(activePanel);
  const movementLockedRef = useRef(movementLocked);
  const gatherProgressRef = useRef(0);
  const depositTimerRef = useRef(0);
  const messageCooldownRef = useRef(0);
  const cameraFocusUntilRef = useRef(0);
  const stageAdvancingRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const ambientTimerRef = useRef(7);
  const lastTickRef = useRef(0);
  const stepRef = useRef<(dt: number) => void>(() => undefined);

  const inventoryCap = getInventoryCap(upgrades);
  const progress = totalProgress(stageIndex, stageStock);
  const currentPlan = STAGE_PLANS[stageIndex];
  const visibleResources = RESOURCE_ORDER.filter((resource) => {
    if (stageIndex >= STAGE_PLANS.length) return inventory[resource] > 0 || resource === 'mosaic';
    return inventory[resource] > 0 || !!currentPlan?.needs[resource];
  });
  const canBuildCurrentStage = !currentPlan?.requiredWorker || hired[currentPlan.requiredWorker];
  const visibleStage = Math.min(stageIndex, 4);
  const nearestStation = useMemo(() => {
    const usable = STATIONS.filter((station) => canUseStation(station.id, stageIndex));
    return usable
      .map((station) => ({ station, d: distance(player.x, player.y, station.x, station.y) }))
      .filter((item) => item.d < item.station.radius)
      .sort((a, b) => a.d - b.d)[0]?.station || null;
  }, [player.x, player.y, stageIndex]);
  const nearestNode = useMemo(() => {
    return RESOURCE_NODES
      .filter((node) => node.unlockStage <= stageIndex)
      .map((node) => ({ node, d: distance(player.x, player.y, node.x, node.y) }))
      .filter((item) => item.d < item.node.radius + 34)
      .sort((a, b) => a.d - b.d)[0]?.node || null;
  }, [player.x, player.y, stageIndex]);
  const nearBuildSite = distance(player.x, player.y, BUILD_SITE.x, BUILD_SITE.y) < BUILD_SITE.radius + 24;
  const nearCarpet = onGoToDashboard ? distance(player.x, player.y, CARPET_SITE.x, CARPET_SITE.y) < CARPET_SITE.radius : false;
  const stationPrompt = nearestStation ? `Open ${nearestStation.label}` : '';
  const fallbackPrompt = nearestNode
    ? `Use ${TOOL_LABEL[nearestNode.tool]}`
    : nearestStation
      ? stationPrompt
      : nearBuildSite
        ? canBuildCurrentStage
          ? 'Deliver restoration materials'
          : `Hire ${currentPlan?.requiredWorker || 'guild help'}`
        : nearCarpet
          ? 'Press E to fly'
          : '';

  useEffect(() => { playerRef.current = player; }, [player]);
  useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
  useEffect(() => { goldRef.current = gold; }, [gold]);
  useEffect(() => { stageIndexRef.current = stageIndex; }, [stageIndex]);
  useEffect(() => { stageStockRef.current = stageStock; }, [stageStock]);
  useEffect(() => { upgradesRef.current = upgrades; }, [upgrades]);
  useEffect(() => { hiredRef.current = hired; }, [hired]);
  useEffect(() => { activePanelRef.current = activePanel; }, [activePanel]);
  useEffect(() => { movementLockedRef.current = movementLocked; }, [movementLocked]);

  const ensureAudio = useCallback(() => {
    const Ctx = window.AudioContext || (window as GameWindow).webkitAudioContext;
    if (!Ctx) return null;
    if (!audioRef.current) audioRef.current = new Ctx();
    if (audioRef.current.state === 'suspended') void audioRef.current.resume();
    return audioRef.current;
  }, []);

  const playSfx = useCallback((kind: SfxKind) => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    const noiseGain = ctx.createGain();
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    osc.connect(gain);
    noise.connect(noiseGain);
    gain.connect(ctx.destination);
    noiseGain.connect(ctx.destination);
    const settings: Record<SfxKind, { type: OscillatorType; freq: number; end: number; gain: number; noise: number }> = {
      stone: { type: 'square', freq: 118, end: 82, gain: 0.045, noise: 0.028 },
      timber: { type: 'triangle', freq: 180, end: 116, gain: 0.04, noise: 0.018 },
      clay: { type: 'sine', freq: 148, end: 106, gain: 0.035, noise: 0.02 },
      mosaic: { type: 'triangle', freq: 560, end: 780, gain: 0.042, noise: 0.004 },
      gold: { type: 'sine', freq: 680, end: 920, gain: 0.04, noise: 0.002 },
      build: { type: 'triangle', freq: 260, end: 420, gain: 0.05, noise: 0.018 },
      unlock: { type: 'sine', freq: 420, end: 760, gain: 0.05, noise: 0.004 },
      deny: { type: 'sawtooth', freq: 150, end: 100, gain: 0.025, noise: 0.002 },
      ambient: { type: 'sine', freq: 196, end: 247, gain: 0.013, noise: 0 },
    };
    const sound = settings[kind];
    osc.type = sound.type;
    osc.frequency.setValueAtTime(sound.freq, now);
    osc.frequency.exponentialRampToValueAtTime(sound.end, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(sound.gain, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    noiseGain.gain.setValueAtTime(sound.noise, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.start(now);
    noise.start(now);
    osc.stop(now + 0.22);
    noise.stop(now + 0.1);
  }, [ensureAudio, onExit]);

  const pushFloater = useCallback((x: number, y: number, text: string, color = '#f4d778') => {
    setFloaters((old) => [
      ...old.slice(-26),
      { id: `float-${Date.now()}-${Math.random()}`, x, y, text, color, life: 1.4 },
    ]);
  }, []);

  const emitParticles = useCallback((kind: EffectKind, x: number, y: number, count = 10) => {
    setParticles((old) => [
      ...old.slice(-54),
      ...Array.from({ length: count }).map((_, index) => ({
        id: `fx-${Date.now()}-${index}-${Math.random()}`,
        kind,
        x,
        y,
        vx: (Math.random() - 0.5) * (kind === 'magic' ? 92 : 62),
        vy: -40 - Math.random() * (kind === 'gold' ? 80 : 54),
        life: 0.72 + Math.random() * 0.34,
        maxLife: 1,
        size: 4 + Math.random() * (kind === 'magic' ? 8 : 6),
      })),
    ]);
  }, []);

  const setTimedMessage = useCallback((text: string, cooldown = 0.5) => {
    const now = performance.now() / 1000;
    if (now < messageCooldownRef.current) return;
    messageCooldownRef.current = now + cooldown;
    setMessage(text);
  }, []);

  const setGoldNow = useCallback((nextGold: number) => {
    goldRef.current = Math.max(0, Math.round(nextGold));
    setGold(goldRef.current);
  }, []);

  const setInventoryNow = useCallback((nextInventory: Record<InventoryResource, number>) => {
    inventoryRef.current = nextInventory;
    setInventory(nextInventory);
  }, []);

  const advanceStage = useCallback(() => {
    if (stageAdvancingRef.current) return;
    const liveStage = stageIndexRef.current;
    if (liveStage >= STAGE_PLANS.length) return;
    stageAdvancingRef.current = true;
    const nextStage = liveStage + 1;
    const title = nextStage >= STAGE_PLANS.length ? 'Registan Restored' : STAGE_PLANS[liveStage].title;
    setMovementLocked(true);
    movementLockedRef.current = true;
    setCinematicText(title);
    setBuildPulse(true);
    cameraFocusUntilRef.current = performance.now() + 2500;
    emitParticles('magic', BUILD_SITE.x, BUILD_SITE.y - 120, 22);
    playSfx('unlock');
    window.setTimeout(() => {
      stageIndexRef.current = nextStage;
      setStageIndex(nextStage);
      stageStockRef.current = makeEmptyInventory();
      setStageStock(makeEmptyInventory());
      setBuildPulse(false);
      if (nextStage >= STAGE_PLANS.length) {
        setLevelFinished(true);
        setMessage('The Registan shines again.');
      } else {
        setMessage(STAGE_PLANS[liveStage].unlock);
      }
    }, 420);
    window.setTimeout(() => {
      setMovementLocked(false);
      movementLockedRef.current = false;
      setCinematicText('');
      stageAdvancingRef.current = false;
    }, 2500);
  }, [emitParticles, playSfx]);

  const depositToStage = useCallback((resource: InventoryResource, qty: number, x: number, y: number, source: 'player' | 'worker') => {
    const liveStage = stageIndexRef.current;
    const plan = STAGE_PLANS[liveStage];
    if (!plan || stageAdvancingRef.current) return false;
    if (plan.requiredWorker && !hiredRef.current[plan.requiredWorker]) {
      if (source === 'player') {
        setTimedMessage(`The ${plan.requiredWorker} must join before this stage.`);
        playSfx('deny');
      }
      return false;
    }
    const required = plan.needs[resource] || 0;
    if (required <= 0) return false;
    const current = stageStockRef.current[resource] || 0;
    const amount = Math.min(qty, Math.max(0, required - current));
    if (amount <= 0) return false;
    const updated = { ...stageStockRef.current, [resource]: current + amount };
    stageStockRef.current = updated;
    setStageStock(updated);
    pushFloater(x, y - 38, `+${amount} ${RESOURCE_META[resource].label}`, '#bdf6ff');
    emitParticles('magic', x, y - 40, source === 'player' ? 7 : 4);
    setBuildPulse(true);
    window.setTimeout(() => setBuildPulse(false), 180);
    playSfx('build');
    if (stageFulfilled(updated, liveStage)) window.setTimeout(advanceStage, 80);
    return true;
  }, [advanceStage, emitParticles, playSfx, pushFloater, setTimedMessage]);

  const collectResource = useCallback((resource: InventoryResource, x: number, y: number, source: 'player' | 'worker') => {
    const current = inventoryRef.current;
    const cap = getInventoryCap(upgradesRef.current);
    const room = cap - sumInventory(current);
    if (source === 'player' && room <= 0) {
      setTimedMessage('The caravan pack is full.');
      pushFloater(x, y - 34, 'Pack full', '#ffb5a3');
      playSfx('deny');
      return false;
    }
    const craftingBonus = resource === 'mosaic' && upgradesRef.current.crafting >= 3 ? 1 : 0;
    const amount = source === 'worker' ? 1 : Math.max(1, 1 + craftingBonus);
    if (source === 'worker') return true;
    const accepted = Math.min(amount, Math.max(0, room));
    const nextInventory = { ...current, [resource]: current[resource] + accepted };
    setInventoryNow(nextInventory);
    pushFloater(x, y - 42, `+${accepted} ${RESOURCE_META[resource].label}`, RESOURCE_META[resource].color);
    emitParticles(resource, x, y, resource === 'mosaic' ? 10 : 7);
    playSfx(resource);
    return true;
  }, [emitParticles, playSfx, pushFloater, setInventoryNow, setTimedMessage]);

  const sellResource = useCallback((resource: InventoryResource, all = false) => {
    const current = inventoryRef.current;
    const available = current[resource];
    if (available <= 0) {
      setTimedMessage(`No ${RESOURCE_META[resource].label.toLowerCase()} to sell.`);
      playSfx('deny');
      return;
    }
    const amount = all ? available : 1;
    const multiplier = getMarketMultiplier(upgradesRef.current);
    const earned = Math.round(SELL_PRICES[resource] * multiplier * amount);
    const nextInventory = { ...current, [resource]: available - amount };
    setInventoryNow(nextInventory);
    setGoldNow(goldRef.current + earned);
    pushFloater(STATIONS[0].x, STATIONS[0].y - 80, `+${earned} gold`, '#ffdc74');
    emitParticles('gold', STATIONS[0].x, STATIONS[0].y - 46, 9);
    playSfx('gold');
  }, [emitParticles, playSfx, pushFloater, setGoldNow, setInventoryNow, setTimedMessage]);

  const hireWorker = useCallback((role: WorkerRole) => {
    const requiredStage = role === 'builder' ? 1 : role === 'craftsman' ? 2 : 3;
    if (stageIndexRef.current < requiredStage) {
      setTimedMessage(`${role} guild opens later.`);
      playSfx('deny');
      return;
    }
    if (hiredRef.current[role]) {
      setTimedMessage(`${role} is already working.`);
      return;
    }
    const cost = HIRE_COSTS[role];
    if (goldRef.current < cost) {
      setTimedMessage('Not enough gold for the guild contract.');
      playSfx('deny');
      return;
    }
    setGoldNow(goldRef.current - cost);
    const nextHired = { ...hiredRef.current, [role]: true };
    hiredRef.current = nextHired;
    setHired(nextHired);
    const spawn = STATIONS.find((station) => station.id === 'guild') || STATIONS[1];
    const newWorker: Worker = {
      id: `${role}-${Date.now()}`,
      role,
      x: spawn.x + (Math.random() * 42 - 21),
      y: spawn.y + 34 + Math.random() * 24,
      phase: 'seeking',
      carrying: null,
      timer: 0,
      seed: Math.random() * 1000,
    };
    const nextWorkers = [...workersRef.current, newWorker];
    workersRef.current = nextWorkers;
    setWorkers(nextWorkers);
    pushFloater(spawn.x, spawn.y - 70, `${role} joined`, '#b8ffd1');
    emitParticles('magic', spawn.x, spawn.y - 40, 10);
    playSfx('unlock');
  }, [emitParticles, playSfx, pushFloater, setGoldNow, setTimedMessage]);

  const buyUpgrade = useCallback((key: UpgradeKey) => {
    const level = upgradesRef.current[key];
    if (level >= 4) return;
    const cost = UPGRADE_DEFS[key].costs[level] || 0;
    if (goldRef.current < cost) {
      setTimedMessage('The workshop needs more gold.');
      playSfx('deny');
      return;
    }
    setGoldNow(goldRef.current - cost);
    const next = { ...upgradesRef.current, [key]: level + 1 };
    upgradesRef.current = next;
    setUpgrades(next);
    pushFloater(STATIONS[2].x, STATIONS[2].y - 70, `${UPGRADE_DEFS[key].label} ${level + 1}`, '#c4f6ff');
    emitParticles('magic', STATIONS[2].x, STATIONS[2].y - 38, 8);
    playSfx('unlock');
  }, [emitParticles, playSfx, pushFloater, setGoldNow, setTimedMessage]);

  const completeAtelier = useCallback((mosaicReward: number, goldReward: number) => {
    const current = inventoryRef.current;
    const cap = getInventoryCap(upgradesRef.current);
    const room = Math.max(0, cap - sumInventory(current));
    const accepted = Math.min(room, mosaicReward);
    setInventoryNow({ ...current, mosaic: current.mosaic + accepted });
    setGoldNow(goldRef.current + goldReward);
    setAtelierLevel((old) => old + 1);
    setActivePanel(null);
    emitParticles('mosaic', STATIONS[4].x, STATIONS[4].y - 38, 14);
    pushFloater(STATIONS[4].x, STATIONS[4].y - 74, `+${accepted} mosaic +${goldReward}g`, '#8ff5ff');
    playSfx('mosaic');
  }, [emitParticles, playSfx, pushFloater, setGoldNow, setInventoryNow]);

  const stepGame = useCallback((dt: number) => {
    const cappedDt = Math.min(0.05, Math.max(0.001, dt));
    const keys = keysRef.current;
    const panelOpen = !!activePanelRef.current;
    const locked = movementLockedRef.current;
    const p = playerRef.current;
    const dx = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
    const dy = (keys.s || keys.arrowdown ? 1 : 0) - (keys.w || keys.arrowup ? 1 : 0);
    const mag = Math.hypot(dx, dy);
    let nextPlayer = p;
    if (!panelOpen && !locked && mag > 0) {
      const speed = 220 * (UPGRADE_DEFS.movement.values[upgradesRef.current.movement - 1] || 1);
      const nx = clamp(p.x + (dx / mag) * speed * cappedDt, 80, WORLD_W - 80);
      const ny = clamp(p.y + (dy / mag) * speed * cappedDt, 92, WORLD_H - 80);
      const facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      nextPlayer = { x: nx, y: ny, vx: (nx - p.x) / cappedDt, vy: (ny - p.y) / cappedDt, facing, moving: true };
    } else {
      nextPlayer = { ...p, vx: 0, vy: 0, moving: false };
    }
    playerRef.current = nextPlayer;
    setPlayer(nextPlayer);

    const now = performance.now();
    const targetZoom = now < cameraFocusUntilRef.current ? CAMERA_FOCUS_ZOOM : nextPlayer.moving ? CAMERA_MOVE_ZOOM : CAMERA_IDLE_ZOOM;
    const focusX = now < cameraFocusUntilRef.current ? BUILD_SITE.x : nextPlayer.x + nextPlayer.vx * 0.18;
    const focusY = now < cameraFocusUntilRef.current ? BUILD_SITE.y : nextPlayer.y + nextPlayer.vy * 0.18 - 20;
    setCamera((old) => {
      const zoom = clamp(old.zoom + (targetZoom - old.zoom) * (1 - Math.exp(-cappedDt * 3.8)), CAMERA_MIN_ZOOM, CAMERA_MAX_ZOOM);
      const halfW = viewport.w / (2 * zoom);
      const halfH = viewport.h / (2 * zoom);
      const targetX = clamp(focusX, halfW, WORLD_W - halfW);
      const targetY = clamp(focusY, halfH, WORLD_H - halfH);
      return {
        x: old.x + (targetX - old.x) * (1 - Math.exp(-cappedDt * 4.6)),
        y: old.y + (targetY - old.y) * (1 - Math.exp(-cappedDt * 4.6)),
        zoom,
        shake: Math.max(0, old.shake - cappedDt * 18),
      };
    });

    const holdInteract = keys.e || keys[' '];
    const liveStage = stageIndexRef.current;
    const node = RESOURCE_NODES
      .filter((item) => item.unlockStage <= liveStage)
      .map((item) => ({ item, d: distance(nextPlayer.x, nextPlayer.y, item.x, item.y) }))
      .filter((item) => item.d < item.item.radius + 34)
      .sort((a, b) => a.d - b.d)[0]?.item || null;

    if (!panelOpen && holdInteract && node) {
      const gatherSpeed = 0.86 * (UPGRADE_DEFS.gathering.values[upgradesRef.current.gathering - 1] || 1);
      gatherProgressRef.current += cappedDt * gatherSpeed;
      setAction({
        label: `${TOOL_LABEL[node.tool]}: ${RESOURCE_META[node.resource].label}`,
        tool: node.tool,
        resource: node.resource,
        progress: clamp(gatherProgressRef.current, 0, 1),
        x: node.x,
        y: node.y,
      });
      if (gatherProgressRef.current >= 1) {
        gatherProgressRef.current = 0;
        const hitX = node.x + (Math.random() * 34 - 17);
        const hitY = node.y - 10 + (Math.random() * 24 - 12);
        collectResource(node.resource, hitX, hitY, 'player');
        setCamera((old) => ({ ...old, shake: Math.max(old.shake, node.resource === 'stone' ? 8 : 5) }));
      }
    } else if (!panelOpen && holdInteract && liveStage >= 2 && distance(nextPlayer.x, nextPlayer.y, STATIONS[3].x, STATIONS[3].y) < STATIONS[3].radius) {
      const gatherSpeed = 0.62 * (UPGRADE_DEFS.crafting.values[upgradesRef.current.crafting - 1] || 1);
      gatherProgressRef.current += cappedDt * gatherSpeed;
      setAction({
        label: 'Fire glaze into mosaic',
        tool: 'kilnTools',
        resource: 'mosaic',
        progress: clamp(gatherProgressRef.current, 0, 1),
        x: STATIONS[3].x,
        y: STATIONS[3].y,
      });
      if (gatherProgressRef.current >= 1) {
        gatherProgressRef.current = 0;
        const current = inventoryRef.current;
        if (current.clay >= 2 && goldRef.current >= 4) {
          setInventoryNow({ ...current, clay: current.clay - 2, mosaic: current.mosaic + 1 });
          setGoldNow(goldRef.current - 4);
          emitParticles('mosaic', STATIONS[3].x, STATIONS[3].y - 44, 10);
          pushFloater(STATIONS[3].x, STATIONS[3].y - 76, '+1 mosaic', '#91f7ff');
          playSfx('mosaic');
        } else {
          setTimedMessage('Kiln needs 2 clay and 4 gold.');
          playSfx('deny');
        }
      }
    } else {
      gatherProgressRef.current = 0;
      setAction(null);
    }

    depositTimerRef.current -= cappedDt;
    if (!panelOpen && liveStage < STAGE_PLANS.length && distance(nextPlayer.x, nextPlayer.y, BUILD_SITE.x, BUILD_SITE.y) < BUILD_SITE.radius + 24) {
      const plan = STAGE_PLANS[liveStage];
      if (plan.requiredWorker && !hiredRef.current[plan.requiredWorker]) {
        setTimedMessage(`The ${plan.requiredWorker} must join this stage.`, 1.1);
      } else if (depositTimerRef.current <= 0) {
        depositTimerRef.current = 0.18;
        const needs = stageNeedEntries(liveStage);
        const chosen = needs.find(([resource, amount]) => inventoryRef.current[resource] > 0 && (stageStockRef.current[resource] || 0) < amount);
        if (chosen) {
          const [resource] = chosen;
          const nextInventory = { ...inventoryRef.current, [resource]: inventoryRef.current[resource] - 1 };
          setInventoryNow(nextInventory);
          depositToStage(resource, 1, BUILD_SITE.x, BUILD_SITE.y, 'player');
        }
      }
    }

    // Pre-compute and apply deposits outside the state updater to avoid React Strict Mode
    // double-invocation causing double-counts, and to correctly handle deposit failures.
    const depositResults = new Map<string, boolean>();
    workersRef.current.forEach((worker, index) => {
      if (!worker.carrying) return;
      const targetX = BUILD_SITE.x + (index - 1) * 18;
      const targetY = BUILD_SITE.y + 72 + (index % 2) * 18;
      if (distance(worker.x, worker.y, targetX, targetY) < 18) {
        depositResults.set(worker.id, depositToStage(worker.carrying, 1, worker.x, worker.y, 'worker'));
      }
    });
    const nextWorkers = workersRef.current.map((worker, index) => {
      const workerSpeed = 150 * (UPGRADE_DEFS.workers.values[upgradesRef.current.workers - 1] || 1);
      const livePlan = STAGE_PLANS[stageIndexRef.current];
      if (!livePlan) return worker;
      if (worker.role === 'architect') {
        // Architect collects mosaic; orbits build site only when there's nothing to deliver
        const needEntries = stageNeedEntries(stageIndexRef.current);
        const mosaicNeeded = needEntries.some(([need, amount]) => need === 'mosaic' && (stageStockRef.current['mosaic'] || 0) < amount);
        if (!mosaicNeeded && !worker.carrying) {
          const orbit = performance.now() / 900 + worker.seed;
          const orbitX = BUILD_SITE.x + Math.cos(orbit) * 170;
          const orbitY = BUILD_SITE.y + Math.sin(orbit) * 96;
          const d = distance(worker.x, worker.y, orbitX, orbitY);
          const step = Math.min(d, workerSpeed * 0.72 * cappedDt);
          return {
            ...worker,
            x: d > 1 ? worker.x + ((orbitX - worker.x) / d) * step : worker.x,
            y: d > 1 ? worker.y + ((orbitY - worker.y) / d) * step : worker.y,
            phase: 'supervising' as const,
          };
        }
        // Fall through to the normal carrying / seeking logic below
      }
      if (worker.carrying) {
        const targetX = BUILD_SITE.x + (index - 1) * 18;
        const targetY = BUILD_SITE.y + 72 + (index % 2) * 18;
        const d = distance(worker.x, worker.y, targetX, targetY);
        if (d < 18) {
          if (depositResults.get(worker.id)) {
            return { ...worker, carrying: null, phase: 'seeking' as const, timer: 0 };
          }
          // Required worker not hired yet — wait at build site, do not drop resource
          return { ...worker, phase: 'carrying' as const };
        }
        const step = Math.min(d, workerSpeed * cappedDt);
        return { ...worker, x: worker.x + ((targetX - worker.x) / d) * step, y: worker.y + ((targetY - worker.y) / d) * step, phase: 'carrying' as const };
      }
      const needEntries = stageNeedEntries(stageIndexRef.current);
      const preference: InventoryResource[] = worker.role === 'builder' ? ['stone', 'timber'] : worker.role === 'architect' ? ['mosaic'] : ['clay', 'mosaic', 'timber'];
      const needed = preference.find((resource) => needEntries.some(([need, amount]) => need === resource && (stageStockRef.current[need] || 0) < amount));
      if (!needed) {
        const idleX = worker.role === 'builder' ? STATIONS[1].x : worker.role === 'architect' ? STATIONS[4].x : STATIONS[2].x;
        const idleY = worker.role === 'builder' ? STATIONS[1].y : worker.role === 'architect' ? STATIONS[4].y : STATIONS[2].y;
        const sway = Math.sin(performance.now() / 1000 + worker.seed) * 24;
        const d = distance(worker.x, worker.y, idleX + sway, idleY + 32);
        const step = Math.min(d, workerSpeed * 0.45 * cappedDt);
        return d > 1 ? { ...worker, x: worker.x + ((idleX + sway - worker.x) / d) * step, y: worker.y + ((idleY + 32 - worker.y) / d) * step, phase: 'seeking' as const } : worker;
      }
      const targetNode = RESOURCE_NODES.find((nodeItem) => nodeItem.resource === needed && nodeItem.unlockStage <= stageIndexRef.current);
      const targetX = needed === 'mosaic' && worker.role === 'craftsman' ? STATIONS[3].x : targetNode?.x || STATIONS[2].x;
      const targetY = needed === 'mosaic' && worker.role === 'craftsman' ? STATIONS[3].y : targetNode?.y || STATIONS[2].y;
      const d = distance(worker.x, worker.y, targetX, targetY);
      if (d < 28) {
        const nextTimer = worker.timer + cappedDt * (UPGRADE_DEFS.workers.values[upgradesRef.current.workers - 1] || 1);
        if (nextTimer > (needed === 'mosaic' ? 1.45 : 1.05)) {
          emitParticles(needed, worker.x, worker.y - 18, 6);
          return { ...worker, carrying: needed, timer: 0, phase: 'carrying' as const };
        }
        return { ...worker, timer: nextTimer, phase: 'working' as const };
      }
      const step = Math.min(d, workerSpeed * cappedDt);
      return { ...worker, x: worker.x + ((targetX - worker.x) / d) * step, y: worker.y + ((targetY - worker.y) / d) * step, phase: 'seeking' as const };
    });
    workersRef.current = nextWorkers;
    setWorkers(nextWorkers);

    setParticles((old) => old
      .map((fx) => ({
        ...fx,
        x: fx.x + fx.vx * cappedDt,
        y: fx.y + fx.vy * cappedDt,
        vy: fx.vy + 98 * cappedDt,
        life: fx.life - cappedDt,
      }))
      .filter((fx) => fx.life > 0));
    setFloaters((old) => old
      .map((floater) => ({ ...floater, y: floater.y - 28 * cappedDt, life: floater.life - cappedDt }))
      .filter((floater) => floater.life > 0));

    ambientTimerRef.current -= cappedDt;
    if (ambientTimerRef.current <= 0 && audioRef.current) {
      ambientTimerRef.current = 7 + Math.random() * 7;
      playSfx('ambient');
    }
  }, [collectResource, depositToStage, emitParticles, playSfx, pushFloater, setGoldNow, setInventoryNow, setTimedMessage, viewport.h, viewport.w]);

  useEffect(() => {
    stepRef.current = stepGame;
  }, [stepGame]);

  // Save Registan progress whenever key state changes
  useEffect(() => {
    saveRegistanSave({
      stageIndex,
      stageStock,
      inventory,
      upgrades,
      hired,
      workers,
      atelierLevel,
      levelFinished,
      message,
    });
  }, [stageIndex, stageStock, inventory, upgrades, hired, workers, atelierLevel, levelFinished, message]);

  useEffect(() => {
    const onResize = () => setViewport(screenSafeViewport());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Sync gold to shared wallet whenever it changes
  useEffect(() => {
    setSharedGold(gold);
  }, [gold]);

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      keysRef.current[key] = true;
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'e'].includes(key)) event.preventDefault();
      ensureAudio();
      if (key === 'escape') {
        if (activePanelRef.current) {
          setActivePanel(null);
        }
        return;
      }
      if (key === 'e' && !activePanelRef.current) {
        const p = playerRef.current;
        // Check magic carpet first
        if (onGoToDashboard && distance(p.x, p.y, CARPET_SITE.x, CARPET_SITE.y) < CARPET_SITE.radius) {
          onGoToDashboard();
          return;
        }
        const station = STATIONS
          .filter((item) => canUseStation(item.id, stageIndexRef.current))
          .map((item) => ({ item, d: distance(p.x, p.y, item.x, item.y) }))
          .filter((item) => item.d < item.item.radius)
          .sort((a, b) => a.d - b.d)[0]?.item;
        if (station && station.id !== 'kiln') setActivePanel(station.id);
      }
    };
    const onUp = (event: KeyboardEvent) => {
      keysRef.current[event.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [ensureAudio]);

  useEffect(() => {
    let raf = 0;
    const tick = (timestamp: number) => {
      const last = lastTickRef.current || timestamp;
      lastTickRef.current = timestamp;
      stepRef.current((timestamp - last) / 1000 || 1 / 60);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const gameWindow = window as GameWindow;
    gameWindow.render_game_to_text = () => JSON.stringify({
      mode: 'registan-rebuilder',
      coordinateSystem: 'world origin top-left, x right, y down',
      player: playerRef.current,
      camera,
      stage: {
        index: stageIndexRef.current,
        title: STAGE_PLANS[stageIndexRef.current]?.title || 'Restored',
        progress: totalProgress(stageIndexRef.current, stageStockRef.current),
        stock: stageStockRef.current,
      },
      inventory: inventoryRef.current,
      gold: goldRef.current,
      activePanel: activePanelRef.current,
      nearestNode: nearestNode?.id || null,
      nearestStation: nearestStation?.id || null,
      workers: workers.map((worker) => ({ role: worker.role, x: Math.round(worker.x), y: Math.round(worker.y), phase: worker.phase, carrying: worker.carrying })),
    });
    gameWindow.advanceTime = (ms: number) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let i = 0; i < steps; i += 1) stepRef.current(1 / 60);
    };
    return () => {
      delete gameWindow.render_game_to_text;
      delete gameWindow.advanceTime;
    };
  }, [camera, nearestNode?.id, nearestStation?.id, workers]);

  const worldTransform = useMemo(() => {
    const shakeX = camera.shake ? (Math.random() - 0.5) * camera.shake : 0;
    const shakeY = camera.shake ? (Math.random() - 0.5) * camera.shake : 0;
    return `translate3d(${viewport.w / 2 + shakeX - camera.x * camera.zoom}px, ${viewport.h / 2 + shakeY - camera.y * camera.zoom}px, 0) scale(${camera.zoom})`;
  }, [camera.shake, camera.x, camera.y, camera.zoom, viewport.h, viewport.w]);


  return (
    <div className="rr-shell" onPointerDown={ensureAudio}>
      <style>{`
        .rr-shell {
          position: relative;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          color: #f8f2dd;
          background:
            radial-gradient(circle at 52% 16%, rgba(255, 225, 152, 0.32) 0, transparent 30%),
            linear-gradient(180deg, #7ebf9b 0%, #d8b06a 45%, #5f8d76 100%);
          font-family: "Nunito", sans-serif;
          letter-spacing: 0;
          user-select: none;
        }
        .rr-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(120deg, rgba(27, 72, 91, 0.26), transparent 42%, rgba(112, 50, 38, 0.22)),
            radial-gradient(circle at 50% 50%, transparent 48%, rgba(24, 32, 28, 0.36) 100%);
          z-index: 8;
        }
        .rr-world {
          position: absolute;
          left: 0;
          top: 0;
          width: ${WORLD_W}px;
          height: ${WORLD_H}px;
          transform-origin: 0 0;
          will-change: transform;
        }
        .rr-terrain {
          position: absolute;
          inset: 0;
          background-image: url('./assets/background_grass.png');
          background-size: cover;
          background-position: center;
        }
        .rr-terrain::after {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url('./assets/sand_background.png');
          background-size: cover;
          background-position: center;
          mask-image: radial-gradient(ellipse 1200px 900px at 950px 790px, black 0%, transparent 100%);
          -webkit-mask-image: radial-gradient(ellipse 1200px 900px at 950px 790px, black 0%, transparent 100%);
        }
        .rr-path {
          position: absolute;
          border-radius: 999px;
          background:
            radial-gradient(ellipse at 50% 45%, rgba(242, 208, 139, 0.72), rgba(173, 119, 70, 0.5) 64%, rgba(118, 84, 56, 0.12) 100%);
          box-shadow: inset 0 0 18px rgba(92, 58, 34, 0.24);
        }
        .rr-top-hud {
          position: absolute;
          z-index: 20;
          left: 18px;
          right: 18px;
          top: 16px;
          display: grid;
          grid-template-columns: auto minmax(280px, 380px) auto;
          gap: 14px;
          align-items: start;
          pointer-events: none;
        }
        .rr-command-row, .rr-resource-bar, .rr-stage-panel {
          pointer-events: auto;
          backdrop-filter: blur(15px);
          background: linear-gradient(135deg, rgba(28, 65, 66, 0.78), rgba(85, 57, 42, 0.64));
          border: 1px solid rgba(239, 208, 132, 0.55);
          box-shadow: 0 14px 36px rgba(32, 22, 14, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.16);
        }
        .rr-command-row {
          display: flex;
          gap: 8px;
          padding: 8px;
          border-radius: 8px;
        }
        .rr-icon-command {
          width: 28px;
          height: 28px;
          border: 1px solid rgba(245, 216, 145, 0.52);
          color: #fff4d0;
          background: rgba(36, 50, 43, 0.64);
          border-radius: 6px;
          display: inline-grid;
          place-items: center;
          transition: transform 160ms ease, background 160ms ease;
        }
        .rr-icon-command:hover { transform: translateY(-1px); background: rgba(58, 82, 64, 0.76); }
        .rr-stage-panel {
          border-radius: 8px;
          padding: 10px 14px;
          min-width: 280px;
          justify-self: start;
          background: linear-gradient(135deg, rgba(28, 65, 66, 0.35), rgba(85, 57, 42, 0.28));
          border-color: rgba(239, 208, 132, 0.2);
          box-shadow: 0 4px 12px rgba(32, 22, 14, 0.15);
          transition: all 0.25s ease;
        }
        .rr-stage-panel:hover {
          background: linear-gradient(135deg, rgba(28, 65, 66, 0.78), rgba(85, 57, 42, 0.64));
          border-color: rgba(239, 208, 132, 0.55);
          box-shadow: 0 14px 36px rgba(32, 22, 14, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.16);
        }
        .rr-stage-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .rr-stage-title h1 {
          margin: 0;
          font-family: "Cinzel", serif;
          font-size: 20px;
          line-height: 1.05;
          color: #fff2c0;
          text-shadow: 0 2px 10px rgba(0,0,0,0.28);
        }
        .rr-stage-title span {
          font-size: 12px;
          font-weight: 900;
          color: #9cf0ed;
        }
        .rr-stage-panel p {
          margin: 5px 0 10px;
          color: #e7dbc1;
          font-size: 12px;
        }
        .rr-stage-track {
          height: 9px;
          border-radius: 999px;
          background: rgba(20, 24, 21, 0.42);
          overflow: hidden;
        }
        .rr-stage-track i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #35c7c6, #f2ce79, #ef7e55);
          box-shadow: 0 0 16px rgba(80, 225, 224, 0.35);
        }
        .rr-stage-needs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }
        .rr-stage-needs span {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 26px;
          padding: 3px 8px;
          border-radius: 8px;
          background: rgba(24, 29, 26, 0.34);
          border: 1px solid rgba(255, 238, 190, 0.12);
          color: #fff5cf;
          font-size: 12px;
          font-weight: 900;
        }
        .rr-resource-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 8px;
          padding: 6px 10px;
          justify-self: end;
          background: linear-gradient(135deg, rgba(28, 65, 66, 0.35), rgba(85, 57, 42, 0.28));
          border-color: rgba(239, 208, 132, 0.2);
          box-shadow: 0 4px 12px rgba(32, 22, 14, 0.15);
          transition: all 0.25s ease;
        }
        .rr-resource-bar:hover {
          background: linear-gradient(135deg, rgba(28, 65, 66, 0.78), rgba(85, 57, 42, 0.64));
          border-color: rgba(239, 208, 132, 0.55);
          box-shadow: 0 14px 36px rgba(32, 22, 14, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.16);
        }
        .rr-resource-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: auto;
          height: auto;
          padding: 0;
          border-radius: 0;
          background: transparent;
          border: none;
          font-weight: 900;
          color: #fff7dc;
        }
        .rr-mini-progress {
          position: relative;
          display: block;
          height: 7px;
          border-radius: 99px;
          overflow: hidden;
          background: rgba(20, 24, 21, 0.48);
        }
        .rr-mini-progress i {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #39c8cd, #e7c15f);
        }
        .rr-bottom-status {
          position: absolute;
          z-index: 20;
          left: 50%;
          bottom: 20px;
          transform: translateX(-50%);
          display: grid;
          gap: 8px;
          justify-items: center;
          pointer-events: none;
        }
        .rr-action-prompt {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 270px;
          min-height: 44px;
          justify-content: center;
          padding: 9px 14px;
          border-radius: 999px;
          background: rgba(20, 36, 35, 0.82);
          border: 1px solid rgba(239, 208, 132, 0.56);
          color: #fff8dc;
          box-shadow: 0 12px 28px rgba(22, 16, 10, 0.3);
          backdrop-filter: blur(12px);
          font-weight: 900;
          transition: opacity 160ms ease;
        }
        .rr-message {
          min-width: 260px;
          max-width: min(620px, 88vw);
          text-align: center;
          padding: 7px 12px;
          color: #f2e4bf;
          border-radius: 999px;
          background: rgba(40, 33, 27, 0.45);
          border: 1px solid rgba(255, 236, 183, 0.17);
          font-size: 13px;
          font-weight: 800;
        }
        .rr-node {
          position: absolute;
          filter: drop-shadow(0 12px 10px rgba(35, 28, 18, 0.28));
          transition: transform 160ms ease, opacity 180ms ease;
        }
        .rr-node-active {
          transform: translateZ(0) scale(1.06);
          filter: drop-shadow(0 0 18px var(--node-glow)) drop-shadow(0 12px 10px rgba(35, 28, 18, 0.28));
        }
        .rr-node-locked {
          opacity: 0.28;
          filter: grayscale(0.5);
        }
        .rr-node-tool {
          position: absolute;
          right: 6px;
          top: 10px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: #fff3c9;
          background: rgba(38, 35, 27, 0.68);
          border: 1px solid rgba(255, 229, 160, 0.38);
        }
        .rr-station {
          position: absolute;
          width: 150px;
          height: 128px;
          transform: translate(-50%, -76%);
          text-align: center;
          filter: drop-shadow(0 16px 12px rgba(39, 28, 18, 0.26));
        }
        .rr-station span {
          display: inline-flex;
          margin-top: -7px;
          padding: 5px 9px;
          border-radius: 999px;
          background: rgba(32, 30, 22, 0.56);
          border: 1px solid rgba(255, 239, 192, 0.18);
          color: #fff2c6;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }
        .rr-station-locked { opacity: 0.32; filter: grayscale(0.7); }
        .rr-prop {
          position: absolute;
          width: 70px;
          height: 70px;
          transform-origin: center bottom;
          pointer-events: none;
        }
        .rr-tree span, .rr-tree i {
          position: absolute;
          border-radius: 999px;
          background: #4f9a62;
          box-shadow: 0 6px 0 #3f7f51;
        }
        .rr-tree span { left: 16px; top: 2px; width: 42px; height: 42px; }
        .rr-tree i { left: 6px; top: 24px; width: 58px; height: 34px; }
        .rr-tree::after {
          content: "";
          position: absolute;
          left: 31px;
          top: 48px;
          width: 10px;
          height: 28px;
          background: #6b4329;
          border-radius: 5px;
        }
        .rr-bush span, .rr-bush i {
          position: absolute;
          border-radius: 999px;
          background: #5ca66a;
        }
        .rr-bush span { left: 8px; top: 32px; width: 38px; height: 28px; }
        .rr-bush i { left: 30px; top: 27px; width: 34px; height: 32px; }
        .rr-banner::before {
          content: "";
          position: absolute;
          left: 22px;
          top: 7px;
          width: 6px;
          height: 72px;
          background: #5d3e28;
          border-radius: 4px;
        }
        .rr-banner span {
          position: absolute;
          left: 28px;
          top: 10px;
          width: 34px;
          height: 48px;
          background: linear-gradient(90deg, #2fb8bd, #d6a53f);
          clip-path: polygon(0 0, 100% 8%, 82% 100%, 0 88%);
          animation: rr-sway 2.8s ease-in-out infinite;
        }
        .rr-cart span {
          position: absolute;
          left: 6px;
          top: 34px;
          width: 58px;
          height: 24px;
          border-radius: 8px;
          background: #8f5b35;
          border: 3px solid #54321f;
        }
        .rr-cart i::before, .rr-cart i::after {
          content: "";
          position: absolute;
          top: 54px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #342116;
          border: 3px solid #c99352;
        }
        .rr-cart i::before { left: 15px; }
        .rr-cart i::after { left: 43px; }
        .rr-lantern::before {
          content: "";
          position: absolute;
          left: 32px;
          top: 10px;
          width: 5px;
          height: 62px;
          background: #473324;
        }
        .rr-lantern span {
          position: absolute;
          left: 20px;
          top: 28px;
          width: 28px;
          height: 34px;
          border-radius: 14px 14px 10px 10px;
          background: radial-gradient(circle, #ffe39b 0 28%, #d88435 62%, #693520 100%);
          box-shadow: 0 0 24px rgba(255, 205, 106, 0.58);
          animation: rr-pulse 2.2s ease-in-out infinite;
        }
        .rr-pottery span, .rr-pottery i {
          position: absolute;
          bottom: 0;
          border-radius: 40% 40% 48% 48%;
          background: #b66145;
          border: 3px solid #743725;
        }
        .rr-pottery span { left: 14px; width: 26px; height: 38px; }
        .rr-pottery i { left: 42px; width: 18px; height: 26px; }
        .rr-carpet {
          width: 88px;
          height: 46px;
          background:
            linear-gradient(90deg, rgba(255,255,255,0.2) 0 3px, transparent 3px 10px),
            linear-gradient(135deg, #2fb8bd, #174f9b 45%, #c84d40);
          border: 4px solid #e3c06f;
          border-radius: 8px;
          box-shadow: 0 10px 12px rgba(31, 24, 17, 0.22);
        }
        .rr-rubble span, .rr-rubble i, .rr-rubble b {
          position: absolute;
          background: #8c8271;
          border: 2px solid #5a5146;
          border-radius: 8px;
        }
        .rr-rubble span { left: 8px; top: 40px; width: 36px; height: 20px; transform: rotate(-9deg); }
        .rr-rubble i { left: 38px; top: 33px; width: 25px; height: 25px; transform: rotate(17deg); }
        .rr-rubble b { left: 25px; top: 20px; width: 19px; height: 19px; transform: rotate(33deg); }
        .rr-scaffold {
          width: 100px;
          height: 110px;
          border-left: 6px solid #735032;
          border-right: 6px solid #735032;
          border-bottom: 6px solid #735032;
        }
        .rr-scaffold span::before, .rr-scaffold span::after {
          content: "";
          position: absolute;
          left: 0;
          width: 100px;
          height: 6px;
          background: #8a633d;
        }
        .rr-scaffold span::before { top: 36px; }
        .rr-scaffold span::after { top: 70px; }
        .rr-ruin {
          width: 100px;
          height: 82px;
          border-left: 18px solid #9c805f;
          border-right: 18px solid #9c805f;
          border-bottom: 18px solid #9c805f;
          border-radius: 8px;
          opacity: 0.86;
        }
        .rr-ruin span {
          position: absolute;
          left: 19px;
          bottom: 15px;
          width: 28px;
          height: 42px;
          border-radius: 20px 20px 0 0;
          background: rgba(67, 46, 34, 0.4);
        }
        .rr-smoke span, .rr-smoke i {
          position: absolute;
          border-radius: 50%;
          background: rgba(232, 225, 209, 0.42);
          animation: rr-smoke 3.2s ease-in-out infinite;
        }
        .rr-smoke span { left: 26px; top: 10px; width: 28px; height: 28px; }
        .rr-smoke i { left: 36px; top: -8px; width: 22px; height: 22px; animation-delay: 0.6s; }
        .rr-tiles span, .rr-tiles i {
          position: absolute;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #2fb8bd;
          border: 3px solid #e3c06f;
          transform: rotate(18deg);
        }
        .rr-tiles span { left: 8px; top: 36px; }
        .rr-tiles i { left: 38px; top: 26px; background: #174f9b; transform: rotate(-14deg); }
        .rr-registan {
          position: absolute;
          width: 390px;
          height: 286px;
          transform: translate(-50%, -58%);
          filter: drop-shadow(0 28px 18px rgba(42, 28, 16, 0.3));
        }
        .rr-registan-stage { position: relative; width: 390px; height: 286px; transition: transform 340ms ease; }
        .rr-registan-pulse { transform: scale(1.035); }
        .rr-restoration-glow {
          position: absolute;
          inset: 38px 48px 34px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(81, 231, 228, 0.34), transparent 68%);
          mix-blend-mode: screen;
          animation: rr-pulse 2.5s ease-in-out infinite;
        }
        .rr-build-ring {
          position: absolute;
          width: 310px;
          height: 190px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 2px dashed rgba(245, 214, 133, 0.32);
          background: radial-gradient(ellipse, rgba(65, 206, 203, 0.1), transparent 68%);
          opacity: 0.76;
          animation: rr-ring 7s linear infinite;
        }
        .rr-figure { position: relative; transform-origin: center bottom; }
        .rr-figure-moving { animation: rr-worker-bob 360ms ease-in-out infinite; }
        .rr-carrying {
          position: absolute;
          right: -4px;
          top: -3px;
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: rgba(29, 31, 24, 0.72);
          border: 1px solid rgba(255, 231, 170, 0.36);
        }
        .rr-player, .rr-worker {
          position: absolute;
          transform: translate(-50%, -84%);
          z-index: 5;
        }
        .rr-architect-aura {
          position: absolute;
          inset: -9px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(91, 220, 230, 0.28), transparent 68%);
          animation: rr-pulse 1.8s ease-in-out infinite;
        }
        .rr-worker-label {
          position: absolute;
          left: 50%;
          top: -24px;
          transform: translateX(-50%);
          padding: 3px 7px;
          border-radius: 999px;
          background: rgba(26, 28, 22, 0.58);
          border: 1px solid rgba(255, 235, 181, 0.16);
          color: #f3e3bb;
          font-size: 10px;
          font-weight: 900;
          white-space: nowrap;
        }
        .rr-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 10px currentColor;
        }
        .rr-floater {
          position: absolute;
          transform: translate(-50%, -50%);
          pointer-events: none;
          font-size: 13px;
          font-weight: 1000;
          text-shadow: 0 2px 5px rgba(0,0,0,0.5);
          white-space: nowrap;
        }
        .rr-cinematic {
          position: absolute;
          z-index: 28;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
          background: radial-gradient(circle, transparent 42%, rgba(10, 17, 15, 0.35) 100%);
        }
        .rr-cinematic h2 {
          margin: 0;
          font-family: "Cinzel", serif;
          font-size: clamp(30px, 5vw, 64px);
          color: #fff0b6;
          text-shadow: 0 8px 28px rgba(0,0,0,0.56);
          animation: rr-cinematic-in 2.4s ease both;
        }
        .rr-modal-backdrop {
          position: absolute;
          z-index: 40;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(21, 24, 20, 0.52);
          backdrop-filter: blur(9px);
        }
        .rr-modal, .rr-atelier-panel {
          position: relative;
          width: min(760px, 94vw);
          max-height: min(760px, 90vh);
          overflow: auto;
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(240, 223, 184, 0.98), rgba(205, 165, 101, 0.96)),
            radial-gradient(circle at 12% 18%, rgba(47, 184, 189, 0.14), transparent 40%);
          color: #2d2419;
          border: 2px solid rgba(92, 61, 33, 0.55);
          box-shadow: 0 30px 80px rgba(22, 16, 10, 0.48), inset 0 0 0 1px rgba(255,255,255,0.25);
          padding: 18px;
        }
        .rr-modal-header, .rr-atelier-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-right: 44px;
        }
        .rr-modal-header h2, .rr-atelier-heading h2 {
          margin: 0;
          font-family: "Cinzel", serif;
          font-size: 24px;
          color: #263a35;
        }
        .rr-modal-header p, .rr-atelier-heading p {
          margin: 2px 0 0;
          color: #67513a;
          font-size: 13px;
          font-weight: 800;
        }
        .rr-close-button {
          position: absolute;
          right: 12px;
          top: 12px;
          width: 34px;
          height: 34px;
          border: 0;
          border-radius: 8px;
          display: grid;
          place-items: center;
          color: #2d2419;
          background: rgba(255,255,255,0.28);
        }
        .rr-modal-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 10px;
          margin-top: 16px;
        }
        .rr-shop-card {
          border-radius: 8px;
          background: rgba(255, 248, 225, 0.44);
          border: 1px solid rgba(92, 61, 33, 0.22);
          padding: 12px;
          min-height: 126px;
          display: grid;
          align-content: space-between;
          gap: 9px;
        }
        .rr-shop-card h3 {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #2d3f39;
        }
        .rr-shop-card p {
          margin: 0;
          color: #6b513a;
          font-size: 12px;
          font-weight: 800;
        }
        .rr-primary-command, .rr-secondary-command {
          min-height: 38px;
          border: 0;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 11px;
          font-weight: 1000;
          color: #23170d;
          background: linear-gradient(180deg, #f2ca69, #ca8f2e);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 5px 0 rgba(107, 69, 26, 0.34);
        }
        .rr-primary-command:disabled {
          color: #7a7062;
          background: #c6b999;
          box-shadow: none;
          cursor: not-allowed;
        }
        .rr-secondary-command {
          color: #f8ecd0;
          background: linear-gradient(180deg, #37635d, #243b39);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 0 rgba(22, 38, 35, 0.3);
        }
        .rr-atelier-layout {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) 210px;
          gap: 16px;
          margin-top: 16px;
          align-items: start;
        }
        .rr-mosaic-board {
          display: grid;
          grid-template-columns: repeat(5, minmax(42px, 1fr));
          gap: 7px;
          padding: 14px;
          border-radius: 8px;
          background:
            linear-gradient(135deg, rgba(96, 67, 38, 0.2), rgba(255,255,255,0.2)),
            #d7bb82;
          border: 1px solid rgba(92, 61, 33, 0.22);
        }
        .rr-mosaic-cell {
          position: relative;
          aspect-ratio: 1;
          border: 0;
          border-radius: 8px;
          background: rgba(255, 248, 225, 0.58);
          box-shadow: inset 0 0 0 1px rgba(92, 61, 33, 0.2), 0 3px 0 rgba(118, 86, 51, 0.18);
          overflow: hidden;
        }
        .rr-mosaic-guide, .rr-mosaic-cell i {
          position: absolute;
          inset: 8px;
          border-radius: 7px;
          clip-path: polygon(8% 0, 94% 9%, 100% 84%, 16% 100%, 0 22%);
        }
        .rr-mosaic-guide { opacity: 0.18; }
        .rr-mosaic-cell i {
          opacity: 0.95;
          box-shadow: inset 0 2px 1px rgba(255,255,255,0.32), 0 5px 8px rgba(52, 35, 19, 0.22);
          animation: rr-tile-set 180ms ease both;
        }
        .rr-mosaic-cell-valid i { box-shadow: inset 0 2px 1px rgba(255,255,255,0.32), 0 0 16px rgba(61, 213, 218, 0.42); }
        .rr-atelier-tools {
          display: grid;
          gap: 8px;
        }
        .rr-palette-button {
          min-height: 44px;
          border: 1px solid rgba(92, 61, 33, 0.2);
          border-radius: 8px;
          background: rgba(255, 248, 225, 0.48);
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px;
          color: #2d2419;
          font-weight: 900;
        }
        .rr-palette-button-active {
          background: rgba(47, 184, 189, 0.2);
          border-color: rgba(22, 95, 116, 0.42);
          box-shadow: inset 0 0 0 2px rgba(47, 184, 189, 0.22);
        }
        .rr-atelier-complete {
          min-height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 8px;
          color: #0d4e52;
          background: rgba(47, 184, 189, 0.18);
          font-weight: 1000;
        }
        .rr-finish-panel {
          text-align: center;
          width: min(540px, 92vw);
        }
        .rr-finish-panel h2 {
          font-size: 31px;
          margin-bottom: 6px;
        }
        @keyframes rr-sway { 0%, 100% { transform: skewY(-2deg); } 50% { transform: skewY(5deg) translateX(2px); } }
        @keyframes rr-pulse { 0%, 100% { opacity: 0.72; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
        @keyframes rr-smoke { 0% { opacity: 0; transform: translateY(12px) scale(0.7); } 35% { opacity: 0.55; } 100% { opacity: 0; transform: translateY(-34px) scale(1.6); } }
        @keyframes rr-worker-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
        @keyframes rr-ring { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes rr-cinematic-in { 0% { opacity: 0; transform: translateY(18px) scale(0.96); } 18%, 78% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(-14px) scale(1.02); } }
        @keyframes rr-tile-set { from { transform: scale(0.72) rotate(-8deg); opacity: 0; } to { transform: scale(1) rotate(0); opacity: 0.95; } }
        @media (max-width: 860px) {
          .rr-top-hud {
            grid-template-columns: auto 1fr;
            right: 12px;
            left: 12px;
            top: 10px;
            gap: 8px;
          }
          .rr-resource-bar {
            grid-column: 1 / -1;
            justify-self: stretch;
            overflow-x: auto;
          }
          .rr-stage-panel {
            min-width: 0;
            padding: 10px;
          }
          .rr-stage-title h1 { font-size: 15px; }
          .rr-stage-title span { font-size: 11px; }
          .rr-command-row { padding: 6px; }
          .rr-icon-command { width: 38px; height: 38px; }
          .rr-side-panel {
            display: none;
          }
          .rr-atelier-layout {
            grid-template-columns: 1fr;
          }
          .rr-action-prompt { min-width: min(310px, 88vw); }
        }
        .rr-magic-carpet {
          position: absolute;
          cursor: pointer;
          z-index: 20;
          transition: transform 0.2s ease;
        }
        .rr-magic-carpet:hover {
          transform: scale(1.08);
        }
        .rr-magic-carpet img {
          width: 96px;
          height: 96px;
          object-fit: contain;
          filter: drop-shadow(0 0 12px rgba(212, 160, 23, 0.6));
        }
        .rr-magic-carpet-label {
          position: absolute;
          top: -22px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(26, 15, 8, 0.85);
          color: #f5d08a;
          font-family: 'Cinzel', serif;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 6px;
          border: 1px solid rgba(212, 160, 23, 0.4);
          white-space: nowrap;
          pointer-events: none;
          opacity: 0.9;
        }
      `}</style>

      <div className="rr-world" style={{ transform: worldTransform }}>
        <div className="rr-terrain" />
        {PATHS.map((path) => (
          <div
            key={path.id}
            className="rr-path"
            style={{
              left: path.x,
              top: path.y,
              width: path.w,
              height: path.h,
              opacity: path.opacity ?? 0.7,
              transform: `translate(-50%, -50%) rotate(${path.rotate}deg)`,
            }}
          />
        ))}

        {WORLD_PROPS.filter((prop) => (prop.unlockStage ?? 0) <= stageIndex).map((prop) => (
          <div key={prop.id} style={{ position: 'absolute', left: prop.x, top: prop.y }}>
            <PropSprite prop={prop} />
          </div>
        ))}

        {/* Magic Carpet — press E when near to fly to level select */}
        {onGoToDashboard && (
          <div
            className="rr-magic-carpet"
            style={{ left: CARPET_SITE.x, top: CARPET_SITE.y }}
            title="Magic Carpet"
          >
            <img src="./assets/magic-carpet.png" alt="Magic Carpet" />
          </div>
        )}

        <div className="rr-build-ring" style={{ left: BUILD_SITE.x, top: BUILD_SITE.y + 26 }} />
        <div className="rr-registan" style={{ left: BUILD_SITE.x, top: BUILD_SITE.y }}>
          <RegistanMonument stage={visibleStage} pulse={buildPulse} />
        </div>

        {RESOURCE_NODES.filter((node) => node.unlockStage <= stageIndex).map((node) => {
          const locked = false;
          const active = nearestNode?.id === node.id;
          return (
            <div key={node.id} style={{ position: 'absolute', left: node.x - node.radius, top: node.y - node.radius }}>
              <ResourceNodeSprite node={node} locked={locked} active={active} />
            </div>
          );
        })}

        {STATIONS.filter((station) => canUseStation(station.id, stageIndex)).map((station) => (
          <div key={station.id} style={{ position: 'absolute', left: station.x, top: station.y }}>
            <StationSprite station={station} locked={false} highlighted={nearestStation?.id === station.id} />
          </div>
        ))}

        {workers.map((worker) => (
          <div key={worker.id} className="rr-worker" style={{ left: worker.x, top: worker.y }}>
            <WorkerFigure role={worker.role} carrying={worker.carrying} size={36} moving={worker.phase === 'seeking' || worker.phase === 'carrying'} />
            {distance(player.x, player.y, worker.x, worker.y) < 160 && (
              <span className="rr-worker-label">{worker.role} {worker.phase}</span>
            )}
          </div>
        ))}

        <div className="rr-player" style={{ left: player.x, top: player.y }}>
          <PlayerFigure moving={player.moving} carrying={null} size={48} facing={player.facing} />
        </div>

        {particles.map((fx) => {
          const color = fx.kind === 'magic' ? '#69f2e8' : RESOURCE_META[fx.kind === 'dust' ? 'stone' : fx.kind].color;
          return (
            <span
              key={fx.id}
              className="rr-particle"
              style={{
                left: fx.x,
                top: fx.y,
                width: fx.size,
                height: fx.size,
                color,
                background: color,
                opacity: clamp(fx.life / fx.maxLife, 0, 1),
              }}
            />
          );
        })}
        {floaters.map((floater) => (
          <span key={floater.id} className="rr-floater" style={{ left: floater.x, top: floater.y, color: floater.color, opacity: clamp(floater.life, 0, 1) }}>
            {floater.text}
          </span>
        ))}
      </div>

      <header className="rr-top-hud">
        <div style={{ pointerEvents: 'auto' }}>
          <button
            onClick={onExit}
            aria-label="Back to menu"
            title="Back"
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              border: '1px solid rgba(245, 216, 145, 0.52)',
              color: '#fff4d0',
              background: 'rgba(36, 50, 43, 0.64)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              transition: 'transform 160ms ease, background 160ms ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(58, 82, 64, 0.76)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'none';
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(36, 50, 43, 0.64)';
            }}
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <section className="rr-stage-panel" aria-label="Restoration progress" style={{ justifySelf: 'start', maxWidth: 380, marginLeft: 60 }}>
          <div className="rr-stage-title">
            <h1>{stageIndex >= STAGE_PLANS.length ? 'Registan Restored' : currentPlan.title}</h1>
            <span>{progress}%</span>
          </div>
          <div className="rr-stage-track">
            <i style={{ width: `${progress}%` }} />
          </div>
          {stageIndex < STAGE_PLANS.length && (
            <div className="rr-stage-needs" aria-label="Current material needs">
              {stageNeedEntries(stageIndex).map(([resource, amount]) => {
                const remaining = Math.max(0, amount - (stageStock[resource] || 0));
                return (
                  <span key={resource}>
                    <ResourceGlyph type={resource} size={18} />
                    {remaining}
                  </span>
                );
              })}
            </div>
          )}
        </section>

        <div className="rr-resource-bar" aria-label="Resources">
          {visibleResources.map((resource) => (
            <div key={resource} className="rr-resource-pill">
              <ResourceGlyph type={resource} size={20} />
              <span>{inventory[resource]}</span>
            </div>
          ))}
          <div className="rr-resource-pill">
            <ResourceGlyph type="gold" size={20} />
            <span>{gold}</span>
          </div>
          <div className="rr-resource-pill">
            <Backpack size={18} />
            <span>{sumInventory(inventory)}/{inventoryCap}</span>
          </div>
        </div>
      </header>

      <div className="rr-bottom-status">
        <ActionPrompt action={action} fallback={fallbackPrompt} />
        <div className="rr-message">{message}</div>
      </div>

      {cinematicText && (
        <div className="rr-cinematic">
          <h2>{cinematicText}</h2>
        </div>
      )}

      {activePanel === 'market' && (
        <div className="rr-modal-backdrop">
          <section className="rr-modal" aria-label="Bazaar market">
            <button className="rr-close-button" onClick={() => setActivePanel(null)} aria-label="Close market"><X size={19} /></button>
            <div className="rr-modal-header">
              <Coins size={25} />
              <div>
                <h2>Silk Road Bazaar</h2>
                <p>Turn surplus materials into guild contracts and tools.</p>
              </div>
            </div>
            <div className="rr-modal-grid">
              {RESOURCE_ORDER.map((resource) => {
                const price = Math.round(SELL_PRICES[resource] * getMarketMultiplier(upgrades));
                return (
                  <article key={resource} className="rr-shop-card">
                    <h3><ResourceGlyph type={resource} size={23} /> {RESOURCE_META[resource].label}</h3>
                    <p>{inventory[resource]} carried. Bazaar rate: {price} gold.</p>
                    <button className="rr-primary-command" disabled={inventory[resource] <= 0} onClick={() => sellResource(resource, false)}>
                      <Coins size={17} />
                      Sell One
                    </button>
                    <button className="rr-secondary-command" disabled={inventory[resource] <= 0} onClick={() => sellResource(resource, true)}>
                      Sell Stack
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {activePanel === 'guild' && (
        <div className="rr-modal-backdrop">
          <section className="rr-modal" aria-label="Builders guild">
            <button className="rr-close-button" onClick={() => setActivePanel(null)} aria-label="Close guild"><X size={19} /></button>
            <div className="rr-modal-header">
              <Users size={25} />
              <div>
                <h2>Builders Guild</h2>
                <p>Living workers carry materials and animate the restoration site.</p>
              </div>
            </div>
            <div className="rr-modal-grid">
              {(['builder', 'craftsman', 'architect'] as WorkerRole[]).map((role) => {
                const requiredStage = role === 'builder' ? 1 : role === 'craftsman' ? 2 : 3;
                const locked = stageIndex < requiredStage;
                const bought = hired[role];
                const cost = HIRE_COSTS[role];
                return (
                  <article key={role} className="rr-shop-card">
                    <h3><WorkerFigure role={role} size={30} /> {role}</h3>
                    <p>{role === 'builder' ? 'Carries stone and timber.' : role === 'craftsman' ? 'Works clay, kiln, and tile.' : 'Supervises the site with a restoration aura.'}</p>
                    <p>{locked ? `Unlocks after stage ${requiredStage}.` : bought ? 'Already on site.' : `${cost} gold contract.`}</p>
                    <button className="rr-primary-command" disabled={locked || bought || gold < cost} onClick={() => hireWorker(role)}>
                      <Hammer size={17} />
                      {bought ? 'Hired' : 'Hire'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {activePanel === 'workshop' && (
        <div className="rr-modal-backdrop">
          <section className="rr-modal" aria-label="Forge workshop">
            <button className="rr-close-button" onClick={() => setActivePanel(null)} aria-label="Close workshop"><X size={19} /></button>
            <div className="rr-modal-header">
              <Hammer size={25} />
              <div>
                <h2>Forge Workshop</h2>
                <p>Tools, packs, guild rhythm, kiln craft, and bazaar favor.</p>
              </div>
            </div>
            <div className="rr-modal-grid">
              {(Object.keys(UPGRADE_DEFS) as UpgradeKey[]).map((key) => {
                const def = UPGRADE_DEFS[key];
                const Icon = def.icon;
                const level = upgrades[key];
                const maxed = level >= 4;
                const cost = def.costs[level] || 0;
                return (
                  <article key={key} className="rr-shop-card">
                    <h3><Icon size={21} /> {def.label}</h3>
                    <p>{def.detail}</p>
                    <p>Level {level}/4 {maxed ? 'complete' : `to ${level + 1}: ${cost} gold`}</p>
                    <button className="rr-primary-command" disabled={maxed || gold < cost} onClick={() => buyUpgrade(key)}>
                      <Sparkles size={17} />
                      {maxed ? 'Maxed' : 'Upgrade'}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {activePanel === 'atelier' && (
        <MosaicAtelierPanel
          level={atelierLevel}
          onClose={() => setActivePanel(null)}
          onReward={completeAtelier}
        />
      )}

      {levelFinished && (
        <div style={{ position: 'fixed', bottom: 36, left: 24, zIndex: 120 }}>
          <button className="rr-primary-command" onClick={onExit}>
            Main Menu
          </button>
        </div>
      )}
    </div>
  );
}
