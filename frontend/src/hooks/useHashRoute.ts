import { useCallback, useEffect, useState } from 'react';

export const VIEWS = ['dashboard', 'essentials', 'reorders', 'assistant', 'settings'] as const;
export type View = (typeof VIEWS)[number];

function readView(): View {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return (VIEWS as readonly string[]).includes(hash) ? (hash as View) : 'dashboard';
}

/** Tiny hash router (#/essentials) so the current view survives a refresh without extra dependencies. */
export function useHashRoute() {
  const [view, setView] = useState<View>(readView);

  useEffect(() => {
    const onChange = () => setView(readView());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: View) => {
    window.location.hash = `/${next}`;
  }, []);

  return { view, navigate };
}
