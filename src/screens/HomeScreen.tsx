import { useMemo, useState, useCallback } from 'react';
import { useScreenStore, type Screen } from '../store/screenStore';
import { useFranchiseStore } from '../store/franchiseStore';
import { getTeamRecord } from '../game/franchiseEngine';
import { allCards } from '../data/cards/allCards';

const GAME_MODES: { id: Screen; title: string; desc: string }[] = [
  { id: 'quickPlaySelect', title: 'Quick Play', desc: 'Pick a preset team and play' },
  { id: 'quickPlaySelect', title: 'Hot Seat', desc: 'Two players, one device' },
  { id: 'quickPlaySelect', title: 'vs CPU', desc: 'Challenge the computer' },
  { id: 'teamBuilder', title: 'Team Builder', desc: 'Build your dream roster' },
];

// Seeded pseudo-random for consistent card positions across renders
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function getHeadshotUrl(mlbPlayerId: number): string {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_213,q_auto:low/v1/people/${mlbPlayerId}/headshot/silo/current`;
}

// Top 10 MLB stars — rendered larger and on top of the pile
const TOP_STAR_IDS = new Set([
  'player-592450', // Aaron Judge
  'player-660271', // Shohei Ohtani
  'player-665489', // Mookie Betts
  'player-545361', // Mike Trout
  'player-665742', // Juan Soto
  'player-668939', // Ronald Acuna Jr
  'player-621043', // Freddie Freeman
  'player-677951', // Bobby Witt Jr
  'player-671096', // Gunnar Henderson
  'player-682998', // Elly De La Cruz
]);

// Pick ~100 cards spread across teams for visual variety
function pickScatteredCards() {
  const rng = seededRandom(42);

  const stars = allCards.filter(c => TOP_STAR_IDS.has(c.id));
  const others = allCards.filter(c => !TOP_STAR_IDS.has(c.id));

  // Shuffle others and pick enough to reach ~100 total
  const shuffled = others.sort(() => rng() - 0.5);
  const picked = [...shuffled.slice(0, 100 - stars.length), ...stars];

  // Re-shuffle — stars end up at random positions
  return picked.sort(() => rng() - 0.5);
}

interface ScatteredCard {
  id: string;
  teamColor: string;
  mlbPlayerId: number;
  name: string;
  position: string;
  isStar: boolean;
  x: number;      // % from left
  y: number;      // % from top
  rotation: number; // degrees
  scale: number;
  zIndex: number;
  brightness: number; // 0-1, lower z = darker
}

// Quadrant bounds: [xMin, xMax, yMin, yMax]
const QUADRANTS: [number, number, number, number][] = [
  [5, 48, 5, 45],   // top-left
  [52, 95, 5, 45],  // top-right
  [5, 48, 55, 90],  // bottom-left
  [52, 95, 55, 90], // bottom-right
];

function generateCardPositions(cards: ReturnType<typeof pickScatteredCards>): ScatteredCard[] {
  const rng = seededRandom(123);

  const stars = cards.filter(c => TOP_STAR_IDS.has(c.id));
  const regulars = cards.filter(c => !TOP_STAR_IDS.has(c.id));

  const result: ScatteredCard[] = [];

  // Place 2 stars in each quadrant, remaining 2 stars get random quadrants
  const starPlacements: number[] = [0, 0, 1, 1, 2, 2, 3, 3];
  // Last 2 stars get random quadrants
  for (let i = 8; i < stars.length; i++) {
    starPlacements.push(Math.floor(rng() * 4));
  }

  stars.forEach((card, i) => {
    const q = QUADRANTS[starPlacements[i]];
    const zIndex = 50 + Math.floor(rng() * 10);
    const brightness = 0.35 + (zIndex / 60) * 0.65;
    result.push({
      id: card.id,
      teamColor: card.teamColor,
      mlbPlayerId: card.mlbPlayerId,
      name: card.name,
      position: card.position,
      isStar: true,
      x: q[0] + rng() * (q[1] - q[0]),
      y: q[2] + rng() * (q[3] - q[2]),
      rotation: (rng() - 0.5) * 50, // stars rotate less (±25)
      scale: 1.3 + rng() * 0.3,
      zIndex,
      brightness,
    });
  });

  // Place regular cards fully randomly
  regulars.forEach((card) => {
    const zIndex = Math.floor(rng() * 50);
    const brightness = 0.35 + (zIndex / 60) * 0.65;
    result.push({
      id: card.id,
      teamColor: card.teamColor,
      mlbPlayerId: card.mlbPlayerId,
      name: card.name,
      position: card.position,
      isStar: false,
      x: rng() * 90 + 5,
      y: rng() * 85 + 5,
      rotation: (rng() - 0.5) * 70,
      scale: 0.6 + rng() * 0.5,
      zIndex,
      brightness,
    });
  });

  return result;
}

function CardPileLayer({ cards, id }: { cards: ScatteredCard[]; id: string }) {
  return (
    <>
      {cards.map((card) => (
        <div
          key={`${id}-${card.id}`}
          className="absolute"
          style={{
            left: `${card.x}%`,
            top: `${card.y}%`,
            transform: `translate(-50%, -50%) rotate(${card.rotation}deg) scale(${card.scale})`,
            zIndex: card.zIndex,
            filter: `brightness(${card.brightness})`,
          }}
        >
          <div
            className="rounded-[5px] overflow-hidden"
            style={{
              width: card.isStar ? '110px' : '100px',
              height: card.isStar ? '165px' : '150px',
              background: card.teamColor,
              boxShadow: card.isStar
                ? '0 4px 20px rgba(0,0,0,0.6), 0 0 8px rgba(201,168,76,0.2)'
                : '0 2px 8px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="m-[2px] rounded-[4px] h-[calc(100%-4px)] flex flex-col overflow-hidden"
              style={{ background: '#1a1d24' }}
            >
              <div className="flex-1 relative overflow-hidden" style={{ background: '#111318' }}>
                <img
                  src={getHeadshotUrl(card.mlbPlayerId)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover object-top"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute top-1 left-1 px-1 py-px rounded text-[6px] font-bold text-white bg-black/60">
                  {card.position}
                </div>
              </div>
              <div className="px-1.5 py-1 bg-[#252830]">
                <div className="text-[7px] font-bold text-white truncate" style={{ fontFamily: 'var(--font-display)' }}>
                  {card.name}
                </div>
              </div>
              <div className="px-1 py-0.5 flex gap-px">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className="flex-1 h-[4px] rounded-sm"
                    style={{
                      background: i < 3 ? '#3a1a1a' : i < 6 ? '#2a2a1a' : i < 8 ? '#1a2a3a' : '#1a1a3a',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export function HomeScreen() {
  const navigate = useScreenStore((s) => s.navigate);
  const franchise = useFranchiseStore((s) => s.franchise);
  const franchiseRecord = franchise ? getTeamRecord(franchise.schedule, franchise.userTeamAbbr) : null;

  const scatteredCards = useMemo(() => {
    const cards = pickScatteredCards();
    return generateCardPositions(cards);
  }, []);

  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos({ x: -1000, y: -1000 });
  }, []);

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen px-4 py-8 overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >

      {/* === Blurred card pile (base layer) === */}
      <div className="absolute inset-0 z-0" style={{ filter: 'blur(6px)' }}>
        <CardPileLayer cards={scatteredCards} id="blur" />
        {/* Dark overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'rgba(13, 15, 20, 0.75)' }}
        />
      </div>

      {/* === Sharp card pile (reveal layer — masked to mouse spotlight) === */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          maskImage: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(circle 250px at ${mousePos.x}px ${mousePos.y}px, black 0%, transparent 100%)`,
        }}
      >
        <CardPileLayer cards={scatteredCards} id="sharp" />
      </div>

      {/* === Content — above background === */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Title */}
        <div
          className="text-center mb-12 px-8 py-6 rounded-xl backdrop-blur-sm"
          style={{
            background: 'rgba(13, 15, 20, 0.85)',
            border: '1px solid var(--color-divider)',
          }}
        >
          <h1
            className="text-5xl md:text-7xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            MLB Showdown
          </h1>
          <div
            className="mt-2 h-1 w-48 mx-auto rounded"
            style={{ background: 'var(--color-gold)' }}
          />
          <p className="mt-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            The classic card game, reimagined for the web
          </p>
        </div>

        {/* Mode cards — 2x2 grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-6">
          {GAME_MODES.map((mode) => (
            <button
              key={mode.title}
              onClick={() => navigate(mode.id)}
              className="group relative rounded-lg p-5 text-left transition-all duration-200
                hover:scale-[1.03] active:scale-[0.98] cursor-pointer backdrop-blur-sm"
              style={{
                background: 'rgba(26, 29, 36, 0.85)',
                border: '1px solid var(--color-divider)',
              }}
            >
              <h3
                className="text-lg font-semibold group-hover:text-[var(--color-gold)] transition-colors"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {mode.title}
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {mode.desc}
              </p>
            </button>
          ))}
        </div>

        {/* Franchise button — full width below grid */}
        <button
          onClick={() => navigate(franchise ? 'franchiseHub' : 'franchiseSetup')}
          className="w-full max-w-md rounded-lg p-5 text-left transition-all duration-200
            hover:scale-[1.02] active:scale-[0.98] cursor-pointer backdrop-blur-sm"
          style={{
            background: 'linear-gradient(135deg, rgba(26, 29, 36, 0.9), rgba(34, 37, 46, 0.9))',
            border: '1px solid var(--color-gold-dim)',
          }}
        >
          <h3
            className="text-xl font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
          >
            Franchise Mode
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {franchise && franchiseRecord
              ? `${franchise.name} — ${franchiseRecord.wins}-${franchiseRecord.losses} (Day ${franchise.currentDay})`
              : '30-team league, full seasons, playoffs, and legacy'}
          </p>
        </button>

        {/* Settings */}
        <button
          onClick={() => navigate('settings')}
          className="mt-8 text-sm transition-colors hover:text-[var(--color-gold)]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Settings
        </button>
      </div>
    </div>
  );
}
