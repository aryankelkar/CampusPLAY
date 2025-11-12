import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description?: string;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        // For Ctrl/Cmd+K style shortcuts
        const modifierMatch = shortcut.ctrl || shortcut.meta
          ? (event.ctrlKey || event.metaKey)
          : true;

        if (keyMatch && modifierMatch) {
          // Check if we're in an input field
          const target = event.target as HTMLElement;
          const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
          
          // Allow Escape key even in inputs
          if (shortcut.key === 'Escape' || !isInput) {
            event.preventDefault();
            shortcut.callback();
            break;
          }
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common keyboard shortcuts
export const SHORTCUTS = {
  SEARCH: { key: 'k', ctrl: true, meta: true, description: 'Open search' },
  ESCAPE: { key: 'Escape', description: 'Close modal/dialog' },
  ENTER: { key: 'Enter', description: 'Confirm action' },
  ARROW_UP: { key: 'ArrowUp', description: 'Navigate up' },
  ARROW_DOWN: { key: 'ArrowDown', description: 'Navigate down' },
  ARROW_LEFT: { key: 'ArrowLeft', description: 'Navigate left' },
  ARROW_RIGHT: { key: 'ArrowRight', description: 'Navigate right' },
};

// Hook for modal keyboard shortcuts
export function useModalShortcuts(
  isOpen: boolean,
  onClose: () => void,
  onConfirm?: () => void
) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Enter' && onConfirm) {
        event.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);
}
