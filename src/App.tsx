import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store';
import { supabase } from './lib/supabase';
import { BubbleCanvas } from './components/BubbleView/BubbleCanvas';
import { TaskList } from './components/ListView/TaskList';
import { ProjectList } from './components/ProjectView/ProjectList';
import { WeekGrid } from './components/WeekView/WeekGrid';
import { BottomNav } from './components/Navigation/BottomNav';
import { TopBar } from './components/Navigation/TopBar';
import { TaskDetail } from './components/UI/TaskDetail';
import { AuthScreen } from './components/Auth/AuthScreen';

function App() {
  const { loadData, viewMode, isDarkMode, user, authLoading, setUser, setAuthLoading } = useStore();

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
      <BottomNav />
      <TaskDetail />
    </div>
  );
}

export default App;
