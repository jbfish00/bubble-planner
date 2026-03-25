import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { Modal } from '../UI/Modal';
import { TaskForm } from '../ListView/TaskForm';

export function TopBar() {
  const { isDarkMode, toggleDarkMode, viewMode } = useStore();
  const [showAdd, setShowAdd] = useState(false);

  const titles: Record<string, string> = {
    daily: 'Bubble Planner',
    list: 'All Tasks',
    projects: 'Projects',
    week: 'Week View',
  };

  return (
    <>
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          {/* Logo bubble */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shadow-sm"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #F4D0CB, #E8A598)',
              boxShadow: '0 2px 10px #E8A59880',
            }}
          >
            B
          </div>
          <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">
            {titles[viewMode]}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <motion.button
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            whileTap={{ scale: 0.9 }}
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </motion.button>

          {/* Add button */}
          <motion.button
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #F4D0CB, #E8A598)',
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => setShowAdd(true)}
            aria-label="Add task"
          >
            +
          </motion.button>
        </div>
      </header>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New task">
        <TaskForm onClose={() => setShowAdd(false)} />
      </Modal>
    </>
  );
}
