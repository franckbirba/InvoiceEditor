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
  blackWhiteTheme,
  googleTheme,
  googleDocsTheme,
} from './defaults/additional-themes';
import {
  denseTemplate,
  modernTemplate,
} from './defaults/additional-templates';
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

    // Add default invoice theme
    const defaultInvoiceTheme = {
      id: 'theme-invoice-default',
      name: 'Thème Facture par défaut',
      typeId: 'facture',
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

    // Add Classic Black & White theme
    const classicTheme = {
      id: 'theme-classic-bw',
      name: 'Thème Classique Noir & Blanc',
      typeId: 'facture',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingThemes.find((t) => t.id === classicTheme.id)) {
      const classicThemeContent = `:root {
  /* Colors - Classic Black & White */
  --color-bg: #ffffff;
  --color-fg: #000000;
  --color-muted: #666666;
  --color-accent: #000000;
  --color-red: #000000;
  --color-border: #000000;
  --color-box: #f8f8f8;
  --chip-bg: #f0f0f0;
  --chip-fg: #000000;

  /* Typography - Classic */
  --font-mono: 'Times New Roman', serif;
  --h1: 24px;
  --h2: 14px;
  --text: 12px;
  --mono: 12px;
  --tracking: 0px;

  /* Layout */
  --page-w: 794px;
  --page-pad: 40px;
  --radius: 0px;
  --gap: 12px;
  --line: 1px;
  --band: 2px;
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
  line-height: 1.4;
  border: 2px solid var(--color-border);
}

.invoice-header {
  margin-bottom: 20px;
  text-align: center;
  border-bottom: var(--band) solid var(--color-border);
  padding-bottom: 15px;
}

.invoice-title {
  font-size: var(--h1);
  font-weight: bold;
  letter-spacing: var(--tracking);
  text-transform: uppercase;
  margin: 0 0 10px 0;
  color: var(--color-fg);
}

.invoice-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--h2);
  color: var(--color-fg);
  margin: 10px 0;
  font-weight: normal;
}

.invoice-meta strong {
  color: var(--color-red);
  font-weight: bold;
}

.section-title {
  color: var(--color-fg);
  font-size: var(--h2);
  margin: 0 0 8px 0;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 3px;
}

.info-box {
  padding: 10px;
  margin-bottom: 10px;
  font-size: var(--text);
  line-height: 1.4;
  border: 1px solid var(--color-border);
  background: var(--color-box);
}

.info-box strong {
  color: var(--color-red);
  font-weight: bold;
}

.highlight-box {
  padding: 8px 10px;
  margin: 10px 0;
  border: 1px solid var(--color-border);
  background: var(--color-box);
  font-size: var(--text);
  font-weight: normal;
}

.header-separator {
  border-top: var(--band) solid var(--color-border);
  margin: 10px 0;
}

.table-wrapper {
  padding: 0;
  margin: 15px 0;
  border: 1px solid var(--color-border);
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 11px;
  border: 1px solid var(--color-border);
}

.invoice-table thead th {
  text-align: left;
  font-size: 10px;
  font-weight: bold;
  text-transform: uppercase;
  padding: 8px 6px;
  border: 1px solid var(--color-border);
  background: var(--color-box);
  color: var(--color-fg);
}

.invoice-table tbody tr {
  border: 1px solid var(--color-border);
}

.invoice-table tbody tr:nth-child(even) {
  background: var(--color-box);
}

.invoice-table td {
  padding: 6px;
  vertical-align: top;
  border: 1px solid var(--color-border);
}

.invoice-table td.text-right {
  text-align: right;
  font-weight: bold;
}

.summary-section {
  padding: 10px;
  margin: 15px 0;
  border: 2px solid var(--color-border);
  background: var(--color-box);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total {
  font-size: 14px;
  font-weight: bold;
  border-top: 2px solid var(--color-border);
  border-bottom: 2px solid var(--color-border);
  margin-top: 5px;
  padding-top: 8px;
  background: var(--color-fg);
  color: white;
}

.footer-section {
  margin-top: 20px;
  font-size: 10px;
  color: var(--color-muted);
  text-align: center;
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
}`;

      const classicThemeObj = {
        ...classicTheme,
        content: classicThemeContent,
      };
      saveTheme(classicThemeObj);
    }

    // Add Google-style colorful theme
    const googleTheme = {
      id: 'theme-google-colorful',
      name: 'Thème Google Coloré',
      typeId: 'facture',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingThemes.find((t) => t.id === googleTheme.id)) {
      const googleThemeContent = `:root {
  /* Colors - Google Style */
  --color-bg: #ffffff;
  --color-fg: #202124;
  --color-muted: #5f6368;
  --color-accent: #4285f4;
  --color-red: #ea4335;
  --color-border: #dadce0;
  --color-box: #f8f9fa;
  --chip-bg: #e8f0fe;
  --chip-fg: #1a73e8;

  /* Typography - Google Sans */
  --font-mono: 'Google Sans', 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
  --h1: 32px;
  --h2: 16px;
  --text: 14px;
  --mono: 13px;
  --tracking: 0px;

  /* Layout */
  --page-w: 794px;
  --page-pad: 48px;
  --radius: 8px;
  --gap: 24px;
  --line: 1px;
  --band: 3px;
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
  line-height: 1.6;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: var(--radius);
}

.invoice-header {
  margin-bottom: 32px;
  text-align: center;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  padding: 24px;
  border-radius: var(--radius);
  margin: -48px -48px 32px -48px;
}

.invoice-title {
  font-size: var(--h1);
  font-weight: 500;
  letter-spacing: var(--tracking);
  text-transform: uppercase;
  margin: 0 0 12px 0;
  color: white;
}

.invoice-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--h2);
  color: white;
  margin: 12px 0;
  font-weight: 400;
  opacity: 0.9;
}

.invoice-meta strong {
  color: #fbbc04;
  font-weight: 500;
}

.section-title {
  color: var(--color-fg);
  font-size: var(--h2);
  margin: 0 0 12px 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--color-accent);
  padding-bottom: 6px;
  display: inline-block;
}

.info-box {
  padding: 20px;
  margin-bottom: 20px;
  font-size: var(--text);
  line-height: 1.6;
  background: var(--color-box);
  border-radius: var(--radius);
  border-left: 4px solid var(--color-accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.info-box strong {
  color: var(--color-accent);
  font-weight: 500;
}

.highlight-box {
  padding: 16px 20px;
  margin: 16px 0;
  border-left: 4px solid var(--color-accent);
  background: var(--color-box);
  border-radius: var(--radius);
  font-size: var(--text);
  font-weight: 400;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-separator {
  border-top: var(--band) solid var(--color-accent);
  margin: 16px 0;
}

.table-wrapper {
  padding: 20px;
  margin: 24px 0;
  background: var(--color-box);
  border-radius: var(--radius);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  margin: 0;
  font-size: 13px;
  background: white;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.invoice-table thead th {
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  padding: 16px 12px;
  background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
  color: white;
  letter-spacing: 0.5px;
}

.invoice-table tbody tr {
  border-bottom: 1px solid var(--color-border);
}

.invoice-table tbody tr:last-child {
  border-bottom: none;
}

.invoice-table tbody tr:nth-child(even) {
  background: #f8f9fa;
}

.invoice-table tbody tr:hover {
  background: #e8f0fe;
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
  padding: 24px;
  margin: 32px 0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%);
  border-radius: var(--radius);
  border: 2px solid var(--color-accent);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text);
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.total {
  font-size: 18px;
  font-weight: 500;
  border-top: 3px solid var(--color-accent);
  border-bottom: 3px solid var(--color-accent);
  margin-top: 12px;
  padding-top: 16px;
  color: var(--color-accent);
  background: white;
  border-radius: var(--radius);
  padding: 16px;
}

.footer-section {
  margin-top: 40px;
  font-size: 12px;
  color: var(--color-muted);
  text-align: center;
  border-top: 1px solid var(--color-border);
  padding-top: 20px;
}`;

      const googleThemeObj = {
        ...googleTheme,
        content: googleThemeContent,
      };
      saveTheme(googleThemeObj);
    }

    // Add Google Docs-style theme
    const googleDocsTheme = {
      id: 'theme-google-docs',
      name: 'Thème Google Docs',
      typeId: 'facture',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingThemes.find((t) => t.id === googleDocsTheme.id)) {
      const googleDocsThemeContent = `:root {
  /* Colors - Google Docs Style */
  --color-bg: #ffffff;
  --color-fg: #202124;
  --color-muted: #5f6368;
  --color-accent: #1a73e8;
  --color-red: #d93025;
  --color-border: #dadce0;
  --color-box: #f8f9fa;
  --chip-bg: #e8f0fe;
  --chip-fg: #1a73e8;

  /* Typography - Google Docs */
  --font-mono: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
  --h1: 28px;
  --h2: 15px;
  --text: 11pt;
  --mono: 11pt;
  --tracking: 0px;

  /* Layout */
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
  margin-bottom: 24pt;
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
  color: var(--color-red);
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

    // Add Dense Template with unified table
    const denseTemplate = {
      id: 'template-facture-dense',
      name: 'Template Facture Dense',
      typeId: 'facture',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingTemplates.find((t) => t.id === denseTemplate.id)) {
      const denseTemplateContent = `<div class="invoice-preview" id="invoice-content">
  <!-- Header compact -->
  <div class="invoice-header">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <div class="invoice-title" style="margin: 0;">FACTURE</div>
      <div style="text-align: right; font-size: 12px;">
        <div><strong>N°</strong> {{invoice.number}}</div>
        <div><strong>DATE:</strong> {{formatted.date}}</div>
      </div>
    </div>
  </div>

  <!-- Informations compactes en 3 colonnes -->
  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 12px 0; font-size: 11px;">
    <div>
      <div class="section-title" style="font-size: 11px; margin-bottom: 4px;">ÉMETTEUR</div>
      <div style="line-height: 1.3;">
        <strong>{{sender.name}}</strong><br>
        {{#sender.address}}{{sender.address}}<br>{{/sender.address}}
        {{#sender.email}}{{sender.email}}<br>{{/sender.email}}
        {{#sender.phone}}{{sender.phone}}{{/sender.phone}}
      </div>
    </div>
    <div>
      <div class="section-title" style="font-size: 11px; margin-bottom: 4px;">CLIENT</div>
      <div style="line-height: 1.3;">
        <strong>{{client.name}}</strong><br>
        {{#client.address}}{{client.address}}<br>{{/client.address}}
        {{#client.email}}{{client.email}}<br>{{/client.email}}
        {{#client.phone}}{{client.phone}}{{/client.phone}}
      </div>
    </div>
    <div>
      <div class="section-title" style="font-size: 11px; margin-bottom: 4px;">DÉTAILS</div>
      <div style="line-height: 1.3;">
        {{#sender.bank}}IBAN: {{sender.bank}}<br>{{/sender.bank}}
        {{#client.reg}}{{client.reg}}<br>{{/client.reg}}
        {{#invoice.subject}}Objet: {{invoice.subject}}{{/invoice.subject}}
      </div>
    </div>
  </div>

  <!-- Tableau unifié avec prestations et récapitulatif -->
  <div class="table-wrapper" style="margin: 16px 0;">
    <table class="invoice-table" style="font-size: 11px;">
      <thead>
        <tr>
          <th style="width: 50%;">DÉSIGNATION</th>
          <th style="width: 10%; text-align: center;">QTÉ</th>
          <th style="width: 15%; text-align: right;">P.U.</th>
          <th style="width: 10%; text-align: center;">REMISE</th>
          <th style="width: 15%; text-align: right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        {{#items_with_totals}}
        <tr>
          <td>{{description}}</td>
          <td style="text-align: center;">{{qty_formatted}}</td>
          <td class="text-right">{{unit_price_formatted}}</td>
          <td style="text-align: center;">{{#discount}}{{discount}}%{{/discount}}{{^discount}}-{{/discount}}</td>
          <td class="text-right"><strong>{{line_total_formatted}}</strong></td>
        </tr>
        {{/items_with_totals}}
        
        <!-- Ligne de séparation -->
        <tr style="border-top: 2px solid var(--color-accent);">
          <td colspan="5" style="padding: 4px 0;"></td>
        </tr>
        
        <!-- Récapitulatif intégré -->
        <tr style="background: var(--color-box);">
          <td colspan="3" style="font-weight: bold;">SOUS-TOTAL</td>
          <td colspan="2" class="text-right" style="font-weight: bold;">{{formatted.subtotal}}</td>
        </tr>
        {{#totals.taxes}}
        <tr style="background: var(--color-box);">
          <td colspan="3">{{label}} ({{rate}}%)</td>
          <td colspan="2" class="text-right">{{amount}}</td>
        </tr>
        {{/totals.taxes}}
        <tr style="background: var(--color-accent); color: white; font-weight: bold; font-size: 12px;">
          <td colspan="3">TOTAL À PAYER</td>
          <td colspan="2" class="text-right">{{formatted.total}}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Conditions de paiement compactes -->
  {{#invoice.payment_terms}}
  <div style="margin: 12px 0; padding: 8px; background: var(--color-box); border-left: 3px solid var(--color-accent); font-size: 11px;">
    <strong>Conditions de paiement:</strong> {{invoice.payment_terms}}
  </div>
  {{/invoice.payment_terms}}

  <!-- Footer minimal -->
  {{#footer.legal}}
  <div class="footer-section" style="margin-top: 16px; font-size: 10px; text-align: center; color: var(--color-muted);">
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

    // Add Modern Template with innovative layout
    const modernTemplate = {
      id: 'template-facture-moderne',
      name: 'Template Facture Moderne',
      typeId: 'facture',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (!existingTemplates.find((t) => t.id === modernTemplate.id)) {
      const modernTemplateContent = `<div class="invoice-preview" id="invoice-content">
  <!-- Header moderne avec logo area -->
  <div class="invoice-header" style="background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent) 100%); color: white; padding: 24px; margin: -32px -32px 24px -32px; border-radius: 0 0 16px 16px;">
    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
      <div>
        <div class="invoice-title" style="margin: 0 0 8px 0; color: white;">FACTURE</div>
        <div style="font-size: 14px; opacity: 0.9;">{{sender.name}}</div>
      </div>
      <div style="text-align: right; background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px;">
        <div style="font-size: 18px; font-weight: bold;">N° {{invoice.number}}</div>
        <div style="font-size: 12px; opacity: 0.9;">{{formatted.date}}</div>
      </div>
    </div>
  </div>

  <!-- Layout en cartes -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
    <!-- Carte Émetteur -->
    <div style="background: var(--color-box); padding: 16px; border-radius: 12px; border-left: 4px solid var(--color-accent);">
      <div class="section-title" style="color: var(--color-accent); margin-bottom: 12px;">👤 ÉMETTEUR</div>
      <div style="line-height: 1.5;">
        <strong style="color: var(--color-fg);">{{sender.name}}</strong><br>
        {{#sender.address}}📍 {{sender.address}}<br>{{/sender.address}}
        {{#sender.email}}📧 {{sender.email}}<br>{{/sender.email}}
        {{#sender.phone}}📱 {{sender.phone}}<br>{{/sender.phone}}
        {{#sender.bank}}🏦 {{sender.bank}}<br>{{/sender.bank}}
        {{#sender.notes}}💼 {{sender.notes}}{{/sender.notes}}
      </div>
    </div>

    <!-- Carte Client -->
    <div style="background: var(--color-box); padding: 16px; border-radius: 12px; border-left: 4px solid var(--color-red);">
      <div class="section-title" style="color: var(--color-red); margin-bottom: 12px;">🏢 CLIENT</div>
      <div style="line-height: 1.5;">
        <strong style="color: var(--color-fg);">{{client.name}}</strong><br>
        {{#client.address}}📍 {{client.address}}<br>{{/client.address}}
        {{#client.email}}📧 {{client.email}}<br>{{/client.email}}
        {{#client.phone}}📱 {{client.phone}}<br>{{/client.phone}}
        {{#client.reg}}📋 {{client.reg}}<br>{{/client.reg}}
        {{#client.notes}}💼 {{client.notes}}{{/client.notes}}
      </div>
    </div>
  </div>

  <!-- Objet en carte -->
  {{#invoice.subject}}
  <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e8f0fe 100%); padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid var(--color-accent);">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
      <span style="font-size: 16px;">📋</span>
      <strong style="color: var(--color-accent);">OBJET</strong>
    </div>
    <div style="color: var(--color-fg);">{{invoice.subject}}</div>
  </div>
  {{/invoice.subject}}

  <!-- Tableau moderne avec design amélioré -->
  <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin: 24px 0;">
    <div style="background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent) 100%); color: white; padding: 16px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">📊</span>
        <strong>DÉTAIL DES PRESTATIONS</strong>
      </div>
    </div>
    
    <table class="invoice-table" style="margin: 0; border: none; font-size: 13px;">
      <thead>
        <tr style="background: var(--color-box);">
          <th style="padding: 16px 20px; text-align: left; font-weight: 600; color: var(--color-fg);">DESCRIPTION</th>
          <th style="padding: 16px 20px; text-align: center; font-weight: 600; color: var(--color-fg);">QTÉ</th>
          <th style="padding: 16px 20px; text-align: right; font-weight: 600; color: var(--color-fg);">PRIX UNIT.</th>
          <th style="padding: 16px 20px; text-align: right; font-weight: 600; color: var(--color-fg);">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        {{#items_with_totals}}
        <tr style="border-bottom: 1px solid #f0f0f0;">
          <td style="padding: 16px 20px;">{{description}}</td>
          <td style="padding: 16px 20px; text-align: center;">{{qty_formatted}}</td>
          <td style="padding: 16px 20px; text-align: right;">{{unit_price_formatted}}</td>
          <td style="padding: 16px 20px; text-align: right; font-weight: 600;">{{line_total_formatted}}</td>
        </tr>
        {{/items_with_totals}}
      </tbody>
    </table>
  </div>

  <!-- Récapitulatif en carte moderne -->
  <div style="background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent) 100%); color: white; padding: 24px; border-radius: 16px; margin: 24px 0;">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
      <span style="font-size: 20px;">💰</span>
      <strong style="font-size: 18px;">RÉCAPITULATIF</strong>
    </div>
    
    <div style="background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>Sous-total:</span>
        <span>{{formatted.subtotal}}</span>
      </div>
      {{#totals.taxes}}
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>{{label}} ({{rate}}%):</span>
        <span>{{amount}}</span>
      </div>
      {{/totals.taxes}}
      <div style="border-top: 2px solid rgba(255,255,255,0.3); padding-top: 12px; margin-top: 12px;">
        <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold;">
          <span>TOTAL À PAYER</span>
          <span>{{formatted.total}}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Conditions de paiement en carte -->
  {{#invoice.payment_terms}}
  <div style="background: var(--color-box); padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid var(--color-red);">
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
      <span style="font-size: 16px;">⏰</span>
      <strong style="color: var(--color-red);">CONDITIONS DE PAIEMENT</strong>
    </div>
    <div style="color: var(--color-fg);">{{invoice.payment_terms}}</div>
  </div>
  {{/invoice.payment_terms}}

  <!-- Footer moderne -->
  {{#footer.legal}}
  <div style="margin-top: 32px; padding: 16px; background: var(--color-box); border-radius: 12px; text-align: center; font-size: 11px; color: var(--color-muted);">
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
