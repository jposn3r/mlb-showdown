import type { PlayerCard as CardType } from '../../types';
import { OutcomeChart } from './OutcomeChart';
import '../../styles/card.css';

function getHeadshotUrl(card: CardType): string {
  if (!card.mlbPlayerId || card.mlbPlayerId === 0) return '';
  // Silo = transparent-background cutout, better for cards
  return `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:silo:current.png/w_426,q_auto:best/v1/people/${card.mlbPlayerId}/headshot/silo/current`;
}

interface Props {
  card: CardType;
  activeRoll?: number;
  showAdvantage?: 'pitcher' | 'batter' | null;
  isActiveRoller?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-[280px] h-[420px]',
  md: 'w-[340px] h-[510px]',
  lg: 'w-[400px] h-[600px]',
};

export function PlayerCard({ card, activeRoll, isActiveRoller, size = 'md' }: Props) {
  const isPitcher = card.position === 'SP' || card.position === 'RP';
  const chart = isPitcher ? card.pitcherChart : card.batterChart;
  const rarityClass = card.rarity === 'foil' ? 'card-foil' : card.rarity === 'rare' ? 'card-rare' : '';

  return (
    <div
      className={`${SIZE_CLASSES[size]} relative rounded-[8px] overflow-hidden ${rarityClass}`}
      style={isActiveRoller ? {
        boxShadow: '0 0 24px rgba(201,168,76,0.6), 0 0 48px rgba(201,168,76,0.3)',
        outline: '3px solid var(--color-gold)',
        outlineOffset: '-1px',
      } : undefined}
    >
      {/* Outer border — team color accent */}
      <div className="absolute inset-0 rounded-[8px]" style={{ background: card.teamColor }} />

      {/* Card body — dark theme */}
      <div className="absolute inset-[3px] rounded-[6px] flex flex-col overflow-hidden bg-[#1a1d24]">

        {/* === TOP: Player Image Area === */}
        <div
          className="relative flex-none overflow-hidden"
          style={{ height: '38%', background: '#111318' }}
        >
          {/* Player headshot */}
          <div className="absolute inset-0 flex items-end justify-center">
            {card.mlbPlayerId ? (
              <img
                src={getHeadshotUrl(card)}
                alt={card.name}
                className="h-[95%] object-contain drop-shadow-md"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="text-4xl opacity-30 mb-4">⚾</div>
            )}
          </div>

          {/* Top-left: Position badge */}
          <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded text-[11px] font-bold text-white bg-black/60">
            {card.position}
          </div>

          {/* Top-right: Points */}
          <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[11px] font-bold text-white/80 bg-black/60">
            {card.points} pt
          </div>

        </div>

        {/* === NAME BAR === */}
        <div className="flex-none px-3 py-1.5 flex items-center justify-between bg-[#252830]">
          <span
            className="text-white font-bold truncate leading-tight"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: size === 'sm' ? '14px' : size === 'md' ? '17px' : '20px',
            }}
          >
            {card.name}
          </span>
          <span className="text-white/40 text-[10px] font-mono shrink-0 ml-2">
            {card.team}
          </span>
        </div>

        {/* === STATS BAR === */}
        <div className="flex-none px-2 py-2 flex items-center justify-around bg-[#1e2128]"
          style={{ borderBottom: '1px solid #333' }}>
          {isPitcher ? (
            <>
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider font-bold text-white/40">Control</div>
                <div className="font-bold leading-none text-white"
                  style={{ fontSize: size === 'sm' ? '26px' : '32px', fontFamily: 'var(--font-display)' }}>
                  {card.control}
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider font-bold text-white/40">IP</div>
                <div className="font-bold leading-none text-white"
                  style={{ fontSize: size === 'sm' ? '26px' : '32px', fontFamily: 'var(--font-display)' }}>
                  {card.ip}
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider font-bold text-white/40">Throws</div>
                <div className="text-sm font-bold text-white">{card.throws}HP</div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider font-bold text-white/40">On-Base</div>
                <div className="font-bold leading-none text-white"
                  style={{ fontSize: size === 'sm' ? '26px' : '32px', fontFamily: 'var(--font-display)' }}>
                  {card.onBase}
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider font-bold text-white/40">Speed</div>
                <div className="font-bold leading-none text-white"
                  style={{ fontSize: size === 'sm' ? '26px' : '32px', fontFamily: 'var(--font-display)' }}>
                  {card.speed}
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <div className="text-[9px] uppercase tracking-wider font-bold text-white/40">Bats</div>
                <div className="text-sm font-bold text-white">{card.bats}</div>
              </div>
            </>
          )}
        </div>

        {/* === OUTCOME CHART === */}
        <div className="flex-1 px-1.5 py-1 min-h-0 overflow-hidden bg-[#1a1d24]">
          {chart && <OutcomeChart chart={chart} activeRoll={activeRoll} />}
        </div>

        {/* === FOOTER === */}
        <div className="flex-none px-2 py-0.5 flex justify-between items-center text-[9px] bg-[#151720] text-white/30">
          <span>{card.year} MLB Showdown</span>
          <span className="font-bold uppercase">{card.rarity}</span>
        </div>
      </div>

      {/* Foil shimmer overlay */}
      {card.rarity === 'foil' && <div className="foil-overlay" />}
    </div>
  );
}
