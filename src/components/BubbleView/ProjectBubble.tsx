import { motion } from 'framer-motion';
import type { Project, Task } from '../../types';
import { BUBBLE_COLORS } from '../../constants/colors';
import { useStore } from '../../store';
import { Bubble } from './Bubble';
import { getBubbleRadius } from '../../utils/taskUtils';

interface ProjectBubbleProps {
  project: Project;
  x: number;
  y: number;
  r: number;
  subTasks: Task[];
}

export function ProjectBubble({ project, x, y, r, subTasks }: ProjectBubbleProps) {
  const { toggleExpandProject, expandedProjectIds, setSelectedProject } = useStore();
  const isExpanded = expandedProjectIds.has(project.id);
  const color = BUBBLE_COLORS[project.colorIndex % BUBBLE_COLORS.length];
  const diameter = r * 2;
  const fontSize = Math.max(10, Math.min(14, r / 3));

  const handleClick = () => {
    if (subTasks.length > 0) {
      toggleExpandProject(project.id);
    } else {
      setSelectedProject(project.id);
    }
  };

  return (
    <motion.div
      className="absolute cursor-pointer select-none"
      style={{ left: x - r, top: y - r, width: diameter, height: diameter }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      whileHover={{ scale: 1.04 }}
      onClick={handleClick}
    >
      <div
        className="w-full h-full rounded-full flex flex-col items-center justify-center text-center overflow-hidden relative"
        style={{
          background: `radial-gradient(circle at 35% 35%, ${color.light}, ${color.base})`,
          boxShadow: `0 4px 20px ${color.base}88, inset 0 1px 0 rgba(255,255,255,0.5)`,
          border: '2px dashed rgba(255,255,255,0.5)',
        }}
      >
        {/* Glass highlight */}
        <div
          className="absolute top-[8%] left-[15%] rounded-full opacity-50"
          style={{
            width: r * 0.5,
            height: r * 0.25,
            background: 'radial-gradient(ellipse, rgba(255,255,255,0.7) 0%, transparent 100%)',
          }}
        />

        <span
          className="relative z-10 font-semibold text-gray-700 leading-tight px-2"
          style={{ fontSize: `${fontSize}px` }}
        >
          {project.name}
        </span>
        {subTasks.length > 0 && (
          <span
            className="relative z-10 text-gray-500 opacity-70"
            style={{ fontSize: `${Math.max(8, fontSize - 2)}px` }}
          >
            {subTasks.length} tasks
          </span>
        )}

        {/* Expand indicator */}
        <motion.div
          className="absolute bottom-2 text-gray-500 opacity-60"
          style={{ fontSize: 8 }}
          animate={{ rotate: isExpanded ? 180 : 0 }}
        >
          ▼
        </motion.div>
      </div>

      {/* Expanded sub-task bubbles */}
      {isExpanded && subTasks.map((task, i) => {
        const angle = (i / subTasks.length) * Math.PI * 2 - Math.PI / 2;
        const subR = getBubbleRadius(task);
        const dist = r + subR + 20;
        const subX = dist * Math.cos(angle);
        const subY = dist * Math.sin(angle);
        return (
          <Bubble
            key={task.id}
            task={task}
            x={r + subX}
            y={r + subY}
            r={subR}
            onDragStart={() => {}}
            dragRef={{ current: null }}
          />
        );
      })}
    </motion.div>
  );
}
