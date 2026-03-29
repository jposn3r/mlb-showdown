import type { Bases } from '../../game/baserunning';
import type { PlayerCard } from '../../types';

function getHeadshotUrl(mlbPlayerId: number): string {
  if (!mlbPlayerId) return '';
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_120,q_auto:best/v1/people/${mlbPlayerId}/headshot/silo/current`;
}

interface Props {
  bases: Bases;
  /** Map of runner ID → PlayerCard so we can show headshots */
  runners?: Map<string, PlayerCard>;
}

function RunnerOnBase({ x, y, runner }: { x: number; y: number; runner: PlayerCard | undefined }) {
  if (!runner) return null;
  const headshotUrl = runner.mlbPlayerId ? getHeadshotUrl(runner.mlbPlayerId) : '';

  return (
    <g>
      {/* Circle background */}
      <circle cx={x} cy={y} r="22" fill="#1a1d24" stroke="var(--color-gold)" strokeWidth="2" />
      {/* Clip the headshot to circle */}
      <clipPath id={`clip-${runner.id}`}>
        <circle cx={x} cy={y} r="20" />
      </clipPath>
      {headshotUrl ? (
        <image
          href={headshotUrl}
          x={x - 20}
          y={y - 24}
          width="40"
          height="48"
          clipPath={`url(#clip-${runner.id})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          {runner.name.split(' ').pop()?.charAt(0)}
        </text>
      )}
      {/* Name label below */}
      <rect x={x - 28} y={y + 22} width="56" height="14" rx="3" fill="rgba(0,0,0,0.8)" />
      <text x={x} y={y + 32} textAnchor="middle" fill="white" fontSize="7" fontFamily="var(--font-mono)">
        {runner.name.split(' ').pop()?.slice(0, 8)}
      </text>
    </g>
  );
}

export function BaseballDiamond({ bases, runners }: Props) {
  const [firstId, secondId, thirdId] = bases;
  const firstRunner = firstId && runners ? runners.get(firstId) : undefined;
  const secondRunner = secondId && runners ? runners.get(secondId) : undefined;
  const thirdRunner = thirdId && runners ? runners.get(thirdId) : undefined;

  return (
    <svg viewBox="0 0 280 260" className="w-full h-full">
      {/* Infield dirt */}
      <polygon
        points="140,40 230,130 140,220 50,130"
        fill="rgba(139,109,56,0.08)"
        stroke="var(--color-divider)"
        strokeWidth="1.5"
      />

      {/* Base paths */}
      <line x1="140" y1="220" x2="230" y2="130" stroke="var(--color-divider)" strokeWidth="1.5" />
      <line x1="230" y1="130" x2="140" y2="40" stroke="var(--color-divider)" strokeWidth="1.5" />
      <line x1="140" y1="40" x2="50" y2="130" stroke="var(--color-divider)" strokeWidth="1.5" />
      <line x1="50" y1="130" x2="140" y2="220" stroke="var(--color-divider)" strokeWidth="1.5" />

      {/* Home plate */}
      <polygon
        points="133,220 140,232 147,220 147,214 133,214"
        fill="white"
        opacity="0.7"
      />

      {/* Base diamonds (empty state) */}
      {/* 1st base */}
      <rect
        x="222" y="122" width="16" height="16"
        fill={firstId ? 'var(--color-gold)' : 'var(--color-bg-elevated)'}
        stroke="var(--color-text-muted)" strokeWidth="1"
        transform="rotate(45, 230, 130)" rx="1"
      />
      {/* 2nd base */}
      <rect
        x="132" y="32" width="16" height="16"
        fill={secondId ? 'var(--color-gold)' : 'var(--color-bg-elevated)'}
        stroke="var(--color-text-muted)" strokeWidth="1"
        transform="rotate(45, 140, 40)" rx="1"
      />
      {/* 3rd base */}
      <rect
        x="42" y="122" width="16" height="16"
        fill={thirdId ? 'var(--color-gold)' : 'var(--color-bg-elevated)'}
        stroke="var(--color-text-muted)" strokeWidth="1"
        transform="rotate(45, 50, 130)" rx="1"
      />

      {/* Pitcher's mound */}
      <circle cx="140" cy="145" r="6" fill="var(--color-bg-elevated)" stroke="var(--color-divider)" />

      {/* Runner headshots on bases */}
      <RunnerOnBase x={230} y={95} runner={firstRunner} />
      <RunnerOnBase x={140} y={10} runner={secondRunner} />
      <RunnerOnBase x={50} y={95} runner={thirdRunner} />
    </svg>
  );
}
