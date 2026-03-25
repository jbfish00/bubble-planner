import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from './store';
import { seedSampleData } from './utils/seedData';
import { BubbleCanvas } from './components/BubbleView/BubbleCanvas';
import { TaskList } from './components/ListView/TaskList';
import { ProjectList } from './components/ProjectView/ProjectList';
import { WeekGrid } from './components/WeekView/WeekGrid';
import { BottomNav } from './components/Navigation/BottomNav';
import { TopBar } from './components/Navigation/TopBar';
import { TaskDetail } from './components/UI/TaskDetail';

function App() {
  const { loadData, viewMode, isDarkMode } = useStore();

  useEffect(() => {
    seedSampleData().then(() => loadData());
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const views = {
    daily: <BubbleCanvas />,
    list: <TaskList />,
    projects: <ProjectList />,
    week: <WeekGrid />,
  };

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
