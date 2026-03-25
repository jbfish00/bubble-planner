import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../../types';
import { BUBBLE_COLORS } from '../../constants/colors';
import { getUrgency, formatDisplay } from '../../utils/dateUtils';
import { useStore } from '../../store';
import { Badge } from '../UI/Badge';
import { Modal } from '../UI/Modal';
import { TaskForm } from './TaskForm';

interface TaskRowProps {
  task: Task;
}

const urgencyLabels = {
  overdue: 'Overdue',
  today: 'Due today',
  week: 'Due this week',
  none: '',
};

const urgencyColors = {
  overdue: '#EF4444',
  today: '#F97316',
  week: '#EAB308',
  none: 'transparent',
};

export function TaskRow({ task }: TaskRowProps) {
  const { completeTask, deleteTask } = useStore();
  const [showEdit, setShowEdit] = useState(false);
  const [completing, setCompleting] = useState(false);

  const color = BUBBLE_COLORS[task.colorIndex % BUBBLE_COLORS.length];
  const urgency = getUrgency(task);
  const urgencyColor = urgencyColors[urgency];

  const handleComplete = async () => {
    if ('vibrate' in navigator) navigator.vibrate(30);
    setCompleting(true);
    setTimeout(async () => {
      await completeTask(task.id);
    }, 300);
  };

  return (
    <>
      <AnimatePresence>
        {!completing && (
          <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
            className="flex items-center gap-3 p-3 rounded-none bg-white dark:bg-gray-800 shadow-sm border border-gray-50 dark:border-gray-700"
          >
            {/* Color indicator */}
            <div
              className="w-1.5 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: color.base }}
            />

            {/* Complete button */}
            <motion.button
              className="w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
              style={{ borderColor: color.base }}
              whileTap={{ scale: 0.9 }}
              onClick={handleComplete}
            >
              {completing && <span className="text-green-500 text-xs">✓</span>}
            </motion.button>

            {/* Content */}
            <div className="flex-1 min-w-0" onClick={() => setShowEdit(true)}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                  {task.name}
                </p>
                {urgency !== 'none' && (
                  <span className="text-xs font-medium flex-shrink-0 whitespace-nowrap" style={{ color: urgencyColor }}>
                    {urgencyLabels[urgency]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400">Due {formatDisplay(task.dueDate)}</span>
                <span className="text-xs text-gray-400">{task.estimatedHours}h</span>
                {task.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} color={color.base}>{tag}</Badge>
                ))}
              </div>
            </div>

            {/* Delete */}
            <motion.button
              className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-colors flex-shrink-0"
              whileTap={{ scale: 0.9 }}
              onClick={() => deleteTask(task.id)}
            >
              <span className="text-xs">×</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit task">
        <TaskForm editTask={task} onClose={() => setShowEdit(false)} />
      </Modal>
    </>
  );
}
