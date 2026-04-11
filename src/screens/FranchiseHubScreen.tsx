import { useScreenStore } from '../store/screenStore';
import { useFranchiseStore } from '../store/franchiseStore';
import { getTeamByAbbr } from '../data/teams';
import { getTeamRecord, getUserGame, isUserGameComplete } from '../game/franchiseEngine';
import { FranchiseNav } from '../components/Franchise/FranchiseNav';
import { ScheduleView } from '../components/Franchise/ScheduleView';
import { StandingsTable } from '../components/Franchise/StandingsTable';
import { RosterManager } from '../components/Franchise/RosterManager';
import { StatLeaders } from '../components/Franchise/StatLeaders';

export function FranchiseHubScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const {
    franchise, activeTab, isAdvancing,
    setActiveTab, startFranchiseGame, advanceDay, setLineup, setStartingPitcher,
  } = useFranchiseStore();

  if (!franchise) {
    navigate('franchiseSetup');
    return null;
  }

  const teamMeta = getTeamByAbbr(franchise.userTeamAbbr);
  const record = getTeamRecord(franchise.schedule, franchise.userTeamAbbr);
  const currentDay = franchise.schedule.find(d => d.dayNumber === franchise.currentDay);
  const userGameDone = currentDay ? isUserGameComplete(currentDay, franchise.userTeamAbbr) : false;
  const seasonOver = franchise.currentDay > franchise.seasonLength;
  const userRoster = franchise.rosters[franchise.userTeamAbbr];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{
          background: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-divider)',
        }}
      >
        <div className="flex items-center gap-3">
          {teamMeta && (
            <img
              src={teamMeta.logoUrl}
              alt={teamMeta.name}
              className="w-8 h-8"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
          <div>
            <h1
              className="text-lg font-bold leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
            >
              {franchise.name}
            </h1>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {record.wins}-{record.losses}
              {' '}&middot;{' '}
              {seasonOver
                ? 'Season Complete'
                : `Day ${franchise.currentDay} of ${franchise.seasonLength}`}
            </div>
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <FranchiseNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'schedule' && (
          <ScheduleView franchise={franchise} onPlayGame={startFranchiseGame} />
        )}
        {activeTab === 'standings' && (
          <StandingsTable schedule={franchise.schedule} userTeamAbbr={franchise.userTeamAbbr} />
        )}
        {activeTab === 'roster' && userRoster && (
          <RosterManager
            roster={userRoster}
            onSetLineup={setLineup}
            onSetStartingPitcher={setStartingPitcher}
          />
        )}
        {activeTab === 'leaders' && (
          <StatLeaders seasonStats={franchise.seasonStats} userTeamAbbr={franchise.userTeamAbbr} />
        )}
      </div>

      {/* Footer actions */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{ background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-divider)' }}
      >
        <button
          onClick={() => navigate('home')}
          className="px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors"
          style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)', border: '1px solid var(--color-divider)' }}
        >
          Main Menu
        </button>

        {!seasonOver && (
          <button
            onClick={advanceDay}
            disabled={!userGameDone || isAdvancing}
            className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all hover:scale-105
              disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}
          >
            {isAdvancing ? 'Simulating...' : 'Advance Day'}
          </button>
        )}

        {seasonOver && (
          <span className="text-sm font-bold" style={{ color: 'var(--color-gold)' }}>
            Season Complete!
          </span>
        )}
      </div>
    </div>
  );
}
