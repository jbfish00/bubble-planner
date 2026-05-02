import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { today } from '../../utils/dateUtils';
import type { EnergyLevel } from '../../types';

const levels: { level: EnergyLevel; label: string; emoji: string; color: string }[] = [
  { level: 1, label: 'Exhausted', emoji: '😴', color: '#A8A8B8' },
  { level: 2, label: 'Low',       emoji: '🥱', color: '#B8C5D5' },
  { level: 3, label: 'Medium',    emoji: '🙂', color: '#A8D5A2' },
  { level: 4, label: 'High',      emoji: '⚡', color: '#E8D098' },
  { level: 5, label: 'Turbo',     emoji: '🔥', color: '#E8A598' },
];

export function EnergyCheckIn() {
  const { todayEnergy, setEnergy, subscriptionTier, showUpgrade, currentDate } = useStore();
  const [dismissed, setDismissed] = useState(false);
  const [showAdjuster, setShowAdjuster] = useState(false);

  // Energy is a "today" feature — don't show it when browsing other days
  if (currentDate !== today()) return null;

  // If user already set energy today, show a small pill (Pro feature)
  if (todayEnergy !== null) {
    const current = levels[todayEnergy - 1];
    return (
      <>
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (subscriptionTier !== 'pro') {
              showUpgrade('Re-checking your energy mid-day is a Pro feature. Upgrade to keep your bubbles in sync with how you feel.');
              return;
            }
            setShowAdjuster(true);
          }}
          className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full pl-2 pr-3 py-1.5 shadow-md text-xs font-semibold text-gray-700 dark:text-gray-200"
          style={{ touchAction: 'manipulation' }}
          title={`Energy: ${current.label}`}
        >
          <span className="text-base leading-none">{current.emoji}</span>
          <span>{current.label}</span>
        </motion.button>

        <AnimatePresence>
          {showAdjuster && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAdjuster(false)}
                className="absolute inset-0 z-40 bg-black/30 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="absolute left-3 right-3 bottom-3 z-50 bg-white dark:bg-gray-900 rounded-sm shadow-2xl p-5"
              >
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3">Update your energy</h3>
                <div className="grid grid-cols-5 gap-2">
                  {levels.map(l => (
                    <motion.button
                      key={l.level}
                      whileTap={{ scale: 0.92 }}
                      whileHover={{ scale: 1.08 }}
                      onClick={() => {
                        setEnergy(l.level);
                        setShowAdjuster(false);
                      }}
                      className="flex flex-col items-center gap-1 p-2 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span className="text-3xl">{l.emoji}</span>
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">{l.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 30, opacity: 0 }}
      className="absolute top-3 left-3 right-3 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-sm shadow-lg p-4"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">How's your energy today?</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            We'll surface tasks that match what you can handle.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none -mt-1"
          aria-label="Dismiss"
        >×</button>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {levels.map(l => (
          <motion.button
            key={l.level}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.08 }}
            onClick={() => setEnergy(l.level)}
            className="flex flex-col items-center gap-0.5 py-2 rounded-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-2xl">{l.emoji}</span>
            <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 leading-none">{l.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
