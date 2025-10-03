import { create } from 'zustand';
import type { InvoiceData } from './invoice.schema';
import { InvoiceDataSchema } from './invoice.schema';
import {
  getActiveDocumentId,
  loadDocument,
  saveDocument,
  createNewDocument,
} from '../../lib/storage';
import { getTheme, getTemplate, renameTemplate, duplicateTemplate, deleteTemplate, renameTheme, duplicateTheme, deleteTheme } from '../document/document.storage';
import sampleData from './sample-data.json';

interface InvoiceStore {
  data: InvoiceData;
  template: string;
  theme: string;
  isEditorMode: boolean;
  isInlineEditMode: boolean;
  dataVersion: number; // Incremented on external updates to trigger form reset
  activeDocumentId: string | null;

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

export const useInvoiceStore = create<InvoiceStore>((set, get) => {
  // Load initial data - try active document first
  let activeId = getActiveDocumentId();
  let initialData: InvoiceData;
  let initialTemplate: string = defaultTemplate;
  let initialTheme: string = defaultInvoiceTheme;

  if (activeId) {
    const doc = loadDocument(activeId);
    if (doc) {
      initialData = InvoiceDataSchema.parse(doc.data);
      initialTemplate = doc.template || defaultTemplate;
      // Load theme from document, fallback to default invoice theme
      initialTheme = doc.theme || (() => {
        const invoiceTheme = getTheme('theme-invoice-default');
        return invoiceTheme?.content || defaultInvoiceTheme;
      })();
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
      saveDocument(
        state.activeDocumentId,
        state.data,
        state.template,
        state.theme,
        {
          name: `Facture ${state.data.invoice.number}`,
          createdAt: Date.now(),
          invoiceNumber: state.data.invoice.number,
          clientName: state.data.client.name,
        }
      );
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
        set({ template: template.content });
        saveCurrentDocument();
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
          const data = InvoiceDataSchema.parse(parsed.data);
          set({
            data,
            template: parsed.template || get().template,
            theme: parsed.theme || get().theme,
            dataVersion: get().dataVersion + 1
          });
          saveCurrentDocument();
        } else {
          // Direct data import
          const data = InvoiceDataSchema.parse(parsed);
          set({ data, dataVersion: get().dataVersion + 1 });
          saveCurrentDocument();
        }
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        throw new Error('Invalid JSON format');
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
      const doc = loadDocument(id);
      if (doc) {
        const data = InvoiceDataSchema.parse(doc.data);
        // Load theme from document, fallback to default invoice theme
        const themeContent = doc.theme || (() => {
          const invoiceTheme = getTheme('theme-invoice-default');
          return invoiceTheme?.content || defaultInvoiceTheme;
        })();
        
        set({
          data,
          template: doc.template || defaultTemplate,
          theme: themeContent,
          activeDocumentId: id,
          dataVersion: get().dataVersion + 1,
        });
      }
    },

    createDocument: () => {
      const newId = createNewDocument();
      const newData = InvoiceDataSchema.parse(sampleData);
      const invoiceTheme = getTheme('theme-invoice-default');
      const themeContent = invoiceTheme?.content || defaultInvoiceTheme;

      saveDocument(
        newId,
        newData,
        defaultTemplate,
        themeContent,
        {
          name: `Facture ${newData.invoice.number}`,
          createdAt: Date.now(),
          invoiceNumber: newData.invoice.number,
          clientName: newData.client.name,
        }
      );

      set({
        data: newData,
        template: defaultTemplate,
        theme: themeContent,
        activeDocumentId: newId,
        dataVersion: get().dataVersion + 1,
      });
    },
  };
});
