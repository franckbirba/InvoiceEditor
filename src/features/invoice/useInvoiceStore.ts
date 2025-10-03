import { create } from 'zustand';
import type { InvoiceData } from './invoice.schema';
import { InvoiceDataSchema } from './invoice.schema';
import {
  getActiveDocumentId,
  createNewDocument,
} from '../../lib/storage';
import { getTheme, getTemplate, renameTemplate, duplicateTemplate, deleteTemplate, renameTheme, duplicateTheme, deleteTheme, getDocument, saveDocument as saveDocumentNew } from '../document/document.storage';
import sampleData from './sample-data.json';

type ActiveView =
  | { type: 'document'; id: string }
  | { type: 'template'; id: string; mode: 'preview' | 'edit' }
  | { type: 'theme'; id: string; mode: 'preview' | 'edit' }
  | { type: 'documentType'; id: string; mode: 'edit' };

interface InvoiceStore {
  data: InvoiceData;
  template: string;
  theme: string;
  isEditorMode: boolean;
  isInlineEditMode: boolean;
  dataVersion: number; // Incremented on external updates to trigger form reset
  activeDocumentId: string | null;
  activeView: ActiveView | null;

  setData: (data: InvoiceData) => void;
  updateData: (updater: (data: InvoiceData) => InvoiceData) => void;
  setTemplate: (template: string) => void;
  setTheme: (theme: string) => void;
  setTemplateById: (templateId: string) => void;
  setThemeById: (themeId: string) => void;
  renameTemplate: (templateId: string, newName: string) => void;
  duplicateTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;
  renameTheme: (themeId: string, newName: string) => void;
  duplicateTheme: (themeId: string) => void;
  deleteTheme: (themeId: string) => void;
  setActiveView: (view: ActiveView | null) => void;
  toggleViewMode: () => void; // Toggle between preview/edit for templates/themes
  toggleEditorMode: () => void;
  toggleInlineEditMode: () => void;
  resetToSample: () => void;
  duplicateInvoice: () => void;
  loadFromJson: (json: string) => void;
  exportToJson: () => string;
  loadDocumentById: (id: string) => void;
  createDocument: () => void;
}

// Default theme for invoices (using the original CV theme as base)
const defaultInvoiceTheme = `:root {
  /* Colors - CV Theme */
  --color-bg: #f5f5f5;
  --color-fg: #333333;
  --color-muted: #666666;
  --color-accent: #6aaf50;
  --color-red: #d32f2f;
  --color-border: #dddddd;
  --color-box: #e8e8e8;
  --chip-bg: #e8e8e8;
  --chip-fg: #333333;

  /* Typography - Monospace */
  --font-mono: 'Courier New', monospace;
  --h1: 24px;
  --h2: 13px;
  --text: 13px;
  --mono: 13px;
  --tracking: 2px;

  /* Layout */
  --page-w: 794px;
  --page-pad: 32px;
  --radius: 4px;
  --gap: 16px;
  --line: 1px;
  --band: 1px;
}

/* Invoice Preview Styles */
.invoice-preview {
  max-width: var(--page-w);
  margin: 0 auto;
  padding: var(--page-pad);
  background: white;
  color: var(--color-fg);
  font-family: var(--font-mono);
  font-size: var(--text);
  line-height: 1.8;
}

.invoice-header {
  margin-bottom: 12px;
  text-align: center;
}

.invoice-title {
  font-size: var(--h1);
  font-weight: bold;
  letter-spacing: var(--tracking);
  text-transform: uppercase;
  margin: 0;
  color: var(--color-fg);
}

.invoice-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--h2);
  color: var(--color-fg);
  margin: 8px 0;
}

.invoice-meta strong {
  color: var(--color-red);
}

.section-title {
  color: var(--color-fg);
  font-size: var(--h2);
  margin: 0 0 6px 0;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-box {
  padding: 12px;
  margin-bottom: 12px;
  font-size: var(--text);
  line-height: 1.6;
}

.info-box strong {
  color: var(--color-red);
}

.highlight-box {
  padding: 10px 12px;
  margin: 12px 0;
  border-left: 2px solid var(--color-accent);
  font-size: var(--text);
}

.header-separator {
  border-top: var(--band) solid var(--color-accent);
  margin: 8px 0;
}

.table-wrapper {
  padding: 12px;
  margin: 16px 0;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 12px;
}

.invoice-table thead th {
  text-align: left;
  font-size: 11px;
  font-weight: bold;
  text-transform: uppercase;
  padding: 8px 6px;
  border-bottom: var(--band) solid var(--color-accent);
  background: transparent;
}

.invoice-table tbody tr {
  border-bottom: var(--line) solid var(--color-border);
}

.invoice-table tbody tr:last-child {
  border-bottom: none;
}

.invoice-table td {
  padding: 6px;
  vertical-align: top;
}

.invoice-table td.text-right {
  text-align: right;
}

.summary-section {
  padding: 12px;
  margin: 16px 0;
  font-size: var(--text);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: var(--line) solid var(--color-border);
}

.summary-row:has(+ .summary-row.total) {
  border-bottom: none;
}

.summary-row.total {
  font-size: 15px;
  font-weight: bold;
  border-top: var(--band) solid var(--color-accent);
  border-bottom: var(--band) solid var(--color-accent);
  margin-top: 6px;
  padding-top: 10px;
}

.footer-section {
  margin-top: 24px;
  font-size: 12px;
  color: var(--color-muted);
}`;

