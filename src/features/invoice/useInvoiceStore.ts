import { create } from 'zustand';
import type { InvoiceData } from './invoice.schema';
import { InvoiceDataSchema } from './invoice.schema';
import { saveToLocalStorage, loadFromLocalStorage, STORAGE_KEYS } from '../../lib/storage';
import sampleData from './sample-data.json';

interface InvoiceStore {
  data: InvoiceData;
  template: string;
  isEditorMode: boolean;
  dataVersion: number; // Incremented on external updates to trigger form reset

  setData: (data: InvoiceData) => void;
  updateData: (updater: (data: InvoiceData) => InvoiceData) => void;
  setTemplate: (template: string) => void;
  toggleEditorMode: () => void;
  resetToSample: () => void;
  duplicateInvoice: () => void;
  loadFromJson: (json: string) => void;
  exportToJson: () => string;
}

const defaultTemplate = `<div class="invoice-preview" id="invoice-content">
  <div class="invoice-header">
    <h1 class="invoice-title">{{#locale}}FACTURE{{/locale}}</h1>
    <div class="invoice-meta">
      <div><strong>N°</strong> {{invoice.number}}</div>
      <div><strong>Date:</strong> {{formatted.date}}</div>
    </div>
  </div>

  <div class="invoice-parties">
    <div class="party-card">
      <h3>Émetteur</h3>
      {{#sender.logo}}<img src="{{sender.logo}}" alt="Logo" style="max-width: 100px; margin-bottom: 8px;" />{{/sender.logo}}
      <p><strong>{{sender.name}}</strong></p>
      {{#sender.address}}<p style="white-space: pre-line;">{{sender.address}}</p>{{/sender.address}}
      {{#sender.email}}<p>{{sender.email}}</p>{{/sender.email}}
      {{#sender.phone}}<p>{{sender.phone}}</p>{{/sender.phone}}
      {{#sender.bank}}<p style="white-space: pre-line;">{{sender.bank}}</p>{{/sender.bank}}
      {{#sender.notes}}<p><em>{{sender.notes}}</em></p>{{/sender.notes}}
    </div>
    <div class="party-card">
      <h3>Client</h3>
      <p><strong>{{client.name}}</strong></p>
      {{#client.address}}<p style="white-space: pre-line;">{{client.address}}</p>{{/client.address}}
      {{#client.reg}}<p>{{client.reg}}</p>{{/client.reg}}
    </div>
  </div>

  {{#invoice.subject}}
  <div style="margin-bottom: 24px; padding: 12px; background: #f8fafc; border-radius: 8px;">
    <strong>Objet:</strong> {{invoice.subject}}
  </div>
  {{/invoice.subject}}

  <table class="invoice-table">
    <thead>
      <tr>
        <th>Désignation</th>
        <th style="text-align: center;">Qté</th>
        <th style="text-align: right;">P.U.</th>
        <th style="text-align: right;">Total</th>
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

  <div class="invoice-summary">
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
      <span><strong>TOTAL</strong></span>
      <span><strong>{{formatted.total}}</strong></span>
    </div>
  </div>

  {{#invoice.payment_terms}}
  <div style="margin-bottom: 24px; padding: 12px; background: #eff6ff; border-left: 4px solid #2563eb;">
    <strong>Conditions de paiement:</strong> {{invoice.payment_terms}}
  </div>
  {{/invoice.payment_terms}}

  <div class="invoice-footer">
    {{#footer.legal}}<p>{{footer.legal}}</p>{{/footer.legal}}
    {{#footer.signature}}<div style="margin-top: 24px;"><img src="{{footer.signature}}" alt="Signature" style="max-width: 200px;" /></div>{{/footer.signature}}
  </div>
</div>`;

export const useInvoiceStore = create<InvoiceStore>((set, get) => {
  // Load initial data from localStorage or use sample
  const savedData = loadFromLocalStorage<InvoiceData>(STORAGE_KEYS.DATA);
  const savedTemplate = loadFromLocalStorage<string>(STORAGE_KEYS.TEMPLATE);

  const initialData = savedData
    ? InvoiceDataSchema.parse(savedData)
    : InvoiceDataSchema.parse(sampleData);

  return {
    data: initialData,
    template: savedTemplate || defaultTemplate,
    isEditorMode: false,
    dataVersion: 0,

    setData: (data) => {
      set({ data }); // Don't increment dataVersion for autosave
      saveToLocalStorage(STORAGE_KEYS.DATA, data);
    },

    updateData: (updater) => {
      const currentData = get().data;
      const newData = updater(currentData);
      set({ data: newData });
      saveToLocalStorage(STORAGE_KEYS.DATA, newData);
    },

    setTemplate: (template) => {
      set({ template });
      saveToLocalStorage(STORAGE_KEYS.TEMPLATE, template);
    },

    toggleEditorMode: () => {
      set((state) => ({ isEditorMode: !state.isEditorMode }));
    },

    resetToSample: () => {
      const data = InvoiceDataSchema.parse(sampleData);
      set({ data, template: defaultTemplate, dataVersion: get().dataVersion + 1 });
      saveToLocalStorage(STORAGE_KEYS.DATA, data);
      saveToLocalStorage(STORAGE_KEYS.TEMPLATE, defaultTemplate);
    },

    duplicateInvoice: () => {
      const currentData = get().data;
      const duplicatedData = {
        ...currentData,
        invoice: {
          ...currentData.invoice,
          number: `${currentData.invoice.number}-COPY`,
          date: new Date().toISOString().split('T')[0],
        },
      };
      set({ data: duplicatedData, dataVersion: get().dataVersion + 1 });
      saveToLocalStorage(STORAGE_KEYS.DATA, duplicatedData);
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
            dataVersion: get().dataVersion + 1
          });
          saveToLocalStorage(STORAGE_KEYS.DATA, data);
          saveToLocalStorage(STORAGE_KEYS.TEMPLATE, parsed.template);
        } else {
          // Direct data import
          const data = InvoiceDataSchema.parse(parsed);
          set({ data, dataVersion: get().dataVersion + 1 });
          saveToLocalStorage(STORAGE_KEYS.DATA, data);
        }
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        throw new Error('Invalid JSON format');
      }
    },

    exportToJson: () => {
      const { data, template } = get();
      const exportData = {
        version: '1.0.0',
        data,
        template,
        theme: 'cv-default',
      };
      return JSON.stringify(exportData, null, 2);
    },
  };
});
