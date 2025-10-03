import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileText, Folder, Palette, FileCode } from 'lucide-react';
import {
  getProjects,
  getDocumentTypes,
  getTemplates,
  getThemes,
  createDocumentId,
  saveDocument as saveNewDocument,
} from '../features/document/document.storage';
import type { Project, DocumentType, Template, Theme, Document } from '../features/document/document.schema';

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onDocumentCreated: (documentId: string) => void;
}

export function CreateDocumentDialog({
  open,
  onOpenChange,
  projectId,
  onDocumentCreated,
}: CreateDocumentDialogProps) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [documentTypes, setDocumentTypes] = React.useState<DocumentType[]>([]);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [themes, setThemes] = React.useState<Theme[]>([]);

  const [selectedType, setSelectedType] = React.useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>('');
  const [selectedTheme, setSelectedTheme] = React.useState<string>('');
  const [selectedProject, setSelectedProject] = React.useState<string | undefined>(projectId);
  const [documentName, setDocumentName] = React.useState<string>('');

  React.useEffect(() => {
    if (open) {
      setProjects(getProjects());
      const types = getDocumentTypes();
      setDocumentTypes(types);
      setTemplates(getTemplates());
      setThemes(getThemes());
      setSelectedProject(projectId);

      // Pre-select first type if available
      if (types.length > 0 && !selectedType) {
        setSelectedType(types[0].id);
      }
    }
  }, [open, projectId]);

  // Filter templates by selected type
  const filteredTemplates = React.useMemo(() => {
    if (!selectedType) return [];
    return templates.filter(t => t.typeId === selectedType);
  }, [templates, selectedType]);

  // Auto-select first template when type changes
  React.useEffect(() => {
    if (filteredTemplates.length > 0 && !selectedTemplate) {
      setSelectedTemplate(filteredTemplates[0].id);
    } else if (filteredTemplates.length > 0 && !filteredTemplates.find(t => t.id === selectedTemplate)) {
      setSelectedTemplate(filteredTemplates[0].id);
    }
  }, [filteredTemplates, selectedTemplate]);

  // Auto-select first theme if not selected
  React.useEffect(() => {
    if (themes.length > 0 && !selectedTheme) {
      setSelectedTheme(themes[0].id);
    }
  }, [themes, selectedTheme]);

  // Auto-generate document name based on type
  React.useEffect(() => {
    if (selectedType && !documentName) {
      const type = documentTypes.find(t => t.id === selectedType);
      if (type) {
        setDocumentName(`Nouveau ${type.name}`);
      }
    }
  }, [selectedType, documentTypes, documentName]);

  // Initialize default data based on document type
  const getDefaultData = (typeId: string) => {
    if (typeId === 'cv') {
      return {
        header: {
          name: 'Votre Nom',
          title: 'Titre du poste',
          prompt: 'user@cv:~$',
        },
        identity: {
          summary: 'Décrivez brièvement votre profil professionnel et vos objectifs de carrière.',
        },
        contact: {
          email: 'email@example.com',
          phone: '+33 X XX XX XX XX',
          location: 'Ville, Pays',
        },
        experiences: [
          {
            period: '2020 - 2024',
            company: 'Nom de l\'entreprise',
            position: 'Poste occupé',
            description: 'Description du poste et des responsabilités',
            achievements: '• Réalisation 1\n• Réalisation 2\n• Réalisation 3',
          },
        ],
        skills: [
          {
            category: 'Frontend',
            items: 'JavaScript***, React***, TypeScript**, CSS**, HTML**',
          },
          {
            category: 'Backend',
            items: 'Node.js**, Python*, SQL*',
          },
          {
            category: 'Outils',
            items: 'Git**, Docker*, AWS*',
          },
        ],
        education: [
          {
            year: '2020',
            degree: 'Diplôme obtenu',
            institution: 'Nom de l\'établissement',
          },
        ],
        languages: [
          {
            name: 'Français',
            level: 'Natif',
          },
          {
            name: 'Anglais',
            level: 'Courant',
          },
        ],
        footer: {
          website: 'https://votre-site.com',
          github: 'https://github.com/votre-profil',
        },
      };
    } else if (typeId === 'facture') {
      // For invoice type, return minimal valid structure
      return {
        version: '1.0.0',
        locale: 'fr',
        theme: 'cv',
        sender: {
          name: '',
          address: '',
          email: '',
          phone: '',
          bank: {
            iban: '',
            bic: '',
          },
          logo: '',
          notes: '',
        },
        client: {
          name: '',
          address: '',
          reg: '',
        },
        invoice: {
          number: '',
          date: new Date().toISOString().split('T')[0],
          subject: '',
          payment_terms: '',
          currency: 'EUR',
        },
        items: [],
        summary: {
          global_discount: {
            type: 'percentage',
            value: 0,
          },
          taxes: [],
        },
        footer: {
          legal: '',
          signature: '',
        },
      };
    }
    // For other types, return empty object
    return {};
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedType || !selectedTemplate || !selectedTheme) {
      alert('Veuillez sélectionner un type, un template et un thème');
      return;
    }

    const docId = createDocumentId();
    const newDoc: Document = {
      id: docId,
      typeId: selectedType,
      name: documentName || 'Nouveau document',
      data: getDefaultData(selectedType),
      templateId: selectedTemplate,
      themeId: selectedTheme,
      projectId: selectedProject,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    saveNewDocument(newDoc);
    onDocumentCreated(docId);
    onOpenChange(false);

    // Reset form
    setDocumentName('');
    setSelectedType('');
    setSelectedTemplate('');
    setSelectedTheme('');
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-50">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Créer un document
            </Dialog.Title>
            <Dialog.Close className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Document Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du document
              </label>
              <input
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mon document"
                required
              />
            </div>

            {/* Document Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="w-4 h-4 inline mr-1" />
                Type de document *
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un type...</option>
                {documentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Template */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileCode className="w-4 h-4 inline mr-1" />
                Template *
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!selectedType}
              >
                <option value="">Sélectionner un template...</option>
                {filteredTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {!selectedType && (
                <p className="text-xs text-gray-500 mt-1">
                  Sélectionnez d'abord un type de document
                </p>
              )}
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Palette className="w-4 h-4 inline mr-1" />
                Thème *
              </label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Sélectionner un thème...</option>
                {themes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Project (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Folder className="w-4 h-4 inline mr-1" />
                Projet (facultatif)
              </label>
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Aucun projet</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Annuler
                </button>
              </Dialog.Close>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
