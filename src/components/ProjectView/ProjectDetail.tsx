import { useState } from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../store';
import { BUBBLE_COLORS } from '../../constants/colors';
import { formatDisplay } from '../../utils/dateUtils';
import { TaskRow } from '../ListView/TaskRow';
import { Modal } from '../UI/Modal';
import { TaskForm } from '../ListView/TaskForm';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';

interface ProjectDetailProps {
  projectId: string;
  onClose: () => void;
}

export function ProjectDetail({ projectId, onClose }: ProjectDetailProps) {
  const { projects, tasks, deleteProject } = useStore();
  const [showAddTask, setShowAddTask] = useState(false);

  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  const subTasks = tasks.filter(t => t.parentProjectId === projectId);
  const completed = subTasks.filter(t => t.isCompleted).length;
  const color = BUBBLE_COLORS[project.colorIndex % BUBBLE_COLORS.length];
  const progress = subTasks.length > 0 ? completed / subTasks.length : 0;

  return (
    <div>
      {/* Header */}
      <div
        className="rounded-sm p-4 mb-4"
        style={{ background: color.light }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1 pl-1">{project.name}</h2>
            {project.description && (
              <p className="text-sm text-gray-600">{project.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-gray-500 hover:bg-white/80 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="flex gap-4 mt-3 text-sm text-gray-600">
          <span>Start: {formatDisplay(project.startDate)}</span>
          <span>Due: {formatDisplay(project.dueDate)}</span>
        </div>

        {/* Progress */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{completed} of {subTasks.length} tasks complete</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color.dark }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {project.tags.map(tag => (
              <Badge key={tag} color={color.base}>{tag}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Sub-tasks */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">Tasks</h3>
        <Button size="xl" variant="primary" onClick={() => setShowAddTask(true)}>
          + Add task
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {subTasks.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No tasks yet</p>
        ) : (
          subTasks.map(task => <TaskRow key={task.id} task={task} />)
        )}
      </div>

      {/* Delete project */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button
          variant="danger"
          size="xl"
          onClick={async () => {
            if (confirm('Delete this project? Tasks will remain but be unlinked.')) {
              await deleteProject(project.id);
              onClose();
            }
          }}
        >
          Delete project
        </Button>
      </div>

      <Modal isOpen={showAddTask} onClose={() => setShowAddTask(false)} title="Add task to project">
        <TaskForm
          onClose={() => setShowAddTask(false)}
          editTask={undefined}
        />
      </Modal>
    </div>
  );
}
