import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../../types';
import { useThemeColors } from '../../constants/colors';
import { getUrgency, today } from '../../utils/dateUtils';
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

export function Bubble({ task, x, y, r, onBubbleTouchStart }: BubbleProps) {
  const {
    setSelectedTask, completeTask,
    todayEnergy, energyDate, focusedTaskIds, currentDate, pomodoro,
  } = useStore();
  const [completing, setCompleting] = useState(false);
  const touchStartRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const colors = useThemeColors();
  const color = colors[task.colorIndex % colors.length];
  const urgency = getUrgency(task);
  const urgencyColor = urgencyColors[urgency];
  const diameter = r * 2;

  // Energy filter is "how I feel TODAY" — only apply when viewing today AND
  // the stored energy is actually from today (not stale from a session that
  // crossed midnight).
  const todayStr = today();
  const energyIsCurrent = todayEnergy !== null && energyDate === todayStr;
  const isViewingToday = currentDate === todayStr;
  const energyMismatch = isViewingToday && energyIsCurrent && task.difficulty > (todayEnergy as number);
  const isFocused = focusedTaskIds?.has(task.id) ?? false;
  const isPomodoroRunning = pomodoro?.taskId === task.id;
  const energyOpacity = energyMismatch ? 0.35 : 1;
  const energyScale = energyMismatch ? 0.85 : 1;

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate([20, 40, 20]);
    setCompleting(true);
    setTimeout(async () => {
      await completeTask(task.id);
    }, 700); // give the burst time to play
  };

  // Particle burst — 12 colored droplets fly outward and fade
  const particles = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * Math.PI * 2;
    return {
      i,
      dx: Math.cos(angle) * (r + 30),
      dy: Math.sin(angle) * (r + 30),
    };
  });

  // Touch events drive tap detection — most reliable on iOS/Android
  const handleTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const t = e.touches[0];
    touchStartRef.current = { time: Date.now(), x: t.clientX, y: t.clientY };
    onBubbleTouchStart?.();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dt = Date.now() - touchStartRef.current.time;
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    if (dt < 350 && Math.sqrt(dx * dx + dy * dy) < 20) {
      e.preventDefault(); // block the synthetic click that follows touchend
      setSelectedTask(task.id);
    }
  };

  // Font size scales with bubble radius
  const fontSize = Math.max(13, Math.min(18, r / 2.8));
  const subFontSize = Math.max(11, fontSize - 3);
  const textWidth = Math.floor(diameter * 0.65);

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
        cursor: 'pointer',
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence>
        {!completing && (
          <motion.div
            className="absolute inset-0 select-none rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: energyScale, opacity: energyOpacity }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: energyScale * 1.07 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          >
            {/* Focus highlight (AI Focus) */}
            {isFocused && (
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  inset: -8,
                  border: '3px solid #E8A598',
                  boxShadow: '0 0 24px rgba(232, 165, 152, 0.7)',
                }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}

            {/* Pomodoro pulse — slow heartbeat while a focus session runs */}
            {isPomodoroRunning && (
              <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{
                  inset: -14,
                  border: `3px solid ${color.dark}`,
                  boxShadow: `0 0 30px ${color.base}`,
                }}
                animate={{ scale: [1, 1.06, 1], opacity: [0.85, 0.4, 0.85] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
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
                boxShadow: `0 6px 20px ${color.base}55, inset 0 2px 0 rgba(255,255,255,0.55)`,
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

      {/* Particle burst on completion */}
      <AnimatePresence>
        {completing && (
          <>
            {/* Center flash */}
            <motion.div
              className="absolute rounded-full pointer-events-none"
              style={{
                left: r - 6,
                top: r - 6,
                width: 12,
                height: 12,
                background: 'white',
                boxShadow: `0 0 20px ${color.base}`,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 4, 8], opacity: [1, 0.6, 0] }}
              transition={{ duration: 0.6 }}
            />
            {/* Confetti droplets */}
            {particles.map(p => (
              <motion.div
                key={p.i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: r - 4,
                  top: r - 4,
                  width: 8,
                  height: 8,
                  background: `radial-gradient(circle at 32% 32%, ${color.light}, ${color.base})`,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.4 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            ))}
            {/* +1 floating points */}
            <motion.div
              className="absolute pointer-events-none font-extrabold text-base"
              style={{ left: r - 14, top: r - 10, color: color.dark, textShadow: '0 1px 4px rgba(255,255,255,0.8)' }}
              initial={{ y: 0, opacity: 0, scale: 0.5 }}
              animate={{ y: -40, opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 1] }}
              transition={{ duration: 0.7 }}
            >
              +1
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
