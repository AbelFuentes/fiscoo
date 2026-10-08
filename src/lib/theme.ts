const THEME_KEY = 'ui-theme';

export type Theme = 'light' | 'dark';

export function getStoredTheme(): Theme {
  const storedTheme = localStorage.getItem(THEME_KEY);

  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  root.classList.toggle('dark', theme === 'dark');
}

export function initializeTheme() {
  const theme = getStoredTheme();

  applyTheme(theme);

  return theme;
}
