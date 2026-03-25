import { motion } from 'framer-motion';
import type { Project } from '../../types';
import { BUBBLE_COLORS } from '../../constants/colors';
import { formatDisplay } from '../../utils/dateUtils';
import { useStore } from '../../store';
import { Badge } from '../UI/Badge';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const { tasks } = useStore();
  const subTasks = tasks.filter(t => t.parentProjectId === project.id);
  const completed = subTasks.filter(t => t.isCompleted).length;
  const total = subTasks.length;
  const progress = total > 0 ? completed / total : 0;

  const color = BUBBLE_COLORS[project.colorIndex % BUBBLE_COLORS.length];

  return (
    <motion.div
      className="p-4 rounded-2xl shadow-sm cursor-pointer border border-gray-50 dark:border-gray-700"
      style={{ background: `linear-gradient(135deg, ${color.light}, ${color.base}22)` }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      layout
    >
      {/* Color stripe */}
      <div
        className="w-8 h-1.5 rounded-full mb-3"
        style={{ backgroundColor: color.base }}
      />

      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-1 line-clamp-1">
        {project.name}
      </h3>

      {project.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">Due {formatDisplay(project.dueDate)}</span>
        <span className="text-xs text-gray-500">{completed}/{total} tasks</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/60 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color.dark }}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {project.tags.slice(0, 3).map(tag => (
            <Badge key={tag} color={color.base}>{tag}</Badge>
          ))}
        </div>
      )}
    </motion.div>
  );
}
