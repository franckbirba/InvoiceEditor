# CSS Requirements for Document Studio Themes

This document outlines the CSS requirements and best practices for creating themes in Document Studio.

## Architecture Overview

Document Studio themes are:
- **Scoped:** All styles use class prefixes to avoid conflicts
- **Variable-driven:** Use CSS custom properties for theming
- **Print-ready:** Include print styles for PDF export
- **Responsive:** Use relative units for scalability

## Required Structure

### 1. CSS Variables (`:root`)

Every theme MUST define these CSS custom properties:

```css
:root {
  /* Colors */
  --color-bg: #ffffff;          /* Background color */
  --color-fg: #333333;          /* Foreground/text color */
  --color-accent: #6aaf50;      /* Primary accent color */
  --color-muted: #666666;       /* Secondary/muted text */
  --color-border: #dddddd;      /* Border and divider color */

  /* Typography */
  --font-mono: 'Courier New', monospace;  /* Primary font */
  --h1: 24px;                   /* Heading 1 size */
  --h2: 18px;                   /* Heading 2 size */
  --text: 14px;                 /* Body text size */

  /* Layout */
  --page-w: 794px;              /* Maximum page width (A4 = 794px) */
  --page-pad: 40px;             /* Page padding */
  --gap: 16px;                  /* Standard spacing */
}
```

### 2. Root Container

Every theme MUST style the main preview container:

```css
.{typeId}-preview {
  max-width: var(--page-w);
  margin: 0 auto;
  padding: var(--page-pad);
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-mono);
  font-size: var(--text);
  line-height: 1.6;
}
```

### 3. Print Styles

Every theme MUST include print media queries:

```css
@media print {
  .{typeId}-preview {
    padding: 20px;
    max-width: 100%;
  }

  /* Prevent page breaks inside important elements */
  .content-box,
  .section,
  table tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }

  /* Hide interactive elements */
  .no-print,
  button {
    display: none !important;
  }
}

@page {
  size: A4;
  margin: 15mm;
}
```

## Class Naming Conventions

### Container Classes
```css
.{typeId}-preview          /* Main container */
.{typeId}-header           /* Document header */
.{typeId}-section          /* Major sections */
.{typeId}-footer           /* Document footer */
```

### Component Classes
```css
.info-box                  /* Information boxes */
.content-box               /* Content containers */
.data-table                /* Tables */
.summary-section           /* Summary/totals */
```

### Utility Classes
```css
.text-right                /* Right-aligned text */
.text-center               /* Center-aligned text */
.text-muted                /* Muted/secondary text */
.mt-1, .mt-2, .mt-3        /* Margin top utilities */
.mb-1, .mb-2, .mb-3        /* Margin bottom utilities */
```

## Component Styling Patterns

### Headers
```css
.{typeId}-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--color-accent);
}

.{typeId}-title {
  font-size: var(--h1);
  font-weight: bold;
  margin: 0;
  color: var(--color-fg);
}
```

### Info Boxes
```css
.info-box {
  padding: 1rem;
  margin-bottom: 1rem;
  background: var(--color-box-bg, #f9f9f9);
  border-radius: 4px;
  line-height: 1.6;
}

.info-box strong {
  color: var(--color-accent);
  font-weight: 600;
}
```

### Tables
```css
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  font-size: var(--text);
}

.data-table thead th {
  text-align: left;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid var(--color-accent);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.85em;
  letter-spacing: 0.5px;
}

.data-table tbody td {
  padding: 0.5rem;
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table .text-right {
  text-align: right;
}
```

### Summary Sections
```css
.summary-section {
  margin-top: 2rem;
  max-width: 400px;
  margin-left: auto;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}

.summary-row.total {
  font-size: 1.2em;
  font-weight: bold;
  border-top: 2px solid var(--color-accent);
  border-bottom: 2px solid var(--color-accent);
  margin-top: 0.5rem;
  padding-top: 0.75rem;
}
```

## Responsive Design

