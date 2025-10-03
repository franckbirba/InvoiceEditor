import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { X, FileText, Folder, Tag, Plus, Trash2, User, Edit } from 'lucide-react';
import {
  getDocumentTypes,
  getDocuments,
  getProjects,
  getTags,
  getActiveDocumentId,
  deleteDocument,
  deleteProject,
  deleteTag,
  setActiveDocumentId,
} from '../features/document/document.storage';
import type { Document, DocumentType, Project, Tag as TagType } from '../features/document/document.schema';
import { CreateProjectDialog } from './CreateProjectDialog';
import { CreateTagDialog } from './CreateTagDialog';
import { EditDocumentMetadataDialog } from './EditDocumentMetadataDialog';
import { ProjectTreeView } from './ProjectTreeView';
import { getProjectPath } from '../features/document/document.storage';

interface DocumentsNavigationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentSelect: (doc: Document) => void;
  onNewDocument: (typeId: string, projectId?: string) => void;
}

export function DocumentsNavigationDialog({
  open,
  onOpenChange,
  onDocumentSelect,
  onNewDocument,
}: DocumentsNavigationDialogProps) {
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [documentTypes, setDocumentTypes] = React.useState<DocumentType[]>([]);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [tags, setTags] = React.useState<TagType[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const [selectedProject, setSelectedProject] = React.useState<string | null>(null);
  const [selectedTag, setSelectedTag] = React.useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = React.useState(false);
  const [showCreateTag, setShowCreateTag] = React.useState(false);
  const [editingDocument, setEditingDocument] = React.useState<Document | null>(null);
  const [createProjectParentId, setCreateProjectParentId] = React.useState<string | undefined>();
  const [selectedProjectForDocs, setSelectedProjectForDocs] = React.useState<string | undefined>();

  React.useEffect(() => {
    if (open) {
      const types = getDocumentTypes();
      setDocumentTypes(types);
      setDocuments(getDocuments());
      setProjects(getProjects());
      setTags(getTags());
      setActiveId(getActiveDocumentId());
    }
  }, [open]);

  const handleLoadDocument = (doc: Document) => {
    setActiveDocumentId(doc.id);
    onDocumentSelect(doc);
    onOpenChange(false);
  };

  const handleDeleteDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer ce document ?')) {
      deleteDocument(id);
      setDocuments(getDocuments());
      setActiveId(getActiveDocumentId());
    }
  };

  const handleCreateDocument = (typeId: string, projectId?: string) => {
    onNewDocument(typeId, projectId);
    onOpenChange(false);
  };

  const refreshData = () => {
    setDocuments(getDocuments());
    setProjects(getProjects());
    setTags(getTags());
  };

  const handleEditDocument = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDocument(doc);
  };

  const handleCreateSubfolder = (parentId: string) => {
    setCreateProjectParentId(parentId);
    setShowCreateProject(true);
  };

  const handleCreateDocumentInProject = (projectId: string) => {
    const typeId = prompt('Type de document (facture/cv):');
    if (typeId === 'facture' || typeId === 'cv') {
      handleCreateDocument(typeId, projectId);
    }
  };

  const getProjectBreadcrumb = (projectId?: string) => {
    if (!projectId) return null;
    const path = getProjectPath(projectId);
    return path.map((p) => p.name).join(' > ');
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTypeIcon = (typeId: string) => {
    if (typeId === 'facture') return FileText;
    if (typeId === 'cv') return User;
    return FileText;
  };

  const filteredDocuments = documents.filter((doc) => {
    if (selectedType && doc.typeId !== selectedType) return false;
    if (selectedProject && doc.projectId !== selectedProject) return false;
    if (selectedProjectForDocs && doc.projectId !== selectedProjectForDocs) return false;
    if (selectedTag && !doc.tags?.includes(selectedTag)) return false;
    return true;
  });

  const documentsByType = React.useMemo(() => {
    const grouped: Record<string, Document[]> = {};
    documentTypes.forEach((type) => {
      grouped[type.id] = filteredDocuments.filter((doc) => doc.typeId === type.id);
    });
    return grouped;
  }, [filteredDocuments, documentTypes]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[85vh] bg-white shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold">Mes documents</Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <Tabs.Root defaultValue="documents" className="flex-1 flex flex-col overflow-hidden">
            <Tabs.List className="flex border-b border-gray-200 px-4">
              <Tabs.Trigger
                value="documents"
                className="px-4 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
              >
                Documents
              </Tabs.Trigger>
              <Tabs.Trigger
                value="projects"
                className="px-4 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
              >
                Projets
              </Tabs.Trigger>
              <Tabs.Trigger
                value="tags"
                className="px-4 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 transition-colors"
              >
                Tags
              </Tabs.Trigger>
            </Tabs.List>

            {/* Documents Tab */}
            <Tabs.Content value="documents" className="flex-1 flex overflow-hidden">
              {/* Sidebar filters */}
              <div className="w-64 border-r border-gray-200 p-4 overflow-y-auto">
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Types</h3>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedType(null)}
                      className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                        !selectedType ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                      }`}
                    >
                      Tous les types
                    </button>
                    {documentTypes.map((type) => {
                      const Icon = getTypeIcon(type.id);
                      const count = documents.filter((d) => d.typeId === type.id).length;
                      return (
                        <button
                          key={type.id}
                          onClick={() => setSelectedType(type.id)}
                          className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                            selectedType === type.id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="flex-1">{type.name}</span>
                          <span className="text-xs text-gray-500">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {projects.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Projets</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedProject(null)}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                          !selectedProject ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                        }`}
                      >
                        Tous les projets
                      </button>
                      {projects.map((project) => {
                        const count = documents.filter((d) => d.projectId === project.id).length;
                        return (
                          <button
                            key={project.id}
                            onClick={() => setSelectedProject(project.id)}
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                              selectedProject === project.id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                            }`}
                          >
                            <Folder className="w-4 h-4" />
                            <span className="flex-1">{project.name}</span>
                            <span className="text-xs text-gray-500">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {tags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Tags</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => setSelectedTag(null)}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                          !selectedTag ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                        }`}
                      >
                        Tous les tags
                      </button>
                      {tags.map((tag) => {
                        const count = documents.filter((d) => d.tags?.includes(tag.id)).length;
                        return (
                          <button
                            key={tag.id}
                            onClick={() => setSelectedTag(tag.id)}
                            className={`w-full text-left px-3 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                              selectedTag === tag.id ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
                            }`}
                          >
                            <Tag className="w-4 h-4" />
                            <span className="flex-1">{tag.name}</span>
                            <span className="text-xs text-gray-500">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Documents list */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedProjectForDocs && (
                  <div className="mb-4 pb-3 border-b border-gray-200">
                    <button
                      onClick={() => setSelectedProjectForDocs(undefined)}
                      className="text-xs text-gray-500 hover:text-gray-700 mb-1"
                    >
                      ← Tous les projets
                    </button>
                    <div className="text-sm font-medium text-gray-700">
                      📁 {getProjectBreadcrumb(selectedProjectForDocs)}
                    </div>
                  </div>
                )}

                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun document trouvé</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {documentTypes.map((type) => {
                      const typeDocs = documentsByType[type.id];
                      if (!typeDocs || typeDocs.length === 0) return null;

                      const Icon = getTypeIcon(type.id);

                      return (
                        <div key={type.id}>
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-semibold text-gray-700">{type.name}</h3>
                            <span className="text-xs text-gray-500">({typeDocs.length})</span>
                            <button
                              onClick={() => handleCreateDocument(type.id)}
                              className="ml-auto p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title={`Nouveau ${type.name}`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {typeDocs.map((doc) => (
                              <button
                                key={doc.id}
                                onClick={() => handleLoadDocument(doc)}
                                className={`flex items-center gap-3 p-3 border transition-colors text-left ${
                                  doc.id === activeId
                                    ? 'border-blue-400 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm truncate">{doc.name}</span>
                                    {doc.id === activeId && (
                                      <span className="text-xs px-1.5 py-0.5 bg-blue-600 text-white rounded">
                                        Actif
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">{formatDate(doc.updatedAt)}</div>
                                </div>
                                <button
                                  onClick={(e) => handleDeleteDocument(doc.id, e)}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                                  aria-label="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={(e) => handleEditDocument(doc, e)}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                                  aria-label="Modifier"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Tabs.Content>

            {/* Projects Tab */}
            <Tabs.Content value="projects" className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <button
                  onClick={() => {
                    setCreateProjectParentId(undefined);
                    setShowCreateProject(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau projet racine
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <ProjectTreeView
                  projects={projects}
                  documents={documents}
                  onCreateSubfolder={handleCreateSubfolder}
                  onCreateDocument={handleCreateDocumentInProject}
                  onDeleteProject={(id) => {
                    deleteProject(id);
                    refreshData();
                  }}
                  selectedProjectId={selectedProjectForDocs}
                  onProjectSelect={(id) => {
                    setSelectedProjectForDocs(id);
                    // Switch to documents tab to show documents in this project
                    const tabsList = document.querySelector('[role="tablist"]');
                    const documentsTab = tabsList?.querySelector('[value="documents"]') as HTMLElement;
                    documentsTab?.click();
                  }}
                />
              </div>
            </Tabs.Content>

            {/* Tags Tab */}
            <Tabs.Content value="tags" className="flex-1 p-4 overflow-y-auto">
              <div className="mb-4">
                <button
                  onClick={() => setShowCreateTag(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nouveau tag
                </button>
              </div>
              {tags.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun tag créé</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const count = documents.filter((d) => d.tags?.includes(tag.id)).length;
                    return (
                      <div
                        key={tag.id}
                        className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-full text-sm"
                      >
                        <Tag className="w-3.5 h-3.5" />
                        <span>{tag.name}</span>
                        <span className="text-xs text-gray-500">({count})</span>
                        <button
                          onClick={() => {
                            if (confirm(`Supprimer le tag "${tag.name}" ?`)) {
                              deleteTag(tag.id);
                              setTags(getTags());
                              setDocuments(getDocuments());
                            }
                          }}
                          className="p-0.5 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Tabs.Content>
          </Tabs.Root>
        </Dialog.Content>
      </Dialog.Portal>

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

      <CreateTagDialog
        open={showCreateTag}
        onOpenChange={setShowCreateTag}
        onTagCreated={() => refreshData()}
      />

      {editingDocument && (
        <EditDocumentMetadataDialog
          open={!!editingDocument}
          onOpenChange={(open) => !open && setEditingDocument(null)}
          document={editingDocument}
          onDocumentUpdated={() => {
            refreshData();
            setEditingDocument(null);
          }}
        />
      )}
    </Dialog.Root>
  );
}
