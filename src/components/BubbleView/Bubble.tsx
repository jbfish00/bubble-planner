import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../../types';
import { BUBBLE_COLORS } from '../../constants/colors';
import { getUrgency } from '../../utils/dateUtils';
import { useStore } from '../../store';

interface BubbleProps {
  task: Task;
  x: number;
  y: number;
  r: number;
  onDragStart: (id: string, clientX: number, clientY: number) => void;
  dragRef: React.RefObject<{ id: string } | null>;
  onBubbleTouchStart?: () => void;
}

const urgencyColors = {
  overdue: '#EF4444',
  today: '#F97316',
  week: '#EAB308',
  none: 'transparent',
};

export function Bubble({ task, x, y, r, onDragStart, dragRef, onBubbleTouchStart }: BubbleProps) {
  const { completeTask } = useStore();
  const [completing, setCompleting] = useState(false);

  const color = BUBBLE_COLORS[task.colorIndex % BUBBLE_COLORS.length];
  const urgency = getUrgency(task);
  const urgencyColor = urgencyColors[urgency];
  const diameter = r * 2;

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(30);
    setCompleting(true);
    setTimeout(async () => {
      await completeTask(task.id);
    }, 400);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Don't interfere with the complete button
    if ((e.target as HTMLElement).closest('button')) return;
    e.stopPropagation();
    onBubbleTouchStart?.();
    onDragStart(task.id, e.clientX, e.clientY);
  };

  // Font size scales with bubble radius
  const fontSize = Math.max(13, Math.min(18, r / 2.8));
  const subFontSize = Math.max(11, fontSize - 3);
  const textWidth = Math.floor(diameter * 0.65);

  const isDragged = dragRef.current?.id === task.id;

  return (
    <div
      className="absolute"
      style={{
        transform: `translate(${x - r}px, ${y - r}px)`,
        width: diameter,
        height: diameter,
        top: 0,
        left: 0,
        willChange: 'transform',
        cursor: isDragged ? 'grabbing' : 'grab',
        zIndex: isDragged ? 10 : 1,
      }}
      onPointerDown={handlePointerDown}
    >
      <AnimatePresence>
        {!completing && (
          <motion.div
            className="absolute inset-0 select-none rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: isDragged ? 1.08 : 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: isDragged ? 1.08 : 1.07 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            {/* Urgency ring */}
            {urgency !== 'none' && (
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{ border: `4px solid ${urgencyColor}` }}
                animate={urgency === 'overdue' ? { opacity: [1, 0.25, 1] } : undefined}
                transition={urgency === 'overdue' ? { duration: 1.5, repeat: Infinity } : undefined}
              />
            )}

            {/* Bubble body */}
            <div
              className="absolute rounded-full flex flex-col items-center justify-center text-center overflow-hidden"
              style={{
                inset: urgency !== 'none' ? 4 : 0,
                background: `radial-gradient(circle at 32% 32%, ${color.light}, ${color.base})`,
                boxShadow: isDragged
                  ? `0 12px 32px ${color.base}88, inset 0 2px 0 rgba(255,255,255,0.55)`
                  : `0 6px 20px ${color.base}55, inset 0 2px 0 rgba(255,255,255,0.55)`,
              }}
            >
              {/* Glass shine */}
              <div
                className="absolute rounded-full opacity-55 pointer-events-none"
                style={{
                  top: '10%',
                  left: '14%',
                  width: r * 0.52,
                  height: r * 0.28,
                  background: 'radial-gradient(ellipse, rgba(255,255,255,0.8) 0%, transparent 100%)',
                }}
              />

              {/* Task name */}
              <span
                className="relative z-10 font-bold text-gray-800 leading-tight text-center break-words"
                style={{ fontSize: `${fontSize}px`, width: textWidth, maxWidth: textWidth }}
              >
                {task.name}
              </span>

              {/* Hours label */}
              {r > 32 && (
                <span
                  className="relative z-10 font-semibold text-gray-600 opacity-80 mt-0.5"
                  style={{ fontSize: `${subFontSize}px` }}
                >
                  {task.estimatedHours}h
                </span>
              )}

              {/* Complete check button */}
              <motion.button
                className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/75 flex items-center justify-center text-gray-700 hover:bg-white transition-colors z-20 font-bold"
                style={{ fontSize: 11 }}
                whileHover={{ scale: 1.25 }}
                onClick={handleComplete}
                title="Mark complete"
              >
                ✓
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
