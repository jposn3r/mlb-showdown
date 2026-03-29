import type { OutcomeChart as ChartType } from '../../types';

interface Props {
  chart: ChartType;
  activeRoll?: number;
}

const RESULT_FULL: Record<string, string> = {
  SO: 'Strikeout', GB: 'Ground Out', FB: 'Fly Out', DP: 'Double Play',
  BB: 'Walk', '1B': 'Single', '2B': 'Double', '3B': 'Triple', HR: 'Home Run',
};

/**
 * Groups consecutive identical results into ranges.
 */
function groupResults(chart: ChartType) {
  const groups: { result: string; from: number; to: number }[] = [];
  let current: { result: string; from: number; to: number } | null = null;

  for (let i = 1; i <= 20; i++) {
    const result = chart[i] ?? '?';
    if (current && current.result === result) {
      current.to = i;
    } else {
      if (current) groups.push(current);
      current = { result, from: i, to: i };
    }
  }
  if (current) groups.push(current);
  return groups;
}

export function OutcomeChart({ chart, activeRoll }: Props) {
  const groups = groupResults(chart);

  return (
    <div className="h-full flex flex-col gap-[2px] font-mono overflow-hidden">
      {groups.map((group) => {
        const isActive = activeRoll !== undefined && activeRoll >= group.from && activeRoll <= group.to;
        const rangeStr = group.from === group.to ? `${group.from}` : `${group.from}–${group.to}`;
        const isOut = ['SO', 'GB', 'FB', 'DP'].includes(group.result);

        return (
          <div
            key={group.from}
            className="flex items-center rounded-sm px-2"
            style={{
              background: isActive ? 'rgba(201, 168, 76, 0.25)' : 'rgba(255,255,255,0.04)',
              outline: isActive ? '2px solid var(--color-gold)' : 'none',
              minHeight: '16px',
              flex: `${group.to - group.from + 1} 0 0`,
            }}
          >
            <span className="w-12 text-right pr-3 text-white/40" style={{ fontSize: '11px' }}>
              {rangeStr}
            </span>
            <span
              className="font-bold text-[12px]"
              style={{ color: isActive ? '#fff' : isOut ? 'rgba(255,255,255,0.5)' : '#fff' }}
            >
              {group.result}
            </span>
            <span
              className="ml-2 text-[10px]"
              style={{ color: isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)' }}
            >
              {RESULT_FULL[group.result] ?? ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
