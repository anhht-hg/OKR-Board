/**
 * Tests for hierarchy validation rules.
 *
 * These guard against the bugs we found:
 * 1. Circular parent reference (A→B, B→A crashes recalcAncestors)
 * 2. Invalid type changes (Feature becoming parent of KeyResult)
 *
 * The logic is tested standalone — no DB needed.
 */

import { describe, it, expect } from 'vitest';
import { CHILD_TYPES } from '../constants';

// ─── CHILD_TYPES validation ───────────────────────────────────────────────────

describe('CHILD_TYPES hierarchy rules', () => {
  it('Objective only accepts SuccessFactor children', () => {
    expect(CHILD_TYPES['Objective']).toEqual(['SuccessFactor']);
  });

  it('SuccessFactor only accepts KeyResult children', () => {
    expect(CHILD_TYPES['SuccessFactor']).toEqual(['KeyResult']);
  });

  it('KeyResult only accepts Feature children', () => {
    expect(CHILD_TYPES['KeyResult']).toEqual(['Feature']);
  });

  it('Feature accepts UserCapability, Adoption, Impact', () => {
    expect(CHILD_TYPES['Feature']).toContain('UserCapability');
    expect(CHILD_TYPES['Feature']).toContain('Adoption');
    expect(CHILD_TYPES['Feature']).toContain('Impact');
  });

  it('leaf types have no children', () => {
    expect(CHILD_TYPES['UserCapability']).toBeUndefined();
    expect(CHILD_TYPES['Adoption']).toBeUndefined();
    expect(CHILD_TYPES['Impact']).toBeUndefined();
  });
});

// ─── validateTypeChange logic ────────────────────────────────────────────────

/**
 * Inline version of validateTypeChange from src/app/api/items/[id]/route.ts
 * for unit testing without DB.
 */
function validateTypeChangeLogic(
  newType: string,
  parentType: string | null,
  childTypes: string[]
): string | null {
  // Check: new type must be a valid child of its parent
  if (parentType) {
    const allowed = CHILD_TYPES[parentType] ?? [];
    if (!allowed.includes(newType)) {
      return `Invalid: ${parentType} does not accept ${newType} children`;
    }
  }

  // Check: new type must be able to parent the existing children
  if (childTypes.length > 0) {
    const childType = childTypes[0];
    const allowedChildren = CHILD_TYPES[newType] ?? [];
    if (!allowedChildren.includes(childType)) {
      return `Invalid: ${newType} cannot parent ${childType} children`;
    }
  }

  return null;
}

describe('validateTypeChange — parent constraint', () => {
  it('allows valid type within parent hierarchy', () => {
    // SuccessFactor under Objective → valid
    expect(validateTypeChangeLogic('SuccessFactor', 'Objective', [])).toBeNull();
  });

  it('rejects Feature being placed under Objective', () => {
    expect(validateTypeChangeLogic('Feature', 'Objective', [])).not.toBeNull();
  });

  it('rejects KeyResult being placed under Objective', () => {
    expect(validateTypeChangeLogic('KeyResult', 'Objective', [])).not.toBeNull();
  });

  it('rejects Objective under SuccessFactor', () => {
    expect(validateTypeChangeLogic('Objective', 'SuccessFactor', [])).not.toBeNull();
  });

  it('allows KeyResult under SuccessFactor', () => {
    expect(validateTypeChangeLogic('KeyResult', 'SuccessFactor', [])).toBeNull();
  });

  it('allows Feature under KeyResult', () => {
    expect(validateTypeChangeLogic('Feature', 'KeyResult', [])).toBeNull();
  });

  it('allows UserCapability under Feature', () => {
    expect(validateTypeChangeLogic('UserCapability', 'Feature', [])).toBeNull();
  });

  it('no parent constraint when parentType is null (root item)', () => {
    expect(validateTypeChangeLogic('Objective', null, [])).toBeNull();
  });
});

describe('validateTypeChange — children constraint', () => {
  it('rejects changing Feature to KeyResult when it has UC children', () => {
    // KeyResult cannot parent UserCapability
    const result = validateTypeChangeLogic('KeyResult', null, ['UserCapability']);
    expect(result).not.toBeNull();
  });

  it('rejects changing SuccessFactor to Objective when it has KeyResult children', () => {
    // Objective cannot parent KeyResult (only SuccessFactor)
    const result = validateTypeChangeLogic('Objective', null, ['KeyResult']);
    expect(result).not.toBeNull();
  });

  it('allows changing type that is still compatible with children', () => {
    // Changing to KeyResult while it has Feature children → valid
    const result = validateTypeChangeLogic('KeyResult', null, ['Feature']);
    expect(result).toBeNull();
  });

  it('no children constraint when item has no children', () => {
    expect(validateTypeChangeLogic('Feature', 'KeyResult', [])).toBeNull();
  });
});

// ─── Circular reference detection logic ──────────────────────────────────────

/**
 * Simulates wouldCreateCycle with a flat map of parentId relationships.
 * In production this walks the DB; here we use a Map.
 */
function wouldCreateCycleSimulation(
  itemId: string,
  newParentId: string,
  parentMap: Map<string, string | null>
): boolean {
  let currentId: string | null = newParentId;
  for (let i = 0; i < 20 && currentId; i++) {
    if (currentId === itemId) return true;
    currentId = parentMap.get(currentId) ?? null;
  }
  return false;
}

describe('wouldCreateCycle', () => {
  it('direct cycle: A becomes parent of B, B is already parent of A', () => {
    // B→A exists. Now trying to set A's parent = B
    const parentMap = new Map([['B', 'A'], ['A', null]]);
    // itemId = A, newParentId = B → walk: B's parent = A = itemId → cycle!
    expect(wouldCreateCycleSimulation('A', 'B', parentMap)).toBe(true);
  });

  it('indirect cycle: A→B→C, trying to set C parent = A', () => {
    const parentMap = new Map([['B', 'A'], ['C', 'B'], ['A', null]]);
    // itemId = A, newParentId = C → walk: C→B→A = itemId → cycle!
    expect(wouldCreateCycleSimulation('A', 'C', parentMap)).toBe(true);
  });

  it('no cycle: valid reparent', () => {
    const parentMap = new Map([['B', null], ['C', null], ['A', 'B']]);
    // itemId = A, newParentId = C → C has no parent → no cycle
    expect(wouldCreateCycleSimulation('A', 'C', parentMap)).toBe(false);
  });

  it('item set as its own parent → cycle', () => {
    const parentMap = new Map([['A', null]]);
    // itemId = A, newParentId = A → immediately A === A → cycle
    expect(wouldCreateCycleSimulation('A', 'A', parentMap)).toBe(true);
  });

  it('deep chain without cycle', () => {
    // A→B→C→D→E, reparent F to E
    const parentMap = new Map([
      ['B', 'A'], ['C', 'B'], ['D', 'C'], ['E', 'D'], ['F', null], ['A', null]
    ]);
    expect(wouldCreateCycleSimulation('F', 'E', parentMap)).toBe(false);
  });
});
