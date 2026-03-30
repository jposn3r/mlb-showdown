/**
 * Franchise state store — manages the active franchise save.
 * Persists to localStorage via Zustand persist middleware.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { teams } from '../data/teams';
import {
  generateSchedule,
  buildAllRosters,
  getNextStarter,
  resolveRoster,
  getCardById,
} from '../game/franchiseEngine';
import { simulateGame } from '../game/simulation';
import { extractStatsFromGame, mergeGameStats } from '../game/statsTracker';
import { useGameStore } from './gameStore';
import { useScreenStore } from './screenStore';
import type {
  FranchiseSave, FranchiseTab, CreateFranchiseConfig, GameResult,
} from '../types/franchise';

interface FranchiseStore {
  franchise: FranchiseSave | null;
  activeFranchiseGameId: string | null;
  activeTab: FranchiseTab;
  isAdvancing: boolean;

  // Setup
  createFranchise: (config: CreateFranchiseConfig) => void;

  // Hub navigation
  setActiveTab: (tab: FranchiseTab) => void;

  // Game flow
  startFranchiseGame: (gameId: string) => void;
  recordFranchiseGameResult: () => void;

  // Day advancement
  advanceDay: () => void;

  // Roster management
  setLineup: (lineup: string[]) => void;
  setStartingPitcher: (pitcherId: string) => void;

  // Lifecycle
  deleteFranchise: () => void;
}

export const useFranchiseStore = create<FranchiseStore>()(
  persist(
    (set, get) => ({
      franchise: null,
      activeFranchiseGameId: null,
      activeTab: 'schedule',
      isAdvancing: false,

      createFranchise: (config) => {
        const id = crypto.randomUUID();
        const seed = hashString(id);
        const rosters = buildAllRosters();
        const schedule = generateSchedule(config.seasonLength, config.userTeamAbbr, seed);

        const franchise: FranchiseSave = {
          id,
          name: config.name,
          createdAt: Date.now(),
          startMode: config.startMode,
          difficulty: config.difficulty,
          currentSeason: 1,
          seasonLength: config.seasonLength,
          currentDay: 1,
          userTeamAbbr: config.userTeamAbbr,
          rosters,
          schedule,
          seasonStats: {},
          awards: [],
          playoffs: null,
          history: [],
        };

        set({ franchise, activeTab: 'schedule', activeFranchiseGameId: null });
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      startFranchiseGame: (gameId) => {
        const { franchise } = get();
        if (!franchise) return;

        const day = franchise.schedule.find(d => d.dayNumber === franchise.currentDay);
        const game = day?.games.find(g => g.id === gameId);
        if (!game || game.status === 'completed') return;

        const awayRoster = franchise.rosters[game.awayTeamAbbr];
        const homeRoster = franchise.rosters[game.homeTeamAbbr];
        if (!awayRoster || !homeRoster) return;

        // Determine starters
        const awayStarterId = getNextStarter(awayRoster);
        const homeStarterId = getNextStarter(homeRoster);

        const awayResolved = resolveRoster(awayRoster, awayStarterId);
        const homeResolved = resolveRoster(homeRoster, homeStarterId);
        if (!awayResolved || !homeResolved) return;

        const awayMeta = teams.find(t => t.abbr === game.awayTeamAbbr);
        const homeMeta = teams.find(t => t.abbr === game.homeTeamAbbr);

        // Start the game via the game store
        useGameStore.getState().startNewGame(
          awayMeta?.abbr ?? game.awayTeamAbbr,
          awayResolved.lineup,
          awayResolved.pitching,
          homeMeta?.abbr ?? game.homeTeamAbbr,
          homeResolved.lineup,
          homeResolved.pitching,
        );

        set({ activeFranchiseGameId: gameId });
        useScreenStore.getState().navigate('game');
      },

      recordFranchiseGameResult: () => {
        const { franchise, activeFranchiseGameId } = get();
        if (!franchise || !activeFranchiseGameId) return;

        const gameState = useGameStore.getState().gameState;
        if (!gameState) return;

        const day = franchise.schedule.find(d => d.dayNumber === franchise.currentDay);
        const gameIdx = day?.games.findIndex(g => g.id === activeFranchiseGameId) ?? -1;
        if (!day || gameIdx === -1) return;

        const game = day.games[gameIdx];
        const awayWon = gameState.away.score > gameState.home.score;
        const winnerAbbr = awayWon ? game.awayTeamAbbr : game.homeTeamAbbr;
        const loserAbbr = awayWon ? game.homeTeamAbbr : game.awayTeamAbbr;

        const result: GameResult = {
          awayScore: gameState.away.score,
          homeScore: gameState.home.score,
          winnerAbbr,
          loserAbbr,
          innings: gameState.inning,
        };

        // Update schedule
        const updatedSchedule = franchise.schedule.map(d => {
          if (d.dayNumber !== franchise.currentDay) return d;
          return {
            ...d,
            games: d.games.map(g =>
              g.id === activeFranchiseGameId
                ? { ...g, status: 'completed' as const, result }
                : g
            ),
          };
        });

        // Extract and merge stats
        const gameStats = extractStatsFromGame(gameState, game.awayTeamAbbr, game.homeTeamAbbr);
        const awayRoster = franchise.rosters[game.awayTeamAbbr];
        const homeRoster = franchise.rosters[game.homeTeamAbbr];
        const awayStarterId = awayRoster?.startingPitchers.find(id => {
          const card = getCardById(id);
          return card?.id === gameState.away.currentPitcher.id ||
            gameState.gameLog.some(e => e.pitcherId === id && e.inning === 1);
        }) ?? gameState.away.pitchingStaff[0]?.id ?? '';
        const homeStarterId = homeRoster?.startingPitchers.find(id => {
          const card = getCardById(id);
          return card?.id === gameState.home.currentPitcher.id ||
            gameState.gameLog.some(e => e.pitcherId === id && e.inning === 1);
        }) ?? gameState.home.pitchingStaff[0]?.id ?? '';

        const updatedStats = mergeGameStats(
          franchise.seasonStats, gameStats,
          winnerAbbr, loserAbbr,
          awayStarterId, homeStarterId,
          game.awayTeamAbbr, game.homeTeamAbbr,
        );

        // Update rosters (mark last starter used)
        const updatedRosters = { ...franchise.rosters };
        if (updatedRosters[game.awayTeamAbbr]) {
          updatedRosters[game.awayTeamAbbr] = {
            ...updatedRosters[game.awayTeamAbbr],
            lastStarterUsed: awayStarterId,
          };
        }
        if (updatedRosters[game.homeTeamAbbr]) {
          updatedRosters[game.homeTeamAbbr] = {
            ...updatedRosters[game.homeTeamAbbr],
            lastStarterUsed: homeStarterId,
          };
        }

        set({
          franchise: {
            ...franchise,
            schedule: updatedSchedule,
            seasonStats: updatedStats,
            rosters: updatedRosters,
          },
          activeFranchiseGameId: null,
        });

        // Clean up game store
        useGameStore.getState().resetGame();
      },

      advanceDay: () => {
        const { franchise } = get();
        if (!franchise) return;

        set({ isAdvancing: true });

        const day = franchise.schedule.find(d => d.dayNumber === franchise.currentDay);
        if (!day) {
          set({ isAdvancing: false });
          return;
        }

        let updatedSchedule = [...franchise.schedule];
        let updatedStats = { ...franchise.seasonStats };
        const updatedRosters = { ...franchise.rosters };

        // Simulate all CPU games for this day
        const cpuGames = day.games.filter(g => g.status === 'upcoming');

        for (const game of cpuGames) {
          const awayRoster = updatedRosters[game.awayTeamAbbr];
          const homeRoster = updatedRosters[game.homeTeamAbbr];
          if (!awayRoster || !homeRoster) continue;

          const awayStarterId = getNextStarter(awayRoster);
          const homeStarterId = getNextStarter(homeRoster);

          const awayResolved = resolveRoster(awayRoster, awayStarterId);
          const homeResolved = resolveRoster(homeRoster, homeStarterId);
          if (!awayResolved || !homeResolved) continue;

          const awayMeta = teams.find(t => t.abbr === game.awayTeamAbbr);
          const homeMeta = teams.find(t => t.abbr === game.homeTeamAbbr);

          // Use day number + game index as seed for deterministic results
          const seed = hashString(franchise.id + game.id);
          const simResult = simulateGame(
            awayMeta?.abbr ?? game.awayTeamAbbr,
            awayResolved.lineup,
            awayResolved.pitching,
            homeMeta?.abbr ?? game.homeTeamAbbr,
            homeResolved.lineup,
            homeResolved.pitching,
            seed,
          );

          const awayWon = simResult.awayScore > simResult.homeScore;
          const winnerAbbr = awayWon ? game.awayTeamAbbr : game.homeTeamAbbr;
          const loserAbbr = awayWon ? game.homeTeamAbbr : game.awayTeamAbbr;

          const result: GameResult = {
            awayScore: simResult.awayScore,
            homeScore: simResult.homeScore,
            winnerAbbr,
            loserAbbr,
            innings: simResult.innings,
          };

          // Update schedule
          updatedSchedule = updatedSchedule.map(d => {
            if (d.dayNumber !== franchise.currentDay) return d;
            return {
              ...d,
              games: d.games.map(g =>
                g.id === game.id
                  ? { ...g, status: 'completed' as const, result }
                  : g
              ),
            };
          });

          // Extract and merge stats
          const gameStats = extractStatsFromGame(
            simResult.finalState, game.awayTeamAbbr, game.homeTeamAbbr,
          );
          updatedStats = mergeGameStats(
            updatedStats, gameStats,
            winnerAbbr, loserAbbr,
            awayStarterId, homeStarterId,
            game.awayTeamAbbr, game.homeTeamAbbr,
          );

          // Update rosters
          updatedRosters[game.awayTeamAbbr] = {
            ...updatedRosters[game.awayTeamAbbr],
            lastStarterUsed: awayStarterId,
          };
          updatedRosters[game.homeTeamAbbr] = {
            ...updatedRosters[game.homeTeamAbbr],
            lastStarterUsed: homeStarterId,
          };
        }

        // Advance to next day
        const nextDay = franchise.currentDay + 1;
        const seasonOver = nextDay > franchise.seasonLength;

        set({
          franchise: {
            ...franchise,
            schedule: updatedSchedule,
            seasonStats: updatedStats,
            rosters: updatedRosters,
            currentDay: seasonOver ? franchise.currentDay : nextDay,
          },
          isAdvancing: false,
        });
      },

      setLineup: (lineup) => {
        const { franchise } = get();
        if (!franchise) return;
        const roster = franchise.rosters[franchise.userTeamAbbr];
        if (!roster) return;

        set({
          franchise: {
            ...franchise,
            rosters: {
              ...franchise.rosters,
              [franchise.userTeamAbbr]: { ...roster, lineup },
            },
          },
        });
      },

      setStartingPitcher: (pitcherId) => {
        const { franchise } = get();
        if (!franchise) return;
        const roster = franchise.rosters[franchise.userTeamAbbr];
        if (!roster || !roster.startingPitchers.includes(pitcherId)) return;

        // Move selected pitcher to front of rotation
        const reordered = [
          pitcherId,
          ...roster.startingPitchers.filter(id => id !== pitcherId),
        ];

        set({
          franchise: {
            ...franchise,
            rosters: {
              ...franchise.rosters,
              [franchise.userTeamAbbr]: {
                ...roster,
                startingPitchers: reordered,
              },
            },
          },
        });
      },

      deleteFranchise: () => {
        set({
          franchise: null,
          activeFranchiseGameId: null,
          activeTab: 'schedule',
          isAdvancing: false,
        });
      },
    }),
    {
      name: 'mlb-showdown-franchise',
      partialize: (state) => ({
        franchise: state.franchise,
      }),
    },
  ),
);

/** Simple string hash for seeding RNG */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
