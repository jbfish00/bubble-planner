import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store';
import { supabase } from './lib/supabase';
import { BubbleCanvas } from './components/BubbleView/BubbleCanvas';
import { TaskList } from './components/ListView/TaskList';
import { ProjectList } from './components/ProjectView/ProjectList';
import { WeekGrid } from './components/WeekView/WeekGrid';
import { TopBar } from './components/Navigation/TopBar';
import { TaskDetail } from './components/UI/TaskDetail';
import { AuthScreen } from './components/Auth/AuthScreen';
import { UpgradeModal } from './components/UI/UpgradeModal';
import { ToastContainer } from './components/UI/ToastContainer';
import { PomodoroOverlay } from './components/Timer/PomodoroOverlay';
import { requestNotificationPermission } from './lib/notifications';
import { isNative } from './lib/platform';

function App() {
  const {
    loadData, viewMode, isDarkMode, user, authLoading, setUser, setAuthLoading,
    upgradeModalReason, hideUpgrade, loadEnergyFromStorage, loadThemeFromStorage,
    refreshSubscription,
  } = useStore();

  // Listen for auth state changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Apply dark mode class
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Load data whenever the user changes
  useEffect(() => {
    if (user) loadData();
  }, [user]);

  // Request notification permission on native platforms
  useEffect(() => {
    if (user && isNative()) {
      requestNotificationPermission().catch(() => {});
    }
  }, [user]);

  // Hydrate today's energy level from localStorage on mount
  useEffect(() => {
    loadEnergyFromStorage();
  }, [loadEnergyFromStorage]);

  // Hydrate active theme from localStorage on mount
  useEffect(() => {
    loadThemeFromStorage();
  }, [loadThemeFromStorage]);

  // Stripe Checkout return handling: poll the subscription a few times
  // because the webhook may not have fired by the time we redirect back.
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') !== 'success') return;
    let cancelled = false;
    let tries = 0;
    const poll = async () => {
      while (!cancelled && tries < 6) {
        await refreshSubscription();
        if (useStore.getState().subscriptionTier === 'pro') break;
        tries++;
        await new Promise(r => setTimeout(r, 1500));
      }
      // Strip the checkout params so a refresh doesn't re-trigger
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      url.searchParams.delete('session_id');
      window.history.replaceState({}, '', url.pathname + (url.search || ''));
    };
    poll();
    return () => { cancelled = true; };
  }, [user, refreshSubscription]);

  // Refresh subscription when window regains focus or auth token refreshes,
  // so a Pro that just expired (or a Pro that just upgraded in another tab)
  // doesn't keep the user in the wrong tier mid-session.
  useEffect(() => {
    if (!user) return;
    const onFocus = () => { refreshSubscription().catch(() => {}); };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user, refreshSubscription]);

  const views = {
    daily: <BubbleCanvas />,
    list: <TaskList />,
    projects: <ProjectList />,
    week: <WeekGrid />,
  };

  // Splash while checking session
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fdf8f5] dark:bg-gray-950">
        <div
          className="w-14 h-14 rounded-full animate-pulse"
          style={{ background: 'radial-gradient(circle at 35% 35%, #F4D0CB, #E8A598)' }}
        />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <div className="flex flex-col h-screen bg-[#fdf8f5] dark:bg-gray-950 overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            className="h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {views[viewMode]}
          </motion.div>
        </AnimatePresence>
      </main>
      <TaskDetail />
      <UpgradeModal
        isOpen={upgradeModalReason !== null}
        onClose={hideUpgrade}
        reason={upgradeModalReason ?? undefined}
      />
      <ToastContainer />
      <PomodoroOverlay />
    </div>
  );
}

export default App;
