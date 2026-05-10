import type { CSSProperties } from 'react';

export type ResourceType = 'stone' | 'timber' | 'clay' | 'mosaic' | 'gold';
export type WorkerKind = 'player' | 'builder' | 'craftsman' | 'architect';
export type NodeKind = 'stone' | 'timber' | 'clay';
export type StationKind = 'market' | 'hiring' | 'kiln';

const shadow: CSSProperties = {
  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.35))',
};

export function ResourceIcon({ type, size = 20 }: { type: ResourceType; size?: number }) {
  const s = size;
  if (type === 'stone') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" style={shadow}>
        <path d="M3 13 8 6l8-1 5 6-2 8H6z" fill="#8e8e8e" stroke="#535353" strokeWidth="1.2" />
        <path d="m8 6 4 5 6-2" stroke="#b8b8b8" strokeWidth="1.2" fill="none" />
      </svg>
    );
  }
  if (type === 'timber') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" style={shadow}>
        <rect x="4" y="8" width="14" height="5" rx="2.5" fill="#98623a" />
        <rect x="6" y="12" width="14" height="5" rx="2.5" fill="#b07443" />
        <circle cx="18" cy="10.5" r="2" fill="#d8a06d" />
      </svg>
    );
  }
  if (type === 'clay') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" style={shadow}>
        <path d="M4 14c0-3 2-6 8-6s8 3 8 6-3 6-8 6-8-3-8-6Z" fill="#b96a43" />
        <path d="M8 12c1.5-1 5-1 8 0" stroke="#cf8a64" strokeWidth="1.4" />
      </svg>
    );
  }
  if (type === 'mosaic') {
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" style={shadow}>
        <rect x="3" y="3" width="18" height="18" rx="3" fill="#1f5d9b" />
        <rect x="6" y="6" width="5" height="5" fill="#5ec3d9" />
        <rect x="13" y="6" width="5" height="5" fill="#87e4ef" />
        <rect x="6" y="13" width="5" height="5" fill="#3d93cb" />
        <rect x="13" y="13" width="5" height="5" fill="#9cf4ff" />
      </svg>
    );
  }
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={shadow}>
      <circle cx="12" cy="12" r="9" fill="#d8a21f" stroke="#996f15" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="4" fill="#e9c75c" />
    </svg>
  );
}

export function WorkerSprite({
  kind,
  size = 28,
  carrying,
}: {
  kind: WorkerKind;
  size?: number;
  carrying?: ResourceType | null;
}) {
  const palette =
    kind === 'player'
      ? { robe: '#1d4f7a', trim: '#f2d7a1', hat: '#5ea7d1' }
      : kind === 'builder'
        ? { robe: '#3f8a4d', trim: '#d9f5df', hat: '#c98f38' }
        : kind === 'craftsman'
          ? { robe: '#7a4a90', trim: '#f3dcff', hat: '#c4756d' }
          : { robe: '#2f5f95', trim: '#d6f0ff', hat: '#f1c15d' };

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg width={size} height={size} viewBox="0 0 32 32" style={shadow}>
        <ellipse cx="16" cy="29" rx="8" ry="2.2" fill="rgba(0,0,0,0.24)" />
        <circle cx="16" cy="9" r="5.2" fill="#f3cda8" />
        <path d="M7 26c0-7 3-12 9-12s9 5 9 12z" fill={palette.robe} />
        <path d="M13 16h6v10h-6z" fill={palette.trim} opacity="0.6" />
        <path d="M10 8c2-4 10-4 12 0v2H10z" fill={palette.hat} />
        {kind === 'architect' && <rect x="20.5" y="16" width="6" height="4" rx="0.7" fill="#dbefff" stroke="#386ca2" strokeWidth="0.8" />}
        {kind === 'player' && <rect x="22" y="17" width="4.5" height="6" rx="1" fill="#8b5c35" />}
      </svg>
      {carrying && (
        <div style={{ position: 'absolute', right: -4, top: 2 }}>
          <ResourceIcon type={carrying} size={12} />
        </div>
      )}
    </div>
  );
}

