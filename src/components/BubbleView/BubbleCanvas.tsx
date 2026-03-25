import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { addDays, parseISO } from 'date-fns';
import { useStore } from '../../store';
import { Bubble } from './Bubble';
import { getBubbleRadius } from '../../utils/taskUtils';
import { toISODate, isTaskOnDay } from '../../utils/dateUtils';
import { DayNavigation } from './DayNavigation';
import type { Task } from '../../types';

interface PhysicsNode {
  id: string;
  r: number;
  colorIndex: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

type PositionMap = Map<string, { x: number; y: number }>;

const PADDING = 16;
const TARGET_SPEED = 0.25;
const MAX_SPEED = 0.5;
const MIN_SPEED = 0.08;

function tickPhysics(nodes: PhysicsNode[], width: number, height: number, draggedId?: string) {
  // Update positions (skip dragged node)
  for (const n of nodes) {
    if (n.id === draggedId) continue;
    n.x += n.vx;
    n.y += n.vy;
  }

  // Wall bounce (skip dragged node)
  for (const n of nodes) {
    if (n.id === draggedId) continue;
    const edge = n.r + PADDING;
    if (n.x < edge) { n.x = edge; n.vx = Math.abs(n.vx); }
    else if (n.x > width - edge) { n.x = width - edge; n.vx = -Math.abs(n.vx); }
    if (n.y < edge) { n.y = edge; n.vy = Math.abs(n.vy); }
    else if (n.y > height - edge) { n.y = height - edge; n.vy = -Math.abs(n.vy); }
  }

  // Bubble-bubble collision (elastic with mass) — includes dragged node so it pushes others
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const distSq = dx * dx + dy * dy;
      const minDist = a.r + b.r + 6;
      if (distSq < minDist * minDist && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const nx = dx / dist;
        const ny = dy / dist;

        // Separate overlapping bubbles (weighted by mass so heavy ones move less)
        const ma = a.r * a.r;
        const mb = b.r * b.r;
        const totalMass = ma + mb;
        const overlap = minDist - dist;
        if (a.id !== draggedId) { a.x -= nx * overlap * (mb / totalMass); a.y -= ny * overlap * (mb / totalMass); }
        if (b.id !== draggedId) { b.x += nx * overlap * (ma / totalMass); b.y += ny * overlap * (ma / totalMass); }

        // Elastic collision velocity exchange along the collision normal
        // Project velocities onto normal
        const van = a.vx * nx + a.vy * ny;
        const vbn = b.vx * nx + b.vy * ny;
        // Only resolve if approaching
        if (van - vbn > 0) {
          const van2 = ((ma - mb) * van + 2 * mb * vbn) / totalMass;
          const vbn2 = ((mb - ma) * vbn + 2 * ma * van) / totalMass;
          const dvan = van2 - van;
          const dvbn = vbn2 - vbn;
          if (a.id !== draggedId) { a.vx += dvan * nx; a.vy += dvan * ny; }
          if (b.id !== draggedId) { b.vx += dvbn * nx; b.vy += dvbn * ny; }
        }
      }
    }
  }

  // Speed maintenance + random wander (skip dragged node)
  for (const n of nodes) {
    if (n.id === draggedId) continue;
    if (Math.random() < 0.003) {
      const angle = Math.random() * Math.PI * 2;
      n.vx += Math.cos(angle) * 0.15;
      n.vy += Math.sin(angle) * 0.15;
    }
    const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
    if (speed < MIN_SPEED) {
      const angle = Math.random() * Math.PI * 2;
      n.vx = Math.cos(angle) * TARGET_SPEED;
      n.vy = Math.sin(angle) * TARGET_SPEED;
    } else if (speed > MAX_SPEED) {
      // Gradually decelerate rather than hard-cap, so throws feel smooth
      n.vx *= 0.92;
      n.vy *= 0.92;
    }
  }
}

const THROW_MAX_SPEED = 18;

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
  lastX: number;
  lastY: number;
  velX: number;
  velY: number;
}

