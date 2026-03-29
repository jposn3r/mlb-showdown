/**
 * Console test — simulate a full 9-inning game using real card data
 * to verify the game engine works end-to-end.
 *
 * Run with: npx tsx scripts/test-engine.ts
 */

import { nyyCards } from '../src/data/cards/teams/nyy';
import { ladCards } from '../src/data/cards/teams/lad';
import { simulateGame, formatBoxScore } from '../src/game/simulation';
import type { PlayerCard } from '../src/types';

function splitRoster(cards: PlayerCard[]) {
  const sp = cards.filter(c => c.position === 'SP');
  const rp = cards.filter(c => c.position === 'RP');
  const batters = cards.filter(c => !['SP', 'RP'].includes(c.position));
  return {
    lineup: batters.slice(0, 9),
    pitching: [...sp, ...rp],
  };
}

// Yankees vs Dodgers
const nyy = splitRoster(nyyCards);
const lad = splitRoster(ladCards);

console.log('=== MLB Showdown Engine Test ===\n');
console.log('Yankees vs Dodgers\n');

console.log('NYY Lineup:');
nyy.lineup.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} (${p.position}) OB:${p.onBase} SPD:${p.speed}`));
console.log(`NYY SP: ${nyy.pitching[0]?.name} (CTRL:${nyy.pitching[0]?.control} IP:${nyy.pitching[0]?.ip})`);

console.log('\nLAD Lineup:');
lad.lineup.forEach((p, i) => console.log(`  ${i + 1}. ${p.name} (${p.position}) OB:${p.onBase} SPD:${p.speed}`));
console.log(`LAD SP: ${lad.pitching[0]?.name} (CTRL:${lad.pitching[0]?.control} IP:${lad.pitching[0]?.ip})`);

// Run 10 simulated games with different seeds
console.log('\n=== Simulating 10 games ===\n');

let nyyWins = 0;
let ladWins = 0;

for (let i = 0; i < 10; i++) {
  const result = simulateGame(
    'NYY', nyy.lineup, nyy.pitching,
    'LAD', lad.lineup, lad.pitching,
    i * 12345,
  );

  if (result.winner === 'away') nyyWins++;
  else ladWins++;

  console.log(`Game ${i + 1}: NYY ${result.awayScore} - LAD ${result.homeScore} (${result.innings} inn) — ${result.winner === 'away' ? 'NYY' : 'LAD'} wins`);
}

console.log(`\nSeries: NYY ${nyyWins} - LAD ${ladWins}`);

// Show detailed box score of last game
console.log('\n=== Last Game Box Score ===\n');
const lastGame = simulateGame('NYY', nyy.lineup, nyy.pitching, 'LAD', lad.lineup, lad.pitching, 99999);
console.log(formatBoxScore(lastGame.finalState));

// Show some game log entries
console.log('\n=== Key Plays (last game) ===\n');
const keyPlays = lastGame.finalState.gameLog.filter(e =>
  ['HR', '3B', '2B', 'DP'].includes(e.result) || e.runsScored > 0
);
keyPlays.slice(0, 15).forEach(e => {
  const when = `${e.halfInning === 'top' ? 'T' : 'B'}${e.inning}`;
  console.log(`  ${when}: ${e.description}${e.runsScored > 0 ? ` (${e.runsScored} run${e.runsScored > 1 ? 's' : ''})` : ''}`);
});

console.log('\n=== Engine test complete ===');
