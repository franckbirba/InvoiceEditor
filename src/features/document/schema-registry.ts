/**
 * Document Schema Registry
 * Central registry for all document type schemas
 */

import type { DocumentTypeDefinition } from './document-schema';
import { invoiceDocumentType } from './types/invoice.schema';

/**
 * Registry of all available document types
 */
export const documentSchemas: Record<string, DocumentTypeDefinition> = {};

/**
 * Initialize the schema registry with default types
 */
export function initializeSchemaRegistry(): void {
  if (Object.keys(documentSchemas).length === 0) {
    console.log('Initializing schema registry with invoice type...');
    registerDocumentType(invoiceDocumentType);
  }
}

/**
 * Get schema for a document type
 */
export function getDocumentSchema(type: string): DocumentTypeDefinition | null {
  // Auto-initialize if not done yet
  if (Object.keys(documentSchemas).length === 0) {
    initializeSchemaRegistry();
  }
  return documentSchemas[type] || null;
}

/**
 * Get all available document types
 */
export function getAllDocumentTypes(): DocumentTypeDefinition[] {
  // Auto-initialize if not done yet
  if (Object.keys(documentSchemas).length === 0) {
    initializeSchemaRegistry();
  }
  return Object.values(documentSchemas);
}

/**
 * Register a new document type
 */
export function registerDocumentType(schema: DocumentTypeDefinition): void {
  documentSchemas[schema.type] = schema;
  console.log(`Registered document type: ${schema.type} - ${schema.name}`);
}
