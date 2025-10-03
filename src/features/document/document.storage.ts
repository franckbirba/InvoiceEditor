import type { DocumentType, Template, Theme, Document, Project, Tag } from './document.schema';

const STORAGE_PREFIX = 'document-studio-';
const KEYS = {
  DOCUMENT_TYPES: `${STORAGE_PREFIX}types`,
  TEMPLATES: `${STORAGE_PREFIX}templates`,
  THEMES: `${STORAGE_PREFIX}themes`,
  DOCUMENTS_LIST: `${STORAGE_PREFIX}documents`,
  PROJECTS: `${STORAGE_PREFIX}projects`,
  TAGS: `${STORAGE_PREFIX}tags`,
  ACTIVE_DOCUMENT: `${STORAGE_PREFIX}active-doc`,
};

// Helper to save/load JSON from localStorage
function saveJson<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
  }
}

function loadJson<T>(key: string): T | null {
  try {
    const str = localStorage.getItem(key);
    return str ? JSON.parse(str) : null;
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return null;
  }
}

// ============================================================================
// DocumentType Storage
// ============================================================================

export function getDocumentTypes(): DocumentType[] {
  return loadJson<DocumentType[]>(KEYS.DOCUMENT_TYPES) || [];
}

export function saveDocumentTypes(types: DocumentType[]): void {
  saveJson(KEYS.DOCUMENT_TYPES, types);
}

export function getDocumentType(id: string): DocumentType | null {
  const types = getDocumentTypes();
  return types.find((t) => t.id === id) || null;
}

export function saveDocumentType(type: DocumentType): void {
  const types = getDocumentTypes();
  const index = types.findIndex((t) => t.id === type.id);

  if (index >= 0) {
    types[index] = { ...type, updatedAt: Date.now() };
  } else {
    types.push(type);
  }

  saveDocumentTypes(types);
}

export function deleteDocumentType(id: string): void {
  const types = getDocumentTypes();
  const filtered = types.filter((t) => t.id !== id);
  saveDocumentTypes(filtered);
}

// ============================================================================
// Template Storage
// ============================================================================

export function getTemplates(): Template[] {
  return loadJson<Template[]>(KEYS.TEMPLATES) || [];
}

export function saveTemplates(templates: Template[]): void {
  saveJson(KEYS.TEMPLATES, templates);
}

export function getTemplate(id: string): Template | null {
  const templates = getTemplates();
  return templates.find((t) => t.id === id) || null;
}

export function getTemplatesByType(typeId: string): Template[] {
  const templates = getTemplates();
  return templates.filter((t) => t.typeId === typeId);
}

export function saveTemplate(template: Template): void {
  const templates = getTemplates();
  const index = templates.findIndex((t) => t.id === template.id);

  if (index >= 0) {
    templates[index] = { ...template, updatedAt: Date.now() };
  } else {
    templates.push(template);
  }

  saveTemplates(templates);
}

export function deleteTemplate(id: string): void {
  const templates = getTemplates();
  const filtered = templates.filter((t) => t.id !== id);
  saveTemplates(filtered);
}

// ============================================================================
// Theme Storage
// ============================================================================

export function getThemes(): Theme[] {
  return loadJson<Theme[]>(KEYS.THEMES) || [];
}

export function saveThemes(themes: Theme[]): void {
  saveJson(KEYS.THEMES, themes);
}

export function getTheme(id: string): Theme | null {
  const themes = getThemes();
  return themes.find((t) => t.id === id) || null;
}

export function saveTheme(theme: Theme): void {
  const themes = getThemes();
  const index = themes.findIndex((t) => t.id === theme.id);

  if (index >= 0) {
    themes[index] = { ...theme, updatedAt: Date.now() };
  } else {
    themes.push(theme);
  }

  saveThemes(themes);
}

export function deleteTheme(id: string): void {
  const themes = getThemes();
  const filtered = themes.filter((t) => t.id !== id);
  saveThemes(filtered);
}

// ============================================================================
// Document Storage
// ============================================================================

export function getDocuments(): Document[] {
  return loadJson<Document[]>(KEYS.DOCUMENTS_LIST) || [];
}

export function saveDocuments(documents: Document[]): void {
  saveJson(KEYS.DOCUMENTS_LIST, documents);
}

export function getDocument(id: string): Document | null {
  const documents = getDocuments();
  return documents.find((d) => d.id === id) || null;
}

export function getDocumentsByType(typeId: string): Document[] {
  const documents = getDocuments();
  return documents.filter((d) => d.typeId === typeId);
}

