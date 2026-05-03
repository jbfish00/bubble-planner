import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';

const variantStyle: Record<string, string> = {
  error: 'bg-red-600 text-white',
  info: 'bg-gray-800 text-white',
  success: 'bg-emerald-600 text-white',
};

export function ToastContainer() {
  const { toasts, dismissToast } = useStore();

  return (
    <div
      style={{
        position: 'fixed', left: 0, right: 0, bottom: '5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 8, zIndex: 100, pointerEvents: 'none', padding: '0 16px',
      }}
    >
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            layout
            initial={{ y: 30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 24, stiffness: 320 }}
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto rounded-sm px-4 py-2.5 shadow-lg text-sm font-medium ${variantStyle[t.variant]}`}
            style={{ maxWidth: '24rem' }}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
