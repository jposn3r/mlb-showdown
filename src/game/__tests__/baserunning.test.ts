import { describe, it, expect } from 'vitest';
import { advanceRunners, attemptSteal, type Bases } from '../baserunning';

const empty: Bases = [null, null, null];

describe('advanceRunners', () => {
  describe('HR', () => {
    it('scores all runners and batter', () => {
      const result = advanceRunners(['r1', 'r2', 'r3'], 'batter', 'HR', 0);
      expect(result.runsScored).toEqual(['r3', 'r2', 'r1', 'batter']);
      expect(result.bases).toEqual([null, null, null]);
      expect(result.outs).toBe(0);
    });

    it('solo HR with empty bases', () => {
      const result = advanceRunners(empty, 'batter', 'HR', 0);
      expect(result.runsScored).toEqual(['batter']);
      expect(result.bases).toEqual([null, null, null]);
    });
  });

  describe('3B', () => {
    it('all runners score, batter to 3rd', () => {
      const result = advanceRunners(['r1', 'r2', null], 'batter', '3B', 0);
      expect(result.runsScored).toEqual(['r2', 'r1']);
      expect(result.bases).toEqual([null, null, 'batter']);
    });
  });

  describe('2B', () => {
    it('all runners score, batter to 2nd', () => {
      const result = advanceRunners(['r1', 'r2', 'r3'], 'batter', '2B', 0);
      expect(result.runsScored).toEqual(['r3', 'r2', 'r1']);
      expect(result.bases).toEqual([null, 'batter', null]);
    });

    it('empty bases, batter to 2nd', () => {
      const result = advanceRunners(empty, 'batter', '2B', 0);
      expect(result.runsScored).toEqual([]);
      expect(result.bases).toEqual([null, 'batter', null]);
    });
  });

  describe('1B', () => {
    it('runner on 3rd scores, others advance 1', () => {
      const result = advanceRunners(['r1', 'r2', 'r3'], 'batter', '1B', 0);
      expect(result.runsScored).toEqual(['r3']);
      expect(result.bases).toEqual(['batter', 'r1', 'r2']);
    });

    it('empty bases, batter to 1st', () => {
      const result = advanceRunners(empty, 'batter', '1B', 0);
      expect(result.runsScored).toEqual([]);
      expect(result.bases).toEqual(['batter', null, null]);
    });

    it('runner on 2nd advances to 3rd', () => {
      const result = advanceRunners([null, 'r2', null], 'batter', '1B', 0);
      expect(result.bases).toEqual(['batter', null, 'r2']);
    });
  });

  describe('BB', () => {
    it('bases loaded walk scores runner from 3rd', () => {
      const result = advanceRunners(['r1', 'r2', 'r3'], 'batter', 'BB', 0);
      expect(result.runsScored).toEqual(['r3']);
      expect(result.bases).toEqual(['batter', 'r1', 'r2']);
    });

    it('runners on 1st and 2nd force advance', () => {
      const result = advanceRunners(['r1', 'r2', null], 'batter', 'BB', 0);
      expect(result.runsScored).toEqual([]);
      expect(result.bases).toEqual(['batter', 'r1', 'r2']);
    });

    it('runner on 1st only forces to 2nd', () => {
      const result = advanceRunners(['r1', null, null], 'batter', 'BB', 0);
      expect(result.bases).toEqual(['batter', 'r1', null]);
    });

    it('runner on 1st and 3rd: 1st forced, 3rd stays', () => {
      const result = advanceRunners(['r1', null, 'r3'], 'batter', 'BB', 0);
      expect(result.bases).toEqual(['batter', 'r1', 'r3']);
      expect(result.runsScored).toEqual([]);
    });

    it('no runners: batter to 1st', () => {
      const result = advanceRunners(empty, 'batter', 'BB', 0);
      expect(result.bases).toEqual(['batter', null, null]);
    });
  });

  describe('GB/DP', () => {
    it('double play with runner on 1st and < 2 outs', () => {
      const result = advanceRunners(['r1', null, null], 'batter', 'GB', 0);
      expect(result.outs).toBe(2);
      expect(result.bases).toEqual([null, null, null]);
    });

    it('DP with runners on 1st and 3rd: runner on 3rd scores', () => {
      const result = advanceRunners(['r1', null, 'r3'], 'batter', 'GB', 0);
      expect(result.outs).toBe(2);
      expect(result.runsScored).toEqual(['r3']);
    });

    it('GB with runner on 1st and 2 outs: regular ground out', () => {
      const result = advanceRunners(['r1', null, null], 'batter', 'GB', 2);
      expect(result.outs).toBe(1);
      expect(result.bases[0]).toBe('r1'); // runner holds
    });

    it('GB with no runner on 1st: regular ground out', () => {
      const result = advanceRunners([null, 'r2', null], 'batter', 'GB', 0);
      expect(result.outs).toBe(1);
      expect(result.bases[2]).toBe('r2'); // runner on 2nd advances
    });

    it('DP chart result treated same as GB', () => {
      const result = advanceRunners(['r1', null, null], 'batter', 'DP', 0);
      expect(result.outs).toBe(2);
    });
  });

  describe('FB', () => {
    it('batter out, runners hold', () => {
      const result = advanceRunners(['r1', 'r2', null], 'batter', 'FB', 0);
      expect(result.outs).toBe(1);
      expect(result.bases).toEqual(['r1', 'r2', null]);
    });
  });

  describe('SO', () => {
    it('batter out, runners hold', () => {
      const result = advanceRunners(['r1', null, 'r3'], 'batter', 'SO', 1);
      expect(result.outs).toBe(1);
      expect(result.bases).toEqual(['r1', null, 'r3']);
    });
  });
});

describe('attemptSteal', () => {
  it('speed A succeeds on roll of 8', () => {
    const result = attemptSteal(['r1', null, null], 0, 8, 'A');
    expect(result.success).toBe(true);
    expect(result.bases).toEqual([null, 'r1', null]);
  });

  it('speed A fails on roll of 7', () => {
    const result = attemptSteal(['r1', null, null], 0, 7, 'A');
    expect(result.success).toBe(false);
    expect(result.bases[0]).toBeNull(); // runner removed (out)
  });

  it('speed B threshold is 12', () => {
    expect(attemptSteal(['r1', null, null], 0, 12, 'B').success).toBe(true);
    expect(attemptSteal(['r1', null, null], 0, 11, 'B').success).toBe(false);
  });

  it('speed C threshold is 16', () => {
    expect(attemptSteal(['r1', null, null], 0, 16, 'C').success).toBe(true);
    expect(attemptSteal(['r1', null, null], 0, 15, 'C').success).toBe(false);
  });

  it('cannot steal if target base is occupied', () => {
    const result = attemptSteal(['r1', 'r2', null], 0, 20, 'A');
    expect(result.success).toBe(false);
    expect(result.bases).toEqual(['r1', 'r2', null]); // no change
  });

  it('steal from 2nd to 3rd', () => {
    const result = attemptSteal([null, 'r2', null], 1, 15, 'A');
    expect(result.success).toBe(true);
    expect(result.bases).toEqual([null, null, 'r2']);
  });

  it('returns null runnerId when no runner on base', () => {
    const result = attemptSteal([null, null, null], 0, 20, 'A');
    expect(result.success).toBe(false);
    expect(result.runnerId).toBeNull();
  });
});
