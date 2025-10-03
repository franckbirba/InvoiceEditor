import * as React from 'react';
import { Folder, ChevronRight, ChevronDown, Plus, Trash2, FileText, Move, Copy } from 'lucide-react';
import type { Project, Document } from '../features/document/document.schema';
import { getProjectChildren } from '../features/document/document.storage';
import { ContextMenu } from './ContextMenu';
import { Tooltip } from './Tooltip';

interface ProjectTreeViewProps {
  projects: Project[];
  documents: Document[];
  onCreateSubfolder: (parentId: string) => void;
  onCreateDocument: (projectId: string) => void;
  onDeleteProject: (id: string) => void;
  onDeleteDocument?: (id: string) => void;
  onMoveProject?: (projectId: string, newParentId: string | undefined) => void;
  onMoveDocument?: (documentId: string, projectId: string | undefined) => void;
  onDuplicateProject?: (projectId: string) => void;
  onDuplicateDocument?: (documentId: string) => void;
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
  onDocumentSelect?: (documentId: string) => void;
  selectedDocumentId?: string;
}

interface TreeNodeProps {
  project: Project;
  projects: Project[];
  documents: Document[];
  level: number;
  onCreateSubfolder: (parentId: string) => void;
  onCreateDocument: (projectId: string) => void;
  onDeleteProject: (id: string) => void;
  onDeleteDocument?: (id: string) => void;
  onMoveProject?: (projectId: string, newParentId: string | undefined) => void;
  onMoveDocument?: (documentId: string, projectId: string | undefined) => void;
  onDuplicateProject?: (projectId: string) => void;
  onDuplicateDocument?: (documentId: string) => void;
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
  onDocumentSelect?: (documentId: string) => void;
  selectedDocumentId?: string;
}

