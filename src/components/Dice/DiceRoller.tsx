import { useState, useCallback } from 'react';
import type { AtBatResult } from '../../types';
import '../../styles/dice.css';

type DiceState = 'idle' | 'rolling' | 'result';

interface Props {
  onRoll: () => number; // callback that returns the die result (1-20)
  disabled?: boolean;
  label?: string;
  resultType?: AtBatResult | null;
}

function getResultClass(result: AtBatResult | null | undefined): string {
  if (!result) return 'result';
  if (result === 'HR') return 'result result-hr';
  if (['1B', '2B', '3B'].includes(result)) return 'result result-hit';
  if (result === 'BB') return 'result result-walk';
  return 'result result-out';
}

export function DiceRoller({ onRoll, disabled, label, resultType }: Props) {
  const [state, setState] = useState<DiceState>('idle');
  const [value, setValue] = useState<number | null>(null);

  const handleRoll = useCallback(() => {
    if (disabled || state === 'rolling') return;

    setState('rolling');
    setValue(null);

    // Animate for ~1s then show result
    setTimeout(() => {
      const result = onRoll();
      setValue(result);
      setState('result');

      // Reset to idle after showing result
      setTimeout(() => {
        setState('idle');
      }, 2000);
    }, 800);
  }, [onRoll, disabled, state]);

  const faceClass = state === 'idle'
    ? 'idle'
    : state === 'rolling'
      ? 'rolling'
      : getResultClass(resultType);

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-gold)' }}>
          {label}
        </span>
      )}
      <div
        className={`dice-container ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        onClick={handleRoll}
      >
        <div className={`dice-face ${faceClass}`}>
          {state === 'rolling' ? '?' : value ?? 'd20'}
        </div>
      </div>
    </div>
  );
}
