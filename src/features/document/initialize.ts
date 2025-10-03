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
import { loadDefaults } from './defaults/defaults-loader';
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

  // Load all defaults from centralized loader
  const { documentTypes, templates, themes } = loadDefaults();
  const [defaultFactureType, defaultCVType] = documentTypes;
  const [defaultFactureTemplate, defaultCVTemplate] = templates;
  const [defaultFactureTheme, defaultCVTheme] = themes;

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
    const existingDefaultTemplate = existingTemplates.find((t) => t.id === template.id);

    // Always update the default template to ensure it has the latest fields
    // Check if the template has the individual tax field attributes (not just the section)
    const hasIndividualTaxFields = existingDefaultTemplate?.content.includes('data-field="summary.taxes.{{index}}.rate"');
    const hasDiscountField = existingDefaultTemplate?.content.includes('data-field="items.{{index}}.discount"');

    if (!existingDefaultTemplate || !hasIndividualTaxFields || !hasDiscountField) {
      console.log('Creating or updating default facture template with tax rate and discount fields...');
      // Force update with new timestamp
      const updatedTemplate = {
        ...template,
        updatedAt: Date.now(),
      };
      saveTemplate(updatedTemplate);
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
    const existingDefaultTemplate = existingTemplates.find((t) => t.id === defaultFactureTemplate.id);

    // Always update the default template to ensure it has the latest fields
    // Check if the template has the individual tax field attributes (not just the section)
    const hasIndividualTaxFields = existingDefaultTemplate?.content.includes('data-field="summary.taxes.{{index}}.rate"');
    const hasDiscountField = existingDefaultTemplate?.content.includes('data-field="items.{{index}}.discount"');

    if (!existingDefaultTemplate || !hasIndividualTaxFields || !hasDiscountField) {
      console.log('Creating or updating default facture template with tax rate and discount fields...');
      const template = {
        ...defaultFactureTemplate,
        content: templateContent,
        updatedAt: Date.now(),
      };
      saveTemplate(template);
    }
    // Always update CV template to ensure latest version
    const cvTemplate = {
      ...defaultCVTemplate,
      content: defaultCVTemplate.content,
      updatedAt: Date.now(),
    };
    saveTemplate(cvTemplate);

    const existingThemes = getThemes();
    if (!existingThemes.find((t) => t.id === defaultFactureTheme.id)) {
      const theme = {
        ...defaultFactureTheme,
        content: themeContent,
      };
      saveTheme(theme);
    }

    // Always update CV theme to ensure latest version
    const cvTheme = {
      ...defaultCVTheme,
      updatedAt: Date.now(),
    };
    saveTheme(cvTheme);

    // Add default invoice theme
    const defaultInvoiceTheme = {
      id: 'theme-invoice-default',
      name: 'Thème Facture par défaut',
      isDefault: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingThemes.find((t) => t.id === defaultInvoiceTheme.id)) {
      const invoiceThemeContent = `:root {
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

      const invoiceTheme = {
        ...defaultInvoiceTheme,
        content: invoiceThemeContent,
      };
      saveTheme(invoiceTheme);
    }

    // Add Classic Black & White theme - Minimalist & Elegant
    const classicTheme = {
      id: 'theme-classic-bw',
      name: 'Noir & Blanc Élégant',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingThemes.find((t) => t.id === classicTheme.id)) {
      const classicThemeContent = `:root {
  /* Colors - Minimalist Black & White */
  --color-bg: #ffffff;
  --color-fg: #1a1a1a;
  --color-muted: #737373;
  --color-accent: #000000;
  --color-red: #1a1a1a;
  --color-border: #e5e5e5;
  --color-box: #f9f9f9;
  --chip-bg: #f3f3f3;
  --chip-fg: #1a1a1a;

  /* Typography - Professional Sans */
  --font-mono: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  --h1: 32px;
  --h2: 14px;
  --text: 13px;
  --mono: 12px;
  --tracking: -0.5px;

  /* Layout */
  --page-w: 800px;
  --page-pad: 60px;
  --radius: 0px;
  --gap: 20px;
  --line: 1px;
  --band: 2px;
}

/* Invoice Preview Styles */
.invoice-preview {
  max-width: var(--page-w);
  margin: 0 auto;
  padding: var(--page-pad);
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-mono);
  font-size: var(--text);
  line-height: 1.6;
  letter-spacing: var(--tracking);
}

.invoice-header {
  margin-bottom: 48px;
  padding-bottom: 32px;
  border-bottom: var(--band) solid var(--color-fg);
}

.invoice-title {
  font-size: var(--h1);
  font-weight: 300;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0 0 20px 0;
  color: var(--color-fg);
}

.invoice-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 16px;
}

