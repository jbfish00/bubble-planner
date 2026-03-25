import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { Modal } from '../UI/Modal';
import { TaskForm } from '../ListView/TaskForm';
import type { ViewMode } from '../../types';

const views: { mode: ViewMode; label: string }[] = [
  { mode: 'daily',    label: 'Today'    },
  { mode: 'list',     label: 'Tasks'    },
  { mode: 'projects', label: 'Projects' },
  { mode: 'week',     label: 'Week'     },
];

export function TopBar() {
  const { isDarkMode, toggleDarkMode, viewMode, setViewMode } = useStore();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-3 py-2 flex items-center gap-2 safe-area-top relative z-50">
        {/* Logo */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0"
          style={{
            background: 'radial-gradient(circle at 35% 35%, #F4D0CB, #E8A598)',
            boxShadow: '0 2px 10px #E8A59880',
          }}
        >
          B
        </div>

        {/* View tabs — fills remaining space */}
        <div className="flex flex-1 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden">
          {views.map(v => {
            const isActive = viewMode === v.mode;
            return (
              <button
                key={v.mode}
                className="flex-1 py-2 text-xs font-semibold transition-colors relative"
                style={{ touchAction: 'manipulation' }}
                onClick={() => {
                  setViewMode(v.mode);
                  if ('vibrate' in navigator) navigator.vibrate(10);
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tabBg"
                    className="absolute inset-0 rounded-sm"
                    style={{ background: '#E8A598' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span
                  className="relative z-10"
                  style={{ color: isActive ? '#fff' : undefined }}
                >
                  {v.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right: dark mode + add */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            whileTap={{ scale: 0.9 }}
            style={{ touchAction: 'manipulation' }}
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? '☀️' : '🌙'}
          </motion.button>

          <motion.button
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md"
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
      </header>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New task">
        <TaskForm onClose={() => setShowAdd(false)} />
      </Modal>
    </>
  );
}
