import { describe, expect, it } from 'vitest';
import type { DayWindow, Task } from '@dayparty/core';
import { computeDayFit, windowAvailableMinutes } from './day-fit';

const iso = '2026-04-02T12:00:00.000Z';

function task(partial: Partial<Task> & Pick<Task, 'id' | 'size' | 'isComplete' | 'position'>): Task {
  const base = {
    userId: 'u1',
    title: 't',
    scheduledDate: '2026-04-02',
    createdAt: iso,
    updatedAt: iso,
    ...partial,
  };
  const status: Task['status'] = base.isComplete ? 'done' : (base.status ?? 'planned');
  return { ...base, status };
}

describe('windowAvailableMinutes', () => {
  it('returns end - start when the window does not cross midnight', () => {
    const w: DayWindow = { startMinuteOfDay: 9 * 60, endMinuteOfDay: 17 * 60, crossesMidnight: false };
    expect(windowAvailableMinutes(w)).toBe(8 * 60);
  });

  it('sums segments when the window crosses midnight', () => {
    const w: DayWindow = { startMinuteOfDay: 23 * 60, endMinuteOfDay: 3 * 60, crossesMidnight: true };
    expect(windowAvailableMinutes(w)).toBe(60 + 3 * 60);
  });
});

describe('computeDayFit', () => {
  const window: DayWindow = { startMinuteOfDay: 0, endMinuteOfDay: 200, crossesMidnight: false };

  it('greedy-packs incomplete tasks in order', () => {
    const tasks: Task[] = [
      task({ id: 'a', size: 1, isComplete: false, position: 0, estimatedMinutes: 80 }),
      task({ id: 'b', size: 1, isComplete: false, position: 1, estimatedMinutes: 80 }),
      task({ id: 'c', size: 1, isComplete: false, position: 2, estimatedMinutes: 80 }),
    ];
    const fit = computeDayFit(tasks, window);
    expect(fit.availableMinutes).toBe(200);
    expect(fit.plannedMinutes).toBe(240);
    expect(fit.inRunwayTaskIds).toEqual(['a', 'b']);
    expect(fit.outsideRunwayTaskIds).toEqual(['c']);
    expect(fit.overflowUnresolved).toBe(false);
  });

  it('sets overflowUnresolved when an essential task is outside the runway', () => {
    const tasks: Task[] = [
      task({ id: 'a', size: 1, isComplete: false, position: 0, estimatedMinutes: 150 }),
      task({
        id: 'b',
        size: 1,
        isComplete: false,
        position: 1,
        estimatedMinutes: 100,
        essentiality: 'essential',
      }),
    ];
    const fit = computeDayFit(tasks, window);
    expect(fit.inRunwayTaskIds).toEqual(['a']);
    expect(fit.outsideRunwayTaskIds).toEqual(['b']);
    expect(fit.overflowUnresolved).toBe(true);
  });

  it('does not count completed tasks toward runway consumption', () => {
    const tasks: Task[] = [
      task({ id: 'a', size: 5, isComplete: true, position: 0 }),
      task({ id: 'b', size: 1, isComplete: false, position: 1, estimatedMinutes: 50 }),
    ];
    const fit = computeDayFit(tasks, window);
    expect(fit.plannedMinutes).toBe(50);
    expect(fit.inRunwayTaskIds).toEqual(['a', 'b']);
    expect(fit.outsideRunwayTaskIds).toEqual([]);
  });

  it('uses size defaults when estimatedMinutes is missing', () => {
    const tasks: Task[] = [task({ id: 'a', size: 2, isComplete: false, position: 0 })];
    const fit = computeDayFit(tasks, window);
    expect(fit.plannedMinutes).toBe(25);
  });

  it('respects sizeToMinutes overrides from preferences', () => {
    const tasks: Task[] = [task({ id: 'a', size: 2, isComplete: false, position: 0 })];
    const fit = computeDayFit(tasks, window, { sizeToMinutes: { 2: 100 } });
    expect(fit.plannedMinutes).toBe(100);
  });

  it('does not count skipped tasks toward runway load', () => {
    const tasks: Task[] = [
      task({ id: 'a', size: 1, isComplete: false, position: 0, estimatedMinutes: 120, status: 'skipped' }),
      task({ id: 'b', size: 1, isComplete: false, position: 1, estimatedMinutes: 50 }),
    ];
    const fit = computeDayFit(tasks, window);
    expect(fit.plannedMinutes).toBe(50);
    expect(fit.inRunwayTaskIds).toEqual(['a', 'b']);
    expect(fit.outsideRunwayTaskIds).toEqual([]);
  });
});
