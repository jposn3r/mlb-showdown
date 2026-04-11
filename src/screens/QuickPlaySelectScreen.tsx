import { useState } from 'react';
import { useScreenStore } from '../store/screenStore';
import { useGameStore } from '../store/gameStore';
import { allCards } from '../data/cards/allCards';
import { teams } from '../data/teams';


function getTeamRoster(abbr: string) {
  const teamCards = allCards.filter((c) => c.team === abbr);
  const sp = teamCards.filter((c) => c.position === 'SP');
  const rp = teamCards.filter((c) => c.position === 'RP');
  const batters = teamCards.filter((c) => !['SP', 'RP'].includes(c.position));
  return {
    lineup: batters.slice(0, 9),
    pitching: [...sp, ...rp],
  };
}

export function QuickPlaySelectScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const [awayTeam, setAwayTeam] = useState<string>('NYY');
  const [homeTeam, setHomeTeam] = useState<string>('LAD');

  const handleStart = () => {
    const away = getTeamRoster(awayTeam);
    const home = getTeamRoster(homeTeam);

    if (away.lineup.length < 9 || home.lineup.length < 9) {
      alert('Not enough players for one of the teams');
      return;
    }

    startNewGame(
      awayTeam, away.lineup, away.pitching,
      homeTeam, home.lineup, home.pitching,
    );
    navigate('game');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <h1
        className="text-3xl font-bold mb-8"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
      >
        Quick Play
      </h1>

      <div className="flex flex-col md:flex-row gap-8 items-center mb-8">
        {/* Away team selector */}
        <TeamSelector
          label="Away"
          selected={awayTeam}
          onSelect={setAwayTeam}
          otherTeam={homeTeam}
        />

        <div
          className="text-2xl font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-muted)' }}
        >
          vs
        </div>

        {/* Home team selector */}
        <TeamSelector
          label="Home"
          selected={homeTeam}
          onSelect={setHomeTeam}
          otherTeam={awayTeam}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleStart}
          className="px-8 py-3 rounded-lg font-bold text-lg cursor-pointer transition-all hover:scale-105"
          style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}
        >
          Play Ball!
        </button>
        <button
          onClick={() => navigate('home')}
          className="px-6 py-3 rounded-lg cursor-pointer transition-colors"
          style={{ background: 'var(--color-bg-surface)', color: 'var(--color-text-muted)', border: '1px solid var(--color-divider)' }}
        >
          Back
        </button>
      </div>
    </div>
  );
}

function TeamSelector({
  label,
  selected,
  onSelect,
  otherTeam,
}: {
  label: string;
  selected: string;
  onSelect: (abbr: string) => void;
  otherTeam: string;
}) {
  const selectedTeam = teams.find((t) => t.abbr === selected);

  // Group by division
  const divisions = [...new Set(teams.map((t) => t.division))];

  return (
    <div className="w-64">
      <h3 className="text-sm font-bold mb-2 text-center uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </h3>

      {/* Selected team display */}
      <div
        className="rounded-lg p-4 mb-3 text-center"
        style={{
          background: selectedTeam?.primaryColor ?? 'var(--color-bg-surface)',
          border: '2px solid var(--color-gold)',
        }}
      >
        <div className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
          {selected}
        </div>
        <div className="text-xs text-white/70">{selectedTeam?.name}</div>
      </div>

      {/* Team list */}
      <div
        className="rounded-lg overflow-y-auto max-h-64"
        style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)' }}
      >
        {divisions.map((div) => (
          <div key={div}>
            <div className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold sticky top-0"
              style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>
              {div}
            </div>
            {teams
              .filter((t) => t.division === div)
              .map((team) => (
                <button
                  key={team.abbr}
                  onClick={() => onSelect(team.abbr)}
                  disabled={team.abbr === otherTeam}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 cursor-pointer
                    transition-colors ${team.abbr === selected ? 'font-bold' : ''}
                    ${team.abbr === otherTeam ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[var(--color-bg-elevated)]'}`}
                  style={{
                    color: team.abbr === selected ? 'var(--color-gold)' : 'var(--color-text)',
                    borderBottom: '1px solid var(--color-divider)',
                  }}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ background: team.primaryColor }}
                  />
                  <span>{team.abbr}</span>
                  <span style={{ color: 'var(--color-text-muted)' }}>{team.name}</span>
                </button>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
