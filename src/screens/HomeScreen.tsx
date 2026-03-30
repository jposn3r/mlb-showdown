import { useScreenStore, type Screen } from '../store/screenStore';
import { useFranchiseStore } from '../store/franchiseStore';
import { getTeamRecord } from '../game/franchiseEngine';

const GAME_MODES: { id: Screen; title: string; desc: string }[] = [
  { id: 'quickPlaySelect', title: 'Quick Play', desc: 'Pick a preset team and play' },
  { id: 'quickPlaySelect', title: 'Hot Seat', desc: 'Two players, one device' },
  { id: 'quickPlaySelect', title: 'vs CPU', desc: 'Challenge the computer' },
  { id: 'teamBuilder', title: 'Team Builder', desc: 'Build your dream roster' },
];

export function HomeScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const franchise = useFranchiseStore((s) => s.franchise);
  const franchiseRecord = franchise ? getTeamRecord(franchise.schedule, franchise.userTeamAbbr) : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
      {/* Title */}
      <div className="text-center mb-12">
        <h1
          className="text-5xl md:text-7xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
        >
          MLB Showdown
        </h1>
        <div
          className="mt-2 h-1 w-48 mx-auto rounded"
          style={{ background: 'var(--color-gold)' }}
        />
        <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          The classic card game, reimagined for the web
        </p>
      </div>

      {/* Mode cards — 2x2 grid */}
      <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
        {GAME_MODES.map((mode) => (
          <button
            key={mode.title}
            onClick={() => navigate(mode.id)}
            className="group relative rounded-lg p-5 text-left transition-all duration-200
              hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-divider)',
            }}
          >
            <h3
              className="text-lg font-semibold group-hover:text-[var(--color-gold)] transition-colors"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {mode.title}
            </h3>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
              {mode.desc}
            </p>
          </button>
        ))}
      </div>

      {/* Franchise button — full width below grid */}
      <button
        onClick={() => navigate(franchise ? 'franchiseHub' : 'franchiseSetup')}
        className="w-full max-w-md rounded-lg p-5 text-left transition-all duration-200
          hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, var(--color-bg-surface), var(--color-bg-elevated))',
          border: '1px solid var(--color-gold-dim)',
        }}
      >
        <h3
          className="text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
        >
          Franchise Mode
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {franchise && franchiseRecord
            ? `${franchise.name} — ${franchiseRecord.wins}-${franchiseRecord.losses} (Day ${franchise.currentDay})`
            : '30-team league, full seasons, playoffs, and legacy'}
        </p>
      </button>

      {/* Settings */}
      <button
        onClick={() => navigate('settings')}
        className="mt-8 text-sm transition-colors hover:text-[var(--color-gold)]"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Settings
      </button>
    </div>
  );
}
