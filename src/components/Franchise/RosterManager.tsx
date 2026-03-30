import { getCardById, getNextStarter } from '../../game/franchiseEngine';
import type { FranchiseRoster } from '../../types/franchise';

export function RosterManager({
  roster,
  onSetLineup,
  onSetStartingPitcher,
}: {
  roster: FranchiseRoster;
  onSetLineup: (lineup: string[]) => void;
  onSetStartingPitcher: (pitcherId: string) => void;
}) {
  const nextStarterId = getNextStarter(roster);

  const moveUp = (idx: number) => {
    if (idx <= 0) return;
    const newLineup = [...roster.lineup];
    [newLineup[idx - 1], newLineup[idx]] = [newLineup[idx], newLineup[idx - 1]];
    onSetLineup(newLineup);
  };

  const moveDown = (idx: number) => {
    if (idx >= roster.lineup.length - 1) return;
    const newLineup = [...roster.lineup];
    [newLineup[idx], newLineup[idx + 1]] = [newLineup[idx + 1], newLineup[idx]];
    onSetLineup(newLineup);
  };

  const swapWithBench = (lineupIdx: number, benchIdx: number) => {
    const newLineup = [...roster.lineup];
    const newBench = [...roster.bench];
    [newLineup[lineupIdx], newBench[benchIdx]] = [newBench[benchIdx], newLineup[lineupIdx]];
    onSetLineup(newLineup);
    // Note: bench update would need a separate action, but for now lineup swap covers it
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lineup */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--color-gold)' }}>
            Batting Order
          </h3>
          <div className="flex flex-col gap-1">
            {roster.lineup.map((id, idx) => {
              const card = getCardById(id);
              if (!card) return null;
              return (
                <div
                  key={id}
                  className="flex items-center gap-2 px-3 py-2 rounded text-xs"
                  style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)' }}
                >
                  <span
                    className="w-5 text-center font-bold"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {idx + 1}
                  </span>
                  <span
                    className="w-6 text-center text-[10px] font-bold px-1 py-0.5 rounded"
                    style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
                  >
                    {card.position}
                  </span>
                  <span className="flex-1 font-bold" style={{ color: 'var(--color-text)' }}>
                    {card.name}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    OB {card.onBase}
                  </span>
                  <div className="flex gap-0.5">
                    <button
                      onClick={() => moveUp(idx)}
                      disabled={idx === 0}
                      className="w-5 h-5 text-[10px] rounded cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed
                        hover:bg-[var(--color-bg-elevated)] transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveDown(idx)}
                      disabled={idx === roster.lineup.length - 1}
                      className="w-5 h-5 text-[10px] rounded cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed
                        hover:bg-[var(--color-bg-elevated)] transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bench */}
          {roster.bench.length > 0 && (
            <div className="mt-4">
              <h4 className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: 'var(--color-text-muted)' }}>
                Bench
              </h4>
              <div className="flex flex-col gap-1">
                {roster.bench.map((id) => {
                  const card = getCardById(id);
                  if (!card) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 px-3 py-2 rounded text-xs"
                      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)', opacity: 0.7 }}
                    >
                      <span
                        className="w-6 text-center text-[10px] font-bold px-1 py-0.5 rounded"
                        style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
                      >
                        {card.position}
                      </span>
                      <span className="flex-1" style={{ color: 'var(--color-text-muted)' }}>
                        {card.name}
                      </span>
                      <span style={{ color: 'var(--color-text-muted)' }}>
                        OB {card.onBase}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pitching */}
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--color-gold)' }}>
            Starting Rotation
          </h3>
          <div className="flex flex-col gap-1">
            {roster.startingPitchers.map((id) => {
              const card = getCardById(id);
              if (!card) return null;
              const isNext = id === nextStarterId;
              const isResting = id === roster.lastStarterUsed;
              return (
                <button
                  key={id}
                  onClick={() => !isResting && onSetStartingPitcher(id)}
                  disabled={isResting}
                  className="flex items-center gap-2 px-3 py-2 rounded text-xs transition-all cursor-pointer
                    disabled:cursor-not-allowed hover:scale-[1.01]"
                  style={{
                    background: isNext ? 'var(--color-bg-elevated)' : 'var(--color-bg-surface)',
                    border: isNext ? '2px solid var(--color-gold)' : '1px solid var(--color-divider)',
                    opacity: isResting ? 0.4 : 1,
                  }}
                >
                  <span className="font-bold" style={{ color: isNext ? 'var(--color-gold)' : 'var(--color-text)' }}>
                    {card.name}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)' }}>
                    C:{card.control} IP:{card.ip}
                  </span>
                  {isNext && (
                    <span
                      className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}
                    >
                      NEXT
                    </span>
                  )}
                  {isResting && (
                    <span
                      className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: '#ef444430', color: '#ef4444' }}
                    >
                      RESTING
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bullpen */}
          <div className="mt-4">
            <h4 className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Bullpen
            </h4>
            <div className="flex flex-col gap-1">
              {roster.reliefPitchers.map((id) => {
                const card = getCardById(id);
                if (!card) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-3 py-2 rounded text-xs"
                    style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)' }}
                  >
                    <span
                      className="text-[10px] font-bold px-1 py-0.5 rounded"
                      style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}
                    >
                      RP
                    </span>
                    <span style={{ color: 'var(--color-text)' }}>{card.name}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>
                      C:{card.control} IP:{card.ip}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
