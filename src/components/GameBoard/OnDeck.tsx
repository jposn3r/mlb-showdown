import type { PlayerCard } from '../../types';

function getHeadshotUrl(mlbPlayerId: number): string {
  if (!mlbPlayerId) return '';
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_213,q_auto:best/v1/people/${mlbPlayerId}/headshot/silo/current`;
}

interface Props {
  nextBatters: PlayerCard[];
}

export function OnDeck({ nextBatters }: Props) {
  if (nextBatters.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2 mb-2">
      <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold">On Deck</span>
      <div className="flex gap-3">
        {nextBatters.slice(0, 2).map((batter) => (
          <div
            key={batter.id}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="w-14 h-14 rounded-full overflow-hidden bg-[#111] shrink-0">
              {batter.mlbPlayerId ? (
                <img
                  src={getHeadshotUrl(batter.mlbPlayerId)}
                  alt={batter.name}
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : null}
            </div>
            <div className="leading-tight">
              <div className="text-sm text-white font-bold truncate max-w-[110px]">
                {batter.name.split(' ').pop()}
              </div>
              <div className="text-xs text-white/40">
                {batter.position}
              </div>
              <div className="text-lg font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}>
                OB {batter.onBase}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
