import * as React from 'react';
import { Folder, ChevronRight, ChevronDown, Plus, Trash2, FileText } from 'lucide-react';
import type { Project, Document } from '../features/document/document.schema';
import { getProjectChildren } from '../features/document/document.storage';

interface ProjectTreeViewProps {
  projects: Project[];
  documents: Document[];
  onCreateSubfolder: (parentId: string) => void;
  onCreateDocument: (projectId: string) => void;
  onDeleteProject: (id: string) => void;
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
}

interface TreeNodeProps {
  project: Project;
  projects: Project[];
  documents: Document[];
  level: number;
  onCreateSubfolder: (parentId: string) => void;
  onCreateDocument: (projectId: string) => void;
  onDeleteProject: (id: string) => void;
  selectedProjectId?: string;
  onProjectSelect?: (projectId: string) => void;
}

function TreeNode({
  project,
  projects,
  documents,
  level,
  onCreateSubfolder,
  onCreateDocument,
  onDeleteProject,
  selectedProjectId,
  onProjectSelect,
}: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = React.useState(true);
  const children = getProjectChildren(project.id);
  const documentCount = documents.filter((d) => d.projectId === project.id).length;
  const hasChildren = children.length > 0;

  const isSelected = selectedProjectId === project.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors group ${
          isSelected ? 'bg-blue-50' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Folder icon */}
        <button
          onClick={() => onProjectSelect?.(project.id)}
          className="flex items-center gap-2 flex-1 min-w-0"
        >
          <Folder
            className="w-4 h-4 flex-shrink-0"
            style={{ color: project.color || '#9ca3af' }}
          />
          <span className="text-sm truncate">{project.name}</span>
          {documentCount > 0 && (
            <span className="text-xs text-gray-400 flex-shrink-0">({documentCount})</span>
          )}
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateDocument(project.id);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Créer un document"
          >
            <FileText className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubfolder(project.id);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Render children */}
      {isExpanded && hasChildren && (
        <div>
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
              selectedProjectId={selectedProjectId}
              onProjectSelect={onProjectSelect}
            />
          ))}
        </div>
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
  selectedProjectId,
  onProjectSelect,
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
          selectedProjectId={selectedProjectId}
          onProjectSelect={onProjectSelect}
        />
      ))}
    </div>
  );
}
