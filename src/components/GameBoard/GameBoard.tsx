import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getCurrentBatter, getCurrentPitcher, getBattingTeam, getFieldingTeam } from '../../game/stateMachine';
import { PlayerCard } from '../Card/PlayerCard';
import { DiceRoller } from '../Dice/DiceRoller';
import { BaseballDiamond } from '../Diamond/BaseballDiamond';
import { Scoreboard } from '../Scoreboard/Scoreboard';
import { GameLog } from './GameLog';
import { OnDeck } from './OnDeck';
import { Bullpen } from './Bullpen';
import { getResultDescription } from '../../game/engine';
import type { PlayerCard as PlayerCardType } from '../../types';

/**
 * One side of the game board — shows either the pitcher+bullpen or batter+on-deck
 * depending on the team's current role.
 */
function TeamColumn({
  team,
  role,
  card,
  nextBatters,
  bullpenPitchers,
  currentPitcherId,
  onSelectPitcher,
  canChangePitcher,
  pitchResult,
  swingResult,
}: {
  team: { name: string; lineup: PlayerCardType[]; currentBatterIndex: number; pitchingStaff: PlayerCardType[] };
  role: 'batting' | 'pitching';
  card: PlayerCardType;
  nextBatters: PlayerCardType[];
  bullpenPitchers: PlayerCardType[];
  currentPitcherId: string;
  onSelectPitcher: (p: PlayerCardType) => void;
  canChangePitcher: boolean;
  pitchResult: { advantage: 'pitcher' | 'batter' } | null;
  swingResult: { dieRoll: number } | null;
}) {
  const isPitching = role === 'pitching';

  return (
    <div className="flex flex-col items-center shrink-0">
      {/* Top panel: Bullpen or On Deck depending on role */}
      {isPitching ? (
        <Bullpen
          availablePitchers={bullpenPitchers}
          currentPitcherId={currentPitcherId}
          onSelectPitcher={onSelectPitcher}
          disabled={!canChangePitcher}
        />
      ) : (
        <OnDeck nextBatters={nextBatters} />
      )}

      {/* Label */}
      <span className="text-xs uppercase tracking-wider font-bold mb-1" style={{ color: 'var(--color-text-muted)' }}>
        {isPitching ? `Pitching — ${team.name}` : `At Bat — ${team.name} (#${team.currentBatterIndex + 1})`}
      </span>

      {/* Card — vertically centered in remaining space */}
      <div className="flex-1 flex items-center">
        <PlayerCard
          card={card}
          size="sm"
          showAdvantage={pitchResult?.advantage ?? null}
          activeRoll={
            isPitching
              ? (pitchResult?.advantage === 'pitcher' ? swingResult?.dieRoll : undefined)
              : (pitchResult?.advantage === 'batter' ? swingResult?.dieRoll : undefined)
          }
        />
      </div>
    </div>
  );
}

