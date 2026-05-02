import { useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { Button } from './Button';
import { useStore } from '../../store';
import {
  calculateStreak,
  calculateWeeklyStats,
  getLastSevenDayKeys,
} from '../../utils/streakUtils';
import { BUBBLE_COLORS } from '../../constants/colors';

interface WeeklyReportProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WeeklyReport({ isOpen, onClose }: WeeklyReportProps) {
  const { tasks, subscriptionTier, showUpgrade } = useStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const isPro = subscriptionTier === 'pro';
  const [shareError, setShareError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const stats = useMemo(() => calculateWeeklyStats(tasks), [tasks]);
  const streak = useMemo(() => calculateStreak(tasks, isPro), [tasks, isPro]);

  const days = useMemo(() => {
    return getLastSevenDayKeys().map(({ date, label }) => ({
      date,
      label,
      count: stats.perDay[date] ?? 0,
    }));
  }, [stats]);

  const maxDay = Math.max(1, ...days.map(d => d.count));

  const handleShare = async () => {
    if (!isPro) {
      showUpgrade('Sharing your Weekly Report is a Pro feature. Upgrade to export beautiful images of your week.');
      return;
    }
    if (!cardRef.current) return;
    setShareError(null);
    setSharing(true);
    try {
      // Lazy load html-to-image so it isn't in the main bundle
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'bubble-report.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] }) && typeof navigator.share === 'function') {
        try {
          await navigator.share({ files: [file], title: 'My Bubble Week' });
        } catch (err) {
          // User-cancelled share isn't an error worth surfacing
          if ((err as Error)?.name !== 'AbortError') throw err;
        }
      } else {
        // Fallback: download the image
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'bubble-report.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('share failed', err);
      setShareError(
        err instanceof Error
          ? `Could not export image: ${err.message}`
          : 'Could not export image. Please try again.',
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Bubble Week">
      <div className="space-y-5">
        <div
          ref={cardRef}
          className="rounded-sm p-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #FDF2EF 0%, #F4E0DA 60%, #E8C9C0 100%)',
          }}
        >
          {/* Floating bubbles decoration */}
          {[0, 2, 4, 6, 8].map((i) => {
            const c = BUBBLE_COLORS[i % BUBBLE_COLORS.length];
            const size = 24 + (i * 6);
            return (
              <div
                key={i}
                className="absolute rounded-full opacity-30 pointer-events-none"
                style={{
                  width: size,
                  height: size,
                  top: `${(i * 17) % 90}%`,
                  right: `${(i * 23) % 80}%`,
                  background: `radial-gradient(circle at 32% 32%, ${c.light}, ${c.base})`,
                }}
              />
            );
          })}

          <div className="relative">
            <div className="text-xs font-bold tracking-[0.2em] text-[#C97B6B]">BUBBLE PLANNER</div>
            <h2 className="text-3xl font-extrabold text-gray-800 mt-1 mb-5">This week</h2>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white/70 backdrop-blur-sm rounded-sm p-4">
                <div className="text-3xl font-extrabold text-gray-800">{stats.bubblesPopped}</div>
                <div className="text-xs font-semibold text-gray-600 mt-0.5">bubbles popped</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-sm p-4">
                <div className="text-3xl font-extrabold text-gray-800 flex items-baseline gap-1">
                  {streak}<span className="text-base">🔥</span>
                </div>
                <div className="text-xs font-semibold text-gray-600 mt-0.5">day streak</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-sm p-4">
                <div className="text-3xl font-extrabold text-gray-800">{stats.totalHoursCompleted.toFixed(1)}h</div>
                <div className="text-xs font-semibold text-gray-600 mt-0.5">work shipped</div>
              </div>
              <div className="bg-white/70 backdrop-blur-sm rounded-sm p-4">
                <div className="text-3xl font-extrabold text-gray-800">
                  {stats.mostProductiveDay ? format(parseISO(stats.mostProductiveDay), 'EEE') : '—'}
                </div>
                <div className="text-xs font-semibold text-gray-600 mt-0.5">best day</div>
              </div>
            </div>

            {/* Per-day bar chart */}
            <div className="bg-white/70 backdrop-blur-sm rounded-sm p-4">
              <div className="flex items-end justify-between gap-1 h-20">
                {days.map((d, idx) => {
                  const ratio = d.count / maxDay;
                  const c = BUBBLE_COLORS[idx % BUBBLE_COLORS.length];
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${ratio * 100}%` }}
                        transition={{ delay: idx * 0.06, type: 'spring', damping: 18 }}
                        className="w-full rounded-sm min-h-[4px]"
                        style={{ background: `linear-gradient(180deg, ${c.light}, ${c.base})` }}
                      />
                      <div className="text-[10px] font-bold text-gray-600">{d.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {shareError && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-sm p-3">
            {shareError}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose} disabled={sharing}>
            Close
          </Button>
          <Button variant="primary" size="md" className="flex-1" onClick={handleShare} disabled={sharing}>
            {sharing ? 'Exporting…' : isPro ? 'Share' : 'Share (Pro)'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
