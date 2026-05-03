// Active bubble palette — theme-aware.
//
// `BUBBLE_COLORS` is kept exported for backwards compatibility with
// non-reactive call sites (e.g. utilities computing color from a colorIndex
// outside React render). Components that should re-render on theme change
// MUST use the `useThemeColors()` hook instead.

import { useStore } from '../store';
import { THEMES, DEFAULT_THEME_ID, getTheme, type BubbleColor } from './themes';

export type { BubbleColor };

// React hook — components subscribe to themeId, re-render on change.
export function useThemeColors(): readonly BubbleColor[] {
  const themeId = useStore(state => state.themeId);
  return getTheme(themeId).colors;
}

// Non-reactive accessor for utilities outside React.
export function getActiveColors(): readonly BubbleColor[] {
  return getTheme(useStore.getState().themeId).colors;
}

// Backwards-compatible static export — equals the default theme's palette.
// Render-time consumers should migrate to `useThemeColors()` so theme
// switching takes effect immediately. (Used today only as a fallback.)
export const BUBBLE_COLORS: readonly BubbleColor[] = getTheme(DEFAULT_THEME_ID).colors;

export { THEMES };
