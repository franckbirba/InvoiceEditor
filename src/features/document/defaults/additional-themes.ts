import type { Theme } from '../document.schema';

// Thème Black & White Sobre
export const blackWhiteTheme: Theme = {
  id: 'theme-invoice-blackwhite',
  name: 'Noir & Blanc Sobre',
  typeId: 'facture',
  isDefault: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  content: `:root {
  /* Colors - Minimal B&W */
  --color-bg: #ffffff;
  --color-fg: #000000;
  --color-muted: #666666;
  --color-accent: #000000;
  --color-border: #000000;
  --color-light-border: #e0e0e0;

  /* Typography - Professional */
  --font-main: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --h1: 32px;
  --h2: 14px;
  --text: 12px;

  /* Layout */
  --page-w: 800px;
  --page-pad: 48px;
  --gap: 20px;
}

.invoice-preview {
  max-width: var(--page-w);
  margin: 0 auto;
  padding: var(--page-pad);
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-main);
  font-size: var(--text);
  line-height: 1.6;
}

.invoice-header {
  border-bottom: 2px solid var(--color-fg);
  padding-bottom: 16px;
  margin-bottom: 32px;
}

.invoice-title {
  font-size: var(--h1);
  font-weight: 300;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0 0 12px 0;
}

.invoice-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.invoice-meta strong {
  font-weight: 600;
}

.section-title {
  font-size: var(--h2);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin: 24px 0 12px 0;
  border-bottom: 1px solid var(--color-light-border);
  padding-bottom: 6px;
}

.info-box {
  padding: 0;
  margin-bottom: 16px;
  font-size: var(--text);
  line-height: 1.8;
}

.info-box strong {
  font-weight: 600;
}

.highlight-box {
  padding: 16px;
  margin: 16px 0;
  background: #f5f5f5;
  border-left: 3px solid var(--color-fg);
  font-size: var(--text);
}

.header-separator {
  border-top: 1px solid var(--color-fg);
  margin: 12px 0;
}

.table-wrapper {
  margin: 20px 0;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.invoice-table thead th {
  text-align: left;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 10px 8px;
  border-bottom: 2px solid var(--color-fg);
  border-top: 2px solid var(--color-fg);
}

.invoice-table tbody tr {
  border-bottom: 1px solid var(--color-light-border);
}

.invoice-table tbody tr:last-child {
  border-bottom: none;
}

.invoice-table td {
  padding: 10px 8px;
  vertical-align: top;
}

.invoice-table td.text-right {
  text-align: right;
}

.summary-section {
  margin: 24px 0;
  border-top: 2px solid var(--color-fg);
  padding-top: 16px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: var(--text);
}

.summary-row.total {
  font-size: 18px;
  font-weight: 600;
  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid var(--color-fg);
}

.footer-section {
  margin-top: 48px;
  padding-top: 16px;
  border-top: 1px solid var(--color-light-border);
  font-size: 10px;
  color: var(--color-muted);
  text-align: center;
}`
};

