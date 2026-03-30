import { useMemo } from 'react';
import { computeStandings } from '../../game/franchiseEngine';
import { divisions, getTeamByAbbr } from '../../data/teams';
import type { ScheduleDay } from '../../types/franchise';

export function StandingsTable({
  schedule,
  userTeamAbbr,
}: {
  schedule: ScheduleDay[];
  userTeamAbbr: string;
}) {
  const standings = useMemo(() => computeStandings(schedule), [schedule]);

  // Group by league
  const alDivisions = divisions.filter(d => d.startsWith('AL'));
  const nlDivisions = divisions.filter(d => d.startsWith('NL'));

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <LeagueSection title="American League" divs={alDivisions} standings={standings} userTeamAbbr={userTeamAbbr} />
      <LeagueSection title="National League" divs={nlDivisions} standings={standings} userTeamAbbr={userTeamAbbr} />
    </div>
  );
}

function LeagueSection({
  title,
  divs,
  standings,
  userTeamAbbr,
}: {
  title: string;
  divs: string[];
  standings: ReturnType<typeof computeStandings>;
  userTeamAbbr: string;
}) {
  return (
    <div className="mb-6">
      <h3
        className="text-sm font-bold mb-3 uppercase tracking-wider"
        style={{ color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      {divs.map(div => {
        const divRows = standings.filter(r => r.division === div);
        return (
          <div key={div} className="mb-4">
            <h4
              className="text-[10px] uppercase tracking-wider font-bold mb-1 px-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {div}
            </h4>
            <div
              className="rounded-lg overflow-hidden text-xs"
              style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)' }}
            >
              {/* Header */}
              <div
                className="grid px-2 py-1.5 font-bold"
                style={{
                  gridTemplateColumns: '1fr 40px 40px 50px 40px 45px 45px 50px',
                  color: 'var(--color-text-muted)',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <span>Team</span>
                <span className="text-center">W</span>
                <span className="text-center">L</span>
                <span className="text-center">PCT</span>
                <span className="text-center">GB</span>
                <span className="text-center">RS</span>
                <span className="text-center">RA</span>
                <span className="text-center">DIFF</span>
              </div>

              {/* Rows */}
              {divRows.map((row, idx) => {
                const meta = getTeamByAbbr(row.teamAbbr);
                const isUser = row.teamAbbr === userTeamAbbr;
                const isLeader = idx === 0;
                return (
                  <div
                    key={row.teamAbbr}
                    className="grid px-2 py-1.5"
                    style={{
                      gridTemplateColumns: '1fr 40px 40px 50px 40px 45px 45px 50px',
                      background: isUser ? 'var(--color-bg-elevated)' : 'transparent',
                      borderBottom: '1px solid var(--color-divider)',
                    }}
                  >
                    <span className="flex items-center gap-1.5" style={{
                      color: isLeader ? 'var(--color-gold)' : isUser ? 'var(--color-text)' : 'var(--color-text)',
                      fontWeight: isUser || isLeader ? 700 : 400,
                    }}>
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: meta?.primaryColor ?? '#666' }}
                      />
                      {row.teamAbbr}
                    </span>
                    <span className="text-center font-bold" style={{ color: 'var(--color-text)' }}>{row.wins}</span>
                    <span className="text-center" style={{ color: 'var(--color-text-muted)' }}>{row.losses}</span>
                    <span className="text-center font-mono" style={{ color: 'var(--color-text)' }}>
                      {row.pct.toFixed(3).replace(/^0/, '')}
                    </span>
                    <span className="text-center" style={{ color: 'var(--color-text-muted)' }}>
                      {row.gamesBack === 0 ? '—' : row.gamesBack.toFixed(1)}
                    </span>
                    <span className="text-center" style={{ color: 'var(--color-text-muted)' }}>{row.runsScored}</span>
                    <span className="text-center" style={{ color: 'var(--color-text-muted)' }}>{row.runsAllowed}</span>
                    <span className="text-center font-mono" style={{
                      color: row.runDiff > 0 ? '#22c55e' : row.runDiff < 0 ? '#ef4444' : 'var(--color-text-muted)',
                    }}>
                      {row.runDiff > 0 ? '+' : ''}{row.runDiff}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
