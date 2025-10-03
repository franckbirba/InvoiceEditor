import * as React from 'react';
import { FileText, User, ChevronLeft, FolderPlus, FilePlus, Move, Copy, Trash2, Palette, FileCode, Edit, Database, Plus } from 'lucide-react';
import { ProjectTreeView } from './ProjectTreeView';
import { CreateProjectDialog } from './CreateProjectDialog';
import { CreateDocumentDialog } from './CreateDocumentDialog';
import { MoveItemDialog } from './MoveItemDialog';
import { ContextMenu } from './ContextMenu';
import { Tooltip } from './Tooltip';
import { ResizablePanel } from './ResizablePanel';
import {
  getProjects,
  getDocuments,
  deleteProject,
  deleteDocument,
  getDocumentTypes,
  createDocumentId,
  saveDocument as saveNewDocument,
  setActiveDocumentId,
  moveProject,
  moveDocument,
  duplicateProject,
  duplicateDocument,
  getDocument,
  getProject,
  getTemplates,
  getThemes,
} from '../features/document/document.storage';
import type { Document, Project, Template, Theme } from '../features/document/document.schema';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { loadDocumentTypes, deleteDocumentType, duplicateDocumentType, renameDocumentType, saveDocumentType, type StoredDocumentType } from '../features/document/document-type-storage';

interface ProjectSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onEditTemplate: (id: string) => void;
  onEditTheme: (id: string) => void;
  onEditDocumentType?: (id: string) => void;
}

type SidebarTab = 'explorer' | 'templates' | 'themes' | 'types';

