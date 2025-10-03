# How to Add a New Document Type

The system is now fully data-driven! Adding a new document type requires **NO code changes** - just edit the JSON configuration file.

## Quick Start

To add a new document type (e.g., "Letter", "Contract", "Report"):

1. **Edit `/src/assets/defaults.json`**
2. **Add your document type, template, and theme**
3. **Restart the dev server**

That's it! No TypeScript files to modify.

## Step-by-Step Example: Adding a "Letter" Document Type

### 1. Add Document Type Definition

In `defaults.json`, add to the `documentTypes` array:

```json
{
  "id": "letter",
  "name": "Letter",
  "icon": "Mail",
  "description": "Professional letter template",
  "sections": [
    {
      "id": "sender",
      "name": "Sender",
      "fields": [
        { "id": "name", "name": "Name", "type": "text", "required": true },
        { "id": "address", "name": "Address", "type": "textarea", "required": false },
        { "id": "email", "name": "Email", "type": "email", "required": false }
      ]
    },
    {
      "id": "recipient",
      "name": "Recipient",
      "fields": [
        { "id": "name", "name": "Name", "type": "text", "required": true },
        { "id": "address", "name": "Address", "type": "textarea", "required": false }
      ]
    },
    {
      "id": "letter",
      "name": "Letter Content",
      "fields": [
        { "id": "subject", "name": "Subject", "type": "text", "required": true },
        { "id": "date", "name": "Date", "type": "date", "required": true },
        { "id": "body", "name": "Body", "type": "textarea", "required": true }
      ]
    }
  ],
  "createdAt": 0,
  "updatedAt": 0
}
```

### 2. Add Template

In `defaults.json`, add to the `templates` array:

```json
{
  "id": "letter-default",
  "name": "Default Letter Template",
  "typeId": "letter",
  "content": "<div class=\"letter-preview\">\n  <div class=\"letter-header\">\n    <div><span data-field=\"sender.name\">{{sender.name}}</span></div>\n    <div><span data-field=\"sender.address\">{{sender.address}}</span></div>\n  </div>\n  \n  <div class=\"letter-date\"><span data-field=\"letter.date\">{{letter.date}}</span></div>\n  \n  <div class=\"letter-recipient\">\n    <div><span data-field=\"recipient.name\">{{recipient.name}}</span></div>\n    <div><span data-field=\"recipient.address\">{{recipient.address}}</span></div>\n  </div>\n  \n  <div class=\"letter-subject\">Subject: <span data-field=\"letter.subject\">{{letter.subject}}</span></div>\n  \n  <div class=\"letter-body\"><span data-field=\"letter.body\">{{letter.body}}</span></div>\n</div>",
  "isDefault": true,
  "createdAt": 0,
  "updatedAt": 0
}
```

### 3. Add Theme

In `defaults.json`, add to the `themes` array:

```json
{
  "id": "theme-letter-default",
  "name": "Letter Theme",
  "content": ".letter-preview {\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 40px;\n  font-family: 'Times New Roman', serif;\n  line-height: 1.6;\n}\n\n.letter-header {\n  margin-bottom: 30px;\n}\n\n.letter-date {\n  margin: 20px 0;\n  text-align: right;\n}\n\n.letter-recipient {\n  margin: 30px 0;\n}\n\n.letter-subject {\n  margin: 20px 0;\n  font-weight: bold;\n}\n\n.letter-body {\n  margin-top: 30px;\n  white-space: pre-line;\n}",
  "isDefault": true,
  "createdAt": 0,
  "updatedAt": 0
}
```

## Field Types Reference

Available field types for your document sections:

- `"text"` - Single line text input
- `"textarea"` - Multi-line text input
- `"email"` - Email input
- `"tel"` - Phone number input
- `"url"` - URL input
- `"number"` - Numeric input
- `"date"` - Date picker
- `"array"` - Repeatable array of fields (requires `itemSchema`)

### Array Field Example

```json
{
  "id": "items",
  "name": "Items",
  "type": "array",
  "required": false,
  "itemSchema": [
    { "id": "name", "name": "Item Name", "type": "text", "required": true },
    { "id": "quantity", "name": "Quantity", "type": "number", "required": true }
  ]
}
```

## Mustache Template Syntax

Templates use [Mustache](https://mustache.github.io/) for variable interpolation:

- `{{field.name}}` - Display a field value
- `{{#field}}...{{/field}}` - Conditional section (shows if field has value)
- `{{^field}}...{{/field}}` - Inverted section (shows if field is empty)
- `{{#array}}...{{/array}}` - Iterate over array
- `{{{raw}}}` - Render HTML without escaping

### Template Best Practices

1. **Use `data-field` attributes** for inline editing:
   ```html
   <span data-field="sender.name">{{sender.name}}</span>
   ```

2. **Use `data-item-index` for arrays**:
   ```html
   {{#items}}
   <div data-item-index="{{index}}">
     <span data-field="items.{{index}}.name">{{name}}</span>
   </div>
   {{/items}}
   ```

3. **Wrap arrays in containers** with `data-array-container`:
   ```html
   <div data-array-container="items">
     {{#items}}...{{/items}}
   </div>
   ```

## Icons Reference

Available icons (from Lucide React):

- `FileText` - Documents
- `User` - People/Profile
- `Mail` - Email/Letter
- `FileCheck` - Contracts
- `FileSpreadsheet` - Reports
- `Briefcase` - Business
- `Calendar` - Events
- `Package` - Inventory

See [Lucide Icons](https://lucide.dev/icons/) for more options.

## Export/Import Document Packs

### Export Your Custom Types

You can export your custom document types as a JSON pack:

1. Open browser DevTools console
2. Run: `localStorage.getItem('documentTypes')`
3. Copy the JSON
4. Save as a `.json` file

### Import Document Packs

To import someone else's document pack:

1. Edit `/src/assets/defaults.json`
2. Add their document types, templates, and themes
3. Restart the app

## Notes

- **IDs must be unique** across all document types, templates, and themes
- **Template typeId** must match the document type ID
- **Timestamps** (createdAt/updatedAt) can be set to `0` - they'll be auto-generated
- **HTML in templates** will be sanitized for security
- **CSS is scoped** to prevent conflicts between themes

## Future Enhancements

Phase 2-4 will add UI features for:
- Creating document types in the app
- Duplicating existing types
- Importing/exporting JSON packs
- Visual template editor
- Theme customization UI
