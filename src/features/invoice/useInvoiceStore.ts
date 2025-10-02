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