.invoice-meta strong {
  color: var(--color-fg);
  font-weight: 500;
}

.section-title {
  color: var(--color-fg);
  font-size: 11px;
  margin: 32px 0 12px 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.info-box {
  padding: 0;
  margin-bottom: 24px;
  font-size: var(--text);
  line-height: 1.8;
}

.info-box strong {
  color: var(--color-fg);
  font-weight: 500;
}

.highlight-box {
  padding: 16px 0;
  margin: 16px 0;
  border-left: none;
  border-top: var(--line) solid var(--color-border);
  border-bottom: var(--line) solid var(--color-border);
  font-size: var(--text);
}

.header-separator {
  border-top: var(--line) solid var(--color-border);
  margin: 16px 0;
}

.table-wrapper {
  padding: 0;
  margin: 32px 0;
  border-top: var(--band) solid var(--color-fg);
  border-bottom: var(--band) solid var(--color-fg);
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 12px;
}

.invoice-table thead th {
  text-align: left;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 16px 12px;
  border-bottom: var(--line) solid var(--color-border);
  color: var(--color-muted);
}

.invoice-table tbody tr {
  border-bottom: var(--line) solid var(--color-border);
}

.invoice-table tbody tr:last-child {
  border-bottom: none;
}

.invoice-table td {
  padding: 12px;
  vertical-align: top;
}

.invoice-table td.text-right {
  text-align: right;
  font-weight: 500;
}

.summary-section {
  padding: 0;
  margin: 32px 0;
  max-width: 400px;
  margin-left: auto;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: var(--line) solid var(--color-border);
  font-size: var(--text);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total {
  font-size: 18px;
  font-weight: 500;
  border-top: var(--band) solid var(--color-fg);
  border-bottom: none;
  margin-top: 12px;
  padding-top: 16px;
  color: var(--color-fg);
}

.footer-section {
  margin-top: 48px;
  padding-top: 24px;
  font-size: 10px;
  color: var(--color-muted);
  text-align: center;
  border-top: var(--line) solid var(--color-border);
}`;

      const classicThemeObj = {
        ...classicTheme,
        content: classicThemeContent,
      };
      saveTheme(classicThemeObj);
    }

    // Add Google-style professional theme - Clean & Modern
    const googleTheme = {
      id: 'theme-google-colorful',
      name: 'Moderne Bleu',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingThemes.find((t) => t.id === googleTheme.id)) {
      const googleThemeContent = `:root {
  /* Colors - Modern Blue */
  --color-bg: #ffffff;
  --color-fg: #202124;
  --color-muted: #5f6368;
  --color-accent: #1967d2;
  --color-red: #d93025;
  --color-border: #e8eaed;
  --color-box: #f8f9fa;
  --chip-bg: #e8f0fe;
  --chip-fg: #1967d2;

  /* Typography - Google Sans inspired */
  --font-mono: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Google Sans', sans-serif;
  --h1: 28px;
  --h2: 14px;
  --text: 13px;
  --mono: 13px;
  --tracking: -0.2px;

  /* Layout */
  --page-w: 800px;
  --page-pad: 48px;
  --radius: 8px;
  --gap: 16px;
  --line: 1px;
  --band: 3px;
}

/* Invoice Preview Styles */
.invoice-preview {
  max-width: var(--page-w);
  margin: 0 auto;
  padding: var(--page-pad);
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-mono);
  font-size: var(--text);
  line-height: 1.6;
  letter-spacing: var(--tracking);
}

.invoice-header {
  margin-bottom: 40px;
  padding-bottom: 24px;
  border-bottom: var(--band) solid var(--color-accent);
}

.invoice-title {
  font-size: var(--h1);
  font-weight: 500;
  margin: 0 0 16px 0;
  color: var(--color-fg);
}

.invoice-meta {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 13px;
  color: var(--color-muted);
}

.invoice-meta strong {
  color: var(--color-accent);
  font-weight: 500;
}

.section-title {
  color: var(--color-accent);
  font-size: 11px;
  margin: 32px 0 12px 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-box {
  padding: 16px;
  margin-bottom: 20px;
  font-size: var(--text);
  line-height: 1.8;
  background: var(--color-box);
  border-radius: var(--radius);
  border-left: 4px solid var(--color-accent);
}

.info-box strong {
  color: var(--color-fg);
  font-weight: 500;
}

.highlight-box {
  padding: 16px;
  margin: 20px 0;
  border-radius: var(--radius);
  background: var(--chip-bg);
  border-left: 4px solid var(--color-accent);
  font-size: var(--text);
}

.header-separator {
  border-top: var(--line) solid var(--color-border);
  margin: 16px 0;
}

.table-wrapper {
  padding: 0;
  margin: 32px 0;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 13px;
  background: white;
}

.invoice-table thead th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px;
  background: var(--color-box);
  color: var(--color-fg);
  border-bottom: 2px solid var(--color-accent);
}

.invoice-table tbody tr {
  border-bottom: var(--line) solid var(--color-border);
}

.invoice-table tbody tr:last-child {
  border-bottom: none;
}

.invoice-table td {
  padding: 14px 16px;
  vertical-align: top;
}

.invoice-table td.text-right {
  text-align: right;
  font-weight: 500;
}

.summary-section {
  padding: 24px;
  margin: 32px 0;
  background: linear-gradient(135deg, var(--chip-bg) 0%, var(--color-box) 100%);
  border-radius: var(--radius);
  border: 1px solid var(--color-border);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: var(--text);
  color: var(--color-fg);
}

.summary-row.total {
  font-size: 20px;
  font-weight: 500;
  border-top: 2px solid var(--color-accent);
  margin-top: 12px;
  padding-top: 16px;
  color: var(--color-accent);
}

.footer-section {
  margin-top: 48px;
  padding-top: 20px;
  font-size: 11px;
  color: var(--color-muted);
  text-align: center;
  border-top: var(--line) solid var(--color-border);
}`;

      const googleThemeObj = {
        ...googleTheme,
        content: googleThemeContent,
      };
      saveTheme(googleThemeObj);
    }

    // Add Google Docs-style theme - Document Style
    const googleDocsTheme = {
      id: 'theme-google-docs',
      name: 'Style Document',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingThemes.find((t) => t.id === googleDocsTheme.id)) {
      const googleDocsThemeContent = `:root {
  /* Colors - Google Docs Style (Authentic) */
  --color-bg: #ffffff;
  --color-fg: #202124;
  --color-muted: #5f6368;
  --color-accent: #1a73e8;
  --color-red: #d93025;
  --color-border: #dadce0;
  --color-box: #f8f9fa;
  --chip-bg: #e8f0fe;
  --chip-fg: #1a73e8;

  /* Typography - Google Docs Authentic */
  --font-mono: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
  --h1: 24pt;
  --h2: 12pt;
  --text: 11pt;
  --mono: 11pt;
  --tracking: 0px;

  /* Layout - Google Docs Standard */
  --page-w: 794px;
  --page-pad: 72px;
  --radius: 0px;
  --gap: 12pt;
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
  line-height: 1.15;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.invoice-header {
  margin-bottom: 18pt;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 12pt;
}

.invoice-title {
  font-size: var(--h1);
  font-weight: 400;
  letter-spacing: var(--tracking);
  text-transform: none;
  margin: 0 0 12pt 0;
  color: var(--color-fg);
  line-height: 1.2;
}

.invoice-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: var(--h2);
  color: var(--color-fg);
  margin: 12pt 0;
  font-weight: 400;
}

.invoice-meta strong {
  color: var(--color-fg);
  font-weight: 400;
}

.section-title {
  color: var(--color-fg);
  font-size: var(--h2);
  margin: 18pt 0 6pt 0;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0px;
  border-bottom: none;
  padding-bottom: 0px;
}

.info-box {
  padding: 0;
  margin-bottom: 12pt;
  font-size: var(--text);
  line-height: 1.15;
  background: transparent;
  border: none;
}

.info-box strong {
  color: var(--color-fg);
  font-weight: 400;
}

.highlight-box {
  padding: 0;
  margin: 12pt 0;
  border: none;
  background: transparent;
  font-size: var(--text);
  font-weight: 400;
}

.header-separator {
  border-top: var(--band) solid var(--color-border);
  margin: 12pt 0;
}

.table-wrapper {
  padding: 0;
  margin: 12pt 0;
  background: transparent;
  border: none;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: var(--text);
  background: transparent;
  border: 1px solid var(--color-border);
}

.invoice-table thead th {
  text-align: left;
  font-size: var(--text);
  font-weight: 400;
  text-transform: none;
  padding: 6pt 12pt;
  border: 1px solid var(--color-border);
  background: var(--color-box);
  color: var(--color-fg);
}

.invoice-table tbody tr {
  border: 1px solid var(--color-border);
}

.invoice-table tbody tr:last-child {
  border-bottom: 1px solid var(--color-border);
}

.invoice-table tbody tr:nth-child(even) {
  background: var(--color-box);
}

.invoice-table td {
  padding: 6pt 12pt;
  vertical-align: top;
  border: 1px solid var(--color-border);
}

.invoice-table td.text-right {
  text-align: right;
  font-weight: 400;
}

.summary-section {
  padding: 0;
  margin: 18pt 0;
  background: transparent;
  border: none;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 3pt 0;
  border-bottom: none;
  font-size: var(--text);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total {
  font-size: var(--h2);
  font-weight: 400;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  margin-top: 6pt;
  padding-top: 6pt;
  color: var(--color-fg);
  background: transparent;
}

.footer-section {
  margin-top: 24pt;
  font-size: 10pt;
  color: var(--color-muted);
  text-align: left;
  border-top: 1px solid var(--color-border);
  padding-top: 12pt;
}`;

      const googleDocsThemeObj = {
        ...googleDocsTheme,
        content: googleDocsThemeContent,
      };
      saveTheme(googleDocsThemeObj);
    }

    // Add Dense Template - Compact & Efficient
    const denseTemplate = {
      id: 'template-facture-dense',
      name: 'Facture Compacte',
      typeId: 'facture',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingTemplates.find((t) => t.id === denseTemplate.id)) {
      const denseTemplateContent = `<div class="invoice-preview" id="invoice-content">
  <!-- Header compact -->
  <div class="invoice-header">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <div class="invoice-title">FACTURE</div>
      <div style="font-size: 13px;">
        <span style="color: var(--color-muted);">N°</span> <strong>{{invoice.number}}</strong>
        <span style="margin: 0 8px;">•</span>
        <span>{{formatted.date}}</span>
      </div>
    </div>
  </div>

  <!-- Informations compactes en 2 colonnes -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 24px 0;">
    <div>
      <div class="section-title">Émetteur</div>
      <div class="info-box" style="margin: 0;">
        <div style="font-weight: 500;">{{sender.name}}</div>
        {{#sender.address}}<div style="font-size: 12px;">{{sender.address}}</div>{{/sender.address}}
        {{#sender.email}}<div style="font-size: 12px;">{{sender.email}}</div>{{/sender.email}}
        {{#sender.phone}}<div style="font-size: 12px;">{{sender.phone}}</div>{{/sender.phone}}
      </div>
    </div>
    <div>
      <div class="section-title">Client</div>
      <div class="info-box" style="margin: 0;">
        <div style="font-weight: 500;">{{client.name}}</div>
        {{#client.address}}<div style="font-size: 12px;">{{client.address}}</div>{{/client.address}}
        {{#client.email}}<div style="font-size: 12px;">{{client.email}}</div>{{/client.email}}
        {{#client.phone}}<div style="font-size: 12px;">{{client.phone}}</div>{{/client.phone}}
      </div>
    </div>
  </div>

  {{#invoice.subject}}
  <div class="highlight-box" style="margin: 20px 0; font-size: 13px;">
    <strong style="color: var(--color-accent);">Objet:</strong> {{invoice.subject}}
  </div>
  {{/invoice.subject}}

  <!-- Tableau unifié avec prestations et récapitulatif -->
  <div class="section-title">Détail et récapitulatif</div>
  <div class="table-wrapper">
    <table class="invoice-table" style="font-size: 12px;">
      <thead>
        <tr>
          <th style="width: 50%;">DÉSIGNATION</th>
          <th style="width: 12%; text-align: center;">QTÉ</th>
          <th style="width: 19%; text-align: right;">P.U.</th>
          <th style="width: 19%; text-align: right;">TOTAL</th>
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

        <!-- Ligne de séparation -->
        <tr style="height: 8px;">
          <td colspan="4" style="border: none; padding: 0;"></td>
        </tr>

        <!-- Récapitulatif intégré -->
        <tr style="background: var(--color-box);">
          <td colspan="3" style="padding: 10px 12px;">Sous-total</td>
          <td class="text-right" style="padding: 10px 12px;">{{formatted.subtotal}}</td>
        </tr>
        {{#totals.taxes}}
        <tr style="background: var(--color-box);">
          <td colspan="3" style="padding: 10px 12px;">{{label}} ({{rate}}%)</td>
          <td class="text-right" style="padding: 10px 12px;">{{amount}}</td>
        </tr>
        {{/totals.taxes}}
        <tr style="font-weight: 500; font-size: 14px; background: var(--color-box);">
          <td colspan="3" style="padding: 12px;">TOTAL À PAYER</td>
          <td class="text-right" style="padding: 12px; color: var(--color-accent);">{{formatted.total}}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Conditions de paiement -->
  {{#invoice.payment_terms}}
  <div style="margin: 20px 0; padding: 12px 0; border-top: 1px solid var(--color-border); font-size: 12px;">
    <strong>Conditions de paiement:</strong> {{invoice.payment_terms}}
  </div>
  {{/invoice.payment_terms}}

  <!-- Footer -->
  {{#footer.legal}}
  <div class="footer-section">
    {{footer.legal}}
  </div>
  {{/footer.legal}}
</div>`;

      const denseTemplateObj = {
        ...denseTemplate,
        content: denseTemplateContent,
      };
      saveTemplate(denseTemplateObj);
    }

    // Add Modern Template - Professional Cards Layout
    const modernTemplate = {
      id: 'template-facture-moderne',
      name: 'Facture en Cartes',
      typeId: 'facture',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingTemplates.find((t) => t.id === modernTemplate.id)) {
      const modernTemplateContent = `<div class="invoice-preview" id="invoice-content">
  <!-- Header moderne -->
  <div class="invoice-header">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <div>
        <div class="invoice-title">FACTURE N° {{invoice.number}}</div>
        <div style="font-size: 13px; color: var(--color-muted); margin-top: 4px;">{{sender.name}}</div>
      </div>
      <div style="text-align: right; font-size: 13px; color: var(--color-muted);">
        <div>{{formatted.date}}</div>
      </div>
    </div>
  </div>

  <!-- Layout en cartes -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 32px 0;">
    <!-- Carte Émetteur -->
    <div style="background: var(--color-box); padding: 20px; border-radius: 8px; border-left: 4px solid var(--color-accent);">
      <div class="section-title" style="margin-top: 0;">ÉMETTEUR</div>
      <div style="line-height: 1.8; font-size: 13px;">
        <div style="font-weight: 500; margin-bottom: 8px;">{{sender.name}}</div>
        {{#sender.address}}<div>{{sender.address}}</div>{{/sender.address}}
        {{#sender.email}}<div>{{sender.email}}</div>{{/sender.email}}
        {{#sender.phone}}<div>{{sender.phone}}</div>{{/sender.phone}}
        {{#sender.bank}}<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--color-border); font-size: 12px;">{{sender.bank}}</div>{{/sender.bank}}
      </div>
    </div>

    <!-- Carte Client -->
    <div style="background: var(--color-box); padding: 20px; border-radius: 8px; border-left: 4px solid var(--color-accent);">
      <div class="section-title" style="margin-top: 0;">CLIENT</div>
      <div style="line-height: 1.8; font-size: 13px;">
        <div style="font-weight: 500; margin-bottom: 8px;">{{client.name}}</div>
        {{#client.address}}<div>{{client.address}}</div>{{/client.address}}
        {{#client.email}}<div>{{client.email}}</div>{{/client.email}}
        {{#client.phone}}<div>{{client.phone}}</div>{{/client.phone}}
        {{#client.reg}}<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--color-border); font-size: 12px;">{{client.reg}}</div>{{/client.reg}}
      </div>
    </div>
  </div>

  <!-- Objet -->
  {{#invoice.subject}}
  <div class="highlight-box">
    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--color-accent); margin-bottom: 8px;">Objet</div>
    <div>{{invoice.subject}}</div>
  </div>
  {{/invoice.subject}}

  <!-- Tableau prestations -->
  <div class="section-title">Détail des prestations</div>
  <div class="table-wrapper">
    <table class="invoice-table">
      <thead>
        <tr>
          <th>DESCRIPTION</th>
          <th style="text-align: center; width: 80px;">QTÉ</th>
          <th style="text-align: right; width: 120px;">P.U.</th>
          <th style="text-align: right; width: 120px;">TOTAL</th>
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

  <!-- Récapitulatif -->
  <div class="summary-section">
    <div class="summary-row">
      <span>Sous-total</span>
      <span>{{formatted.subtotal}}</span>
    </div>
    {{#totals.taxes}}
    <div class="summary-row">
      <span>{{label}} ({{rate}}%)</span>
      <span>{{amount}}</span>
    </div>
    {{/totals.taxes}}
    <div class="summary-row total">
      <span>TOTAL À PAYER</span>
      <span>{{formatted.total}}</span>
    </div>
  </div>

  <!-- Conditions de paiement -->
  {{#invoice.payment_terms}}
  <div style="background: var(--color-box); padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid var(--color-accent);">
    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Conditions de paiement</div>
    <div style="font-size: 13px;">{{invoice.payment_terms}}</div>
  </div>
  {{/invoice.payment_terms}}

  <!-- Footer -->
  {{#footer.legal}}
  <div class="footer-section">
    {{footer.legal}}
  </div>
  {{/footer.legal}}
</div>`;

      const modernTemplateObj = {
        ...modernTemplate,
        content: modernTemplateContent,
      };
      saveTemplate(modernTemplateObj);
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
  // Default template content with data-field attributes for inline editing
  const template = `<div class="invoice-preview" id="invoice-content">
  <div class="invoice-header">
    <div class="invoice-title">FACTURE</div>
    <div class="header-separator"></div>
    <div class="invoice-meta">
      <div><strong>N°</strong> <span data-field="invoice.number">{{invoice.number}}</span></div>
      <div style="font-size: 14px; color: #666;"><span data-field="sender.name">{{sender.name}}</span></div>
      <div><strong>DATE:</strong> <span data-field="invoice.date">{{formatted.date}}</span></div>
    </div>
    <div class="header-separator"></div>
  </div>

  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0;">
    <div>
      <div class="section-title">Émetteur</div>
      <div class="info-box" style="margin-bottom: 0;">
        <strong><span data-field="sender.name">{{sender.name}}</span></strong><br>
        {{#sender.address}}<span data-field="sender.address">{{sender.address}}</span><br>{{/sender.address}}
        {{#sender.email}}📧 <span data-field="sender.email">{{sender.email}}</span><br>{{/sender.email}}
        {{#sender.phone}}📱 <span data-field="sender.phone">{{sender.phone}}</span><br>{{/sender.phone}}
        {{#sender.bank}}<span data-field="sender.bank">{{sender.bank}}</span><br>{{/sender.bank}}
        {{#sender.notes}}<em><span data-field="sender.notes">{{sender.notes}}</span></em>{{/sender.notes}}
      </div>
    </div>
    <div>
      <div class="section-title">Client</div>
      <div class="info-box" style="margin-bottom: 0;">
        <strong><span data-field="client.name">{{client.name}}</span></strong><br>
        {{#client.address}}<span data-field="client.address">{{client.address}}</span><br>{{/client.address}}
        {{#client.email}}📧 <span data-field="client.email">{{client.email}}</span><br>{{/client.email}}
        {{#client.phone}}📱 <span data-field="client.phone">{{client.phone}}</span><br>{{/client.phone}}
        {{#client.bank}}<span data-field="client.bank">{{client.bank}}</span><br>{{/client.bank}}
        {{#client.reg}}<span data-field="client.reg">{{client.reg}}</span><br>{{/client.reg}}
        {{#client.notes}}<em><span data-field="client.notes">{{client.notes}}</span></em>{{/client.notes}}
      </div>
    </div>
  </div>

  {{#invoice.subject}}
  <div class="section-title" style="margin-top: 8px;">Objet</div>
  <div class="highlight-box"><span data-field="invoice.subject">{{invoice.subject}}</span></div>
  {{/invoice.subject}}

  <div class="section-title">Prestations</div>
  <div class="table-wrapper">
    <table class="invoice-table">
      <thead>
        <tr>
          <th>DÉSIGNATION</th>
          <th style="text-align: center;">QTÉ</th>
          <th style="text-align: right;">P.U.</th>
          <th style="text-align: right;">REMISE</th>
          <th style="text-align: right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        {{#items_with_totals}}
        <tr data-item-index="{{index}}">
          <td><span data-field="items.{{index}}.description">{{description}}</span></td>
          <td style="text-align: center;"><span data-field="items.{{index}}.qty">{{qty_formatted}}</span></td>
          <td class="text-right"><span data-field="items.{{index}}.unit_price">{{unit_price_formatted}}</span></td>
          <td class="text-right"><span data-field="items.{{index}}.discount">{{discount}}</span>%</td>
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
    <div class="summary-row" data-tax-index="{{index}}">
      <span><span data-field="summary.taxes.{{index}}.label">{{label}}</span> (<span data-field="summary.taxes.{{index}}.rate">{{rate}}</span>%):</span>
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
  <div class="highlight-box"><span data-field="invoice.payment_terms">{{invoice.payment_terms}}</span></div>
  {{/invoice.payment_terms}}

  <div class="footer-section">
    {{#footer.legal}}<span data-field="footer.legal">{{footer.legal}}</span>{{/footer.legal}}
  </div>
</div>`;

  // Default theme CSS - CV theme
  const theme = `:root {
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
}
`;

  return { template, theme };
}
