import type { DocumentTypeDefinition } from './document-schema';

const STORAGE_KEY = 'document-studio-document-types';

export interface StoredDocumentType {
  id: string;
  name: string;
  definition: DocumentTypeDefinition;
  createdAt: number;
  updatedAt: number;
  isBuiltIn?: boolean;
}

export function loadDocumentTypes(): StoredDocumentType[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load document types:', error);
    return [];
  }
}

export function saveDocumentType(documentType: StoredDocumentType): void {
  const types = loadDocumentTypes();
  const index = types.findIndex((t) => t.id === documentType.id);

  if (index >= 0) {
    types[index] = { ...documentType, updatedAt: Date.now() };
  } else {
    types.push({ ...documentType, createdAt: Date.now(), updatedAt: Date.now() });
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
}

export function deleteDocumentType(id: string): void {
  const types = loadDocumentTypes();
  const filtered = types.filter((t) => t.id !== id && !t.isBuiltIn);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function getDocumentType(id: string): StoredDocumentType | null {
  const types = loadDocumentTypes();
  return types.find((t) => t.id === id) || null;
}

export function duplicateDocumentType(id: string): StoredDocumentType | null {
  const original = getDocumentType(id);
  if (!original) return null;

  const duplicate: StoredDocumentType = {
    ...original,
    id: `${original.id}-copy-${Date.now()}`,
    name: `${original.name} (Copie)`,
    isBuiltIn: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  saveDocumentType(duplicate);
  return duplicate;
}

export function renameDocumentType(id: string, newName: string): void {
  const type = getDocumentType(id);
  if (!type || type.isBuiltIn) return;

  type.name = newName;
  type.updatedAt = Date.now();
  saveDocumentType(type);
}
