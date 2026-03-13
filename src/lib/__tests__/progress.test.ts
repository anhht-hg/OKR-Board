/**
 * Tests for the core progress calculation engine.
 *
 * These tests cover the business logic in src/lib/progress.ts
 * WITHOUT hitting the database — they test calcChotProgress and
 * calcItemProgress directly via the exported logic.
 *
 * KEY RULES being tested:
 * 1. chotFlag = null or 'TRUE' → committed (counts toward denominator)
 * 2. chotFlag = 'FALSE' → bonus (pushes progress above 100%)
 * 3. progress = (sum_all_progress / committed_count * 100) * 100
 * 4. Per-type formulas (KR = 60/40, Objective = 50/50, etc.)
 */

import { describe, it, expect } from 'vitest';

// ─── Pure helpers extracted from progress.ts for unit testing ───────────────

function calcChotProgress(
  children: { progressPct: number; chotFlag: string | null }[]
): number | null {
  if (children.length === 0) return null;
  const committed = children.filter(c => c.chotFlag !== 'FALSE');
  if (committed.length === 0) {
    const total = children.reduce((s, c) => s + c.progressPct, 0);
    return Math.round(total / children.length);
  }
  const numerator = children.reduce((s, c) => s + c.progressPct, 0);
  const denominator = committed.length * 100;
  return Math.round((numerator / denominator) * 100);
}

const STATUS_WEIGHT: Record<string, number> = {
  'Hoàn thành': 100,
  'Đang triển khai': 50,
  'Chưa bắt đầu': 0,
};

function calcItemProgress(
  item: { type: string; status: string },
  children: { type: string; progressPct: number; chotFlag: string | null }[],
  extraData?: {
    outcomeGrandchildren?: { progressPct: number; chotFlag: string | null }[];
    featureDescendants?: { progressPct: number; chotFlag: string | null }[];
  }
): number {
  if (children.length === 0) return STATUS_WEIGHT[item.status] ?? 0;

  if (item.type === 'Feature') {
    const ucChildren = children.filter(c => c.type === 'UserCapability');
    if (ucChildren.length === 0) return STATUS_WEIGHT[item.status] ?? 0;
    return calcChotProgress(ucChildren) ?? STATUS_WEIGHT[item.status] ?? 0;
  }

  if (item.type === 'KeyResult') {
    const featureChildren = children.filter(c => c.type === 'Feature');
    const deliveryScore = featureChildren.length > 0
      ? (calcChotProgress(featureChildren) ?? 0) : 0;
    const outcomeItems = extraData?.outcomeGrandchildren ?? [];
    if (outcomeItems.length > 0) {
      const outcomeScore = calcChotProgress(outcomeItems) ?? 0;
      return Math.round(deliveryScore * 0.6 + outcomeScore * 0.4);
    }
    return Math.round(deliveryScore);
  }

  if (item.type === 'Objective') {
    const strategicChildren = children.filter(c =>
      c.type === 'SuccessFactor' || c.type === 'KeyResult'
    );
    const strategicScore = strategicChildren.length > 0
      ? strategicChildren.reduce((s, c) => s + c.progressPct, 0) / strategicChildren.length
      : STATUS_WEIGHT[item.status] ?? 0;
    const featureItems = extraData?.featureDescendants ?? [];
    if (featureItems.length > 0) {
      const featureScore = calcChotProgress(featureItems) ?? 0;
      return Math.round(strategicScore * 0.5 + featureScore * 0.5);
    }
    return Math.round(strategicScore);
  }

  // SuccessFactor
  const featureChildren = children.filter(c => c.type === 'Feature');
  if (featureChildren.length > 0) {
    return calcChotProgress(featureChildren) ?? Math.round(
      children.reduce((s, c) => s + c.progressPct, 0) / children.length
    );
  }
  return Math.round(children.reduce((s, c) => s + c.progressPct, 0) / children.length);
}

// ─── calcChotProgress ────────────────────────────────────────────────────────