const defaultTemplate = `<div class="invoice-preview" id="invoice-content">
  <div class="invoice-header">
    <div class="invoice-title">FACTURE</div>
    <div class="header-separator"></div>
    <div class="invoice-meta">
      <div><strong>N°</strong> {{invoice.number}}</div>
      <div style="font-size: 14px; color: #666;">{{sender.name}}</div>
      <div><strong>DATE:</strong> {{formatted.date}}</div>
    </div>
    <div class="header-separator"></div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0;">
    <div>
      <div class="section-title">Émetteur</div>
      <div class="info-box" style="margin-bottom: 0;">
        <strong>{{sender.name}}</strong><br>
        {{#sender.address}}{{sender.address}}<br>{{/sender.address}}
        {{#sender.email}}📧 {{sender.email}}<br>{{/sender.email}}
        {{#sender.phone}}📱 {{sender.phone}}<br>{{/sender.phone}}
        {{#sender.bank}}{{sender.bank}}<br>{{/sender.bank}}
        {{#sender.notes}}<em>{{sender.notes}}</em>{{/sender.notes}}
      </div>
    </div>
    <div>
      <div class="section-title">Client</div>
      <div class="info-box" style="margin-bottom: 0;">
        <strong>{{client.name}}</strong><br>
        {{#client.address}}{{client.address}}<br>{{/client.address}}
        {{#client.email}}📧 {{client.email}}<br>{{/client.email}}
        {{#client.phone}}📱 {{client.phone}}<br>{{/client.phone}}
        {{#client.bank}}{{client.bank}}<br>{{/client.bank}}
        {{#client.reg}}{{client.reg}}<br>{{/client.reg}}
        {{#client.notes}}<em>{{client.notes}}</em>{{/client.notes}}
      </div>
    </div>
  </div>

  {{#invoice.subject}}
  <div class="section-title" style="margin-top: 8px;">Objet</div>
  <div class="highlight-box">{{invoice.subject}}</div>
  {{/invoice.subject}}

  <div class="section-title">Prestations</div>
  <div class="table-wrapper">
    <table class="invoice-table">
      <thead>
        <tr>
          <th>DÉSIGNATION</th>
          <th style="text-align: center;">QTÉ</th>
          <th style="text-align: right;">P.U.</th>
          <th style="text-align: right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        {{#items_with_totals}}
        <tr>
          <td>{{description}}</td>
          <td style="text-align: center;">{{qty_formatted}}</td>
          <td class="text-right">{{unit_price_formatted}}</td>
          <td class="text-right"><strong>{{line_total_formatted}}</strong></td>
        </tr>
        {{/items_with_totals}}
      </tbody>
    </table>
  </div>

  <div class="section-title">Récapitulatif</div>
  <div class="summary-section">
    <div class="summary-row">
      <span>Sous-total:</span>
      <span>{{formatted.subtotal}}</span>
    </div>
    {{#totals.taxes}}
    <div class="summary-row">
      <span>{{label}} ({{rate}}%):</span>
      <span>{{amount}}</span>
    </div>
    {{/totals.taxes}}
    <div class="summary-row total">
      <span>TOTAL</span>
      <span>{{formatted.total}}</span>
    </div>
  </div>

  {{#invoice.payment_terms}}
  <div class="section-title">Conditions de paiement</div>
  <div class="highlight-box">{{invoice.payment_terms}}</div>
  {{/invoice.payment_terms}}

  <div class="footer-section">
    {{#footer.legal}}{{footer.legal}}{{/footer.legal}}
  </div>
</div>`;