export function NodeSprite({ kind, size = 72, locked = false }: { kind: NodeKind; size?: number; locked?: boolean }) {
  const alpha = locked ? 0.26 : 1;
  if (kind === 'stone') {
    return (
      <div style={{ width: size, height: size, opacity: alpha }}>
        <svg width={size} height={size} viewBox="0 0 72 72">
          <ellipse cx="36" cy="62" rx="20" ry="6" fill="rgba(0,0,0,0.2)" />
          <path d="M16 44 24 26l14-6 14 6 8 18-6 10H22z" fill="#868686" stroke="#4f4f4f" strokeWidth="2" />
          <path d="m24 26 12 9 16-6" stroke="#b5b5b5" strokeWidth="2" fill="none" />
        </svg>
      </div>
    );
  }
  if (kind === 'timber') {
    return (
      <div style={{ width: size, height: size, opacity: alpha }}>
        <svg width={size} height={size} viewBox="0 0 72 72">
          <ellipse cx="36" cy="62" rx="20" ry="6" fill="rgba(0,0,0,0.2)" />
          <rect x="30" y="24" width="12" height="28" rx="4" fill="#7d5332" />
          <circle cx="36" cy="22" r="14" fill="#4f9449" />
          <circle cx="27" cy="27" r="8" fill="#5aa652" />
          <circle cx="45" cy="28" r="8" fill="#5aa652" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, opacity: alpha }}>
      <svg width={size} height={size} viewBox="0 0 72 72">
        <ellipse cx="36" cy="62" rx="20" ry="6" fill="rgba(0,0,0,0.2)" />
        <ellipse cx="36" cy="44" rx="19" ry="12" fill="#b26a46" stroke="#7f472d" strokeWidth="2" />
        <path d="M22 41c6-4 22-4 28 0" stroke="#d09572" strokeWidth="2" />
        <path d="M30 36c4-2 8-2 12 0" stroke="#d09572" strokeWidth="2" />
      </svg>
    </div>
  );
}

export function StationSprite({ kind, width = 132, height = 74 }: { kind: StationKind; width?: number; height?: number }) {
  const roof = kind === 'market' ? '#a24f2f' : kind === 'hiring' ? '#4a5f86' : '#8c5837';
  const wall = kind === 'market' ? '#d9b384' : kind === 'hiring' ? '#9ea9bd' : '#c79d73';
  return (
    <svg width={width} height={height} viewBox="0 0 132 74">
      <ellipse cx="66" cy="68" rx="44" ry="5" fill="rgba(0,0,0,0.16)" />
      <rect x="18" y="26" width="96" height="34" rx="6" fill={wall} stroke="#4e3425" strokeWidth="2" />
      <path d="M14 28 66 8l52 20v7H14z" fill={roof} stroke="#4e3425" strokeWidth="2" />
      {kind === 'market' && <circle cx="66" cy="43" r="9" fill="#d8a21f" stroke="#8f6510" strokeWidth="1.3" />}
      {kind === 'hiring' && <rect x="54" y="34" width="24" height="18" rx="2" fill="#f2e8cd" stroke="#666" />}
      {kind === 'kiln' && <path d="M54 55c0-8 5-13 12-13s12 5 12 13z" fill="#5f3924" />}
    </svg>
  );
}

export function BuildSiteRing({ size = 168, active = false }: { size?: number; active?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 168 168">
      <circle cx="84" cy="84" r="72" fill={active ? 'rgba(44,137,190,0.25)' : 'rgba(58,96,134,0.18)'} stroke={active ? '#56c8ff' : '#345984'} strokeDasharray="7 5" strokeWidth="4" />
      <circle cx="84" cy="84" r="52" fill="rgba(180,207,224,0.08)" />
    </svg>
  );
}

