import { useMemo } from 'react';
import type { PlayerSeasonStats } from '../../types/franchise';

export function StatLeaders({
  seasonStats,
  userTeamAbbr,
}: {
  seasonStats: Record<string, PlayerSeasonStats>;
  userTeamAbbr: string;
}) {
  const stats = useMemo(() => Object.values(seasonStats), [seasonStats]);

  const hrLeaders = useMemo(() =>
    stats.filter(s => s.hr > 0).sort((a, b) => b.hr - a.hr).slice(0, 5),
    [stats],
  );

  const battingLeaders = useMemo(() =>
    stats.filter(s => s.ab >= 10).sort((a, b) => {
      const aAvg = a.hits / a.ab;
      const bAvg = b.hits / b.ab;
      return bAvg - aAvg;
    }).slice(0, 5),
    [stats],
  );

  const soLeaders = useMemo(() =>
    stats.filter(s => s.soRecorded > 0).sort((a, b) => b.soRecorded - a.soRecorded).slice(0, 5),
    [stats],
  );

  const winLeaders = useMemo(() =>
    stats.filter(s => s.wins > 0).sort((a, b) => b.wins - a.wins).slice(0, 5),
    [stats],
  );

  if (stats.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No stats yet. Play some games to see leaderboards.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LeaderBoard title="Home Run Leaders" rows={hrLeaders} statKey="hr" userTeamAbbr={userTeamAbbr} />
        <LeaderBoard
          title="Batting Average"
          rows={battingLeaders}
          statKey="avg"
          userTeamAbbr={userTeamAbbr}
          formatStat={(s) => (s.hits / s.ab).toFixed(3).replace(/^0/, '')}
        />
        <LeaderBoard title="Strikeouts (P)" rows={soLeaders} statKey="soRecorded" userTeamAbbr={userTeamAbbr} />
        <LeaderBoard title="Wins (P)" rows={winLeaders} statKey="wins" userTeamAbbr={userTeamAbbr} />
      </div>
    </div>
  );
}

function LeaderBoard({
  title,
  rows,
  statKey,
  userTeamAbbr,
  formatStat,
}: {
  title: string;
  rows: PlayerSeasonStats[];
  statKey: string;
  userTeamAbbr: string;
  formatStat?: (s: PlayerSeasonStats) => string;
}) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-wider font-bold mb-2" style={{ color: 'var(--color-gold)' }}>
        {title}
      </h3>
      <div
        className="rounded-lg overflow-hidden text-xs"
        style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)' }}
      >
        {rows.length === 0 ? (
          <div className="px-3 py-2" style={{ color: 'var(--color-text-muted)' }}>
            No data yet
          </div>
        ) : (
          rows.map((row, idx) => {
            const isUser = row.teamAbbr === userTeamAbbr;
            return (
              <div
                key={row.playerId}
                className="flex items-center gap-2 px-3 py-1.5"
                style={{
                  borderBottom: '1px solid var(--color-divider)',
                  background: isUser ? 'var(--color-bg-elevated)' : 'transparent',
                }}
              >
                <span className="w-4 text-center font-bold" style={{ color: 'var(--color-text-muted)' }}>
                  {idx + 1}
                </span>
                <span className="flex-1 font-bold" style={{
                  color: isUser ? 'var(--color-gold)' : 'var(--color-text)',
                }}>
                  {row.playerName}
                </span>
                <span style={{ color: 'var(--color-text-muted)' }}>{row.teamAbbr}</span>
                <span className="font-bold font-mono w-8 text-right" style={{ color: 'var(--color-text)' }}>
                  {formatStat ? formatStat(row) : (row as Record<string, number>)[statKey]}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
