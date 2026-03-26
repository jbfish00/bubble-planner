import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { Modal } from '../UI/Modal';
import { TaskForm } from '../ListView/TaskForm';
import type { ViewMode } from '../../types';

const BubbleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
    <circle cx="6" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <line x1="8" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="4" cy="7" r="1.5" fill="currentColor" />
    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
    <circle cx="4" cy="17" r="1.5" fill="currentColor" />
  </svg>
);

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const views: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'daily',    label: 'Today',    icon: <BubbleIcon /> },
  { mode: 'list',     label: 'Tasks',    icon: <ListIcon /> },
  { mode: 'projects', label: 'Projects', icon: <FolderIcon /> },
  { mode: 'week',     label: 'Week',     icon: <CalendarIcon /> },
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

        {/* View tabs */}
        <div className="flex flex-1 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden">
          {views.map(v => {
            const isActive = viewMode === v.mode;
            return (
              <button
                key={v.mode}
                className="flex-1 py-2 flex flex-col items-center gap-1 transition-colors relative"
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
                  style={{ color: isActive ? '#fff' : '#9ca3af' }}
                >
                  {v.icon}
                </span>
                <span
                  className="relative z-10 text-xs font-semibold leading-none"
                  style={{ color: isActive ? '#fff' : '#9ca3af' }}
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
