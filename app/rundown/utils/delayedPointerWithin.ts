// utils/delayedPointerWithin.ts
import { CollisionDetection, pointerWithin } from '@dnd-kit/core';

const delayMap = new Map<string, NodeJS.Timeout>();

export const delayedPointerWithin: CollisionDetection = (args) => {
  const collisions = pointerWithin(args);
  const activeId = args.active.id as string;

  if (collisions.length === 0) {
    delayMap.delete(activeId);
    return [];
  }

  const targetId = collisions[0].id as string;

  if (!delayMap.has(activeId)) {
    const timeout = setTimeout(() => {
      args?.onCollisions?.([{ id: targetId }]); // For some dnd-kit versions
    }, 300); // Delay in ms

    delayMap.set(activeId, timeout);
    return [];
  }

  return [];
};
