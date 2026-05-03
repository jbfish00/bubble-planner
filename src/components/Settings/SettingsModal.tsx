import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../UI/Modal';
import { useStore } from '../../store';
import { THEMES, type Theme } from '../../constants/themes';
import { getCalendarPrefs, setCalendarSyncEnabled, type CalendarPrefs } from '../../lib/calendar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CalendarState =
  | { status: 'loading' }
  | { status: 'ready'; prefs: CalendarPrefs }
  | { status: 'error' };

function ThemeSwatch({ theme }: { theme: Theme }) {
  const sample = theme.colors.slice(0, 5);
  return (
    <div className="flex -space-x-2">
      {sample.map((c, i) => (
        <div
          key={c.name + i}
          className="w-6 h-6 rounded-full border-2 border-white dark:border-gray-900"
          style={{ background: `radial-gradient(circle at 32% 32%, ${c.light}, ${c.base})` }}
        />
      ))}
    </div>
  );
}

// Calendar section — only mounted when SettingsModal is open, so its
// state (loading → ready/error) starts fresh on each open and we don't
// need a state-resetting effect on the outer component.
function CalendarSection() {
  const { user, subscriptionTier, showUpgrade, pushToast } = useStore();
  const isPro = subscriptionTier === 'pro';
  // If user is null at mount we know it immediately — derive instead of effect.
  const initialStatus: CalendarState = user ? { status: 'loading' } : { status: 'error' };
  const [state, setState] = useState<CalendarState>(initialStatus);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getCalendarPrefs(user.id)
      .then(prefs => { if (!cancelled) setState({ status: 'ready', prefs }); })
      .catch(() => { if (!cancelled) setState({ status: 'error' }); });
    return () => { cancelled = true; };
  }, [user]);

  const toggle = async () => {
    if (!user || state.status !== 'ready') return;
    if (!isPro) {
      showUpgrade('Google Calendar sync is a Pro feature. Tasks become events on your calendar automatically.');
      return;
    }
    if (!state.prefs.hasOAuth) {
      pushToast('Sign in with Google to grant calendar access first.', 'info');
      return;
    }
    const next = !state.prefs.enabled;
    await setCalendarSyncEnabled(user.id, next);
    setState({ status: 'ready', prefs: { ...state.prefs, enabled: next } });
    pushToast(next ? 'Calendar sync enabled ✓' : 'Calendar sync paused', 'info');
  };

  if (state.status === 'loading') {
    return <div className="py-4 text-sm text-gray-500">Loading…</div>;
  }
  if (state.status === 'error') {
    return <div className="py-4 text-sm text-red-500">Couldn't load preferences.</div>;
  }

  const { prefs } = state;
  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center justify-between rounded-sm p-3 border-2 transition-colors ${
        prefs.enabled
          ? 'border-[#E8A598] bg-[#FDF2EF] dark:bg-gray-800'
          : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <div className="text-left">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">
            {prefs.enabled ? 'Sync on' : 'Sync off'}
          </span>
          {!isPro && (
            <span className="text-[10px] font-bold bg-[#E8A598] text-white px-1.5 py-0.5 rounded-full">PRO</span>
          )}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {prefs.enabled
            ? 'Tasks become events on your primary calendar.'
            : 'Push tasks to Google Calendar as you work.'}
        </div>
      </div>
      {!isPro
        ? <span className="text-gray-400 text-lg">🔒</span>
        : !prefs.hasOAuth
        ? <span className="text-yellow-600 text-xs font-bold">Sign in with Google</span>
        : null}
    </button>
  );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { themeId, setTheme, subscriptionTier, showUpgrade } = useStore();
  const isPro = subscriptionTier === 'pro';

  const pickTheme = (theme: Theme) => {
    if (theme.isPro && !isPro) {
      showUpgrade(`"${theme.label}" is a Pro theme. Upgrade to unlock all six palettes.`);
      return;
    }
    setTheme(theme.id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Themes */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Bubble theme
          </h3>
          <div className="space-y-1.5">
            {THEMES.map(theme => {
              const selected = themeId === theme.id;
              const locked = theme.isPro && !isPro;
              return (
                <motion.button
                  key={theme.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => pickTheme(theme)}
                  className={`w-full text-left flex items-center gap-3 rounded-sm p-2.5 border-2 transition-colors ${
                    selected
                      ? 'border-[#E8A598] bg-[#FDF2EF] dark:bg-gray-800'
                      : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <ThemeSwatch theme={theme} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 dark:text-gray-100 text-sm">{theme.label}</span>
                      {theme.isPro && (
                        <span className="text-[10px] font-bold bg-[#E8A598] text-white px-1.5 py-0.5 rounded-full">PRO</span>
                      )}
                      {selected && (
                        <span className="text-[10px] font-bold text-[#D4796A] uppercase tracking-wide">Active</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {theme.description}
                    </div>
                  </div>
                  {locked && <span className="text-gray-400 text-lg" aria-label="Locked">🔒</span>}
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* Google Calendar */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            Google Calendar sync
          </h3>
          {/* CalendarSection only mounts while the modal is open, so its
              fetch fires once per opening and we don't race state. */}
          {isOpen && <CalendarSection />}
        </section>
      </div>
    </Modal>
  );
}
