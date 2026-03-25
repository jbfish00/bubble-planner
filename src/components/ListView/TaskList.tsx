import { useState } from 'react';
import { useStore } from '../../store';
import { TaskRow } from './TaskRow';
import { Modal } from '../UI/Modal';
import { TaskForm } from './TaskForm';
import { Button } from '../UI/Button';

export function TaskList() {
  const { tasks } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<'active' | 'completed'>('active');

  const activeTasks = tasks.filter(t => !t.isCompleted);
  const completedTasks = tasks.filter(t => t.isCompleted);
  const displayed = filter === 'active' ? activeTasks : completedTasks;

  // Sort: overdue first, then by due date
  const sorted = [...displayed].sort((a, b) => {
    if (a.dueDate < b.dueDate) return -1;
    if (a.dueDate > b.dueDate) return 1;
    return b.importance - a.importance;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 pl-2">Tasks</h2>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
          + Add task
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="px-4 mb-3">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-sm p-1">
          {(['active', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-sm text-sm font-medium transition-all ${
                filter === f
                  ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {f === 'active' ? `Active (${activeTasks.length})` : `Done (${completedTasks.length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3 opacity-30">📋</div>
            <p className="text-gray-400 font-medium">
              {filter === 'active' ? 'No active tasks' : 'No completed tasks'}
            </p>
            {filter === 'active' && (
              <button
                className="text-[#E8A598] text-sm mt-2 hover:text-[#D4796A] transition-colors"
                onClick={() => setShowAdd(true)}
              >
                Add your first task
              </button>
            )}
          </div>
        ) : (
          sorted.map(task => <TaskRow key={task.id} task={task} />)
        )}
      </div>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New task">
        <TaskForm onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}
