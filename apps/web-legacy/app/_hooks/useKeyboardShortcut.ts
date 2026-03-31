import { useCallback, useEffect } from 'react';

const useKeyboardShortcut = (shortcut, callback) => {
  const handleKeyPress = useCallback((event) => {
    const isInput = event.target.tagName.match(/INPUT|TEXTAREA|SELECT/i);
    
    if (isInput) return;

    const keys = shortcut.split('+').map(k => k.trim().toLowerCase());
    const modifiers = {
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      alt: event.altKey,
      meta: event.metaKey
    };

    const requiredKeys = keys.every(key => {
      if (key in modifiers) return modifiers[key];
      return event.key.toLowerCase() === key;
    });

    if (requiredKeys) {
      event.preventDefault();
      callback();
    }
  }, [shortcut, callback]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
};

export default useKeyboardShortcut;
