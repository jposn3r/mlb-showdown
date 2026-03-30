import { useGameStore } from '../store/gameStore';
import { useScreenStore } from '../store/screenStore';
import { useFranchiseStore } from '../store/franchiseStore';
import { getWinner } from '../game/stateMachine';
import { getTeamRecord } from '../game/franchiseEngine';

export function FranchiseResultScreen() {
  const { gameState } = useGameStore();
  const navigate = useScreenStore((s) => s.navigate);
  const { franchise, recordFranchiseGameResult } = useFranchiseStore();

  if (!gameState || !franchise) {
    navigate('franchiseHub');
    return null;
  }

  const winner = getWinner(gameState);
  const userTeamAbbr = franchise.userTeamAbbr;
  const userWon = (winner === 'away' && gameState.away.name === userTeamAbbr)
    || (winner === 'home' && gameState.home.name === userTeamAbbr);

  const maxInnings = Math.max(gameState.away.inningRuns.length, gameState.home.inningRuns.length);

  // Preview what the record will be after recording
  const currentRecord = getTeamRecord(franchise.schedule, userTeamAbbr);
  const newRecord = {
    wins: currentRecord.wins + (userWon ? 1 : 0),
    losses: currentRecord.losses + (userWon ? 0 : 1),
  };

  const handleReturn = () => {
    recordFranchiseGameResult();
    navigate('franchiseHub');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Win/Loss banner */}
      <div
        className="text-lg font-bold uppercase tracking-wider mb-2"
        style={{ color: userWon ? '#22c55e' : '#ef4444' }}
      >
        {userWon ? 'Victory!' : 'Defeat'}
      </div>

      {/* Final score */}
      <h1
        className="text-4xl md:text-6xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
      >
        Final Score
      </h1>

      <div className="flex items-center gap-6 mb-4 text-3xl md:text-5xl font-bold">
        <div className="text-center">
          <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Away</div>
          <div style={{ color: winner === 'away' ? 'var(--color-gold)' : 'var(--color-text-muted)' }}>
            {gameState.away.name}
          </div>
          <div>{gameState.away.score}</div>
        </div>
        <span style={{ color: 'var(--color-text-muted)' }}>—</span>
        <div className="text-center">
          <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>Home</div>
          <div style={{ color: winner === 'home' ? 'var(--color-gold)' : 'var(--color-text-muted)' }}>
            {gameState.home.name}
          </div>
          <div>{gameState.home.score}</div>
        </div>
      </div>

      {/* Updated record */}
      <div className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        {franchise.name} is now{' '}
        <span className="font-bold" style={{ color: 'var(--color-text)' }}>
          {newRecord.wins}-{newRecord.losses}
        </span>
      </div>

      {/* Box score table */}
      <div
        className="rounded-lg overflow-hidden mb-8 text-xs font-mono w-full max-w-xl"
        style={{ background: 'var(--color-scoreboard-bg)', border: '1px solid var(--color-divider)' }}
      >
        <div className="flex">
          <div className="w-16 shrink-0" />
          {Array.from({ length: maxInnings }, (_, i) => (
            <div key={i} className="w-7 text-center py-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {i + 1}
            </div>
          ))}
          <div className="w-8 text-center py-1.5 font-bold" style={{ color: 'var(--color-scoreboard-amber)' }}>R</div>
          <div className="w-8 text-center py-1.5" style={{ color: 'var(--color-text-muted)' }}>H</div>
        </div>
        {[gameState.away, gameState.home].map((team) => (
          <div key={team.name} className="flex" style={{ borderTop: '1px solid var(--color-divider)' }}>
            <div className="w-16 shrink-0 px-2 py-1.5 font-bold" style={{ color: 'var(--color-scoreboard-amber)' }}>
              {team.name}
            </div>
            {Array.from({ length: maxInnings }, (_, i) => (
              <div key={i} className="w-7 text-center py-1.5" style={{ color: 'var(--color-text-muted)' }}>
                {team.inningRuns[i] ?? '-'}
              </div>
            ))}
            <div className="w-8 text-center py-1.5 font-bold" style={{ color: 'var(--color-scoreboard-amber)' }}>
              {team.score}
            </div>
            <div className="w-8 text-center py-1.5" style={{ color: 'var(--color-text-muted)' }}>
              {team.hits}
            </div>
          </div>
        ))}
      </div>

      {/* Key plays */}
      <div className="w-full max-w-xl mb-8">
        <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--color-gold)' }}>Highlights</h3>
        <div
          className="rounded-lg p-3 max-h-48 overflow-y-auto text-xs font-mono"
          style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)' }}
        >
          {gameState.gameLog
            .filter((e) => ['HR', '3B', '2B', 'DP'].includes(e.result) || e.runsScored > 0)
            .map((entry, i) => (
              <div key={i} className="py-0.5">
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {entry.halfInning === 'top' ? '▲' : '▼'}{entry.inning}{' '}
                </span>
                <span style={{
                  color: entry.result === 'HR' ? 'var(--color-gold)' : '#70a0ff',
                }}>
                  {entry.description}
                </span>
                {entry.runsScored > 0 && (
                  <span style={{ color: 'var(--color-gold)' }}>
                    {' '}({entry.runsScored}R)
                  </span>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={handleReturn}
        className="px-8 py-3 rounded-lg font-bold text-lg cursor-pointer transition-all hover:scale-105"
        style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}
      >
        Return to Franchise
      </button>
    </div>
  );
}
