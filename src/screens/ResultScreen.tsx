import { useGameStore } from '../store/gameStore';
import { useScreenStore } from '../store/screenStore';
import { getWinner } from '../game/stateMachine';

export function ResultScreen() {
  const { gameState, resetGame } = useGameStore();
  const navigate = useScreenStore((s) => s.navigate);

  if (!gameState) {
    navigate('home');
    return null;
  }

  const winner = getWinner(gameState);
  const winnerTeam = winner === 'away' ? gameState.away : gameState.home;
  const loserTeam = winner === 'away' ? gameState.home : gameState.away;
  const maxInnings = Math.max(gameState.away.inningRuns.length, gameState.home.inningRuns.length);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Final score */}
      <h1
        className="text-4xl md:text-6xl font-bold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
      >
        Final Score
      </h1>

      <div className="flex items-center gap-6 mb-8 text-3xl md:text-5xl font-bold">
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
      <div className="flex gap-4">
        <button
          onClick={() => {
            // Rematch with same teams
            navigate('quickPlaySelect');
          }}
          className="px-6 py-2.5 rounded-lg font-bold cursor-pointer transition-all hover:scale-105"
          style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}
        >
          Rematch
        </button>
        <button
          onClick={() => {
            resetGame();
            navigate('home');
          }}
          className="px-6 py-2.5 rounded-lg cursor-pointer transition-colors"
          style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-divider)' }}
        >
          Main Menu
        </button>
      </div>
    </div>
  );
}
