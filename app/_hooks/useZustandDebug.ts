import { useEffect, useRef } from 'react';

/**
 * A debug hook for Zustand that tracks changes to the selected state
 * Only logs in development mode to avoid performance impact in production
 *
 * @param store The Zustand store
 * @param selector The state selector function
 * @param storeName A name for the store (to identify in console logs)
 * @param options Additional options
 */
export function useZustandDebug<T, U>(
  store: {
    (selector: (state: T) => U): U;
    subscribe: (listener: (state: any) => void) => () => void;
  },
  selector: (state: T) => U,
  storeName = 'store',
  options: { logChanges?: boolean; logSelector?: boolean } = {},
) {
  const { logChanges = true, logSelector = false } = options;
  const prevState = useRef<U>(undefined);
  const selectorRef = useRef(selector);
  const isDevMode = process.env.NODE_ENV === 'development';

  // Always call useEffect to maintain hook rules, but only do work in development
  useEffect(() => {
    if (!isDevMode || !logSelector) return;

    const state = store(selector);
    console.group(`🔍 ${storeName} initial state`);
    console.log('Selected state:', state);
    console.groupEnd();
    prevState.current = state;
  }, [store, storeName, selector, isDevMode, logSelector]);

  // Always call useEffect to maintain hook rules, but only do work in development
  useEffect(() => {
    if (!isDevMode || !logChanges) return;

    selectorRef.current = selector;

    const unsubscribe = store.subscribe((state) => {
      if (!isDevMode) return; // Double-check inside subscribe

      const selectedState = selectorRef.current(state as T);
      const prev = prevState.current;

      if (prev !== selectedState) {
        console.group(`🔄 ${storeName} state changed`);
        console.log('Previous:', prev);
        console.log('Current:', selectedState);
        console.log('Diff:', getDiff(prev, selectedState));
        console.trace('Change triggered by:');
        console.groupEnd();

        prevState.current = selectedState;
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [store, storeName, selector, isDevMode, logChanges]);
}

/**
 * Helper function to get a simple diff between two objects
 */
function getDiff(prev: any, current: any): Record<string, { from: any; to: any }> {
  if (!prev || typeof prev !== 'object' || !current || typeof current !== 'object') {
    return { value: { from: prev, to: current } };
  }

  const diff: Record<string, { from: any; to: any }> = {};

  // Check for changes in current keys
  Object.keys(current).forEach((key) => {
    if (!prev.hasOwnProperty(key)) {
      diff[key] = { from: undefined, to: current[key] };
    } else if (JSON.stringify(prev[key]) !== JSON.stringify(current[key])) {
      diff[key] = { from: prev[key], to: current[key] };
    }
  });

  // Check for deleted keys
  Object.keys(prev).forEach((key) => {
    if (!current.hasOwnProperty(key)) {
      diff[key] = { from: prev[key], to: undefined };
    }
  });

  return diff;
}
