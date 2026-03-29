import type { GameState } from '../../game/stateMachine';

interface Props {
  gameState: GameState;
}

export function Scoreboard({ gameState }: Props) {
  const { away, home, inning, halfInning, outs } = gameState;
  const maxInnings = Math.max(away.inningRuns.length, home.inningRuns.length, 9);

  return (
    <div
      className="rounded-lg overflow-hidden text-xs font-mono"
      style={{ background: 'var(--color-scoreboard-bg)', border: '1px solid var(--color-divider)' }}
    >
      {/* Header row */}
      <div className="flex">
        <div className="w-20 shrink-0" />
        {Array.from({ length: maxInnings }, (_, i) => (
          <div
            key={i}
            className="w-7 text-center py-1"
            style={{
              color: i + 1 === inning ? 'var(--color-scoreboard-amber)' : 'var(--color-text-muted)',
              fontWeight: i + 1 === inning ? 'bold' : 'normal',
            }}
          >
            {i + 1}
          </div>
        ))}
        <div className="w-8 text-center py-1 font-bold" style={{ color: 'var(--color-scoreboard-amber)' }}>R</div>
        <div className="w-8 text-center py-1" style={{ color: 'var(--color-text-muted)' }}>H</div>
      </div>

      {/* Away row */}
      <div className="flex" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div
          className="w-20 shrink-0 px-2 py-1 font-bold truncate"
          style={{ color: halfInning === 'top' ? 'var(--color-scoreboard-amber)' : 'var(--color-text-muted)' }}
        >
          {away.name}
        </div>
        {Array.from({ length: maxInnings }, (_, i) => (
          <div
            key={i}
            className="w-7 text-center py-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {away.inningRuns[i] ?? (i < away.inningRuns.length ? '0' : '-')}
          </div>
        ))}
        <div className="w-8 text-center py-1 font-bold" style={{ color: 'var(--color-scoreboard-amber)' }}>
          {away.score}
        </div>
        <div className="w-8 text-center py-1" style={{ color: 'var(--color-text-muted)' }}>
          {away.hits}
        </div>
      </div>

      {/* Home row */}
      <div className="flex" style={{ borderTop: '1px solid var(--color-divider)' }}>
        <div
          className="w-20 shrink-0 px-2 py-1 font-bold truncate"
          style={{ color: halfInning === 'bottom' ? 'var(--color-scoreboard-amber)' : 'var(--color-text-muted)' }}
        >
          {home.name}
        </div>
        {Array.from({ length: maxInnings }, (_, i) => (
          <div
            key={i}
            className="w-7 text-center py-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {home.inningRuns[i] ?? (i < home.inningRuns.length ? '0' : '-')}
          </div>
        ))}
        <div className="w-8 text-center py-1 font-bold" style={{ color: 'var(--color-scoreboard-amber)' }}>
          {home.score}
        </div>
        <div className="w-8 text-center py-1" style={{ color: 'var(--color-text-muted)' }}>
          {home.hits}
        </div>
      </div>

      {/* Inning + Outs indicator */}
      <div
        className="flex items-center justify-center gap-4 py-1.5"
        style={{ borderTop: '1px solid var(--color-divider)' }}
      >
        <span style={{ color: 'var(--color-scoreboard-amber)' }}>
          {halfInning === 'top' ? '▲' : '▼'} {inning}
        </span>
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                background: i < outs ? 'var(--color-scoreboard-amber)' : 'transparent',
                border: `1.5px solid ${i < outs ? 'var(--color-scoreboard-amber)' : 'var(--color-text-muted)'}`,
              }}
            />
          ))}
          <span className="ml-1 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>OUTS</span>
        </div>
      </div>
    </div>
  );
}
