import { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from './Modal';
import { Button } from './Button';
import { startCheckout, type Plan } from '../../lib/purchases';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

const features = [
  'Unlimited tasks & projects',
  'Unlimited AI Focus suggestions',
  'Energy-based smart planning',
  'Custom bubble themes',
  'Weekly Bubble Report export',
  'Streak shield (one-day grace per month)',
];

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const [plan, setPlan] = useState<Plan>('pro_yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);
    try {
      await startCheckout(plan);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upgrade to Bubble Pro">
      <div className="space-y-5">
        {reason && (
          <div className="bg-[#FDF2EF] dark:bg-gray-800 rounded-sm p-3 text-sm text-gray-700 dark:text-gray-300">
            {reason}
          </div>
        )}

        <ul className="space-y-2">
          {features.map(f => (
            <li key={f} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
              <span className="text-[#E8A598] font-bold mt-0.5">✓</span>
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPlan('pro_monthly')}
            className={`p-4 rounded-sm border-2 text-left transition-colors ${
              plan === 'pro_monthly'
                ? 'border-[#E8A598] bg-[#FDF2EF] dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="font-bold text-gray-800 dark:text-gray-100">Monthly</div>
            <div className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mt-1">$4.99</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">per month</div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setPlan('pro_yearly')}
            className={`p-4 rounded-sm border-2 text-left transition-colors relative ${
              plan === 'pro_yearly'
                ? 'border-[#E8A598] bg-[#FDF2EF] dark:bg-gray-800'
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            <div className="absolute top-2 right-2 bg-[#E8A598] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              SAVE 41%
            </div>
            <div className="font-bold text-gray-800 dark:text-gray-100">Yearly</div>
            <div className="text-2xl font-extrabold text-gray-800 dark:text-gray-100 mt-1">$34.99</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">$2.92 / month</div>
          </motion.button>
        </div>

        {error && (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-sm p-3">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Redirecting…' : 'Start Pro'}
        </Button>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Cancel anytime. No ads, ever.
        </p>
      </div>
    </Modal>
  );
}