// Thème Coloré façon Google
export const googleTheme: Theme = {
  id: 'theme-invoice-google',
  name: 'Coloré Google',
  typeId: 'facture',
  isDefault: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  content: `:root {
  /* Colors - Google Palette */
  --color-blue: #4285f4;
  --color-red: #ea4335;
  --color-yellow: #fbbc04;
  --color-green: #34a853;
  --color-bg: #ffffff;
  --color-fg: #202124;
  --color-muted: #5f6368;
  --color-border: #dadce0;
  --color-hover: #f8f9fa;

  /* Typography - Google Sans inspired */
  --font-main: -apple-system, BlinkMacSystemFont, 'Google Sans', 'Segoe UI', Roboto, sans-serif;
  --h1: 28px;
  --h2: 14px;
  --text: 13px;

  /* Layout */
  --page-w: 800px;
  --page-pad: 40px;
  --radius: 8px;
}

.invoice-preview {
  max-width: var(--page-w);
  margin: 0 auto;
  padding: var(--page-pad);
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-main);
  font-size: var(--text);
  line-height: 1.6;
}

.invoice-header {
  background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-green) 100%);
  margin: -40px -40px 32px -40px;
  padding: 32px 40px;
  color: white;
  border-radius: var(--radius) var(--radius) 0 0;
}

.invoice-title {
  font-size: var(--h1);
  font-weight: 500;
  letter-spacing: 0.5px;
  margin: 0 0 16px 0;
}

.invoice-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  opacity: 0.95;
}

.invoice-meta strong {
  font-weight: 500;
}

.section-title {
  font-size: var(--h2);
  font-weight: 500;
  color: var(--color-blue);
  margin: 24px 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-blue);
  display: inline-block;
  min-width: 150px;
}

.info-box {
  padding: 16px;
  margin-bottom: 16px;
  background: var(--color-hover);
  border-radius: var(--radius);
  font-size: var(--text);
  line-height: 1.8;
}

.info-box strong {
  color: var(--color-blue);
  font-weight: 500;
}

.highlight-box {
  padding: 16px;
  margin: 16px 0;
  background: #e8f0fe;
  border-left: 4px solid var(--color-blue);
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: var(--text);
}

.header-separator {
  display: none;
}

.table-wrapper {
  margin: 20px 0;
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.invoice-table thead th {
  text-align: left;
  font-size: 12px;
  font-weight: 500;
  padding: 14px 16px;
  background: var(--color-hover);
  color: var(--color-fg);
  border-bottom: 2px solid var(--color-border);
}

.invoice-table tbody tr {
  border-bottom: 1px solid var(--color-border);
  transition: background 0.2s;
}

.invoice-table tbody tr:hover {
  background: var(--color-hover);
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
}

.summary-section {
  margin: 24px 0;
  padding: 20px;
  background: linear-gradient(135deg, #e8f0fe 0%, #fce8e6 100%);
  border-radius: var(--radius);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: var(--text);
}

.summary-row.total {
  font-size: 20px;
  font-weight: 500;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 2px solid var(--color-blue);
  color: var(--color-blue);
}

.footer-section {
  margin-top: 32px;
  padding: 16px;
  background: var(--color-hover);
  border-radius: var(--radius);
  font-size: 11px;
  color: var(--color-muted);
  text-align: center;
}`
};

// Thème Google Docs
export const googleDocsTheme: Theme = {
  id: 'theme-invoice-gdocs',
  name: 'Style Google Docs',
  typeId: 'facture',
  isDefault: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  content: `:root {
  /* Colors - Google Docs */
  --color-bg: #ffffff;
  --color-fg: #000000;
  --color-muted: #666666;
  --color-accent: #1a73e8;
  --color-border: #c7c7c7;
  --color-light-bg: #f9fbfd;

  /* Typography - Classic Document */
  --font-main: Arial, sans-serif;
  --font-title: 'Times New Roman', serif;
  --h1: 26px;
  --h2: 13px;
  --text: 11pt;

  /* Layout - A4 Document */
  --page-w: 816px;
  --page-pad: 96px;
}

.invoice-preview {
  max-width: var(--page-w);
  margin: 0 auto;
  padding: var(--page-pad);
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-main);
  font-size: var(--text);
  line-height: 1.5;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.invoice-header {
  text-align: center;
  margin-bottom: 32px;
}

.invoice-title {
  font-family: var(--font-title);
  font-size: var(--h1);
  font-weight: bold;
  margin: 0 0 16px 0;
  color: var(--color-fg);
}

.invoice-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11pt;
  margin: 16px 0;
  padding: 8px 0;
}

.invoice-meta strong {
  font-weight: bold;
}

.section-title {
  font-size: var(--h2);
  font-weight: bold;
  margin: 20px 0 8px 0;
  color: var(--color-fg);
  text-decoration: underline;
}

.info-box {
  padding: 8px 0;
  margin-bottom: 12px;
  font-size: var(--text);
  line-height: 1.6;
}

.info-box strong {
  font-weight: bold;
}

.highlight-box {
  padding: 12px;
  margin: 12px 0;
  background: var(--color-light-bg);
  border: 1px solid var(--color-border);
  font-size: var(--text);
  font-style: italic;
}

.header-separator {
  border-top: 1px solid var(--color-border);
  margin: 12px 0;
}

.table-wrapper {
  margin: 16px 0;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11pt;
  border: 1px solid var(--color-border);
}

.invoice-table thead th {
  text-align: left;
  font-weight: bold;
  padding: 8px;
  background: var(--color-light-bg);
  border: 1px solid var(--color-border);
}

.invoice-table tbody tr {
  border: 1px solid var(--color-border);
}

.invoice-table td {
  padding: 8px;
  border: 1px solid var(--color-border);
  vertical-align: top;
}

.invoice-table td.text-right {
  text-align: right;
}

.summary-section {
  margin: 20px 0;
  padding: 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: var(--text);
}

.summary-row.total {
  font-size: 14pt;
  font-weight: bold;
  padding-top: 8px;
  margin-top: 8px;
  border-top: 2px solid var(--color-fg);
}

.footer-section {
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  font-size: 9pt;
  color: var(--color-muted);
  line-height: 1.4;
}`
};
