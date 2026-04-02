import type { Task } from '@dayparty/core';
import { describe, expect, it } from 'vitest';
import { mergeFocusForStatusTransition } from './focus-session';

function baseTask(over: Partial<Task> = {}): Task {
  return {
    id: 't1',
    userId: 'u1',
    title: 'x',
    size: 2,
    status: 'planned',
    isComplete: false,
    scheduledDate: '2026-04-02',
    position: 0,
    createdAt: '2026-04-02T00:00:00.000Z',
    updatedAt: '2026-04-02T00:00:00.000Z',
    ...over,
  };
}

describe('mergeFocusForStatusTransition', () => {
  it('starts session when entering in_progress', () => {
    const task = baseTask({ status: 'planned' });
    const patch = mergeFocusForStatusTransition(task, 'in_progress', 1_000_000);
    expect(patch.focusSessionStartedAt).toBe(new Date(1_000_000).toISOString());
    expect(patch.focusedSecondsTotal).toBeUndefined();
  });

  it('accumulates and clears session when pausing', () => {
    const task = baseTask({
      status: 'in_progress',
      focusSessionStartedAt: new Date(1_000_000).toISOString(),
      focusedSecondsTotal: 60,
    });
    const patch = mergeFocusForStatusTransition(task, 'planned', 1_000_000 + 90_000);
    expect(patch.focusedSecondsTotal).toBe(150);
    expect(patch.focusSessionStartedAt).toBeUndefined();
  });

  it('does not restart session when already in_progress', () => {
    const task = baseTask({
      status: 'in_progress',
      focusSessionStartedAt: '2026-01-01T00:00:00.000Z',
    });
    const patch = mergeFocusForStatusTransition(task, 'in_progress', 2_000_000);
    expect(patch).toEqual({});
  });
});
