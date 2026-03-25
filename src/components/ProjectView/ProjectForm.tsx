import { useState } from 'react';
import { useStore } from '../../store';
import type { Project } from '../../types';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { BUBBLE_COLORS } from '../../constants/colors';
import { today } from '../../utils/dateUtils';

interface ProjectFormProps {
  editProject?: Project;
  onClose: () => void;
}

export function ProjectForm({ editProject, onClose }: ProjectFormProps) {
  const { addProject, updateProject } = useStore();
  const [name, setName] = useState(editProject?.name ?? '');
  const [description, setDescription] = useState(editProject?.description ?? '');
  const [startDate, setStartDate] = useState(editProject?.startDate ?? today());
  const [dueDate, setDueDate] = useState(editProject?.dueDate ?? '');
  const [colorIndex, setColorIndex] = useState(editProject?.colorIndex ?? Math.floor(Math.random() * 10));
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(editProject?.tags ?? []);

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
    if (!name.trim() || !dueDate) return;

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      startDate,
      dueDate,
      colorIndex,
      subTaskIds: editProject?.subTaskIds ?? [],
      isCompleted: false,
      tags,
    };

    if (editProject) {
      await updateProject(editProject.id, data);
    } else {
      await addProject(data);
    }
    onClose();
  };

  const color = BUBBLE_COLORS[colorIndex % BUBBLE_COLORS.length];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project name *
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Project name..."
          className="w-full px-3 py-2.5 rounded-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50 text-sm"
          autoFocus
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional description..."
          rows={2}
          className="w-full px-3 py-2.5 rounded-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50 text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Start date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 rounded-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Due date *
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Color
        </label>
        <div className="flex gap-2 flex-wrap">
          {BUBBLE_COLORS.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setColorIndex(i)}
              className={`w-7 h-7 rounded-full transition-transform ${colorIndex === i ? 'scale-125 ring-2 ring-gray-400 ring-offset-1' : 'hover:scale-110'}`}
              style={{ backgroundColor: c.base }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map(tag => (
            <Badge key={tag} color={color.base} onRemove={() => setTags(tags.filter(t => t !== tag))}>
              {tag}
            </Badge>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder="Type tag and press Enter..."
          className="w-full px-3 py-2 rounded-none border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8A598]/50"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {editProject ? 'Save changes' : 'Create project'}
        </Button>
      </div>
    </form>
  );
}
