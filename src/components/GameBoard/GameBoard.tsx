import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getCurrentBatter, getCurrentPitcher, getBattingTeam, getFieldingTeam } from '../../game/stateMachine';
import { PlayerCard } from '../Card/PlayerCard';
import { BaseballDiamond } from '../Diamond/BaseballDiamond';
import { Scoreboard } from '../Scoreboard/Scoreboard';
import { GameLog } from './GameLog';
import { OnDeck } from './OnDeck';
import { Bullpen } from './Bullpen';
import { getResultDescription } from '../../game/engine';
import type { PlayerCard as PlayerCardType, AtBatResult } from '../../types';
import '../../styles/dice.css';

// ── Bouncing Die ────────────────────────────────────────────────────

function BouncingDie({
  isAnimating,
  value,
  resultType,
}: {
  isAnimating: boolean;
  value: number | null;
  resultType: AtBatResult | null;
}) {
  const [offsetX] = useState(() => Math.random() * 60 - 30); // random horizontal drift

  if (!isAnimating && value === null) return null;

  const settled = !isAnimating && value !== null;
  const resultColor = !resultType ? 'var(--color-gold)'
    : resultType === 'HR' ? '#ffcc00'
    : ['1B', '2B', '3B'].includes(resultType) ? '#70ff70'
    : resultType === 'BB' ? '#70a0ff'
    : '#ff7070';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      <div
        className={`absolute ${isAnimating ? 'die-bouncing' : 'die-settled'}`}
        style={{
          bottom: isAnimating ? undefined : '20px',
          left: '50%',
          transform: settled ? `translateX(calc(-50% + ${offsetX}px))` : undefined,
          ['--drift' as string]: `${offsetX}px`,
        }}
      >
        <div
          className="w-[52px] h-[52px] rounded-xl flex items-center justify-center font-bold text-xl"
          style={{
            fontFamily: 'var(--font-display)',
            background: settled
              ? `linear-gradient(145deg, ${resultColor}22, ${resultColor}11)`
              : 'linear-gradient(145deg, #3a3a4a, #2a2a3a)',
            border: `2px solid ${settled ? resultColor : 'var(--color-gold)'}`,
            color: settled ? resultColor : 'var(--color-text)',
            boxShadow: settled ? `0 0 16px ${resultColor}60` : 'none',
          }}
        >
          {isAnimating ? '?' : value}
        </div>
      </div>
    </div>
  );
}

// ── Roll Button ─────────────────────────────────────────────────────

