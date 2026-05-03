import { useState } from 'react';
import { useStore } from '../../store';
import { useThemeColors } from '../../constants/colors';
import { getUrgency, formatFull } from '../../utils/dateUtils';
import { Modal } from './Modal';
import { TaskForm } from '../ListView/TaskForm';
import { Button } from './Button';
import { Badge } from './Badge';
import { ConfirmDialog } from './ConfirmDialog';

export function TaskDetail() {
  const {
    selectedTaskId, setSelectedTask, tasks, completeTask, deleteTask,
    addTemplate, pushToast,
    startPomodoro, stopPomodoro, pomodoro, subscriptionTier, showUpgrade,
  } = useStore();
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const colors = useThemeColors();
  const task = tasks.find(t => t.id === selectedTaskId);
  if (!task) return null;

  const color = colors[task.colorIndex % colors.length];
  const urgency = getUrgency(task);

  const urgencyLabel = {
    overdue: 'Overdue',
    today: 'Due today',
    week: 'Due this week',
    none: '',
  }[urgency];

  const urgencyColor = {
    overdue: '#EF4444',
    today: '#F97316',
    week: '#EAB308',
    none: 'transparent',
  }[urgency];

  const importanceLabels = ['', 'Low', 'Medium', 'High', 'Critical', 'Urgent'];
  const difficultyLabels = ['', 'Easy', 'Medium', 'Hard', 'Very Hard', 'Expert'];

  const handleComplete = async () => {
    if ('vibrate' in navigator) navigator.vibrate(30);
    await completeTask(task.id);
    setSelectedTask(null);
  };

  const handleDelete = () => setShowDeleteDialog(true);
  const performDelete = async () => {
    await deleteTask(task.id);
    setSelectedTask(null);
  };

  const handleStartPomodoro = () => {
    if (subscriptionTier !== 'pro') {
      showUpgrade('Bubble Pomodoro is a Pro feature. Track focus time on each task and see how your estimates compare to reality.');
      return;
    }
    if (pomodoro?.taskId === task.id) {
      stopPomodoro();
    } else {
      startPomodoro(task.id);
      setSelectedTask(null); // close the detail so the user can see the bubble pulse
    }
  };

  const handleSaveAsTemplate = async () => {
    setSavingTemplate(true);
    const ok = await addTemplate({
      name: task.name,
      description: task.description,
      importance: task.importance,
      difficulty: task.difficulty,
      estimatedHours: task.estimatedHours,
      colorIndex: task.colorIndex,
      tags: [...task.tags],
      recurrence: task.recurrence,
      parentProjectId: task.parentProjectId,
    });
    setSavingTemplate(false);
    if (ok) pushToast('Saved as routine ✓', 'success');
  };

  return (
    <>
      <Modal isOpen={!!selectedTaskId} onClose={() => setSelectedTask(null)} title="">
        <div>
          {/* Header with color */}
          <div
            className="rounded-sm p-5 mb-4"
            style={{ background: `linear-gradient(135deg, ${color.light}, ${color.base}44)` }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h2 className="text-xl font-bold text-gray-800 flex-1 pl-1">{task.name}</h2>
              {urgency !== 'none' && (
                <span className="text-sm font-semibold px-3 py-1 rounded-full text-white flex-shrink-0" style={{ backgroundColor: urgencyColor }}>
                  {urgencyLabel}
                </span>
              )}
            </div>
            {task.description && (
              <p className="text-base text-gray-700 mt-1">{task.description}</p>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Importance</p>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{importanceLabels[task.importance]}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Difficulty</p>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{difficultyLabels[task.difficulty]}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Estimated time</p>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{task.estimatedHours}h</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Due date</p>
              <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{formatFull(task.dueDate)}</p>
            </div>
            {task.startDate && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Start date</p>
                <p className="text-base font-semibold text-gray-800 dark:text-gray-100">{formatFull(task.startDate)}</p>
              </div>
            )}
            {task.recurrence && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-sm p-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Recurrence</p>
                <p className="text-base font-semibold text-gray-800 dark:text-gray-100 capitalize">{task.recurrence}</p>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-400 mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map(tag => (
                  <Badge key={tag} color={color.base}>{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {!task.isCompleted && (
              <Button variant="primary" className="flex-1" onClick={handleComplete}>
                Mark complete ✓
              </Button>
            )}
            {!task.isCompleted && (
              <Button variant="secondary" onClick={handleStartPomodoro}>
                {pomodoro?.taskId === task.id ? 'Stop focus' : '🍅 Start focus'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Button variant="ghost" onClick={handleSaveAsTemplate} disabled={savingTemplate}>
              {savingTemplate ? 'Saving…' : 'Save as routine'}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit task">
        <TaskForm
          editTask={task}
          onClose={() => {
            setShowEdit(false);
            setSelectedTask(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        title="Delete task?"
        message={`"${task.name}" will be permanently deleted.`}
        actions={[
          { label: 'Cancel', variant: 'secondary', onClick: () => {} },
          { label: 'Delete', variant: 'danger', onClick: performDelete },
        ]}
      />
    </>
  );
}
