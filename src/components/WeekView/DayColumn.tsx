import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { useStore } from '../../store';
import { BUBBLE_COLORS } from '../../constants/colors';
import { getBubbleRadius } from '../../utils/taskUtils';
import { today } from '../../utils/dateUtils';

interface DayColumnProps {
  dateStr: string;
  onClick: () => void;
}

export function DayColumn({ dateStr, onClick }: DayColumnProps) {
  const { getTasksForDay, currentDate } = useStore();
  const tasks = getTasksForDay(dateStr);
  const isToday = dateStr === today();
  const isSelected = dateStr === currentDate;
  const date = parseISO(dateStr);

  // Show up to 5 mini bubbles
  const displayTasks = tasks.slice(0, 5);
  const more = tasks.length - displayTasks.length;

  return (
    <motion.div
      className={`flex-shrink-0 w-14 cursor-pointer rounded-sm p-2 flex flex-col items-center gap-1 transition-colors ${
        isSelected
          ? 'bg-[#E8A598]/20 ring-2 ring-[#E8A598]/50'
          : isToday
          ? 'bg-amber-50 dark:bg-amber-900/20'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Day label */}
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {format(date, 'EEE')}
      </p>
      <p className={`text-sm font-bold ${isToday ? 'text-[#E8A598]' : 'text-gray-700 dark:text-gray-200'}`}>
        {format(date, 'd')}
      </p>

      {/* Mini bubbles */}
      <div className="flex flex-col gap-1 w-full items-center min-h-[60px] justify-center">
        {displayTasks.map(task => {
          const color = BUBBLE_COLORS[task.colorIndex % BUBBLE_COLORS.length];
          const r = Math.min(10, Math.max(5, getBubbleRadius(task) * 0.25));
          return (
            <div
              key={task.id}
              className="rounded-full flex-shrink-0"
              style={{
                width: r * 2,
                height: r * 2,
                background: `radial-gradient(circle at 35% 35%, ${color.light}, ${color.base})`,
              }}
              title={task.name}
            />
          );
        })}
        {more > 0 && (
          <span className="text-xs text-gray-400">+{more}</span>
        )}
        {tasks.length === 0 && (
          <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />
        )}
      </div>

      {/* Task count */}
      {tasks.length > 0 && (
        <span className="text-xs text-gray-400 dark:text-gray-500">{tasks.length}</span>
      )}
    </motion.div>
  );
}
