import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Folder } from 'lucide-react';
import { createProjectId, saveProject } from '../features/document/document.storage';
import type { Project } from '../features/document/document.schema';

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: Project) => void;
  parentId?: string; // For creating sub-folders
}

export function CreateProjectDialog({ open, onOpenChange, onProjectCreated, parentId }: CreateProjectDialogProps) {
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('#3b82f6');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const project: Project = {
      id: createProjectId(),
      name: name.trim(),
      parentId,
      color,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveProject(project);
    onProjectCreated(project);
    setName('');
    setColor('#3b82f6');
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
              <Folder className="w-5 h-5" />
              {parentId ? 'Nouveau sous-dossier' : 'Nouveau projet'}
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du projet
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                placeholder="Mon projet"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Couleur
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-12 h-10 border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-600">{color}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Créer
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