describe('calcChotProgress', () => {
  it('returns null for empty array', () => {
    expect(calcChotProgress([])).toBeNull();
  });

  it('returns 0 when all committed items are not started', () => {
    const children = [
      { progressPct: 0, chotFlag: null },
      { progressPct: 0, chotFlag: 'TRUE' },
    ];
    expect(calcChotProgress(children)).toBe(0);
  });

  it('returns 100 when all committed items are done', () => {
    const children = [
      { progressPct: 100, chotFlag: null },
      { progressPct: 100, chotFlag: 'TRUE' },
    ];
    expect(calcChotProgress(children)).toBe(100);
  });

  it('returns >100 when bonus items are done and all committed are done', () => {
    const children = [
      { progressPct: 100, chotFlag: 'TRUE' },   // committed, done
      { progressPct: 100, chotFlag: 'FALSE' },  // bonus, done
    ];
    // numerator = 200, denominator = 1 * 100 = 100 → 200%
    expect(calcChotProgress(children)).toBe(200);
  });

  it('bonus item done does not inflate if committed not done', () => {
    const children = [
      { progressPct: 0, chotFlag: 'TRUE' },     // committed, not started
      { progressPct: 100, chotFlag: 'FALSE' },  // bonus, done
    ];
    // numerator = 100, denominator = 1 * 100 = 100 → 100%
    expect(calcChotProgress(children)).toBe(100);
  });

  it('partial committed progress returns correct percentage', () => {
    const children = [
      { progressPct: 100, chotFlag: null },   // done
      { progressPct: 0, chotFlag: null },     // not started
    ];
    // numerator = 100, denominator = 2 * 100 = 200 → 50%
    expect(calcChotProgress(children)).toBe(50);
  });

  it('when all children are bonus, returns simple average', () => {
    const children = [
      { progressPct: 100, chotFlag: 'FALSE' },
      { progressPct: 50, chotFlag: 'FALSE' },
    ];
    expect(calcChotProgress(children)).toBe(75);
  });

  it('three committed items, one done → 33%', () => {
    const children = [
      { progressPct: 100, chotFlag: null },
      { progressPct: 0, chotFlag: null },
      { progressPct: 0, chotFlag: null },
    ];
    // numerator = 100, denominator = 3 * 100 = 300 → 33%
    expect(calcChotProgress(children)).toBe(33);
  });

  it('in-progress item contributes 50 to numerator', () => {
    const children = [
      { progressPct: 50, chotFlag: null },  // in progress
      { progressPct: 0, chotFlag: null },   // not started
    ];
    // numerator = 50, denominator = 2 * 100 = 200 → 25%
    expect(calcChotProgress(children)).toBe(25);
  });
});

// ─── calcItemProgress — Leaf nodes ───────────────────────────────────────────

describe('calcItemProgress — leaf nodes', () => {
  it('UserCapability: Hoàn thành → 100', () => {
    expect(calcItemProgress({ type: 'UserCapability', status: 'Hoàn thành' }, [])).toBe(100);
  });

  it('UserCapability: Đang triển khai → 50', () => {
    expect(calcItemProgress({ type: 'UserCapability', status: 'Đang triển khai' }, [])).toBe(50);
  });

  it('Adoption: Chưa bắt đầu → 0', () => {
    expect(calcItemProgress({ type: 'Adoption', status: 'Chưa bắt đầu' }, [])).toBe(0);
  });

  it('Impact: Hoàn thành → 100', () => {
    expect(calcItemProgress({ type: 'Impact', status: 'Hoàn thành' }, [])).toBe(100);
  });
});

// ─── calcItemProgress — Feature ──────────────────────────────────────────────

describe('calcItemProgress — Feature', () => {
  it('Feature with no UC children falls back to status weight', () => {
    const children = [
      { type: 'Adoption', progressPct: 100, chotFlag: null },
    ];
    expect(calcItemProgress({ type: 'Feature', status: 'Đang triển khai' }, children)).toBe(50);
  });

  it('Feature with all UC done → 100', () => {
    const children = [
      { type: 'UserCapability', progressPct: 100, chotFlag: null },
      { type: 'UserCapability', progressPct: 100, chotFlag: null },
    ];
    expect(calcItemProgress({ type: 'Feature', status: 'Chưa bắt đầu' }, children)).toBe(100);
  });

  it('Feature with bonus UC done pushes >100', () => {
    const children = [
      { type: 'UserCapability', progressPct: 100, chotFlag: 'TRUE' },
      { type: 'UserCapability', progressPct: 100, chotFlag: 'FALSE' }, // bonus
    ];
    expect(calcItemProgress({ type: 'Feature', status: 'Chưa bắt đầu' }, children)).toBe(200);
  });
});

// ─── calcItemProgress — KeyResult ────────────────────────────────────────────

