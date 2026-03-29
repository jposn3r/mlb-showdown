import { useRef, useEffect } from 'react';
import type { GameLogEntry } from '../../game/stateMachine';

interface Props {
  entries: GameLogEntry[];
}

export function GameLog({ entries }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  return (
    <div
      ref={scrollRef}
      className="h-32 overflow-y-auto rounded-lg px-3 py-2 text-xs font-mono"
      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)' }}
    >
      {entries.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>Game log will appear here...</p>
      )}
      {entries.map((entry, i) => {
        const isHit = ['1B', '2B', '3B', 'HR'].includes(entry.result);
        const isHR = entry.result === 'HR';
        const prefix = `${entry.halfInning === 'top' ? '▲' : '▼'}${entry.inning}`;

        return (
          <div key={i} className="py-0.5">
            <span style={{ color: 'var(--color-text-muted)' }}>{prefix} </span>
            <span style={{
              color: isHR ? 'var(--color-gold)' : isHit ? '#70a0ff' : 'var(--color-text-muted)',
              fontWeight: isHR ? 'bold' : 'normal',
            }}>
              {entry.description}
            </span>
            {entry.runsScored > 0 && (
              <span style={{ color: 'var(--color-gold)' }}>
                {' '}({entry.runsScored} run{entry.runsScored > 1 ? 's' : ''})
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