function TreeNode({
  project,
  projects,
  documents,
  level,
  onCreateSubfolder,
  onCreateDocument,
  onDeleteProject,
  onDeleteDocument,
  onMoveProject,
  onMoveDocument,
  onDuplicateProject,
  onDuplicateDocument,
  selectedProjectId,
  onProjectSelect,
  onDocumentSelect,
  selectedDocumentId,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const [contextMenu, setContextMenu] = React.useState<{
    type: 'project' | 'document';
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const children = getProjectChildren(project.id);
  const projectDocuments = documents.filter((d) => d.projectId === project.id);
  const hasChildren = children.length > 0 || projectDocuments.length > 0;

  const isSelected = selectedProjectId === project.id;

  const handleProjectContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type: 'project',
      id: project.id,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleDocumentContextMenu = (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      type: 'document',
      id: docId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 transition-colors group ${
          isSelected ? 'bg-gray-800' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onContextMenu={handleProjectContextMenu}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-700 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Folder icon */}
        <Tooltip text={project.name}>
          <button
            onClick={() => onProjectSelect?.(project.id)}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <Folder
              className="w-4 h-4 flex-shrink-0"
              style={{ color: project.color || '#9ca3af' }}
            />
            <span className="text-sm truncate">{project.name}</span>
            {projectDocuments.length > 0 && (
              <span className="text-xs text-gray-400 flex-shrink-0">({projectDocuments.length})</span>
            )}
          </button>
        </Tooltip>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateDocument(project.id);
            }}
            className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
            title="Créer un document"
          >
            <FileText className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubfolder(project.id);
            }}
            className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
            title="Créer un sous-dossier"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Supprimer "${project.name}" et tous ses sous-dossiers ?`)) {
                onDeleteProject(project.id);
              }
            }}
            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Render children */}
      {isExpanded && hasChildren && (
        <div>
          {/* Render documents */}
          {projectDocuments.map((doc) => (
            <Tooltip key={doc.id} text={doc.name}>
              <div
                className={`flex items-center gap-2 px-3 py-1.5 hover:bg-gray-800 transition-colors cursor-pointer ${
                  selectedDocumentId === doc.id ? 'bg-gray-800' : ''
                }`}
                style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}
                onClick={() => onDocumentSelect?.(doc.id)}
                onContextMenu={(e) => handleDocumentContextMenu(e, doc.id)}
              >
                <div className="w-4" />
                <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span className="text-sm truncate">{doc.name}</span>
              </div>
            </Tooltip>
          ))}
          {/* Render subprojects */}
          {children.map((child) => (
            <TreeNode
              key={child.id}
              project={child}
              projects={projects}
              documents={documents}
              level={level + 1}
              onCreateSubfolder={onCreateSubfolder}
              onCreateDocument={onCreateDocument}
              onDeleteProject={onDeleteProject}
              onDeleteDocument={onDeleteDocument}
              onMoveProject={onMoveProject}
              onMoveDocument={onMoveDocument}
              onDuplicateProject={onDuplicateProject}
              onDuplicateDocument={onDuplicateDocument}
              selectedProjectId={selectedProjectId}
              onProjectSelect={onProjectSelect}
              onDocumentSelect={onDocumentSelect}
              selectedDocumentId={selectedDocumentId}
            />
          ))}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={
            contextMenu.type === 'project'
              ? [
                  {
                    label: 'Déplacer',
                    icon: <Move className="w-4 h-4" />,
                    onClick: () => onMoveProject?.(contextMenu.id, undefined),
                  },
                  {
                    label: 'Dupliquer',
                    icon: <Copy className="w-4 h-4" />,
                    onClick: () => onDuplicateProject?.(contextMenu.id),
                  },
                  { separator: true, label: '', onClick: () => {} },
                  {
                    label: 'Supprimer',
                    icon: <Trash2 className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                      if (confirm(`Supprimer "${project.name}" et tous ses sous-dossiers ?`)) {
                        onDeleteProject(contextMenu.id);
                      }
                    },
                  },
                ]
              : [
                  {
                    label: 'Déplacer',
                    icon: <Move className="w-4 h-4" />,
                    onClick: () => onMoveDocument?.(contextMenu.id, undefined),
                  },
                  {
                    label: 'Dupliquer',
                    icon: <Copy className="w-4 h-4" />,
                    onClick: () => onDuplicateDocument?.(contextMenu.id),
                  },
                  { separator: true, label: '', onClick: () => {} },
                  {
                    label: 'Supprimer',
                    icon: <Trash2 className="w-4 h-4" />,
                    variant: 'danger' as const,
                    onClick: () => {
                      const doc = documents.find((d) => d.id === contextMenu.id);
                      if (doc && confirm(`Supprimer "${doc.name}" ?`)) {
                        onDeleteDocument?.(contextMenu.id);
                      }
                    },
                  },
                ]
          }
        />
      )}
    </div>
  );
}

export function ProjectTreeView({
  projects,
  documents,
  onCreateSubfolder,
  onCreateDocument,
  onDeleteProject,
  onDeleteDocument,
  onMoveProject,
  onMoveDocument,
  onDuplicateProject,
  onDuplicateDocument,
  selectedProjectId,
  onProjectSelect,
  onDocumentSelect,
  selectedDocumentId,
}: ProjectTreeViewProps) {
  const rootProjects = projects.filter((p) => !p.parentId);

  if (rootProjects.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Aucun projet créé</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {rootProjects.map((project) => (
        <TreeNode
          key={project.id}
          project={project}
          projects={projects}
          documents={documents}
          level={0}
          onCreateSubfolder={onCreateSubfolder}
          onCreateDocument={onCreateDocument}
          onDeleteProject={onDeleteProject}
          onDeleteDocument={onDeleteDocument}
          onMoveProject={onMoveProject}
          onMoveDocument={onMoveDocument}
          onDuplicateProject={onDuplicateProject}
          onDuplicateDocument={onDuplicateDocument}
          selectedProjectId={selectedProjectId}
          onProjectSelect={onProjectSelect}
          onDocumentSelect={onDocumentSelect}
          selectedDocumentId={selectedDocumentId}
        />
      ))}
    </div>
  );
}
