import { motion } from 'framer-motion';
import { Modal } from '../UI/Modal';
import { useStore } from '../../store';
import { useThemeColors } from '../../constants/colors';
import { FREE_TEMPLATE_LIMIT } from '../../types';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TemplatesModal({ isOpen, onClose }: TemplatesModalProps) {
  const {
    templates, instantiateTemplate, deleteTemplate, currentDate,
    subscriptionTier, pushToast,
  } = useStore();
  const colors = useThemeColors();
  const isPro = subscriptionTier === 'pro';

  const handleAdd = async (templateId: string) => {
    const ok = await instantiateTemplate(templateId, currentDate);
    if (ok) {
      pushToast('Task created from template', 'success');
      onClose();
    }
    // If blocked by free-tier task limit, the UpgradeModal handles it
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Routines">
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <div className="text-5xl mb-3 opacity-30">📋</div>
            <p className="font-semibold">No saved routines yet</p>
            <p className="mt-1 text-xs">
              Open any task and tap <span className="font-bold">Save as routine</span> to add it here.
            </p>
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
              Tap a routine to add it as today's task.
              {!isPro && ` (${templates.length} of ${FREE_TEMPLATE_LIMIT} on free)`}
            </div>
            {templates.map(tmpl => {
              const color = colors[tmpl.colorIndex % colors.length];
              return (
                <motion.div
                  key={tmpl.id}
                  layout
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 rounded-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-3"
                >
                  <button
                    onClick={() => handleAdd(tmpl.id)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-700"
                      style={{ background: `radial-gradient(circle at 32% 32%, ${color.light}, ${color.base})` }}
                    >
                      {tmpl.estimatedHours}h
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-800 dark:text-gray-100 truncate">{tmpl.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Importance {tmpl.importance}/5 · Difficulty {tmpl.difficulty}/5
                        {tmpl.recurrence && ` · ${tmpl.recurrence}`}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => deleteTemplate(tmpl.id)}
                    className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                    title="Delete routine"
                    aria-label="Delete routine"
                  >
                    ×
                  </button>
                </motion.div>
              );
            })}
          </>
        )}
      </div>
    </Modal>
  );
}
