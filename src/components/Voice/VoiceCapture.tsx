import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { startVoiceCapture, type VoiceSession } from '../../lib/voice';

interface VoiceCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
}

// Inner session — only mounted while isOpen=true, so its state always
// starts fresh and we never need to "reset" via an effect.
function VoiceSessionContent({ onClose, onResult }: { onClose: () => void; onResult: (text: string) => void }) {
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [listening, setListening] = useState(true);
  const sessionRef = useRef<VoiceSession | null>(null);

  // Side effect: kick off a single recognition session on mount, cancel on unmount.
  useEffect(() => {
    let cancelled = false;

    startVoiceCapture({
      onPartial: (t) => { if (!cancelled) setPartial(t); },
      onFinal: (t) => {
        if (cancelled) return;
        setListening(false);
        if (t.trim()) {
          onResult(t.trim());
          onClose();
        } else {
          setError("Didn't catch that. Try again?");
        }
      },
      onError: (msg) => {
        if (cancelled) return;
        setListening(false);
        setError(msg);
      },
    }).then(session => {
      if (cancelled) {
        session?.cancel();
        return;
      }
      sessionRef.current = session;
    });

    return () => {
      cancelled = true;
      sessionRef.current?.cancel();
      sessionRef.current = null;
    };
  }, [onClose, onResult]);

  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="bg-white dark:bg-gray-900 rounded-sm shadow-2xl p-6 text-center"
      style={{ pointerEvents: 'auto', maxWidth: '24rem', width: '100%' }}
    >
      <div className="relative w-24 h-24 mx-auto mb-4">
        {listening && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: '#E8A598', opacity: 0.3 }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-2 rounded-full"
              style={{ background: '#E8A598', opacity: 0.5 }}
              animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
          </>
        )}
        <div
          className="absolute inset-4 rounded-full flex items-center justify-center text-3xl"
          style={{
            background: 'radial-gradient(circle at 32% 32%, #F4D0CB, #E8A598)',
            boxShadow: '0 6px 20px rgba(232, 165, 152, 0.55)',
          }}
        >
          🎤
        </div>
      </div>

      <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">
        {listening ? 'Listening…' : error ? 'Hmm' : 'Done'}
      </h3>

      {partial && (
        <p className="text-sm italic text-gray-600 dark:text-gray-300 min-h-[3rem]">
          "{partial}"
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
      )}

      {!partial && !error && listening && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Speak your task — we'll fill in the details.
        </p>
      )}

      <button
        className="mt-4 w-full py-2 rounded-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
        onClick={onClose}
      >
        Cancel
      </button>
    </motion.div>
  );
}

export function VoiceCapture({ isOpen, onClose, onResult }: VoiceCaptureProps) {
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
              backgroundColor: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 61,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px', pointerEvents: 'none',
            }}
          >
            <VoiceSessionContent onClose={onClose} onResult={onResult} />
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
