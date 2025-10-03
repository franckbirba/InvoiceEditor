import { invoiceDocumentType } from './types/invoice.schema';
import { cvDocumentType } from './types/cv.schema';
import { loadDocumentTypes, saveDocumentType, type StoredDocumentType } from './document-type-storage';

export function initializeDocumentTypes() {
  const types = loadDocumentTypes();

  // Check if invoice type already exists
  const invoiceExists = types.some((t) => t.id === 'invoice');

  if (!invoiceExists) {
    const invoiceType: StoredDocumentType = {
      id: 'invoice',
      name: 'Facture',
      definition: invoiceDocumentType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isBuiltIn: true,
    };

    saveDocumentType(invoiceType);
    console.log('Document type "invoice" initialized');
  }

  // Check if cv type already exists
  const cvExists = types.some((t) => t.id === 'cv');

  if (!cvExists) {
    const cvType: StoredDocumentType = {
      id: 'cv',
      name: 'CV',
      definition: cvDocumentType,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isBuiltIn: true,
    };

    saveDocumentType(cvType);
    console.log('Document type "cv" initialized');
  }
}