export function saveDocument(document: Document): void {
  const documents = getDocuments();
  const index = documents.findIndex((d) => d.id === document.id);

  const updatedDoc = { ...document, updatedAt: Date.now() };

  if (index >= 0) {
    documents[index] = updatedDoc;
  } else {
    documents.push(updatedDoc);
  }

  saveDocuments(documents);
  setActiveDocumentId(document.id);
}

export function deleteDocument(id: string): void {
  const documents = getDocuments();
  const filtered = documents.filter((d) => d.id !== id);
  saveDocuments(filtered);

  if (getActiveDocumentId() === id) {
    const newActive = filtered[0]?.id || null;
    if (newActive) {
      setActiveDocumentId(newActive);
    } else {
      clearActiveDocumentId();
    }
  }
}

export function getActiveDocumentId(): string | null {
  return localStorage.getItem(KEYS.ACTIVE_DOCUMENT);
}

export function setActiveDocumentId(id: string): void {
  localStorage.setItem(KEYS.ACTIVE_DOCUMENT, id);
}

export function clearActiveDocumentId(): void {
  localStorage.removeItem(KEYS.ACTIVE_DOCUMENT);
}

export function createDocumentId(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Project Storage
// ============================================================================

export function getProjects(): Project[] {
  return loadJson<Project[]>(KEYS.PROJECTS) || [];
}

export function saveProjects(projects: Project[]): void {
  saveJson(KEYS.PROJECTS, projects);
}

export function getProject(id: string): Project | null {
  const projects = getProjects();
  return projects.find((p) => p.id === id) || null;
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const index = projects.findIndex((p) => p.id === project.id);

  const updatedProject = { ...project, updatedAt: Date.now() };

  if (index >= 0) {
    projects[index] = updatedProject;
  } else {
    projects.push(updatedProject);
  }

  saveProjects(projects);
}

export function deleteProject(id: string): void {
  const projects = getProjects();

  // Find all child projects recursively
  const findChildren = (parentId: string): string[] => {
    const children = projects.filter((p) => p.parentId === parentId);
    const childIds = children.map((c) => c.id);
    const grandChildren = children.flatMap((c) => findChildren(c.id));
    return [...childIds, ...grandChildren];
  };

  const childProjectIds = findChildren(id);
  const allProjectIds = [id, ...childProjectIds];

  // Remove all projects (parent and children)
  const filtered = projects.filter((p) => !allProjectIds.includes(p.id));
  saveProjects(filtered);

  // Remove projectId from all documents in these projects
  const documents = getDocuments();
  documents.forEach((doc) => {
    if (doc.projectId && allProjectIds.includes(doc.projectId)) {
      saveDocument({ ...doc, projectId: undefined });
    }
  });
}

export function getProjectChildren(parentId: string): Project[] {
  const projects = getProjects();
  return projects.filter((p) => p.parentId === parentId);
}

export function getProjectPath(projectId: string): Project[] {
  const projects = getProjects();
  const path: Project[] = [];

  let currentId: string | undefined = projectId;
  while (currentId) {
    const project = projects.find((p) => p.id === currentId);
    if (!project) break;
    path.unshift(project);
    currentId = project.parentId;
  }

  return path;
}

export function getRootProjects(): Project[] {
  const projects = getProjects();
  return projects.filter((p) => !p.parentId);
}

export function createProjectId(): string {
  return `proj-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Tag Storage
// ============================================================================

export function getTags(): Tag[] {
  return loadJson<Tag[]>(KEYS.TAGS) || [];
}

export function saveTags(tags: Tag[]): void {
  saveJson(KEYS.TAGS, tags);
}

export function getTag(id: string): Tag | null {
  const tags = getTags();
  return tags.find((t) => t.id === id) || null;
}

export function saveTag(tag: Tag): void {
  const tags = getTags();
  const index = tags.findIndex((t) => t.id === tag.id);

  if (index >= 0) {
    tags[index] = tag;
  } else {
    tags.push(tag);
  }

  saveTags(tags);
}

export function deleteTag(id: string): void {
  const tags = getTags();
  const filtered = tags.filter((t) => t.id !== id);
  saveTags(filtered);

  // Remove tag from all documents
  const documents = getDocuments();
  documents.forEach((doc) => {
    if (doc.tags?.includes(id)) {
      saveDocument({
        ...doc,
        tags: doc.tags.filter((tagId) => tagId !== id),
      });
    }
  });
}

export function createTagId(): string {
  return `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
