import { useEffect, useRef } from 'react';

export function useScanner(onScan: (code: string) => void, enabled = true) {
  const buffer = useRef('');
  const lastKey = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const now = Date.now();
      const gap = now - lastKey.current;
      lastKey.current = now;

      if (gap > 100) buffer.current = '';

      if (e.key === 'Enter') {
        const code = buffer.current.trim();
        buffer.current = '';
        if (code) {
          e.preventDefault();
          onScan(code);
        }
        return;
      }

      if (e.key.length === 1) buffer.current += e.key;
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onScan, enabled]);
}