// Helper function to sanitize data before Zod validation
// Converts string numbers to actual numbers for numeric fields
function sanitizeInvoiceData(data: any): any {
  const sanitized = JSON.parse(JSON.stringify(data)); // Deep clone

  // Sanitize items
  if (sanitized.items && Array.isArray(sanitized.items)) {
    sanitized.items = sanitized.items.map((item: any) => ({
      ...item,
      qty: typeof item.qty === 'string' ? parseFloat(item.qty) || 0 : item.qty,
      unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) || 0 : item.unit_price,
      discount: item.discount && typeof item.discount === 'string' ? parseFloat(item.discount) || 0 : item.discount,
    }));
  }

  // Sanitize taxes
  if (sanitized.summary?.taxes && Array.isArray(sanitized.summary.taxes)) {
    sanitized.summary.taxes = sanitized.summary.taxes.map((tax: any) => ({
      ...tax,
      rate: typeof tax.rate === 'string' ? parseFloat(tax.rate) || 0 : tax.rate,
    }));
  }

  // Sanitize global discount
  if (sanitized.summary?.global_discount && typeof sanitized.summary.global_discount === 'string') {
    sanitized.summary.global_discount = parseFloat(sanitized.summary.global_discount) || 0;
  }

  // Sanitize email fields - convert invalid/whitespace-only emails to empty string
  // Use a basic email regex to validate before passing to Zod
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (sanitized.sender?.email !== undefined) {
    const email = String(sanitized.sender.email || '').trim();
    sanitized.sender.email = email && emailRegex.test(email) ? email : '';
  }
  if (sanitized.client?.email !== undefined) {
    const email = String(sanitized.client.email || '').trim();
    sanitized.client.email = email && emailRegex.test(email) ? email : '';
  }

  return sanitized;
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => {
  // Load initial data - try active document first
  let activeId = getActiveDocumentId();
  let initialData: InvoiceData;
  let initialTemplate: string = defaultTemplate;
  let initialTheme: string = defaultInvoiceTheme;

  if (activeId) {
    const doc = loadDocument(activeId);
    if (doc) {
      try {
        initialData = InvoiceDataSchema.parse(sanitizeInvoiceData(doc.data));
        initialTemplate = doc.template || defaultTemplate;
        // Load theme from document, fallback to default invoice theme
        initialTheme = doc.theme || (() => {
          const invoiceTheme = getTheme('theme-invoice-default');
          return invoiceTheme?.content || defaultInvoiceTheme;
        })();
      } catch (error) {
        console.error('Failed to parse document data, using sample data:', error);
        // If validation fails, use sample data
        initialData = InvoiceDataSchema.parse(sampleData);
      }
    } else {
      // Document not found, create new one
      activeId = createNewDocument();
      initialData = InvoiceDataSchema.parse(sampleData);
    }
  } else {
    // No active document, create new one
    activeId = createNewDocument();
    initialData = InvoiceDataSchema.parse(sampleData);
  }

  const saveCurrentDocument = () => {
    const state = get();
    if (state.activeDocumentId) {
      const doc = getDocument(state.activeDocumentId);
      if (doc) {
        // Update the document with new data
        saveDocumentNew({
          ...doc,
          data: state.data,
          updatedAt: Date.now(),
        });
      }
    }
  };

  return {
    data: initialData,
    template: initialTemplate,
    theme: initialTheme,
    isEditorMode: false,
    isInlineEditMode: false,
    dataVersion: 0,
    activeDocumentId: activeId,
    activeView: activeId ? { type: 'document', id: activeId } : null,

    setActiveView: (view) => {
      // If switching to a document, load it
      if (view?.type === 'document') {
        const doc = getDocument(view.id);
        if (doc) {
          try {
            // For invoice documents, validate with schema
            // For other document types (CV, etc.), use data as-is
            let data;
            if (doc.typeId === 'facture') {
              // Check if data is empty or invalid
              const hasValidData = doc.data && typeof doc.data === 'object' &&
                                   Object.keys(doc.data).length > 0;

              if (hasValidData) {
                try {
                  data = InvoiceDataSchema.parse(sanitizeInvoiceData(doc.data));
                } catch (validationError) {
                  console.warn('Invalid invoice data, using default:', validationError);
                  // Use default invoice data for corrupted documents
                  data = sampleData as InvoiceData;
                }
              } else {
                // Empty data, use sample data
                console.warn('Empty invoice data, using sample data');
                data = sampleData as InvoiceData;
              }
            } else {
              // For non-invoice documents, use data as-is
              data = doc.data || {};
            }

            // Get template content
            const templateObj = doc.templateId ? getTemplate(doc.templateId) : null;
            const templateContent = templateObj?.content || defaultTemplate;

            // Get theme content
            const themeObj = doc.themeId ? getTheme(doc.themeId) : null;
            const themeContent = themeObj?.content || (() => {
              const invoiceTheme = getTheme('theme-invoice-default');
              return invoiceTheme?.content || defaultInvoiceTheme;
            })();

            set({
              activeView: view,
              data,
              template: templateContent,
              theme: themeContent,
              activeDocumentId: view.id,
              dataVersion: get().dataVersion + 1,
              isEditorMode: false,
              isInlineEditMode: false,
            });
          } catch (error) {
            console.error('Failed to load document:', error);
            // Don't crash, just log the error
            alert('Erreur lors du chargement du document. Les données sont peut-être corrompues.');
          }
        }
      } else {
        // For templates and themes, just set the view
        set({ activeView: view });
      }
    },

    toggleViewMode: () => {
      const currentView = get().activeView;
      if (currentView && (currentView.type === 'template' || currentView.type === 'theme')) {
        set({
          activeView: {
            ...currentView,
            mode: currentView.mode === 'preview' ? 'edit' : 'preview'
          }
        });
      }
    },

    setData: (data) => {
      set({ data });
      saveCurrentDocument();
    },

    updateData: (updater) => {
      const currentData = get().data;
      const newData = updater(currentData);
      set({ data: newData });
      saveCurrentDocument();
    },

    setTemplate: (template) => {
      set({ template });
      saveCurrentDocument();
    },

    setTheme: (theme) => {
      set({ theme });
      saveCurrentDocument();
    },

    setTemplateById: (templateId) => {
      const template = getTemplate(templateId);
      if (template) {
        const state = get();
        set({
          template: template.content,
          dataVersion: state.dataVersion + 1
        });

        // Save the document with the new template
        if (state.activeDocumentId) {
          saveDocument(
            state.activeDocumentId,
            state.data,
            template.content,
            state.theme,
            {
              name: `Facture ${state.data.invoice.number}`,
              createdAt: Date.now(),
              invoiceNumber: state.data.invoice.number,
              clientName: state.data.client.name,
            }
          );
        }
      }
    },

    setThemeById: (themeId) => {
      const theme = getTheme(themeId);
      if (theme) {
        set({ theme: theme.content });
        saveCurrentDocument();
      }
    },
    renameTemplate: (templateId: string, newName: string) => {
      renameTemplate(templateId, newName);
    },
    duplicateTemplate: (templateId: string) => {
      duplicateTemplate(templateId);
    },
    deleteTemplate: (templateId: string) => {
      deleteTemplate(templateId);
    },
    renameTheme: (themeId: string, newName: string) => {
      renameTheme(themeId, newName);
    },
    duplicateTheme: (themeId: string) => {
      duplicateTheme(themeId);
    },
    deleteTheme: (themeId: string) => {
      deleteTheme(themeId);
    },

    toggleEditorMode: () => {
      set((state) => ({ isEditorMode: !state.isEditorMode, isInlineEditMode: false }));
    },

    toggleInlineEditMode: () => {
      set((state) => ({ isInlineEditMode: !state.isInlineEditMode, isEditorMode: false }));
    },

    resetToSample: () => {
      const data = InvoiceDataSchema.parse(sampleData);
      const invoiceTheme = getTheme('theme-invoice-default');
      const themeContent = invoiceTheme?.content || defaultInvoiceTheme;
      set({ data, template: defaultTemplate, theme: themeContent, dataVersion: get().dataVersion + 1 });
      saveCurrentDocument();
    },

    duplicateInvoice: () => {
      const currentData = get().data;
      const currentTemplate = get().template;
      const currentTheme = get().theme;
      const duplicatedData = {
        ...currentData,
        invoice: {
          ...currentData.invoice,
          number: `${currentData.invoice.number}-COPY`,
          date: new Date().toISOString().split('T')[0],
        },
      };

      // Create a new document with duplicated data
      const newId = createNewDocument();
      saveDocument(
        newId,
        duplicatedData,
        currentTemplate,
        currentTheme,
        {
          name: `Facture ${duplicatedData.invoice.number}`,
          createdAt: Date.now(),
          invoiceNumber: duplicatedData.invoice.number,
          clientName: duplicatedData.client.name,
        }
      );

      set({
        activeView: { type: 'document', id: newId },
        data: duplicatedData,
        template: currentTemplate,
        theme: currentTheme,
        activeDocumentId: newId,
        dataVersion: get().dataVersion + 1,
      });
    },

    loadFromJson: (json) => {
      try {
        const parsed = JSON.parse(json);

        // Check if it's export format with template
        if (parsed.data && parsed.template) {
          try {
            const data = InvoiceDataSchema.parse(sanitizeInvoiceData(parsed.data));
            set({
              data,
              template: parsed.template || get().template,
              theme: parsed.theme || get().theme,
              dataVersion: get().dataVersion + 1
            });
            saveCurrentDocument();
          } catch (validationError) {
            console.error('Data validation error:', validationError);
            throw new Error('Format de données invalide. Vérifiez que toutes les données sont correctes.');
          }
        } else {
          // Direct data import
          try {
            const data = InvoiceDataSchema.parse(sanitizeInvoiceData(parsed));
            set({ data, dataVersion: get().dataVersion + 1 });
            saveCurrentDocument();
          } catch (validationError) {
            console.error('Data validation error:', validationError);
            throw new Error('Format de données invalide. Vérifiez que toutes les données sont correctes.');
          }
        }
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        if (error instanceof Error && error.message.includes('Format de données invalide')) {
          throw error;
        }
        throw new Error('Format JSON invalide');
      }
    },

    exportToJson: () => {
      const { data, template, theme } = get();
      const exportData = {
        version: '1.0.0',
        data,
        template,
        theme,
      };
      return JSON.stringify(exportData, null, 2);
    },

    loadDocumentById: (id: string) => {
      get().setActiveView({ type: 'document', id });
    },

    createDocument: () => {
      const newId = createNewDocument();
      const newData = InvoiceDataSchema.parse(sampleData);

      // Use the currently selected template and theme from the store
      const currentTemplate = get().template;
      const currentTheme = get().theme;

      saveDocument(
        newId,
        newData,
        currentTemplate,
        currentTheme,
        {
          name: `Facture ${newData.invoice.number}`,
          createdAt: Date.now(),
          invoiceNumber: newData.invoice.number,
          clientName: newData.client.name,
        }
      );

      get().setActiveView({ type: 'document', id: newId });
    },
  };
});
