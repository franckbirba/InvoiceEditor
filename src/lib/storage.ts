const STORAGE_KEY_DATA = 'invoice-studio-data';
const STORAGE_KEY_TEMPLATE = 'invoice-studio-template';
const STORAGE_KEY_LOCALE = 'invoice-studio-locale';
const STORAGE_VERSION = '1.0.0';

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
};
