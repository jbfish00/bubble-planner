import { motion } from 'framer-motion';
import { useStore } from '../../store';
import type { ViewMode } from '../../types';

interface NavItem {
  mode: ViewMode;
  label: string;
  icon: React.ReactNode;
}

const BubbleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
    <circle cx="6" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="18" cy="17" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <line x1="8" y1="7" x2="20" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="12" x2="20" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="8" y1="17" x2="20" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="4" cy="7" r="1.5" fill="currentColor" />
    <circle cx="4" cy="12" r="1.5" fill="currentColor" />
    <circle cx="4" cy="17" r="1.5" fill="currentColor" />
  </svg>
);

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const navItems: NavItem[] = [
  { mode: 'daily', label: 'Today', icon: <BubbleIcon /> },
  { mode: 'list', label: 'Tasks', icon: <ListIcon /> },
  { mode: 'projects', label: 'Projects', icon: <FolderIcon /> },
  { mode: 'week', label: 'Week', icon: <CalendarIcon /> },
];

export function BottomNav() {
  const { viewMode, setViewMode } = useStore();

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 safe-area-bottom">
      <div className="flex">
        {navItems.map(item => {
          const isActive = viewMode === item.mode;
          return (
            <button
              key={item.mode}
              className="flex-1 py-4 flex flex-col items-center gap-1 transition-colors"
              onClick={() => {
                setViewMode(item.mode);
                if ('vibrate' in navigator) navigator.vibrate(10);
              }}
            >
              <motion.div
                className={`transition-colors [&_svg]:w-6 [&_svg]:h-6 ${isActive ? 'text-[#E8A598]' : 'text-gray-400 dark:text-gray-500'}`}
                animate={isActive ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                {item.icon}
              </motion.div>
              <span
                className={`text-xs font-semibold transition-colors ${
                  isActive ? 'text-[#E8A598]' : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-[#E8A598]"
                  layoutId="navDot"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
