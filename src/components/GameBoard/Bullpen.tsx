import type { PlayerCard } from '../../types';

function getHeadshotUrl(mlbPlayerId: number): string {
  if (!mlbPlayerId) return '';
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_213,q_auto:best/v1/people/${mlbPlayerId}/headshot/silo/current`;
}

interface Props {
  availablePitchers: PlayerCard[];
  currentPitcherId: string;
  onSelectPitcher: (pitcher: PlayerCard) => void;
  disabled?: boolean;
}

export function Bullpen({ availablePitchers, currentPitcherId, onSelectPitcher, disabled }: Props) {
  const others = availablePitchers.filter((p) => p.id !== currentPitcherId);
  if (others.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2 mb-2">
      <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">Bullpen</span>
      <div className="flex gap-3">
        {others.slice(0, 2).map((p) => (
          <button
            key={p.id}
            onClick={() => !disabled && onSelectPitcher(p)}
            disabled={disabled}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all
              ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/10'}`}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#111] shrink-0">
              {p.mlbPlayerId ? (
                <img
                  src={getHeadshotUrl(p.mlbPlayerId)}
                  alt={p.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
            </div>
            <div className="leading-tight text-left">
              <div className="text-sm text-white font-bold truncate max-w-[110px]">
                {p.name.split(' ').pop()}
              </div>
              <div className="text-xs text-white/40">
                {p.position}
              </div>
              <div className="text-lg font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}>
                CTRL {p.control}
              </div>
            </div>
          </button>
        ))}
      </div>
      {!disabled && (
        <span className="text-[9px] text-white/20">Click to sub in</span>
      )}
    </div>
  );
}
