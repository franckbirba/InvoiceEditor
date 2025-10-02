const STORAGE_KEY_DATA = 'invoice-studio-data';
const STORAGE_KEY_TEMPLATE = 'invoice-studio-template';
const STORAGE_KEY_LOCALE = 'invoice-studio-locale';
const STORAGE_KEY_DOCUMENTS_LIST = 'invoice-studio-documents-list';
const STORAGE_KEY_ACTIVE_DOCUMENT = 'invoice-studio-active-document';
const STORAGE_VERSION = '1.0.0';

export interface DocumentMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  invoiceNumber?: string;
  clientName?: string;
}

export interface StorageData {
  version: string;
  data: any;
  timestamp: number;
}

export function saveToLocalStorage(key: string, data: any): void {
  try {
    const storageData: StorageData = {
      version: STORAGE_VERSION,
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(storageData));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export function loadFromLocalStorage<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const storageData: StorageData = JSON.parse(stored);

    // Version check could be implemented here
    if (storageData.version !== STORAGE_VERSION) {
      console.warn('Storage version mismatch, migration might be needed');
    }

    return storageData.data as T;
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return null;
  }
}

export function clearLocalStorage(key?: string): void {
  if (key) {
    localStorage.removeItem(key);
  } else {
    localStorage.removeItem(STORAGE_KEY_DATA);
    localStorage.removeItem(STORAGE_KEY_TEMPLATE);
  }
}

export const STORAGE_KEYS = {
  DATA: STORAGE_KEY_DATA,
  TEMPLATE: STORAGE_KEY_TEMPLATE,
  LOCALE: STORAGE_KEY_LOCALE,
  DOCUMENTS_LIST: STORAGE_KEY_DOCUMENTS_LIST,
  ACTIVE_DOCUMENT: STORAGE_KEY_ACTIVE_DOCUMENT,
};

// Multi-document functions
export function getDocumentsList(): DocumentMetadata[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DOCUMENTS_LIST);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get documents list:', error);
    return [];
  }
}

export function saveDocumentsList(documents: DocumentMetadata[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DOCUMENTS_LIST, JSON.stringify(documents));
  } catch (error) {
    console.error('Failed to save documents list:', error);
  }
}

export function getActiveDocumentId(): string | null {
  return localStorage.getItem(STORAGE_KEY_ACTIVE_DOCUMENT);
}

export function setActiveDocumentId(id: string): void {
  localStorage.setItem(STORAGE_KEY_ACTIVE_DOCUMENT, id);
}

export function getDocumentKey(id: string, type: 'data' | 'template'): string {
  return `invoice-studio-doc-${id}-${type}`;
}

export function saveDocument(id: string, data: any, template: string, metadata: Omit<DocumentMetadata, 'id' | 'updatedAt'>): void {
  try {
    // Save document data and template
    saveToLocalStorage(getDocumentKey(id, 'data'), data);
    saveToLocalStorage(getDocumentKey(id, 'template'), template);

    // Update documents list
    const documents = getDocumentsList();
    const existingIndex = documents.findIndex(doc => doc.id === id);

    const docMetadata: DocumentMetadata = {
      ...metadata,
      id,
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      documents[existingIndex] = docMetadata;
    } else {
      documents.push(docMetadata);
    }

    saveDocumentsList(documents);
    setActiveDocumentId(id);
  } catch (error) {
    console.error('Failed to save document:', error);
  }
}

export function loadDocument(id: string): { data: any; template: string | null } | null {
  try {
    const data = loadFromLocalStorage(getDocumentKey(id, 'data'));
    const template = loadFromLocalStorage<string>(getDocumentKey(id, 'template'));

    if (!data) return null;

    setActiveDocumentId(id);
    return { data, template };
  } catch (error) {
    console.error('Failed to load document:', error);
    return null;
  }
}

export function deleteDocument(id: string): void {
  try {
    localStorage.removeItem(getDocumentKey(id, 'data'));
    localStorage.removeItem(getDocumentKey(id, 'template'));

    const documents = getDocumentsList();
    const filtered = documents.filter(doc => doc.id !== id);
    saveDocumentsList(filtered);

    if (getActiveDocumentId() === id) {
      const newActive = filtered[0]?.id || null;
      if (newActive) {
        setActiveDocumentId(newActive);
      } else {
        localStorage.removeItem(STORAGE_KEY_ACTIVE_DOCUMENT);
      }
    }
  } catch (error) {
    console.error('Failed to delete document:', error);
  }
}

export function createNewDocument(): string {
  return `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
