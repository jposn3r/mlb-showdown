import { describe, it, expect } from 'vitest';
import {
  createGameState,
  startGame,
  recordAtBatResult,
  startNextHalfInning,
  changePitcher,
  getBattingTeam,
  getFieldingTeam,
  getCurrentBatter,
  getCurrentPitcher,
  getInningsPitchedInGame,
  isGameOver,
  getWinner,
} from '../stateMachine';
import { makeLineup, makePitchingStaff, makeStartedGame, makePitcher } from './fixtures';

describe('stateMachine', () => {
  describe('createGameState', () => {
    it('initializes with correct defaults', () => {
      const state = createGameState(
        'Away', makeLineup('a'), makePitchingStaff('a'),
        'Home', makeLineup('h'), makePitchingStaff('h'),
      );
      expect(state.phase).toBe('pre_game');
      expect(state.inning).toBe(1);
      expect(state.halfInning).toBe('top');
      expect(state.outs).toBe(0);
      expect(state.bases).toEqual([null, null, null]);
      expect(state.away.score).toBe(0);
      expect(state.home.score).toBe(0);
      expect(state.away.lineup).toHaveLength(9);
      expect(state.home.lineup).toHaveLength(9);
      expect(state.gameLog).toEqual([]);
    });
  });

  describe('startGame', () => {
    it('transitions to pre_at_bat and initializes inningRuns', () => {
      const state = createGameState(
        'Away', makeLineup('a'), makePitchingStaff('a'),
        'Home', makeLineup('h'), makePitchingStaff('h'),
      );
      const started = startGame(state);
      expect(started.phase).toBe('pre_at_bat');
      expect(started.away.inningRuns).toEqual([0]);
      expect(started.home.inningRuns).toEqual([0]);
    });
  });

  describe('accessors', () => {
    it('getBattingTeam returns away in top, home in bottom', () => {
      const state = makeStartedGame();
      expect(getBattingTeam(state).name).toBe('Away Team');
      const bottomState = { ...state, halfInning: 'bottom' as const };
      expect(getBattingTeam(bottomState).name).toBe('Home Team');
    });

    it('getFieldingTeam returns home in top, away in bottom', () => {
      const state = makeStartedGame();
      expect(getFieldingTeam(state).name).toBe('Home Team');
    });

    it('getCurrentBatter returns correct batter from lineup', () => {
      const state = makeStartedGame();
      const batter = getCurrentBatter(state);
      expect(batter.id).toBe('away-batter-0');
    });

    it('getCurrentPitcher returns fielding team pitcher', () => {
      const state = makeStartedGame();
      const pitcher = getCurrentPitcher(state);
      expect(pitcher.id).toBe('home-pitcher-0');
    });
  });

  describe('recordAtBatResult', () => {
    it('records a strikeout and increments outs', () => {
      const state = makeStartedGame();
      const next = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'Strikeout');
      expect(next.outs).toBe(1);
      expect(next.gameLog).toHaveLength(1);
      expect(next.gameLog[0].result).toBe('SO');
    });

    it('advances batter index after each at-bat', () => {
      let state = makeStartedGame();
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      expect(state.away.currentBatterIndex).toBe(1);
      state = recordAtBatResult(state, 'FB', [], [null, null, null], 1, 'Fly out');
      expect(state.away.currentBatterIndex).toBe(2);
    });

    it('records runs and updates score', () => {
      let state = makeStartedGame();
      state = recordAtBatResult(state, 'HR', ['batter'], [null, null, null], 0, 'HR');
      expect(state.away.score).toBe(1);
      expect(state.away.hits).toBe(1);
    });

    it('transitions to half_inning_end after 3 outs', () => {
      let state = makeStartedGame();
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      expect(state.phase).toBe('half_inning_end');
      expect(state.outs).toBe(0); // reset after half-inning end
      expect(state.halfInning).toBe('bottom');
    });

    it('detects walk-off in bottom of 9th', () => {
      let state = makeStartedGame();
      // Simulate to bottom of 9th with tied score
      state = {
        ...state,
        inning: 9,
        halfInning: 'bottom',
        away: { ...state.away, score: 3, inningRuns: [0, 0, 0, 0, 0, 0, 0, 0, 3] },
        home: { ...state.home, score: 3, inningRuns: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
      };
      // Home team hits a solo HR to win
      state = recordAtBatResult(state, 'HR', ['batter'], [null, null, null], 0, 'Walk-off HR');
      expect(state.phase).toBe('game_over');
      expect(state.home.score).toBe(4);
    });
  });

  describe('startNextHalfInning', () => {
    it('transitions from half_inning_end to pre_at_bat', () => {
      let state = makeStartedGame();
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      expect(state.phase).toBe('half_inning_end');
      state = startNextHalfInning(state);
      expect(state.phase).toBe('pre_at_bat');
    });
  });

  describe('changePitcher', () => {
    it('updates the fielding team pitcher', () => {
      const state = makeStartedGame();
      const newPitcher = makePitcher({ id: 'reliever-1', name: 'Reliever' });
      const updated = changePitcher(state, newPitcher);
      // In top of 1st, fielding team is home
      expect(updated.home.currentPitcher.id).toBe('reliever-1');
    });
  });

  describe('getInningsPitchedInGame', () => {
    it('returns 0 for pitcher with no entries', () => {
      const state = makeStartedGame();
      expect(getInningsPitchedInGame(state, 'unknown')).toBe(0);
    });

    it('counts distinct half-innings', () => {
      let state = makeStartedGame();
      // Record some at-bats in the same half-inning
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      state = recordAtBatResult(state, 'SO', [], [null, null, null], 1, 'K');
      expect(getInningsPitchedInGame(state, 'home-pitcher-0')).toBe(1);
    });
  });

  describe('isGameOver / getWinner', () => {
    it('isGameOver returns false during play', () => {
      expect(isGameOver(makeStartedGame())).toBe(false);
    });

    it('getWinner returns null during play', () => {
      expect(getWinner(makeStartedGame())).toBeNull();
    });

    it('getWinner returns correct team after game over', () => {
      let state = makeStartedGame();
      state = { ...state, phase: 'game_over', away: { ...state.away, score: 5 }, home: { ...state.home, score: 3 } };
      expect(getWinner(state)).toBe('away');
    });
  });
});
