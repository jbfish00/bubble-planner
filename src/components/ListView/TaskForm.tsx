import { useState } from 'react';
import { useStore } from '../../store';
import type { Task } from '../../types';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { BUBBLE_COLORS } from '../../constants/colors';

interface TaskFormProps {
  editTask?: Task;
  onClose: () => void;
  defaultDate?: string;
}

const HOUR_CHIPS = [0.5, 1, 2, 4, 8, 16];
const IMPORTANCE_LABELS = ['', 'Low', 'Medium', 'High', 'Critical', 'Urgent'];
const DIFFICULTY_LABELS = ['', 'Easy', 'Medium', 'Hard', 'Very Hard', 'Expert'];

export function TaskForm({ editTask, onClose, defaultDate }: TaskFormProps) {
  const { addTask, updateTask, projects, currentDate } = useStore();
  const [name, setName] = useState(editTask?.name ?? '');
  const [description, setDescription] = useState(editTask?.description ?? '');
  const [importance, setImportance] = useState<1|2|3|4|5>(editTask?.importance ?? 3);
  const [difficulty, setDifficulty] = useState<1|2|3|4|5>(editTask?.difficulty ?? 2);
  const [estimatedHours, setEstimatedHours] = useState(editTask?.estimatedHours ?? 1);
  const [dueDate, setDueDate] = useState(editTask?.dueDate ?? defaultDate ?? currentDate);
  const [startDate, setStartDate] = useState(editTask?.startDate ?? '');
  const [recurrence, setRecurrence] = useState<Task['recurrence']>(editTask?.recurrence ?? null);
  const [parentProjectId, setParentProjectId] = useState(editTask?.parentProjectId ?? '');
  const [colorIndex, setColorIndex] = useState(editTask?.colorIndex ?? Math.floor(Math.random() * 10));
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(editTask?.tags ?? []);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/,/g, '');
      if (!tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const taskData = {
      name: name.trim() || 'New Task',
      description: description.trim() || undefined,
      importance,
      difficulty,
      estimatedHours,
      dueDate,
      startDate: startDate || undefined,
      isCompleted: false,
      parentProjectId: parentProjectId || undefined,
      colorIndex,
      tags,
      recurrence: recurrence || null,
      assignedDays: [],
    };

    if (editTask) {
      await updateTask(editTask.id, taskData);
    } else {
      await addTask(taskData);
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Task name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50 text-base"
          autoFocus
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional notes..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50 text-base resize-none"
        />
      </div>

      {/* Importance */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Importance: <span className="text-[#E8A598]">{IMPORTANCE_LABELS[importance]}</span>
        </label>
        <div className="flex gap-2">
          {([1,2,3,4,5] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setImportance(v)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                importance === v
                  ? 'bg-[#E8A598] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {IMPORTANCE_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Difficulty: <span className="text-[#98C5E8]">{DIFFICULTY_LABELS[difficulty]}</span>
        </label>
        <div className="flex gap-2">
          {([1,2,3,4,5] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setDifficulty(v)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                difficulty === v
                  ? 'bg-[#98C5E8] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {DIFFICULTY_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Estimated Hours */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Estimated time: <span className="text-[#A8D5A2]">{estimatedHours}h</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {HOUR_CHIPS.map(h => (
            <button
              key={h}
              type="button"
              onClick={() => setEstimatedHours(h)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                estimatedHours === h
                  ? 'bg-[#A8D5A2] text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {h === 0.5 ? '30m' : `${h}h`}
            </button>
          ))}
          <input
            type="number"
            min={0.25}
            max={100}
            step={0.25}
            value={estimatedHours}
            onChange={e => setEstimatedHours(parseFloat(e.target.value) || 1)}
            className="w-20 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#A8D5A2]/50"
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Due date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50"
          />
        </div>
      </div>

      {/* Recurrence */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Recurrence
        </label>
        <select
          value={recurrence ?? ''}
          onChange={e => setRecurrence((e.target.value || null) as Task['recurrence'])}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50"
        >
          <option value="">None</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Every 2 weeks</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {/* Parent project */}
      {projects.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Project
          </label>
          <select
            value={parentProjectId}
            onChange={e => setParentProjectId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50"
          >
            <option value="">No project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Color */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Color
        </label>
        <div className="flex gap-3 flex-wrap">
          {BUBBLE_COLORS.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setColorIndex(i)}
              className={`w-9 h-9 rounded-full transition-transform ${colorIndex === i ? 'scale-125 ring-2 ring-gray-400 ring-offset-2' : 'hover:scale-110'}`}
              style={{ backgroundColor: c.base }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <Badge key={tag} color={BUBBLE_COLORS[colorIndex % BUBBLE_COLORS.length].base} onRemove={() => setTags(tags.filter(t => t !== tag))}>
              {tag}
            </Badge>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Type a tag and press Enter..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-3">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {editTask ? 'Save changes' : 'Add task'}
        </Button>
      </div>
    </form>
  );
}