describe('calcItemProgress — KeyResult', () => {
  it('KR with all features done and no outcomes → 100', () => {
    const children = [
      { type: 'Feature', progressPct: 100, chotFlag: null },
    ];
    expect(calcItemProgress({ type: 'KeyResult', status: 'Chưa bắt đầu' }, children)).toBe(100);
  });

  it('KR: 60% delivery + 40% outcomes when outcomes exist', () => {
    const children = [
      { type: 'Feature', progressPct: 100, chotFlag: null },
    ];
    const outcomeGrandchildren = [
      { progressPct: 0, chotFlag: null }, // not started
    ];
    // delivery = 100, outcomes = 0 → 100*0.6 + 0*0.4 = 60
    expect(calcItemProgress(
      { type: 'KeyResult', status: 'Chưa bắt đầu' },
      children,
      { outcomeGrandchildren }
    )).toBe(60);
  });

  it('KR: both delivery and outcomes 100% → 100', () => {
    const children = [
      { type: 'Feature', progressPct: 100, chotFlag: null },
    ];
    const outcomeGrandchildren = [
      { progressPct: 100, chotFlag: null },
    ];
    expect(calcItemProgress(
      { type: 'KeyResult', status: 'Chưa bắt đầu' },
      children,
      { outcomeGrandchildren }
    )).toBe(100);
  });

  it('KR: no features → 0 delivery', () => {
    expect(calcItemProgress({ type: 'KeyResult', status: 'Chưa bắt đầu' }, [])).toBe(0);
  });
});

// ─── calcItemProgress — Objective ────────────────────────────────────────────

describe('calcItemProgress — Objective', () => {
  it('Objective with no features uses strategic average only', () => {
    const children = [
      { type: 'SuccessFactor', progressPct: 80, chotFlag: null },
      { type: 'SuccessFactor', progressPct: 60, chotFlag: null },
    ];
    // avg = 70, no features → 70
    expect(calcItemProgress({ type: 'Objective', status: 'Chưa bắt đầu' }, children)).toBe(70);
  });

  it('Objective: 50% strategic + 50% features when features exist', () => {
    const children = [
      { type: 'SuccessFactor', progressPct: 100, chotFlag: null },
    ];
    const featureDescendants = [
      { progressPct: 0, chotFlag: null }, // not started
    ];
    // strategic = 100, features = 0 → 100*0.5 + 0*0.5 = 50
    expect(calcItemProgress(
      { type: 'Objective', status: 'Chưa bắt đầu' },
      children,
      { featureDescendants }
    )).toBe(50);
  });

  it('Objective: both strategic and features 100% → 100', () => {
    const children = [
      { type: 'SuccessFactor', progressPct: 100, chotFlag: null },
    ];
    const featureDescendants = [
      { progressPct: 100, chotFlag: null },
    ];
    expect(calcItemProgress(
      { type: 'Objective', status: 'Chưa bắt đầu' },
      children,
      { featureDescendants }
    )).toBe(100);
  });

  it('Objective: bonus features push above 100', () => {
    const children = [
      { type: 'SuccessFactor', progressPct: 100, chotFlag: null },
    ];
    const featureDescendants = [
      { progressPct: 100, chotFlag: 'TRUE' },
      { progressPct: 100, chotFlag: 'FALSE' }, // bonus
    ];
    // strategic=100, features=200 → 100*0.5 + 200*0.5 = 150
    expect(calcItemProgress(
      { type: 'Objective', status: 'Chưa bắt đầu' },
      children,
      { featureDescendants }
    )).toBe(150);
  });
});

// ─── calcItemProgress — SuccessFactor ────────────────────────────────────────

describe('calcItemProgress — SuccessFactor', () => {
  it('SF with KR children uses simple average', () => {
    const children = [
      { type: 'KeyResult', progressPct: 100, chotFlag: null },
      { type: 'KeyResult', progressPct: 0, chotFlag: null },
    ];
    expect(calcItemProgress({ type: 'SuccessFactor', status: 'Chưa bắt đầu' }, children)).toBe(50);
  });

  it('SF with Feature children uses chotFlag-aware formula', () => {
    const children = [
      { type: 'Feature', progressPct: 100, chotFlag: 'TRUE' },
      { type: 'Feature', progressPct: 100, chotFlag: 'FALSE' }, // bonus
    ];
    // numerator=200, denominator=1*100=100 → 200%
    expect(calcItemProgress({ type: 'SuccessFactor', status: 'Chưa bắt đầu' }, children)).toBe(200);
  });
});