function RollButton({
  label,
  onClick,
  pulsing,
}: {
  label: string;
  onClick: () => void;
  pulsing?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-[224px] py-2.5 rounded-lg font-bold text-sm cursor-pointer
        transition-all hover:scale-[1.03] active:scale-[0.97]
        ${pulsing ? 'animate-pulse' : ''}`}
      style={{
        background: 'var(--color-gold)',
        color: 'var(--color-bg)',
        fontFamily: 'var(--font-display)',
      }}
    >
      {label}
    </button>
  );
}

// ── Team Column ─────────────────────────────────────────────────────

function TeamColumn({
  team,
  role,
  card,
  nextBatters,
  bullpenPitchers,
  currentPitcherId,
  onSelectPitcher,
  canChangePitcher,
  isActiveRoller,
  onRoll,
  rollLabel,
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
  isActiveRoller: boolean;
  onRoll: (() => void) | null;
  rollLabel: string | null;
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

      {/* Card */}
      <div className="flex-1 flex items-center">
        <PlayerCard
          card={card}
          size="sm"
          showAdvantage={pitchResult?.advantage ?? null}
          isActiveRoller={isActiveRoller}
          activeRoll={
            isPitching
              ? (pitchResult?.advantage === 'pitcher' ? swingResult?.dieRoll : undefined)
              : (pitchResult?.advantage === 'batter' ? swingResult?.dieRoll : undefined)
          }
        />
      </div>

      {/* Roll button — appears under the active roller's card */}
      <div className="h-[52px] flex items-center justify-center mt-2">
        {isActiveRoller && onRoll && rollLabel && (
          <RollButton label={rollLabel} onClick={onRoll} pulsing />
        )}
      </div>
    </div>
  );
}

// ── Main Game Board ─────────────────────────────────────────────────

export function GameBoard() {
  const {
    gameState, uiPhase, pitchResult, swingResult,
    lastResult, lastRunsScored, lastDescription,
    rollPitch, rollSwing, confirmResult, continueToNextHalfInning,
    doChangePitcher,
  } = useGameStore();

  // Bouncing die state
  const [dieAnim, setDieAnim] = useState<{
    isAnimating: boolean;
    value: number | null;
    resultType: AtBatResult | null;
  }>({ isAnimating: false, value: null, resultType: null });

  const handleRollPitch = useCallback(() => {
    setDieAnim({ isAnimating: true, value: null, resultType: null });
    setTimeout(() => {
      const result = rollPitch();
      setDieAnim({ isAnimating: false, value: result, resultType: null });
      // Clear after display
      setTimeout(() => setDieAnim({ isAnimating: false, value: null, resultType: null }), 1500);
    }, 800);
  }, [rollPitch]);

  const handleRollSwing = useCallback(() => {
    setDieAnim({ isAnimating: true, value: null, resultType: null });
    setTimeout(() => {
      const result = rollSwing();
      // We'll get the lastResult from the store after it updates
      setTimeout(() => {
        const { lastResult: lr } = useGameStore.getState();
        setDieAnim({ isAnimating: false, value: result, resultType: lr });
        setTimeout(() => setDieAnim({ isAnimating: false, value: null, resultType: null }), 1500);
      }, 100);
    }, 800);
  }, [rollSwing]);

  if (!gameState) return null;

  const batter = getCurrentBatter(gameState);
  const pitcher = getCurrentPitcher(gameState);
  const battingTeam = getBattingTeam(gameState);
  const fieldingTeam = getFieldingTeam(gameState);

  const canRollPitch = uiPhase === 'awaiting_pitch';
  const canRollSwing = uiPhase === 'awaiting_swing';
  const swingChartOwner = pitchResult?.advantage === 'pitcher' ? 'pitcher' : 'batter';
  const canChangePitcher = uiPhase === 'awaiting_pitch' || uiPhase === 'half_inning_break';

  // Determine which side is rolling
  // Pitch: fielding team (pitcher) rolls. Swing: batting team (batter) rolls.
  const awayRole = gameState.halfInning === 'top' ? 'batting' : 'pitching';
  const homeRole = gameState.halfInning === 'top' ? 'pitching' : 'batting';

  const awayIsRolling = (canRollPitch && awayRole === 'pitching') || (canRollSwing && awayRole === 'batting');
  const homeIsRolling = (canRollPitch && homeRole === 'pitching') || (canRollSwing && homeRole === 'batting');

  const getRollHandler = (side: 'away' | 'home') => {
    if (side === 'away' && awayIsRolling) return canRollPitch ? handleRollPitch : handleRollSwing;
    if (side === 'home' && homeIsRolling) return canRollPitch ? handleRollPitch : handleRollSwing;
    return null;
  };

  const getRollLabel = (side: 'away' | 'home') => {
    if (side === 'away' && awayIsRolling) return canRollPitch ? 'Roll the Pitch' : 'Roll the Swing';
    if (side === 'home' && homeIsRolling) return canRollPitch ? 'Roll the Pitch' : 'Roll the Swing';
    return null;
  };

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
    <div className="relative flex flex-col h-full max-w-7xl mx-auto px-4 py-2">
      {/* Scoreboard */}
      <div className="shrink-0 mb-2">
        <Scoreboard gameState={gameState} />
      </div>

      {/* === MAIN GAME AREA === */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 justify-start items-start min-h-0">

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
          isActiveRoller={awayIsRolling}
          onRoll={getRollHandler('away')}
          rollLabel={getRollLabel('away')}
          pitchResult={pitchResult}
          swingResult={swingResult}
        />

        {/* CENTER: Diamond + Status */}
        <div className="flex-1 flex flex-col items-center gap-3 min-w-[280px]">
          {/* Diamond */}
          <div className="w-[300px]">
            <BaseballDiamond bases={gameState.bases} runners={runnersMap} />
          </div>

          {/* === Fixed-height status area — no layout shifts === */}
          <div className="min-h-[140px] w-full max-w-md flex flex-col items-center justify-center">

            {/* Pitch phase instruction */}
            {canRollPitch && (
              <div
                className="text-center px-5 py-3 rounded-lg w-full"
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

            {/* Pitch rolled / waiting for swing */}
            {uiPhase === 'pitch_rolled' && pitchResult && (
              <div
                className="text-center px-5 py-3 rounded-lg w-full"
                style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
              >
                <div className="text-sm font-mono mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Pitch: {pitchResult.dieRoll} + {pitchResult.control} CTRL
                  {pitchResult.fatiguePenalty < 0 && ` (${pitchResult.fatiguePenalty} fatigue)`}
                  {' = '}<b style={{ color: 'var(--color-gold)' }}>{pitchResult.pitchTotal}</b>
                  {pitchResult.pitchTotal >= pitchResult.batterOnBase ? ' >= ' : ' < '}
                  OB <b>{pitchResult.batterOnBase}</b>
                </div>
                <div className="text-lg font-bold"
                  style={{ color: pitchResult.advantage === 'pitcher' ? '#ff7070' : '#70ff70' }}>
                  {pitchResult.advantage === 'pitcher' ? 'PITCHER' : 'BATTER'} ADVANTAGE
                </div>
              </div>
            )}

            {/* Awaiting swing */}
            {canRollSwing && pitchResult && (
              <div
                className="text-center px-5 py-3 rounded-lg w-full"
                style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
              >
                <div className="text-lg font-bold mb-1"
                  style={{ color: pitchResult.advantage === 'pitcher' ? '#ff7070' : '#70ff70' }}>
                  {pitchResult.advantage === 'pitcher' ? 'PITCHER' : 'BATTER'} ADVANTAGE
                </div>
                <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  Roll the swing — result on <b style={{ color: 'var(--color-gold)' }}>
                    {swingChartOwner === 'pitcher' ? pitcher.name + "'s" : batter.name + "'s"}
                  </b> chart
                </div>
              </div>
            )}

            {/* Swing rolled — showing result */}
            {uiPhase === 'swing_rolled' && pitchResult && (
              <div
                className="text-center px-5 py-3 rounded-lg w-full"
                style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-divider)' }}
              >
                <div className="text-sm mb-1" style={{ color: 'var(--color-text-muted)' }}>
                  Rolling on {swingChartOwner === 'pitcher' ? pitcher.name : batter.name}'s chart...
                </div>
              </div>
            )}

            {/* Result banner */}
            {lastResult && uiPhase === 'showing_result' && (
              <div className="text-center">
                <div className="text-3xl font-bold mb-1" style={{
                  fontFamily: 'var(--font-display)',
                  color: lastResult === 'HR' ? 'var(--color-gold)'
                    : ['1B', '2B', '3B'].includes(lastResult) ? '#70a0ff'
                    : lastResult === 'BB' ? '#70a0ff' : '#ff7070',
                }}>
                  {getResultDescription(lastResult)}!
                </div>
                {lastRunsScored > 0 && (
                  <div className="text-xl mb-1" style={{ color: 'var(--color-gold)' }}>
                    {lastRunsScored} run{lastRunsScored > 1 ? 's' : ''} scored!
                  </div>
                )}
                <button onClick={confirmResult}
                  className="mt-2 px-6 py-2 rounded text-sm font-bold cursor-pointer transition-all hover:scale-105"
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
                  className="px-8 py-2.5 rounded font-bold cursor-pointer transition-all hover:scale-105"
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
                <div className="text-2xl" style={{ color: 'var(--color-text)' }}>
                  {gameState.away.name} {gameState.away.score} — {gameState.home.name} {gameState.home.score}
                </div>
              </div>
            )}
          </div>
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
          isActiveRoller={homeIsRolling}
          onRoll={getRollHandler('home')}
          rollLabel={getRollLabel('home')}
          pitchResult={pitchResult}
          swingResult={swingResult}
        />
      </div>

      {/* === GAME LOG — pinned to bottom === */}
      <div className="shrink-0 mt-2">
        <GameLog entries={gameState.gameLog} />
      </div>

      {/* === Bouncing die overlay === */}
      <BouncingDie
        isAnimating={dieAnim.isAnimating}
        value={dieAnim.value}
        resultType={dieAnim.resultType}
      />
    </div>
  );
}