### Use Relative Units
```css
/* ✅ Good - scalable */
.section-title {
  font-size: 1.2rem;
  margin-bottom: 1em;
}

/* ❌ Bad - fixed */
.section-title {
  font-size: 18px;
  margin-bottom: 16px;
}
```

### Flexible Layouts
```css
/* ✅ Good - responsive grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* ❌ Bad - fixed columns */
.info-grid {
  display: flex;
}
.info-grid > div {
  width: 50%;
}
```

## Accessibility

### Color Contrast
```css
/* Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text) */
:root {
  --color-bg: #ffffff;
  --color-fg: #333333;      /* Ratio: 12.6:1 ✅ */
  --color-muted: #666666;   /* Ratio: 5.7:1 ✅ */
}
```

### Focus States
```css
/* Add visible focus states for keyboard navigation */
[contenteditable]:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

## Performance Best Practices

### Low Specificity
```css
/* ✅ Good - low specificity */
.data-table {
  border-collapse: collapse;
}

/* ❌ Bad - high specificity */
.invoice-preview .content .data-table {
  border-collapse: collapse;
}
```

### Avoid !important
```css
/* ✅ Good - no !important */
.text-muted {
  color: var(--color-muted);
}

/* ❌ Bad - use !important only when absolutely necessary */
.text-muted {
  color: var(--color-muted) !important;
}
```

### Group Related Styles
```css
/* ✅ Good - logical grouping */
/* Header Styles */
.document-header { ... }
.document-title { ... }
.document-meta { ... }

/* Table Styles */
.data-table { ... }
.data-table thead th { ... }
.data-table tbody td { ... }
```

## Theme Styles Examples

### Modern Minimal
```css
:root {
  --color-bg: #ffffff;
  --color-fg: #1a1a1a;
  --color-accent: #2563eb;
  --color-muted: #6b7280;
  --color-border: #e5e7eb;
  --font-mono: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --h1: 28px;
  --h2: 18px;
  --text: 14px;
}
```

### Terminal/Tech
```css
:root {
  --color-bg: #ffffff;
  --color-fg: #333333;
  --color-accent: #6aaf50;
  --color-muted: #666666;
  --color-border: #dddddd;
  --font-mono: 'Courier New', 'Monaco', monospace;
  --h1: 24px;
  --h2: 16px;
  --text: 13px;
}
```

### Professional Classic
```css
:root {
  --color-bg: #ffffff;
  --color-fg: #1a1a1a;
  --color-accent: #c9a961;
  --color-muted: #737373;
  --color-border: #d4d4d4;
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Lato', sans-serif;
  --h1: 32px;
  --h2: 20px;
  --text: 14px;
}

.document-preview {
  font-family: var(--font-body);
}

h1, h2, h3 {
  font-family: var(--font-heading);
}
```

## Testing Checklist

- [ ] All required CSS variables defined
- [ ] Root container styled
- [ ] Print styles included (@media print and @page)
- [ ] Color contrast meets WCAG AA
- [ ] Uses relative units (rem, em, %)
- [ ] Low specificity selectors
- [ ] No layout breaks with long content
- [ ] Renders correctly in print preview
- [ ] Works with different document types
- [ ] Mobile responsive (if applicable)

## Common Mistakes to Avoid

❌ **Missing print styles**
```css
/* Incomplete - no print support */
.invoice-preview {
  padding: 40px;
}
```

✅ **Complete with print styles**
```css
.invoice-preview {
  padding: 40px;
}

@media print {
  .invoice-preview {
    padding: 20px;
  }
}
```

❌ **Fixed pixel units everywhere**
```css
.title {
  font-size: 24px;
  margin-bottom: 16px;
}
```

✅ **Relative units**
```css
.title {
  font-size: 1.5rem;
  margin-bottom: 1em;
}
```

❌ **Not scoped to document type**
```css
.header {
  background: blue;
}
```

✅ **Properly scoped**
```css
.invoice-preview .header {
  background: var(--color-accent);
}
```
