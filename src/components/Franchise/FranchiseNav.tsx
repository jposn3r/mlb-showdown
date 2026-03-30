import type { FranchiseTab } from '../../types/franchise';

const TABS: { id: FranchiseTab; label: string }[] = [
  { id: 'schedule', label: 'Schedule' },
  { id: 'standings', label: 'Standings' },
  { id: 'roster', label: 'Roster' },
  { id: 'leaders', label: 'Leaders' },
];

export function FranchiseNav({
  activeTab,
  onTabChange,
}: {
  activeTab: FranchiseTab;
  onTabChange: (tab: FranchiseTab) => void;
}) {
  return (
    <div
      className="flex overflow-x-auto gap-1 px-4 py-2 shrink-0"
      style={{ background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-divider)' }}
    >
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all whitespace-nowrap cursor-pointer"
          style={{
            color: activeTab === tab.id ? 'var(--color-gold)' : 'var(--color-text-muted)',
            background: activeTab === tab.id ? 'var(--color-bg-elevated)' : 'transparent',
            borderBottom: activeTab === tab.id ? '2px solid var(--color-gold)' : '2px solid transparent',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