export function ProjectSidebar({ isOpen, onToggle, onEditTemplate, onEditTheme, onEditDocumentType }: ProjectSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<SidebarTab>('explorer');
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [themes, setThemes] = React.useState<Theme[]>([]);
  const [documentTypes, setDocumentTypes] = React.useState<StoredDocumentType[]>([]);
  const [showCreateProject, setShowCreateProject] = React.useState(false);
  const [createProjectParentId, setCreateProjectParentId] = React.useState<string | undefined>();
  const [showCreateDocument, setShowCreateDocument] = React.useState(false);
  const [createDocumentProjectId, setCreateDocumentProjectId] = React.useState<string | undefined>();
  const [moveDialog, setMoveDialog] = React.useState<{
    type: 'project' | 'document';
    id: string;
    currentProjectId?: string;
    name: string;
  } | null>(null);
  const [contextMenu, setContextMenu] = React.useState<{
    type: 'document' | 'template' | 'theme' | 'documentType';
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const activeDocumentId = useInvoiceStore((state) => state.activeDocumentId);
  const { renameTemplate, duplicateTemplate, deleteTemplate, renameTheme, duplicateTheme, deleteTheme } = useInvoiceStore();

  React.useEffect(() => {
    refreshData();
  }, []);

  // Refresh data when activeDocumentId changes (new document created)
  React.useEffect(() => {
    refreshData();
  }, [activeDocumentId]);

  const refreshData = () => {
    setProjects(getProjects());
    setDocuments(getDocuments());
    setTemplates(getTemplates());
    setThemes(getThemes());
    setDocumentTypes(loadDocumentTypes());
  };

  const handleCreateSubfolder = (parentId: string) => {
    setCreateProjectParentId(parentId);
    setShowCreateProject(true);
  };

  const handleCreateDocumentInProject = (projectId: string) => {
    setCreateDocumentProjectId(projectId || undefined);
    setShowCreateDocument(true);
  };

  const handleDocumentCreated = (documentId: string) => {
    setActiveDocumentId(documentId);
    useInvoiceStore.getState().loadDocumentById(documentId);
    refreshData();
  };

  const handleDocumentClick = (doc: Document) => {
    useInvoiceStore.getState().loadDocumentById(doc.id);
  };

  const handleMoveProject = (projectId: string) => {
    const project = getProject(projectId);
    if (!project) return;
    setMoveDialog({
      type: 'project',
      id: projectId,
      currentProjectId: project.parentId,
      name: project.name,
    });
  };

  const handleMoveDocument = (documentId: string) => {
    const doc = getDocument(documentId);
    if (!doc) return;
    setMoveDialog({
      type: 'document',
      id: documentId,
      currentProjectId: doc.projectId,
      name: doc.name,
    });
  };

  const handleMove = (newProjectId: string | undefined) => {
    if (!moveDialog) return;

    if (moveDialog.type === 'project') {
      moveProject(moveDialog.id, newProjectId);
    } else {
      moveDocument(moveDialog.id, newProjectId);
    }

    refreshData();
    setMoveDialog(null);
  };

  const handleDuplicateProject = (projectId: string) => {
    duplicateProject(projectId);
    refreshData();
  };

  const handleDuplicateDocument = (documentId: string) => {
    const newDoc = duplicateDocument(documentId);
    if (newDoc) {
      setActiveDocumentId(newDoc.id);
      useInvoiceStore.getState().loadDocumentById(newDoc.id);
    }
    refreshData();
  };

  const handleDeleteDocument = (documentId: string) => {
    deleteDocument(documentId);
    refreshData();
  };

  const getDocumentIcon = (typeId: string) => {
    if (typeId === 'cv') return User;
    return FileText;
  };

  const handleRenameTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    
    const newName = prompt('Nouveau nom du template:', template.name);
    if (newName && newName.trim() && newName !== template.name) {
      renameTemplate(templateId, newName.trim());
      refreshData();
    }
  };

  const handleDuplicateTemplate = (templateId: string) => {
    duplicateTemplate(templateId);
    refreshData();
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    
    if (template.isDefault) {
      alert('Impossible de supprimer un template par défaut');
      return;
    }
    
    if (confirm(`Supprimer le template "${template.name}" ?`)) {
      deleteTemplate(templateId);
      refreshData();
    }
  };

  const handleRenameTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (!theme) return;
    
    const newName = prompt('Nouveau nom du thème:', theme.name);
    if (newName && newName.trim() && newName !== theme.name) {
      renameTheme(themeId, newName.trim());
      refreshData();
    }
  };

  const handleDuplicateTheme = (themeId: string) => {
    duplicateTheme(themeId);
    refreshData();
  };

  const handleDeleteTheme = (themeId: string) => {
    const theme = themes.find((t) => t.id === themeId);
    if (!theme) return;

    if (theme.isDefault) {
      alert('Impossible de supprimer un thème par défaut');
      return;
    }

    if (confirm(`Supprimer le thème "${theme.name}" ?`)) {
      deleteTheme(themeId);
      refreshData();
    }
  };

  const handleRenameDocumentType = (typeId: string) => {
    const docType = documentTypes.find((t) => t.id === typeId);
    if (!docType || docType.isBuiltIn) return;

    const newName = prompt('Nouveau nom du type:', docType.name);
    if (newName && newName.trim() && newName !== docType.name) {
      renameDocumentType(typeId, newName.trim());
      refreshData();
    }
  };

  const handleDuplicateDocumentType = (typeId: string) => {
    duplicateDocumentType(typeId);
    refreshData();
  };

  const handleDeleteDocumentType = (typeId: string) => {
    const docType = documentTypes.find((t) => t.id === typeId);
    if (!docType) return;

    if (docType.isBuiltIn) {
      alert('Impossible de supprimer un type intégré');
      return;
    }

    if (confirm(`Supprimer le type "${docType.name}" ?`)) {
      deleteDocumentType(typeId);
      refreshData();
    }
  };

  const handleCreateDocumentType = () => {
    const name = prompt('Nom du nouveau type de document:');
    if (!name || !name.trim()) return;

    const typeId = prompt('ID du type (ex: contract, receipt):');
    if (!typeId || !typeId.trim()) return;

    // Create a minimal document type definition
    const newDocType: StoredDocumentType = {
      id: `custom-${typeId.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      name: name.trim(),
      definition: {
        type: typeId.toLowerCase().replace(/\s+/g, '-'),
        name: name.trim(),
        description: `Type de document ${name.trim()}`,
        sections: [
          {
            id: 'basic',
            title: 'Informations de base',
            fields: [
              {
                path: 'title',
                label: 'Titre',
                type: 'text',
                editable: true,
                required: true,
              },
            ],
          },
        ],
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isBuiltIn: false,
    };

    saveDocumentType(newDocType);
    refreshData();

    // Open the newly created type for editing
    if (onEditDocumentType) {
      onEditDocumentType(newDocType.id);
    }
  };

  // Show collapsed state
  if (!isOpen) {
    return (
      <div className="w-12 bg-gray-900 text-white flex flex-col items-center py-4 no-print">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-gray-800 rounded transition-colors"
          title="Ouvrir l'explorateur"
        >
          <ChevronLeft className="w-5 h-5 rotate-180" />
        </button>
      </div>
    );
  }

  return (
    <>
      <ResizablePanel
        defaultWidth={256}
        minWidth={200}
        maxWidth={600}
        storageKey="document-studio-sidebar-width"
        className="bg-gray-900 text-white flex flex-col no-print"
      >
        {/* Header with tabs */}
        <div className="border-b border-gray-700">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Navigation</span>
            <button
              onClick={onToggle}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
              title="Fermer l'explorateur"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-2 gap-1">
            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t transition-colors ${
                activeTab === 'explorer'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Fichiers</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t transition-colors ${
                activeTab === 'templates'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Templates</span>
            </button>
            <button
              onClick={() => setActiveTab('themes')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t transition-colors ${
                activeTab === 'themes'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Thèmes</span>
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-t transition-colors ${
                activeTab === 'types'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Types</span>
            </button>
          </div>
        </div>

        {/* Toolbar - Explorer only */}
        {activeTab === 'explorer' && (
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
            <button
              onClick={() => {
                setCreateProjectParentId(undefined);
                setShowCreateProject(true);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-800 rounded transition-colors"
              title="Nouveau dossier"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Dossier</span>
            </button>
            <button
              onClick={() => {
                const typeId = prompt('Type de document (facture/cv):');
                if (typeId === 'facture' || typeId === 'cv') {
                  handleCreateDocumentInProject('');
                }
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-800 rounded transition-colors"
              title="Nouveau document"
            >
              <FilePlus className="w-3.5 h-3.5" />
              <span>Fichier</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Explorer Tab */}
          {activeTab === 'explorer' && (
            <>
              <ProjectTreeView
                projects={projects}
                documents={documents}
                onCreateSubfolder={handleCreateSubfolder}
                onCreateDocument={handleCreateDocumentInProject}
                onDeleteProject={(id) => {
                  deleteProject(id);
                  refreshData();
                }}
                onDeleteDocument={handleDeleteDocument}
                onMoveProject={handleMoveProject}
                onMoveDocument={handleMoveDocument}
                onDuplicateProject={handleDuplicateProject}
                onDuplicateDocument={handleDuplicateDocument}
                selectedProjectId={undefined}
                onProjectSelect={() => {}}
                onDocumentSelect={(docId) => {
                  useInvoiceStore.getState().loadDocumentById(docId);
                }}
                selectedDocumentId={activeDocumentId ?? undefined}
              />

              {/* Standalone documents (no project) */}
              <div className="mt-2">
                {documents
                  .filter((doc) => !doc.projectId)
                  .map((doc) => {
                    const Icon = getDocumentIcon(doc.typeId);
                    const isActive = doc.id === activeDocumentId;

                    return (
                      <Tooltip key={doc.id} text={doc.name}>
                        <button
                          onClick={() => handleDocumentClick(doc)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              type: 'document',
                              id: doc.id,
                              x: e.clientX,
                              y: e.clientY,
                            });
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-gray-800 transition-colors ${
                            isActive ? 'bg-gray-800 text-blue-400' : 'text-gray-300'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{doc.name}</span>
                        </button>
                      </Tooltip>
                    );
                  })}
              </div>
            </>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="p-2 space-y-1">
              {templates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileCode className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Aucun template</p>
                </div>
              ) : (
                templates.map((template) => (
                  <Tooltip key={template.id} text={template.name}>
                    <button
                      onClick={() => onEditTemplate(template.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          type: 'template',
                          id: template.id,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-800 rounded transition-colors text-gray-300"
                    >
                      <FileCode className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{template.name}</div>
                        <div className="text-xs text-gray-500 truncate">{template.typeId}</div>
                      </div>
                    </button>
                  </Tooltip>
                ))
              )}
            </div>
          )}

          {/* Themes Tab */}
          {activeTab === 'themes' && (
            <div className="p-2 space-y-1">
              {themes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Aucun thème</p>
                </div>
              ) : (
                themes.map((theme) => (
                  <Tooltip key={theme.id} text={theme.name}>
                    <button
                      onClick={() => onEditTheme(theme.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          type: 'theme',
                          id: theme.id,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-800 rounded transition-colors text-gray-300"
                    >
                      <Palette className="w-4 h-4 text-pink-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{theme.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {theme.isDefault ? 'Par défaut' : 'Personnalisé'}
                        </div>
                      </div>
                    </button>
                  </Tooltip>
                ))
              )}
            </div>
          )}

          {/* Types Tab */}
          {activeTab === 'types' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Add new type button */}
              <div className="p-3 border-b border-gray-700">
                <button
                  onClick={handleCreateDocumentType}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau type
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {documentTypes.length === 0 ? (
                  <div className="text-center text-gray-500 py-8 text-sm">
                    Aucun type de document
                  </div>
                ) : (
                  documentTypes.map((docType) => (
                  <Tooltip key={docType.id} text={docType.name}>
                    <button
                      onClick={() => onEditDocumentType?.(docType.id)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          type: 'documentType',
                          id: docType.id,
                          x: e.clientX,
                          y: e.clientY,
                        });
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-800 rounded transition-colors text-gray-300"
                    >
                      <Database className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{docType.name}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {docType.isBuiltIn ? 'Intégré' : 'Personnalisé'} • {docType.definition.type}
                        </div>
                      </div>
                    </button>
                  </Tooltip>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </ResizablePanel>

      <CreateProjectDialog
        open={showCreateProject}
        onOpenChange={(open) => {
          setShowCreateProject(open);
          if (!open) setCreateProjectParentId(undefined);
        }}
        onProjectCreated={() => {
          refreshData();
          setCreateProjectParentId(undefined);
        }}
        parentId={createProjectParentId}
      />

      {moveDialog && (
        <MoveItemDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setMoveDialog(null);
          }}
          projects={projects}
          currentProjectId={moveDialog.currentProjectId}
          itemName={moveDialog.name}
          onMove={handleMove}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={
            contextMenu.type === 'document'
              ? [
                  {
                    label: 'Déplacer',
                    icon: <Move className="w-4 h-4" />,
                    onClick: () => handleMoveDocument(contextMenu.id),
                  },
                  {
                    label: 'Dupliquer',
                    icon: <Copy className="w-4 h-4" />,
                    onClick: () => handleDuplicateDocument(contextMenu.id),
                  },
                  { separator: true, label: '', onClick: () => {} },
                  {
                    label: 'Supprimer',
                    icon: <Trash2 className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                      const doc = getDocument(contextMenu.id);
                      if (doc && confirm(`Supprimer "${doc.name}" ?`)) {
                        handleDeleteDocument(contextMenu.id);
                      }
                    },
                  },
                ]
              : contextMenu.type === 'template'
              ? [
                  {
                    label: 'Renommer',
                    icon: <Edit className="w-4 h-4" />,
                    onClick: () => handleRenameTemplate(contextMenu.id),
                  },
                  {
                    label: 'Dupliquer',
                    icon: <Copy className="w-4 h-4" />,
                    onClick: () => handleDuplicateTemplate(contextMenu.id),
                  },
                  { separator: true, label: '', onClick: () => {} },
                  {
                    label: 'Supprimer',
                    icon: <Trash2 className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => handleDeleteTemplate(contextMenu.id),
                  },
                ]
              : contextMenu.type === 'theme'
              ? [
                  {
                    label: 'Renommer',
                    icon: <Edit className="w-4 h-4" />,
                    onClick: () => handleRenameTheme(contextMenu.id),
                  },
                  {
                    label: 'Dupliquer',
                    icon: <Copy className="w-4 h-4" />,
                    onClick: () => handleDuplicateTheme(contextMenu.id),
                  },
                  { separator: true, label: '', onClick: () => {} },
                  {
                    label: 'Supprimer',
                    icon: <Trash2 className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => handleDeleteTheme(contextMenu.id),
                  },
                ]
              : [
                  {
                    label: 'Renommer',
                    icon: <Edit className="w-4 h-4" />,
                    onClick: () => handleRenameDocumentType(contextMenu.id),
                  },
                  {
                    label: 'Dupliquer',
                    icon: <Copy className="w-4 h-4" />,
                    onClick: () => handleDuplicateDocumentType(contextMenu.id),
                  },
                  { separator: true, label: '', onClick: () => {} },
                  {
                    label: 'Supprimer',
                    icon: <Trash2 className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => handleDeleteDocumentType(contextMenu.id),
                  },
                ]
          }
        />
      )}

      {/* Create Document Dialog */}
      <CreateDocumentDialog
        open={showCreateDocument}
        onOpenChange={setShowCreateDocument}
        projectId={createDocumentProjectId}
        onDocumentCreated={handleDocumentCreated}
      />
    </>
  );
}
