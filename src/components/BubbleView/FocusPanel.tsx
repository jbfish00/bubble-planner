import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { getDailyFocus } from '../../lib/ai';
import { BUBBLE_COLORS } from '../../constants/colors';
import { isTaskOnDay } from '../../utils/dateUtils';
import type { FocusSuggestion } from '../../types';

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" fill="currentColor" />
    <path d="M19 14l.7 2.1L22 17l-2.3.9L19 20l-.7-2.1L16 17l2.3-.9L19 14z" fill="currentColor" opacity={0.7} />
  </svg>
);

export function FocusPanel() {
  const {
    tasks, currentDate, setSelectedTask, showUpgrade,
    setFocusedTaskIds, clearFocusedTaskIds,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FocusSuggestion[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Use the same filter as BubbleCanvas so the AI sees what the user sees
  // (includes multi-day ranges and recurring tasks, not just exact dueDate match).
  const todaysTasks = useMemo(
    () => tasks.filter(t => !t.isCompleted && isTaskOnDay(t, currentDate)),
    [tasks, currentDate],
  );

  const handleClose = () => {
    setOpen(false);
    clearFocusedTaskIds();
  };

  const handleFetch = async () => {
    if (loading) return; // guard against double-click while in flight
    setSuggestions(null);
    setLoading(true);
    setErrorMsg(null);
    setOpen(true);
    const result = await getDailyFocus(todaysTasks, currentDate);
    setLoading(false);
    if (!result.ok) {
      if (result.error.code === 'rate_limit') {
        handleClose();
        showUpgrade(result.error.message);
        return;
      }
      setErrorMsg(result.error.message);
      return;
    }
    setSuggestions(result.suggestions);
    setFocusedTaskIds(result.suggestions.map(s => s.taskId));
  };

  if (todaysTasks.length === 0) return null;

  return (
    <>
      {/* Floating Focus button */}
      <motion.button
        whileTap={loading ? undefined : { scale: 0.95 }}
        whileHover={loading ? undefined : { scale: 1.05 }}
        onClick={handleFetch}
        disabled={loading}
        className="absolute top-3 right-3 z-30 flex items-center gap-1.5 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full pl-2.5 pr-3 py-1.5 shadow-md text-sm font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-60 disabled:cursor-wait"
        style={{ touchAction: 'manipulation' }}
        aria-busy={loading}
      >
        <span className="text-[#E8A598]"><SparkleIcon /></span>
        {loading ? 'Thinking…' : 'Focus'}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => handleClose()}
              className="absolute inset-0 z-40 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="absolute left-3 right-3 bottom-3 z-50 bg-white dark:bg-gray-900 rounded-sm shadow-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-[#E8A598]"><SparkleIcon /></span>
                  <h3 className="font-bold text-gray-800 dark:text-gray-100">Today's Focus</h3>
                </div>
                <button
                  onClick={() => handleClose()}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg leading-none"
                >×</button>
              </div>

              {loading && (
                <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  <div className="inline-block w-5 h-5 border-2 border-[#E8A598] border-t-transparent rounded-full animate-spin mb-2" />
                  <div>Thinking…</div>
                </div>
              )}

              {!loading && errorMsg && (
                <div className="py-4 text-sm text-red-600 dark:text-red-400">{errorMsg}</div>
              )}

              {!loading && !errorMsg && suggestions && suggestions.length === 0 && (
                <div className="py-4 text-sm text-gray-500 dark:text-gray-400">
                  No suggestions returned. Try again with a different task list.
                </div>
              )}

              {!loading && !errorMsg && suggestions && suggestions.length > 0 && (
                <ol className="space-y-2.5">
                  {suggestions.map((s, idx) => {
                    const task = todaysTasks.find(t => t.id === s.taskId);
                    if (!task) return null;
                    const color = BUBBLE_COLORS[task.colorIndex % BUBBLE_COLORS.length];
                    return (
                      <motion.li
                        key={s.taskId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 }}
                      >
                        <button
                          onClick={() => {
                            setSelectedTask(s.taskId);
                            handleClose();
                          }}
                          className="w-full text-left bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-sm p-3 flex items-start gap-3"
                        >
                          <div
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-700 text-sm"
                            style={{ background: `radial-gradient(circle at 32% 32%, ${color.light}, ${color.base})` }}
                          >
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 dark:text-gray-100 truncate">{task.name}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{s.reason}</div>
                          </div>
                        </button>
                      </motion.li>
                    );
                  })}
                </ol>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
