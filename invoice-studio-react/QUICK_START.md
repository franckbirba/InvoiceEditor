# Invoice Studio - Quick Start Guide

## 🚀 Getting Started

### Installation
```bash
cd invoice-studio-react
npm install
```

### Development
```bash
npm run dev
```

Open http://localhost:5173

### Build for Production
```bash
npm run build
npm run preview
```

## 📋 Key Features

### 1. Edit Invoice
- Fill sender and client info in the left sidebar
- Add line items with prices
- Configure taxes and discounts
- Auto-saves to localStorage every 300ms

### 2. Live Preview
- Real-time preview with CV theme
- A4 format optimized for print
- Toggle between Preview and Template Editor

### 3. Template Editor
Click "Edit Template" to customize the HTML template with Mustache placeholders.

**Available Placeholders:**
- `{{sender.name}}` - Sender name
- `{{client.name}}` - Client name  
- `{{invoice.number}}` - Invoice number
- `{{formatted.total}}` - Formatted total amount
- `{{#items_with_totals}}...{{/items_with_totals}}` - Loop items

### 4. Import/Export
- Export: Downloads JSON with data + template
- Import: Drag & drop or upload JSON file
- Validates data with Zod schema

### 5. Print & PDF
- **Print**: Click Print button or `Ctrl/Cmd + P`
- **PDF Export**: Uses html2pdf.js (in Topbar actions)

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + P` - Print invoice
- `Ctrl/Cmd + S` - Export JSON
- `Ctrl/Cmd + E` - Toggle Preview/Editor

## 🎨 Customization

### Change Theme Colors
Edit `src/styles/theme-cv.css`:
```css
:root {
  --color-accent: #2563eb; /* Change this */
}
```

### Modify Template
1. Click "Edit Template"
2. Edit HTML with Mustache syntax
3. Click "Validate" to check placeholders
4. Click "Save"

## 🔧 Project Structure

```
src/
├── components/        # UI components
├── features/invoice/  # Business logic
├── lib/              # Utilities
├── styles/           # CSS files
└── App.tsx           # Main app
```

## 📱 PWA Installation

1. Open the app in Chrome/Edge
2. Click install icon in address bar
3. Works offline after installation!

## 🐛 Troubleshooting

**Build warnings about chunk size?**
- Normal for Monaco Editor
- Consider lazy loading in production

**Styles not loading?**
- Check that all CSS files are imported in `main.tsx`

**Template errors?**
- Use Template Editor's Validate button
- Check placeholder names match schema

## 📦 Bundle Size

- Total: ~1.6 MB (gzipped: ~420 KB)
- Monaco Editor: ~1.2 MB (lazy-loaded)
- Core app: ~370 KB

## ✅ Next Steps

1. Customize the default template
2. Add your logo (base64 in form)
3. Configure taxes for your region
4. Export and backup your templates

Enjoy! 🎉
