import { describe, it, expect } from 'vitest';
import {
  generateSchedule,
  buildDefaultRoster,
  getNextStarter,
  computeStandings,
  getTeamRecord,
  getUserGame,
  isUserGameComplete,
} from '../franchiseEngine';
import type { FranchiseRoster, ScheduleDay, ScheduledGame } from '../../types/franchise';

describe('franchiseEngine', () => {
  describe('generateSchedule', () => {
    it('generates correct number of days', () => {
      const schedule = generateSchedule(10, 'NYY', 42);
      expect(schedule).toHaveLength(10);
    });

    it('each day has 15 games (30 teams / 2)', () => {
      const schedule = generateSchedule(10, 'NYY', 42);
      for (const day of schedule) {
        expect(day.games).toHaveLength(15);
      }
    });

    it('user team plays every day', () => {
      const schedule = generateSchedule(30, 'NYY', 42);
      for (const day of schedule) {
        const userGame = day.games.find(
          g => g.awayTeamAbbr === 'NYY' || g.homeTeamAbbr === 'NYY',
        );
        expect(userGame).toBeDefined();
      }
    });

    it('is deterministic with the same seed', () => {
      const s1 = generateSchedule(10, 'NYY', 42);
      const s2 = generateSchedule(10, 'NYY', 42);
      expect(s1).toEqual(s2);
    });

    it('all games start as upcoming', () => {
      const schedule = generateSchedule(10, 'NYY', 42);
      for (const day of schedule) {
        for (const game of day.games) {
          expect(game.status).toBe('upcoming');
        }
      }
    });
  });

  describe('buildDefaultRoster', () => {
    it('produces a roster with 9 lineup slots', () => {
      const roster = buildDefaultRoster('NYY');
      expect(roster.lineup).toHaveLength(9);
    });

    it('has up to 5 starting pitchers', () => {
      const roster = buildDefaultRoster('NYY');
      expect(roster.startingPitchers.length).toBeLessThanOrEqual(5);
      expect(roster.startingPitchers.length).toBeGreaterThan(0);
    });

    it('has up to 3 relief pitchers', () => {
      const roster = buildDefaultRoster('NYY');
      expect(roster.reliefPitchers.length).toBeLessThanOrEqual(3);
    });

    it('lastStarterUsed starts as null', () => {
      const roster = buildDefaultRoster('NYY');
      expect(roster.lastStarterUsed).toBeNull();
    });

    it('sets correct team abbr', () => {
      const roster = buildDefaultRoster('BOS');
      expect(roster.teamAbbr).toBe('BOS');
    });
  });

  describe('getNextStarter', () => {
    const roster: FranchiseRoster = {
      teamAbbr: 'NYY',
      lineup: [],
      bench: [],
      startingPitchers: ['sp1', 'sp2', 'sp3', 'sp4', 'sp5'],
      reliefPitchers: [],
      lastStarterUsed: null,
    };

    it('returns first pitcher when no last starter', () => {
      expect(getNextStarter(roster)).toBe('sp1');
    });

    it('cycles to next pitcher after last', () => {
      expect(getNextStarter({ ...roster, lastStarterUsed: 'sp1' })).toBe('sp2');
      expect(getNextStarter({ ...roster, lastStarterUsed: 'sp3' })).toBe('sp4');
    });

    it('wraps around to first pitcher', () => {
      expect(getNextStarter({ ...roster, lastStarterUsed: 'sp5' })).toBe('sp1');
    });

    it('returns first if lastStarterUsed not in rotation', () => {
      expect(getNextStarter({ ...roster, lastStarterUsed: 'unknown' })).toBe('sp1');
    });

    it('returns empty string for empty rotation', () => {
      expect(getNextStarter({ ...roster, startingPitchers: [] })).toBe('');
    });
  });

  describe('computeStandings', () => {
    it('computes W-L from completed games', () => {
      const schedule: ScheduleDay[] = [{
        dayNumber: 1,
        games: [{
          id: 'g1',
          awayTeamAbbr: 'NYY',
          homeTeamAbbr: 'BOS',
          status: 'completed',
          result: { awayScore: 5, homeScore: 3, winnerAbbr: 'NYY', loserAbbr: 'BOS', innings: 9 },
        }],
      }];
      const standings = computeStandings(schedule);
      const nyy = standings.find(r => r.teamAbbr === 'NYY')!;
      const bos = standings.find(r => r.teamAbbr === 'BOS')!;
      expect(nyy.wins).toBe(1);
      expect(nyy.losses).toBe(0);
      expect(bos.wins).toBe(0);
      expect(bos.losses).toBe(1);
    });

    it('computes games back correctly', () => {
      const schedule: ScheduleDay[] = [
        {
          dayNumber: 1,
          games: [{
            id: 'g1', awayTeamAbbr: 'NYY', homeTeamAbbr: 'BOS', status: 'completed',
            result: { awayScore: 5, homeScore: 3, winnerAbbr: 'NYY', loserAbbr: 'BOS', innings: 9 },
          }],
        },
        {
          dayNumber: 2,
          games: [{
            id: 'g2', awayTeamAbbr: 'NYY', homeTeamAbbr: 'BOS', status: 'completed',
            result: { awayScore: 4, homeScore: 2, winnerAbbr: 'NYY', loserAbbr: 'BOS', innings: 9 },
          }],
        },
      ];
      const standings = computeStandings(schedule);
      const nyy = standings.find(r => r.teamAbbr === 'NYY')!;
      const bos = standings.find(r => r.teamAbbr === 'BOS')!;
      expect(nyy.gamesBack).toBe(0);
      expect(bos.gamesBack).toBe(2); // ((2-0)+(2-0))/2 = 2
    });

    it('ignores upcoming games', () => {
      const schedule: ScheduleDay[] = [{
        dayNumber: 1,
        games: [{
          id: 'g1', awayTeamAbbr: 'NYY', homeTeamAbbr: 'BOS', status: 'upcoming',
        }],
      }];
      const standings = computeStandings(schedule);
      const nyy = standings.find(r => r.teamAbbr === 'NYY')!;
      expect(nyy.wins).toBe(0);
      expect(nyy.losses).toBe(0);
    });
  });

  describe('getTeamRecord', () => {
    const schedule: ScheduleDay[] = [{
      dayNumber: 1,
      games: [{
        id: 'g1', awayTeamAbbr: 'NYY', homeTeamAbbr: 'BOS', status: 'completed',
        result: { awayScore: 5, homeScore: 3, winnerAbbr: 'NYY', loserAbbr: 'BOS', innings: 9 },
      }],
    }];

    it('returns correct wins and losses', () => {
      expect(getTeamRecord(schedule, 'NYY')).toEqual({ wins: 1, losses: 0 });
      expect(getTeamRecord(schedule, 'BOS')).toEqual({ wins: 0, losses: 1 });
    });

    it('returns 0-0 for team with no games', () => {
      expect(getTeamRecord(schedule, 'LAD')).toEqual({ wins: 0, losses: 0 });
    });
  });

  describe('getUserGame / isUserGameComplete', () => {
    const day: ScheduleDay = {
      dayNumber: 1,
      games: [
        { id: 'g1', awayTeamAbbr: 'NYY', homeTeamAbbr: 'BOS', status: 'completed',
          result: { awayScore: 5, homeScore: 3, winnerAbbr: 'NYY', loserAbbr: 'BOS', innings: 9 } },
        { id: 'g2', awayTeamAbbr: 'LAD', homeTeamAbbr: 'SF', status: 'upcoming' },
      ],
    };

    it('finds the user game', () => {
      expect(getUserGame(day, 'NYY')?.id).toBe('g1');
      expect(getUserGame(day, 'BOS')?.id).toBe('g1');
      expect(getUserGame(day, 'LAD')?.id).toBe('g2');
    });

    it('returns undefined for team not playing', () => {
      expect(getUserGame(day, 'HOU')).toBeUndefined();
    });

    it('checks if user game is complete', () => {
      expect(isUserGameComplete(day, 'NYY')).toBe(true);
      expect(isUserGameComplete(day, 'LAD')).toBe(false);
    });
  });
});
