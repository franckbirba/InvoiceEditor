import {
  getDocumentTypes,
  saveDocumentType,
  getTemplates,
  saveTemplate,
  getThemes,
  saveTheme,
  getDocuments,
  saveDocument as saveNewDocument,
} from './document.storage';
import {
  defaultFactureType,
  defaultFactureTemplate,
  defaultFactureTheme,
} from './defaults/facture.default';
import {
  defaultCVType,
  defaultCVTemplate,
} from './defaults/cv.default';
import {
  needsMigration,
  getLegacyDocuments,
  migrateInvoiceToDocument,
} from './migration';

/**
 * Initialize the document system with defaults and migrate legacy data if needed
 * This should be called once on application startup
 */
export function initializeDocumentSystem(): {
  migrated: boolean;
  documentCount: number;
} {
  let migrated = false;
  let documentCount = 0;

  // Check if document types exist
  const existingTypes = getDocumentTypes();

  // If no types exist, initialize with default types
  if (existingTypes.length === 0) {
    console.log('Initializing document system with default types...');
    saveDocumentType(defaultFactureType);
    saveDocumentType(defaultCVType);
  }

  // Always check for documents that need migration
  const legacyDocs = getLegacyDocuments();

  if (legacyDocs.length > 0 && needsMigration()) {
    console.log('Migration needed - converting legacy invoices to new format...');
    migrated = true;
    console.log(`Found ${legacyDocs.length} legacy documents to migrate`);

    // Need to load template and theme content first
    const { template: templateContent, theme: themeContent } = loadDefaultAssets();

    // Initialize default template with actual content
    const template = {
      ...defaultFactureTemplate,
      content: templateContent,
    };

    const theme = {
      ...defaultFactureTheme,
      content: themeContent,
    };

    // Initialize default CV template
    const cvTemplate = {
      ...defaultCVTemplate,
      content: defaultCVTemplate.content,
    };

    // Save templates and themes if they don't exist
    const existingTemplates = getTemplates();
    if (!existingTemplates.find((t) => t.id === template.id)) {
      saveTemplate(template);
    }
    if (!existingTemplates.find((t) => t.id === cvTemplate.id)) {
      saveTemplate(cvTemplate);
    }

    const existingThemes = getThemes();
    if (!existingThemes.find((t) => t.id === theme.id)) {
      saveTheme(theme);
    }

    // Migrate each legacy document
    for (const legacy of legacyDocs) {
      const document = migrateInvoiceToDocument(
        legacy,
        template.id,
        theme.id
      );
      saveNewDocument(document);
      documentCount++;
    }

    console.log(`Successfully migrated ${documentCount} documents`);
  } else {
    // No migration needed, just count existing documents
    const existingDocs = getDocuments();
    documentCount = existingDocs.length;

    // Still need to ensure default templates and themes exist
    const { template: templateContent, theme: themeContent } = loadDefaultAssets();

    const existingTemplates = getTemplates();
    if (!existingTemplates.find((t) => t.id === defaultFactureTemplate.id)) {
      const template = {
        ...defaultFactureTemplate,
        content: templateContent,
      };
      saveTemplate(template);
    }
    if (!existingTemplates.find((t) => t.id === defaultCVTemplate.id)) {
      const cvTemplate = {
        ...defaultCVTemplate,
        content: defaultCVTemplate.content,
      };
      saveTemplate(cvTemplate);
    }

    const existingThemes = getThemes();
    if (!existingThemes.find((t) => t.id === defaultFactureTheme.id)) {
      const theme = {
        ...defaultFactureTheme,
        content: themeContent,
      };
      saveTheme(theme);
    }
  }

  return { migrated, documentCount };
}

/**
 * Load default template and theme assets
 * For now, we'll return the default template from the store
 * In the future, this could load from files
 */
function loadDefaultAssets(): { template: string; theme: string } {
  // Default template content
  const template = `<div class="invoice-preview" id="invoice-content">
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

  // For theme, we'll return an empty string for now
  // The actual theme-cv.css will be loaded by the component
  const theme = `/* Theme CV - Default styles */`;

  return { template, theme };
}
