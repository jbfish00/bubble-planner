import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { Modal } from '../UI/Modal';
import { TaskForm } from '../ListView/TaskForm';
import type { ViewMode } from '../../types';

const views: { mode: ViewMode; label: string; icon: string }[] = [
  { mode: 'daily',    label: 'Today',    icon: '○' },
  { mode: 'list',     label: 'Tasks',    icon: '☰' },
  { mode: 'projects', label: 'Projects', icon: '▤' },
  { mode: 'week',     label: 'Week',     icon: '▦' },
];

export function TopBar() {
  const { isDarkMode, toggleDarkMode, viewMode, setViewMode } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [showViews, setShowViews] = useState(false);

  const currentView = views.find(v => v.mode === viewMode);

  return (
    <>
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-5 py-4 flex items-center justify-between safe-area-top relative z-50">
        {/* Left: logo + view switcher */}
        <div className="flex items-center gap-3">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold shadow-sm flex-shrink-0"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #F4D0CB, #E8A598)',
              boxShadow: '0 2px 10px #E8A59880',
              touchAction: 'manipulation',
            }}
            onClick={() => setShowViews(v => !v)}
            aria-label="Switch view"
          >
            B
          </button>

          {/* View switcher button */}
          <button
            className="flex items-center gap-2 px-3 py-2 rounded-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            style={{ touchAction: 'manipulation' }}
            onClick={() => setShowViews(v => !v)}
            aria-label="Switch view"
          >
            <span className="text-base font-bold text-gray-800 dark:text-gray-100 pl-1">
              {currentView?.label}
            </span>
            <span className="text-gray-400 dark:text-gray-500 text-xs">▼</span>
          </button>
        </div>

        {/* Right: dark mode + add */}
        <div className="flex items-center gap-3">
          <motion.button
            className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            whileTap={{ scale: 0.9 }}
            style={{ touchAction: 'manipulation' }}
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </motion.button>

          <motion.button
            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #F4D0CB, #E8A598)',
              touchAction: 'manipulation',
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => setShowAdd(true)}
            aria-label="Add task"
          >
            +
          </motion.button>
        </div>

        {/* View dropdown */}
        <AnimatePresence>
          {showViews && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowViews(false)}
              />
              <motion.div
                className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-lg z-50"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <div className="grid grid-cols-4">
                  {views.map(v => (
                    <button
                      key={v.mode}
                      className={`flex flex-col items-center gap-1.5 py-4 px-2 transition-colors ${
                        viewMode === v.mode
                          ? 'bg-[#E8A598]/15 text-[#E8A598]'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      style={{ touchAction: 'manipulation' }}
                      onClick={() => {
                        setViewMode(v.mode);
                        setShowViews(false);
                        if ('vibrate' in navigator) navigator.vibrate(10);
                      }}
                    >
                      <span className="text-2xl">{v.icon}</span>
                      <span className="text-sm font-semibold">{v.label}</span>
                      {viewMode === v.mode && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#E8A598]" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New task">
        <TaskForm onClose={() => setShowAdd(false)} />
      </Modal>
    </>
  );
}
