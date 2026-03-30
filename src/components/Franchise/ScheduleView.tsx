import { useMemo } from 'react';
import { getTeamByAbbr } from '../../data/teams';
import { getUserGame } from '../../game/franchiseEngine';
import type { FranchiseSave, ScheduleDay, ScheduledGame } from '../../types/franchise';

export function ScheduleView({
  franchise,
  onPlayGame,
}: {
  franchise: FranchiseSave;
  onPlayGame: (gameId: string) => void;
}) {
  const currentDay = franchise.schedule.find(d => d.dayNumber === franchise.currentDay);
  const userGame = currentDay ? getUserGame(currentDay, franchise.userTeamAbbr) : undefined;

  const pastDays = franchise.schedule.filter(d => d.dayNumber < franchise.currentDay);
  const futureDays = franchise.schedule.filter(d => d.dayNumber > franchise.currentDay);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Current day */}
      {currentDay && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--color-gold)' }}>
            Day {currentDay.dayNumber} of {franchise.seasonLength}
          </h3>

          {/* User's game - prominent */}
          {userGame && (
            <UserGameCard game={userGame} userTeamAbbr={franchise.userTeamAbbr} onPlay={onPlayGame} />
          )}

          {/* Other games today */}
          <div className="mt-3">
            <h4 className="text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Around the League
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
              {currentDay.games
                .filter(g => g.id !== userGame?.id)
                .map(game => (
                  <SmallGameRow key={game.id} game={game} />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Past days */}
      {pastDays.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Previous Games
          </h3>
          <div className="flex flex-col gap-1">
            {pastDays.slice().reverse().map(day => {
              const ug = getUserGame(day, franchise.userTeamAbbr);
              if (!ug || !ug.result) return null;
              const userIsAway = ug.awayTeamAbbr === franchise.userTeamAbbr;
              const userWon = ug.result.winnerAbbr === franchise.userTeamAbbr;
              const opponent = userIsAway ? ug.homeTeamAbbr : ug.awayTeamAbbr;
              const opMeta = getTeamByAbbr(opponent);
              return (
                <div
                  key={day.dayNumber}
                  className="flex items-center gap-3 px-3 py-2 rounded text-xs"
                  style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)' }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>Day {day.dayNumber}</span>
                  <span
                    className="font-bold px-1.5 py-0.5 rounded text-[10px]"
                    style={{
                      background: userWon ? '#22c55e20' : '#ef444420',
                      color: userWon ? '#22c55e' : '#ef4444',
                    }}
                  >
                    {userWon ? 'W' : 'L'}
                  </span>
                  <span style={{ color: 'var(--color-text)' }}>
                    {userIsAway ? '@' : 'vs'} {opMeta?.name ?? opponent}
                  </span>
                  <span className="ml-auto font-mono font-bold" style={{ color: 'var(--color-text)' }}>
                    {ug.result.awayScore} - {ug.result.homeScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {futureDays.length > 0 && (
        <div>
          <h3 className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--color-text-muted)' }}>
            Upcoming
          </h3>
          <div className="flex flex-col gap-1">
            {futureDays.slice(0, 5).map(day => {
              const ug = getUserGame(day, franchise.userTeamAbbr);
              if (!ug) return null;
              const userIsAway = ug.awayTeamAbbr === franchise.userTeamAbbr;
              const opponent = userIsAway ? ug.homeTeamAbbr : ug.awayTeamAbbr;
              const opMeta = getTeamByAbbr(opponent);
              return (
                <div
                  key={day.dayNumber}
                  className="flex items-center gap-3 px-3 py-2 rounded text-xs"
                  style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)' }}
                >
                  <span style={{ color: 'var(--color-text-muted)' }}>Day {day.dayNumber}</span>
                  <span style={{ color: 'var(--color-text)' }}>
                    {userIsAway ? '@' : 'vs'} {opMeta?.name ?? opponent}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function UserGameCard({
  game,
  userTeamAbbr,
  onPlay,
}: {
  game: ScheduledGame;
  userTeamAbbr: string;
  onPlay: (id: string) => void;
}) {
  const userIsAway = game.awayTeamAbbr === userTeamAbbr;
  const opponentAbbr = userIsAway ? game.homeTeamAbbr : game.awayTeamAbbr;
  const opMeta = getTeamByAbbr(opponentAbbr);
  const userMeta = getTeamByAbbr(userTeamAbbr);
  const isCompleted = game.status === 'completed';

  return (
    <div
      className="rounded-lg p-4"
      style={{
        background: 'var(--color-bg-surface)',
        border: isCompleted ? '1px solid var(--color-divider)' : '2px solid var(--color-gold)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* User team */}
          <div className="flex items-center gap-2">
            <img
              src={userMeta?.logoUrl ?? ''}
              alt={userTeamAbbr}
              className="w-8 h-8"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="font-bold text-sm" style={{ color: 'var(--color-gold)' }}>
              {userTeamAbbr}
            </span>
          </div>

          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {userIsAway ? '@' : 'vs'}
          </span>

          {/* Opponent */}
          <div className="flex items-center gap-2">
            <img
              src={opMeta?.logoUrl ?? ''}
              alt={opponentAbbr}
              className="w-8 h-8"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
              {opponentAbbr}
            </span>
          </div>
        </div>

        {isCompleted && game.result ? (
          <div className="text-right">
            <div className="font-bold font-mono" style={{ color: 'var(--color-text)' }}>
              {game.result.awayScore} - {game.result.homeScore}
            </div>
            <div
              className="text-[10px] font-bold"
              style={{ color: game.result.winnerAbbr === userTeamAbbr ? '#22c55e' : '#ef4444' }}
            >
              {game.result.winnerAbbr === userTeamAbbr ? 'WIN' : 'LOSS'}
            </div>
          </div>
        ) : (
          <button
            onClick={() => onPlay(game.id)}
            className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all hover:scale-105"
            style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}
          >
            Play
          </button>
        )}
      </div>
    </div>
  );
}

function SmallGameRow({ game }: { game: ScheduledGame }) {
  const awayMeta = getTeamByAbbr(game.awayTeamAbbr);
  const homeMeta = getTeamByAbbr(game.homeTeamAbbr);

  return (
    <div
      className="flex items-center justify-between px-3 py-1.5 rounded text-xs"
      style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-divider)' }}
    >
      <span style={{ color: 'var(--color-text)' }}>
        {game.awayTeamAbbr} @ {game.homeTeamAbbr}
      </span>
      {game.status === 'completed' && game.result ? (
        <span className="font-mono font-bold" style={{ color: 'var(--color-text-muted)' }}>
          {game.result.awayScore} - {game.result.homeScore}
        </span>
      ) : (
        <span style={{ color: 'var(--color-text-muted)' }}>--</span>
      )}
    </div>
  );
}
