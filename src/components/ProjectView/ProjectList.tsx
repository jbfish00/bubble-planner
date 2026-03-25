import { useState } from 'react';
import { useStore } from '../../store';
import { ProjectCard } from './ProjectCard';
import { ProjectDetail } from './ProjectDetail';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { ProjectForm } from './ProjectForm';

export function ProjectList() {
  const { projects } = useStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const active = projects.filter(p => !p.isCompleted);
  const completed = projects.filter(p => p.isCompleted);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Projects</h2>
        <Button variant="primary" size="sm" onClick={() => setShowAdd(true)}>
          + New project
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {active.length === 0 && completed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3 opacity-30">📁</div>
            <p className="text-gray-400 font-medium">No projects yet</p>
            <button
              className="text-[#E8A598] text-sm mt-2 hover:text-[#D4796A]"
              onClick={() => setShowAdd(true)}
            >
              Create your first project
            </button>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Active</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {active.map(p => (
                    <ProjectCard key={p.id} project={p} onClick={() => setSelectedId(p.id)} />
                  ))}
                </div>
              </>
            )}
            {completed.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Completed</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
                  {completed.map(p => (
                    <ProjectCard key={p.id} project={p} onClick={() => setSelectedId(p.id)} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Modal isOpen={!!selectedId} onClose={() => setSelectedId(null)} title="">
        {selectedId && (
          <ProjectDetail projectId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </Modal>

      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="New project">
        <ProjectForm onClose={() => setShowAdd(false)} />
      </Modal>
    </div>
  );
}
