import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { useThemeColors } from '../../constants/colors';

const POMODORO_MINUTES = 25;

function formatMMSS(seconds: number): string {
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

// Inner timer — only mounts while a session is active. Re-mounts (with
// fresh `chimed` state) whenever the user starts a new focus session,
// keyed by `startedAt`.
function ActiveTimer({ session }: { session: { taskId: string; startedAt: number } }) {
  const { stopPomodoro, tasks, pushToast } = useStore();
  const colors = useThemeColors();
  const [now, setNow] = useState(() => Date.now());
  // chimed is fire-once side-effect bookkeeping — never affects rendering,
  // so we use a ref (no setState-in-effect lint noise, no extra renders).
  const chimedRef = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const elapsed = (now - session.startedAt) / 1000;
    if (elapsed >= POMODORO_MINUTES * 60 && !chimedRef.current) {
      chimedRef.current = true;
      if ('vibrate' in navigator) navigator.vibrate([60, 40, 60, 40, 120]);
      pushToast('Pomodoro complete — take a 5-min break ☕', 'success');
    }
  }, [now, session.startedAt, pushToast]);

  const task = tasks.find(t => t.id === session.taskId);
  if (!task) return null;

  const elapsedSec = Math.max(0, Math.floor((now - session.startedAt) / 1000));
  const totalSec = POMODORO_MINUTES * 60;
  const remainingSec = Math.max(0, totalSec - elapsedSec);
  const overran = elapsedSec > totalSec;
  const ratio = Math.min(1, elapsedSec / totalSec);

  const color = colors[task.colorIndex % colors.length];

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="fixed left-3 right-3 bottom-3 z-40 bg-white dark:bg-gray-900 rounded-sm shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
      style={{ maxWidth: '28rem', margin: '0 auto' }}
    >
      <div className="relative h-1 bg-gray-100 dark:bg-gray-800">
        <motion.div
          className="absolute top-0 left-0 h-full"
          style={{ background: color.base }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      <div className="flex items-center gap-3 p-4">
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-gray-700"
          style={{ background: `radial-gradient(circle at 32% 32%, ${color.light}, ${color.base})` }}
        >
          🍅
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {overran ? 'Bonus time' : 'Focus session'}
          </div>
          <div className="font-semibold text-gray-800 dark:text-gray-100 truncate">{task.name}</div>
        </div>
        <div
          className="font-mono text-2xl font-extrabold tabular-nums"
          style={{ color: overran ? color.dark : '#1f2937' }}
        >
          {overran ? `+${formatMMSS(elapsedSec - totalSec)}` : formatMMSS(remainingSec)}
        </div>
        <button
          onClick={() => stopPomodoro()}
          className="ml-1 px-3 py-1.5 text-xs font-semibold rounded-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
          aria-label="Stop focus session"
        >
          Stop
        </button>
      </div>
    </motion.div>
  );
}

export function PomodoroOverlay() {
  const pomodoro = useStore(state => state.pomodoro);
  return (
    <AnimatePresence>
      {pomodoro && <ActiveTimer key={pomodoro.startedAt} session={pomodoro} />}
    </AnimatePresence>
  );
}