export function GameBoard() {
  const {
    gameState, uiPhase, pitchResult, swingResult,
    lastResult, lastRunsScored, lastDescription,
    rollPitch, rollSwing, confirmResult, continueToNextHalfInning,
    doChangePitcher,
  } = useGameStore();

  if (!gameState) return null;

  const batter = getCurrentBatter(gameState);
  const pitcher = getCurrentPitcher(gameState);
  const battingTeam = getBattingTeam(gameState);
  const fieldingTeam = getFieldingTeam(gameState);

  const canRollPitch = uiPhase === 'awaiting_pitch';
  const canRollSwing = uiPhase === 'awaiting_swing';
  const swingChartOwner = pitchResult?.advantage === 'pitcher' ? 'pitcher' : 'batter';
  const canChangePitcher = uiPhase === 'awaiting_pitch' || uiPhase === 'half_inning_break';

  // Away team role: batting in top, pitching in bottom
  const awayRole = gameState.halfInning === 'top' ? 'batting' : 'pitching';
  const homeRole = gameState.halfInning === 'top' ? 'pitching' : 'batting';

  // The card shown for each side
  const awayCard = awayRole === 'batting' ? batter : pitcher;
  const homeCard = homeRole === 'batting' ? batter : pitcher;

  // Build runner map for diamond headshots
  const runnersMap = useMemo(() => {
    const map = new Map<string, PlayerCardType>();
    const allCards = [...gameState.away.cards, ...gameState.home.cards];
    for (const card of allCards) {
      map.set(card.id, card);
    }
    return map;
  }, [gameState.away.cards, gameState.home.cards]);

  // Next 2 batters
  const nextBatters = useMemo(() => {
    const lineup = battingTeam.lineup;
    const idx = battingTeam.currentBatterIndex;
    return [lineup[(idx + 1) % 9], lineup[(idx + 2) % 9]];
  }, [battingTeam.lineup, battingTeam.currentBatterIndex]);

  // Bullpen pitchers
  const bullpenPitchers = useMemo(() => {
    return fieldingTeam.pitchingStaff.filter((p) => p.id !== pitcher.id);
  }, [fieldingTeam.pitchingStaff, pitcher.id]);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-4 py-2">
      {/* Scoreboard */}
      <div className="shrink-0 mb-2">
        <Scoreboard gameState={gameState} />
      </div>

      {/* === MAIN GAME AREA === */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 justify-center min-h-0">

        {/* LEFT = Away Team */}
        <TeamColumn
          team={gameState.away}
          role={awayRole}
          card={awayCard}
          nextBatters={awayRole === 'batting' ? nextBatters : []}
          bullpenPitchers={awayRole === 'pitching' ? bullpenPitchers : []}
          currentPitcherId={pitcher.id}
          onSelectPitcher={doChangePitcher}
          canChangePitcher={canChangePitcher}
          pitchResult={pitchResult}
          swingResult={swingResult}
        />

        {/* CENTER: Diamond + Dice + Status */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 min-w-[280px]">
          {/* Diamond */}
          <div className="w-[300px]">
            <BaseballDiamond bases={gameState.bases} runners={runnersMap} />
          </div>

          {/* Pitch phase instruction */}
          {canRollPitch && (
            <div
              className="text-center px-5 py-3 rounded-lg max-w-sm"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
            >
              <div className="text-xs uppercase tracking-wider mb-1 font-bold" style={{ color: 'var(--color-gold)' }}>
                Step 1 — The Pitch
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text)' }}>
                <b style={{ color: 'var(--color-gold)' }}>{fieldingTeam.name}</b> rolls.
                Result + Control ({pitcher.control}) vs On-Base ({batter.onBase})
              </div>
            </div>
          )}

          {/* Pitch result */}
          {pitchResult && (
            <div
              className="text-center px-5 py-3 rounded-lg max-w-md"
              style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
            >
              <div className="text-sm font-mono mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Pitch: {pitchResult.dieRoll} + {pitchResult.control} CTRL
                {pitchResult.fatiguePenalty < 0 && ` (${pitchResult.fatiguePenalty} fatigue)`}
                {' = '}<b style={{ color: 'var(--color-gold)' }}>{pitchResult.pitchTotal}</b>
                {pitchResult.pitchTotal >= pitchResult.batterOnBase ? ' ≥ ' : ' < '}
                OB <b>{pitchResult.batterOnBase}</b>
              </div>
              <div className="text-lg font-bold"
                style={{ color: pitchResult.advantage === 'pitcher' ? '#ff7070' : '#70ff70' }}>
                {pitchResult.advantage === 'pitcher' ? '⚾ PITCHER' : '🏏 BATTER'} ADVANTAGE
              </div>
              {canRollSwing && (
                <div className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Step 2 — Roll the swing → result on <b style={{ color: 'var(--color-gold)' }}>
                    {swingChartOwner === 'pitcher' ? pitcher.name + "'s" : batter.name + "'s"}
                  </b> chart
                </div>
              )}
            </div>
          )}

          {/* Dice */}
          <div className="flex gap-8 items-end">
            <div className="flex flex-col items-center">
              <DiceRoller onRoll={rollPitch} disabled={!canRollPitch} label="The Pitch" />
              {canRollPitch && (
                <span className="text-xs mt-1 animate-pulse" style={{ color: 'var(--color-gold)' }}>
                  ▲ Click to roll
                </span>
              )}
            </div>
            <div className="flex flex-col items-center">
              <DiceRoller onRoll={rollSwing} disabled={!canRollSwing} label="The Swing" resultType={lastResult} />
              {canRollSwing && (
                <span className="text-xs mt-1 animate-pulse" style={{ color: 'var(--color-gold)' }}>
                  ▲ Roll ({swingChartOwner}'s chart)
                </span>
              )}
            </div>
          </div>

          {/* Result banner */}
          {lastResult && uiPhase === 'showing_result' && (
            <div className="text-center">
              <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Swing {swingResult?.dieRoll} on {swingChartOwner === 'pitcher' ? pitcher.name : batter.name}'s chart
              </div>
              <div className="text-3xl font-bold mb-1" style={{
                fontFamily: 'var(--font-display)',
                color: lastResult === 'HR' ? 'var(--color-gold)'
                  : ['1B', '2B', '3B'].includes(lastResult) ? '#70a0ff'
                  : lastResult === 'BB' ? '#70a0ff' : '#ff7070',
              }}>
                {getResultDescription(lastResult)}!
              </div>
              {lastRunsScored > 0 && (
                <div className="text-xl" style={{ color: 'var(--color-gold)' }}>
                  {lastRunsScored} run{lastRunsScored > 1 ? 's' : ''} scored!
                </div>
              )}
              <button onClick={confirmResult}
                className="mt-3 px-6 py-2 rounded text-sm font-bold cursor-pointer transition-colors"
                style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}>
                Next Batter
              </button>
            </div>
          )}

          {/* Half-inning break */}
          {uiPhase === 'half_inning_break' && (
            <div className="text-center">
              {lastDescription && (
                <div className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>{lastDescription}</div>
              )}
              <div className="text-2xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}>
                {gameState.halfInning === 'top' ? 'Middle' : 'End'} of {gameState.inning}
              </div>
              <button onClick={continueToNextHalfInning}
                className="px-8 py-2.5 rounded font-bold cursor-pointer transition-colors"
                style={{ background: 'var(--color-gold)', color: 'var(--color-bg)' }}>
                Continue
              </button>
            </div>
          )}

          {/* Game over */}
          {uiPhase === 'game_over' && (
            <div className="text-center">
              <div className="text-4xl font-bold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}>
                Game Over!
              </div>
              <div className="text-2xl">
                {gameState.away.name} {gameState.away.score} — {gameState.home.name} {gameState.home.score}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT = Home Team */}
        <TeamColumn
          team={gameState.home}
          role={homeRole}
          card={homeCard}
          nextBatters={homeRole === 'batting' ? nextBatters : []}
          bullpenPitchers={homeRole === 'pitching' ? bullpenPitchers : []}
          currentPitcherId={pitcher.id}
          onSelectPitcher={doChangePitcher}
          canChangePitcher={canChangePitcher}
          pitchResult={pitchResult}
          swingResult={swingResult}
        />
      </div>

      {/* === GAME LOG — pinned to bottom === */}
      <div className="shrink-0 mt-2">
        <GameLog entries={gameState.gameLog} />
      </div>
    </div>
  );
}
