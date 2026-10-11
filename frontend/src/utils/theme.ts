import type { ThemePreference } from '../types';

/** Sets data-theme on <html>. "system" removes it so the CSS follows the device setting. */
export function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}
