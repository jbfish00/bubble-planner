import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — separate fixed layer so it reliably covers the screen on iOS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              backgroundColor: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* Centering container — inline styles bypass any iOS/Tailwind quirks */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 51,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              className="bg-white dark:bg-gray-900"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '42rem',
                maxHeight: '85vh',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                borderRadius: '4px',
                boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                pointerEvents: 'auto',
              }}
            >
              <div className="sticky top-0 bg-white dark:bg-gray-900 px-7 pt-5 pb-3 border-b border-gray-100 dark:border-gray-800 z-10">
                {title && (
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 pl-2">{title}</h2>
                    <button
                      onClick={onClose}
                      className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-lg"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              <div className="px-7 py-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