export function BubbleCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<PositionMap>(new Map());
  const nodesRef = useRef<PhysicsNode[]>([]);
  const rafRef = useRef<number>(0);
  const sizeRef = useRef({ width: 0, height: 0 });
  const mountedRef = useRef(true);
  const dragRef = useRef<DragState | null>(null);

  const { currentDate, setCurrentDate, setSelectedTask } = useStore();
  const allTasks = useStore(state => state.tasks);

  const tasks = useMemo(
    () => allTasks.filter(t => isTaskOnDay(t, currentDate)),
    [allTasks, currentDate],
  );
  const taskKey = useMemo(() => tasks.map(t => t.id).sort().join(','), [tasks]);

  const loop = useCallback(() => {
    if (!mountedRef.current) return;
    const { width, height } = sizeRef.current;
    if (width > 0 && height > 0 && nodesRef.current.length > 0) {
      tickPhysics(nodesRef.current, width, height, dragRef.current?.id);
      const map: PositionMap = new Map();
      for (const n of nodesRef.current) map.set(n.id, { x: n.x, y: n.y });
      setPositions(map);
    }
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const initNodes = useCallback((newTasks: Task[], width: number, height: number) => {
    cancelAnimationFrame(rafRef.current);
    const w = width - PADDING * 2;
    const h = height - PADDING * 2;
    nodesRef.current = newTasks.map(task => {
      const r = getBubbleRadius(task);
      const angle = Math.random() * Math.PI * 2;
      const speed = TARGET_SPEED + Math.random() * 0.15;
      return {
        id: task.id,
        r,
        colorIndex: task.colorIndex,
        x: PADDING + r + Math.random() * Math.max(0, w - r * 2),
        y: PADDING + r + Math.random() * Math.max(0, h - r * 2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      };
    });
    if (newTasks.length > 0) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [loop]);

  // Track tap start for tap-vs-drag detection in handlePointerUp
  const tapStartRef = useRef({ time: 0, clientX: 0, clientY: 0 });

  // Drag handlers
  const handleDragStart = useCallback((id: string, clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const node = nodesRef.current.find(n => n.id === id);
    if (!node) return;
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    node.vx = 0;
    node.vy = 0;
    dragRef.current = { id, offsetX: cx - node.x, offsetY: cy - node.y, lastX: cx, lastY: cy, velX: 0, velY: 0 };
    tapStartRef.current = { time: Date.now(), clientX, clientY };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    drag.velX = cx - drag.lastX;
    drag.velY = cy - drag.lastY;
    drag.lastX = cx;
    drag.lastY = cy;
    const node = nodesRef.current.find(n => n.id === drag.id);
    if (node) {
      node.x = cx - drag.offsetX;
      node.y = cy - drag.offsetY;
      node.vx = 0;
      node.vy = 0;
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    // Detect tap: short duration + minimal movement → open task detail
    const dt = Date.now() - tapStartRef.current.time;
    const dx = e.clientX - tapStartRef.current.clientX;
    const dy = e.clientY - tapStartRef.current.clientY;
    if (dt < 300 && Math.sqrt(dx * dx + dy * dy) < 15) {
      dragRef.current = null;
      setSelectedTask(drag.id);
      return;
    }
    const node = nodesRef.current.find(n => n.id === drag.id);
    if (node) {
      // Release with throw velocity, capped at THROW_MAX_SPEED
      const speed = Math.sqrt(drag.velX ** 2 + drag.velY ** 2);
      const scale = speed > THROW_MAX_SPEED ? THROW_MAX_SPEED / speed : 1;
      node.vx = drag.velX * scale;
      node.vy = drag.velY * scale;
    }
    dragRef.current = null;
  }, [setSelectedTask]);

  // Restart simulation when tasks change
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    sizeRef.current = { width, height };
    initNodes(tasks, width, height);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskKey]);

  // ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        sizeRef.current = { width, height };
        initNodes(tasksRef.current, width, height);
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Swipe to change day (only when not dragging or tapping a bubble)
  const touchStartX = useRef(0);
  const bubbleTouchedRef = useRef(false);
  const handleBubbleTouchStart = useCallback(() => {
    bubbleTouchedRef.current = true;
  }, []);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (dragRef.current) return;
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (bubbleTouchedRef.current) {
      bubbleTouchedRef.current = false;
      return;
    }
    if (dragRef.current) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      setCurrentDate(toISODate(addDays(parseISO(currentDate), diff > 0 ? 1 : -1)));
      if ('vibrate' in navigator) navigator.vibrate(10);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <DayNavigation />
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ touchAction: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-10">
            <div className="text-7xl mb-5 opacity-20">○</div>
            <p className="text-gray-600 dark:text-gray-400 text-xl font-semibold">No tasks for this day</p>
            <p className="text-gray-400 dark:text-gray-500 text-base mt-2">Tap + to add a task</p>
          </div>
        ) : (
          <AnimatePresence>
            {tasks.map(task => {
              const pos = positions.get(task.id);
              if (!pos) return null;
              return (
                <Bubble
                  key={task.id}
                  task={task}
                  x={pos.x}
                  y={pos.y}
                  r={getBubbleRadius(task)}
                  onDragStart={handleDragStart}
                  dragRef={dragRef}
                  onBubbleTouchStart={handleBubbleTouchStart}
                />
              );
            })}
          </AnimatePresence>
        )}

        {tasks.length > 0 && (
          <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 shadow-sm">
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
