import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileText, Folder, Tag as TagIcon } from 'lucide-react';
import {
  getProjects,
  getTags,
  saveDocument,
} from '../features/document/document.storage';
import type { Document, Project, Tag } from '../features/document/document.schema';

interface EditDocumentMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
  onDocumentUpdated: () => void;
}

export function EditDocumentMetadataDialog({
  open,
  onOpenChange,
  document,
  onDocumentUpdated,
}: EditDocumentMetadataDialogProps) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [tags, setTags] = React.useState<Tag[]>([]);
  const [selectedProject, setSelectedProject] = React.useState<string | undefined>(document.projectId);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(document.tags || []);

  React.useEffect(() => {
    if (open) {
      setProjects(getProjects());
      setTags(getTags());
      setSelectedProject(document.projectId);
      setSelectedTags(document.tags || []);
    }
  }, [open, document]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedDoc: Document = {
      ...document,
      projectId: selectedProject,
      tags: selectedTags,
      updatedAt: Date.now(),
    };

    saveDocument(updatedDoc);
    onDocumentUpdated();
    onOpenChange(false);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white shadow-xl">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Modifier le document
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du document
              </label>
              <input
                type="text"
                value={document.name}
                disabled
                className="w-full px-3 py-2 border border-gray-300 bg-gray-50 text-sm text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Projet
              </label>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="">Aucun projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                Tags
              </label>
              {tags.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun tag disponible</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        selectedTags.includes(tag.id)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={
                        selectedTags.includes(tag.id) && tag.color
                          ? {
                              borderColor: tag.color,
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }
                          : undefined
                      }
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
