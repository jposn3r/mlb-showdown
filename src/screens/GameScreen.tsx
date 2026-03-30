import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { useScreenStore } from '../store/screenStore';
import { useFranchiseStore } from '../store/franchiseStore';
import { GameBoard } from '../components/GameBoard/GameBoard';

export function GameScreen() {
  const { gameState, uiPhase, resetGame } = useGameStore();
  const navigate = useScreenStore((s) => s.navigate);
  const activeFranchiseGameId = useFranchiseStore((s) => s.activeFranchiseGameId);

  // Auto-navigate to result screen on game over
  useEffect(() => {
    if (uiPhase === 'game_over') {
      const target = activeFranchiseGameId ? 'franchiseResult' : 'result';
      const timer = setTimeout(() => navigate(target), 3000);
      return () => clearTimeout(timer);
    }
  }, [uiPhase, navigate, activeFranchiseGameId]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p style={{ color: 'var(--color-text-muted)' }}>No game in progress</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Thin top bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 shrink-0"
        style={{ background: 'var(--color-bg-surface)', borderBottom: '1px solid var(--color-divider)' }}
      >
        <button
          onClick={() => { resetGame(); navigate('home'); }}
          className="text-xs cursor-pointer transition-colors hover:text-[var(--color-gold)]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          ← Menu
        </button>
        <span
          className="text-sm font-bold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-gold)' }}
        >
          MLB Showdown
        </span>
        <div className="w-12" />
      </div>

      {/* Game board — fills all remaining vertical space */}
      <div className="flex-1 min-h-0">
        <GameBoard />
      </div>
    </div>
  );
}
