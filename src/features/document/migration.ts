import type { InvoiceData } from '../invoice/invoice.schema';
import type { Document } from './document.schema';

/**
 * Migration utility to convert old invoice data to new Document format
 */

export interface LegacyInvoiceDocument {
  id: string;
  data: InvoiceData;
  template: string;
  metadata: {
    name: string;
    createdAt: number;
    updatedAt: number;
    invoiceNumber?: string;
    clientName?: string;
  };
}

/**
 * Converts legacy invoice data to new Document format
 */
export function migrateInvoiceToDocument(
  legacy: LegacyInvoiceDocument,
  templateId: string = 'facture-terminal-default',
  themeId: string = 'theme-terminal-default'
): Document {
  const { id, data, metadata } = legacy;

  // Flatten the invoice data structure to match the new Document format
  const documentData: Record<string, any> = {
    // Metadata
    version: data.version,
    locale: data.locale,
    theme: data.theme,

    // Sender section
    sender: data.sender,

    // Client section
    client: data.client,

    // Invoice section
    invoice: data.invoice,

    // Items array
    items: data.items,

    // Summary section
    summary: data.summary,

    // Footer section
    footer: data.footer,
  };

  return {
    id,
    typeId: 'facture', // Use the facture document type ID directly
    name: metadata.name || `Facture ${data.invoice.number}`,
    data: documentData,
    templateId,
    themeId,
    projectId: undefined,
    tags: [],
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt || Date.now(),
  };
}

/**
 * Converts new Document format back to legacy invoice data
 * This ensures backward compatibility
 */
export function documentToInvoiceData(document: Document): InvoiceData {
  const { data } = document;

  return {
    version: (data.version as string) || '1.0.0',
    locale: (data.locale as 'fr' | 'en') || 'fr',
    theme: (data.theme as string) || 'cv-default',
    sender: data.sender as any,
    client: data.client as any,
    invoice: data.invoice as any,
    items: data.items as any,
    summary: data.summary as any || { taxes: [] },
    footer: data.footer as any || {},
  };
}

/**
 * Check if migration is needed by looking for old storage keys
 */
export function needsMigration(): boolean {
  // Check if old invoice-studio data exists but hasn't been migrated to new system
  const hasOldData = localStorage.getItem('invoice-studio-data') !== null;
  const hasOldDocuments = localStorage.getItem('invoice-studio-documents-list') !== null;
  const hasNewDocuments = localStorage.getItem('document-studio-documents') !== null;

  // Migration is needed if we have old data but no new documents yet
  return (hasOldData || hasOldDocuments) && !hasNewDocuments;
}

/**
 * Get legacy document list from old storage format
 */
export function getLegacyDocuments(): LegacyInvoiceDocument[] {
  const documents: LegacyInvoiceDocument[] = [];

  try {
    // Get documents list
    const listStr = localStorage.getItem('invoice-studio-documents-list');
    if (listStr) {
      const list = JSON.parse(listStr);

      for (const meta of list) {
        const dataKey = `invoice-studio-doc-${meta.id}-data`;
        const templateKey = `invoice-studio-doc-${meta.id}-template`;

        const dataStr = localStorage.getItem(dataKey);
        const templateStr = localStorage.getItem(templateKey);

        if (dataStr) {
          const dataWrapper = JSON.parse(dataStr);
          const templateWrapper = templateStr ? JSON.parse(templateStr) : { data: '' };

          documents.push({
            id: meta.id,
            data: dataWrapper.data,
            template: templateWrapper.data,
            metadata: {
              name: meta.name,
              createdAt: meta.createdAt,
              updatedAt: meta.updatedAt,
              invoiceNumber: meta.invoiceNumber,
              clientName: meta.clientName,
            },
          });
        }
      }
    }

    // Also check for old single-document format
    const oldDataStr = localStorage.getItem('invoice-studio-data');
    if (oldDataStr && documents.length === 0) {
      const oldDataWrapper = JSON.parse(oldDataStr);
      const oldTemplateStr = localStorage.getItem('invoice-studio-template');
      const oldTemplateWrapper = oldTemplateStr ? JSON.parse(oldTemplateStr) : { data: '' };

      const oldData = oldDataWrapper.data;
      documents.push({
        id: `migrated-${Date.now()}`,
        data: oldData,
        template: oldTemplateWrapper.data,
        metadata: {
          name: `Facture ${oldData.invoice?.number || 'importée'}`,
          createdAt: oldDataWrapper.timestamp || Date.now(),
          updatedAt: Date.now(),
          invoiceNumber: oldData.invoice?.number,
          clientName: oldData.client?.name,
        },
      });
    }
  } catch (error) {
    console.error('Error loading legacy documents:', error);
  }

  return documents;
}
