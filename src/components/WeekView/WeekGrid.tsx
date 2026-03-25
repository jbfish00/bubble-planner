import { useRef } from 'react';
import { addDays, parseISO } from 'date-fns';
import { useStore } from '../../store';
import { DayColumn } from './DayColumn';
import { toISODate, getWeekDays } from '../../utils/dateUtils';
import { TaskRow } from '../ListView/TaskRow';

export function WeekGrid() {
  const { currentDate, setCurrentDate, setViewMode, getTasksForDay } = useStore();
  const weekDays = getWeekDays(currentDate);
  const scrollRef = useRef<HTMLDivElement>(null);

  const goToPrevWeek = () => {
    const prev = toISODate(addDays(parseISO(currentDate), -7));
    setCurrentDate(prev);
  };

  const goToNextWeek = () => {
    const next = toISODate(addDays(parseISO(currentDate), 7));
    setCurrentDate(next);
  };

  const handleDayClick = (dateStr: string) => {
    setCurrentDate(dateStr);
    setViewMode('daily');
  };

  const tasksForSelectedDay = getTasksForDay(currentDate);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 pl-2">Week</h2>
        <div className="flex gap-2">
          <button
            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300"
            onClick={goToPrevWeek}
          >
            ‹
          </button>
          <button
            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-gray-600 dark:text-gray-300"
            onClick={goToNextWeek}
          >
            ›
          </button>
        </div>
      </div>

      {/* Day columns - horizontally scrollable */}
      <div
        ref={scrollRef}
        className="px-4 overflow-x-auto flex gap-2 pb-2 scrollbar-hide"
      >
        {weekDays.map(dateStr => (
          <DayColumn
            key={dateStr}
            dateStr={dateStr}
            onClick={() => handleDayClick(dateStr)}
          />
        ))}
      </div>

      {/* Tasks for selected day */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 mt-2">
          Tasks for selected day
        </h3>
        {tasksForSelectedDay.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No tasks for this day</p>
        ) : (
          <div className="space-y-2">
            {tasksForSelectedDay.map(task => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
