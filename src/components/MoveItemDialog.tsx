import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Folder } from 'lucide-react';
import type { Project } from '../features/document/document.schema';

interface MoveItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  currentProjectId?: string;
  itemName: string;
  onMove: (projectId: string | undefined) => void;
}

export function MoveItemDialog({
  open,
  onOpenChange,
  projects,
  currentProjectId,
  itemName,
  onMove,
}: MoveItemDialogProps) {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | undefined>(
    currentProjectId
  );

  const handleMove = () => {
    onMove(selectedProjectId);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Déplacer "{itemName}"
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Destination
            </label>

            {/* Option: Root (no project) */}
            <button
              onClick={() => setSelectedProjectId(undefined)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded border transition-colors text-left ${
                selectedProjectId === undefined
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Folder className="w-4 h-4 text-gray-500" />
              <span className="text-sm">(Racine - sans projet)</span>
            </button>

            {/* Project options */}
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded border transition-colors text-left ${
                  selectedProjectId === project.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Folder
                  className="w-4 h-4"
                  style={{ color: project.color || '#6b7280' }}
                />
                <span className="text-sm">{project.name}</span>
              </button>
            ))}
          </div>

          <div className="flex gap-2 justify-end">
            <Dialog.Close className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors">
              Annuler
            </Dialog.Close>
            <button
              onClick={handleMove}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              Déplacer
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