export function RegistanStage({ stage }: { stage: 0 | 1 | 2 | 3 | 4 }) {
  return (
    <svg width={160} height={122} viewBox="0 0 160 122" style={shadow}>
      <ellipse cx="80" cy="106" rx="58" ry="8" fill="rgba(0,0,0,0.2)" />
      <rect x="18" y="78" width="124" height="26" rx="4" fill={stage >= 1 ? '#9a7d5f' : '#6e5949'} />
      <rect x="22" y="84" width="116" height="5" fill="rgba(78,54,38,0.22)" />

      {stage === 0 && (
        <>
          <path d="M30 84 50 58l17 26zM73 84l16-22 15 22zM106 84l14-17 11 17z" fill="#725b46" />
          <rect x="26" y="92" width="14" height="8" fill="#88715a" />
          <rect x="46" y="95" width="10" height="6" fill="#7d6752" />
          <rect x="96" y="93" width="9" height="7" fill="#806a54" />
          <circle cx="62" cy="96" r="1.3" fill="#b5946d">
            <animate attributeName="opacity" values="0.2;0.55;0.2" dur="2.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="90" cy="94" r="1.2" fill="#b5946d">
            <animate attributeName="opacity" values="0.15;0.48;0.15" dur="2.6s" repeatCount="indefinite" />
          </circle>
        </>
      )}

      {stage >= 1 && (
        <>
          <rect x="30" y="58" width="100" height="24" fill="#ac8a68" />
          <rect x="36" y="62" width="88" height="14" fill="#b59572" />
          <path d="M44 80V62M58 80V62M72 80V62M86 80V62M100 80V62M114 80V62" stroke="rgba(91,63,45,0.28)" strokeWidth="1.2" />
        </>
      )}

      {stage >= 2 && (
        <>
          <rect x="24" y="38" width="14" height="44" fill="#b09372" />
          <rect x="122" y="38" width="14" height="44" fill="#b09372" />
          <rect x="52" y="30" width="56" height="52" fill="#c29f79" />
          <path d="M38 50h84M38 58h84" stroke="#7d5f44" strokeWidth="2" strokeDasharray="6 4" />
          <path d="M48 82V36M64 82V34M80 82V34M96 82V34M112 82V36" stroke="#856746" strokeWidth="2" />
        </>
      )}

      {stage >= 3 && (
        <>
          <rect x="58" y="22" width="44" height="18" rx="8" fill="#cab08e" />
          <path d="M58 46h44v36H58z" fill="#d3b68f" />
          <path d="M64 46h32a16 16 0 0 1-32 0z" fill="#bb9a73" />
          <rect x="32" y="42" width="20" height="40" fill="#b99a77" />
          <rect x="108" y="42" width="20" height="40" fill="#b99a77" />
          <path d="M36 52h12M112 52h12" stroke="#7e6145" strokeWidth="1.4" />
          <path d="M58 24c3-9 16-13 22-13s19 4 22 13z" fill="#7ab6c9" opacity="0.8" />
          <path d="M61 30h38" stroke="#4f7f8e" strokeWidth="1.2" strokeDasharray="2 3" />
        </>
      )}

      {stage >= 4 && (
        <>
          <rect x="52" y="30" width="56" height="52" fill="#4f99c6" />
          <rect x="32" y="42" width="20" height="40" fill="#5ea8cc" />
          <rect x="108" y="42" width="20" height="40" fill="#5ea8cc" />
          <rect x="58" y="40" width="8" height="8" fill="#8ce8ef" />
          <rect x="67" y="40" width="8" height="8" fill="#2b6baf" />
          <rect x="76" y="40" width="8" height="8" fill="#a2f8ff" />
          <rect x="85" y="40" width="8" height="8" fill="#3c8fcb" />
          <rect x="94" y="40" width="8" height="8" fill="#8ce8ef" />
          <rect x="58" y="50" width="8" height="8" fill="#3c8fcb" />
          <rect x="67" y="50" width="8" height="8" fill="#8ce8ef" />
          <rect x="76" y="50" width="8" height="8" fill="#2b6baf" />
          <rect x="85" y="50" width="8" height="8" fill="#a2f8ff" />
          <rect x="94" y="50" width="8" height="8" fill="#3c8fcb" />
          <path d="M65 82V64h30v18z" fill="#bd9a70" />
          <path d="M65 64a15 15 0 0 1 30 0" fill="#1f4e80" />
          <path d="M58 24c4-10 16-15 22-15s18 5 22 15z" fill="#3da0cf" />
          <path d="M56 24c5-14 18-20 24-20s19 6 24 20" fill="rgba(162,248,255,0.35)" />
          <circle cx="80" cy="16" r="2.2" fill="#ffe7a8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <rect x="36" y="34" width="1.8" height="10" fill="#5d3f2e" />
          <rect x="122.2" y="34" width="1.8" height="10" fill="#5d3f2e" />
          <path d="M38 34c7 0 7 7 0 7z" fill="#d89a3d">
            <animate attributeName="d" values="M38 34c7 0 7 7 0 7z;M38 34c8 0 6 8 0 7z;M38 34c7 0 7 7 0 7z" dur="1.6s" repeatCount="indefinite" />
          </path>
          <path d="M124 34c-7 0-7 7 0 7z" fill="#d89a3d">
            <animate attributeName="d" values="M124 34c-7 0-7 7 0 7z;M124 34c-8 0-6 8 0 7z;M124 34c-7 0-7 7 0 7z" dur="1.6s" repeatCount="indefinite" />
          </path>
          <path d="M52 30h56" stroke="rgba(140,246,255,0.65)" strokeWidth="1.2">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="2.4s" repeatCount="indefinite" />
          </path>
        </>
      )}
    </svg>
  );
}

export function SparkleBurst() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 16 }).map((_, i) => (
        <span
          key={i}
          className="absolute registan-sparkle"
          style={{
            left: `${10 + ((i * 17) % 80)}%`,
            top: `${15 + ((i * 23) % 65)}%`,
            animationDelay: `${i * 35}ms`,
          }}
        />
      ))}
    </div>
  );
}
