import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Tag } from 'lucide-react';
import { createTagId, saveTag } from '../features/document/document.storage';
import type { Tag as TagType } from '../features/document/document.schema';

interface CreateTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTagCreated: (tag: TagType) => void;
}

export function CreateTagDialog({ open, onOpenChange, onTagCreated }: CreateTagDialogProps) {
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState('#6b7280');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const tag: TagType = {
      id: createTagId(),
      name: name.trim(),
      color,
    };

    saveTag(tag);
    onTagCreated(tag);
    setName('');
    setColor('#6b7280');
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Nouveau tag
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du tag
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                placeholder="urgent, client, etc."
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
