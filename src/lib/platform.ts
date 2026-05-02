// Lazy-loaded Capacitor detection so the web build doesn't break if Capacitor
// isn't installed yet (the deps will exist after `npm install`).

type CapacitorGlobal = { isNativePlatform?: () => boolean; getPlatform?: () => string };

declare global {
  interface Window {
    Capacitor?: CapacitorGlobal;
  }
}

export function isNative(): boolean {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.();
}

export function getPlatform(): 'web' | 'android' | 'ios' {
  const p = window.Capacitor?.getPlatform?.();
  if (p === 'android' || p === 'ios') return p;
  return 'web';
}
