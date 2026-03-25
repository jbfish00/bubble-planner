import { motion } from 'framer-motion';
import { addDays, parseISO } from 'date-fns';
import { useStore } from '../../store';
import { toISODate, formatDisplay, today } from '../../utils/dateUtils';

export function DayNavigation() {
  const { currentDate, setCurrentDate } = useStore();

  const goToPrev = () => {
    const prev = toISODate(addDays(parseISO(currentDate), -1));
    setCurrentDate(prev);
  };

  const goToNext = () => {
    const next = toISODate(addDays(parseISO(currentDate), 1));
    setCurrentDate(next);
  };

  const goToToday = () => setCurrentDate(today());

  const isToday = currentDate === today();

  return (
    <div className="flex items-center justify-between px-5 py-3">
      <motion.button
        className="w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 shadow flex items-center justify-center text-2xl text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors font-light"
        whileTap={{ scale: 0.88 }}
        onClick={goToPrev}
        aria-label="Previous day"
      >
        ‹
      </motion.button>

      <div className="flex flex-col items-center gap-0.5">
        <motion.span
          key={currentDate}
          className="text-xl font-bold text-gray-800 dark:text-gray-100"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {formatDisplay(currentDate)}
        </motion.span>
        {!isToday && (
          <button
            className="text-sm font-semibold text-[#E8A598] hover:text-[#D4796A] transition-colors"
            onClick={goToToday}
          >
            Back to today
          </button>
        )}
        {isToday && (
          <span className="text-sm font-medium text-gray-400">Today</span>
        )}
      </div>

      <motion.button
        className="w-12 h-12 rounded-full bg-white/90 dark:bg-gray-800/90 shadow flex items-center justify-center text-2xl text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-700 transition-colors font-light"
        whileTap={{ scale: 0.88 }}
        onClick={goToNext}
        aria-label="Next day"
      >
        ›
      </motion.button>
    </div>
  );
}
