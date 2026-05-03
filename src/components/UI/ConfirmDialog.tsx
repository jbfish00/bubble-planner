import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

export interface ConfirmAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  onClick: () => void | Promise<void>;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  actions: ConfirmAction[];
}

export function ConfirmDialog({ isOpen, onClose, title, message, actions }: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              backgroundColor: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 61,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px', pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-white dark:bg-gray-900 rounded-sm shadow-2xl"
              style={{ pointerEvents: 'auto', maxWidth: '24rem', width: '100%' }}
            >
              <div className="px-6 pt-5 pb-3">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">{title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1.5">{message}</p>
              </div>
              <div className="px-6 pb-5 pt-2 flex flex-col gap-2">
                {actions.map((a, idx) => (
                  <Button
                    key={idx}
                    variant={a.variant ?? 'secondary'}
                    size="md"
                    onClick={async () => { await a.onClick(); onClose(); }}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
