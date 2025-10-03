# Document Studio Rendering Rules

This document explains how Document Studio renders documents and the rules LLMs must follow to ensure proper display and editing.

## Rendering Pipeline

```
DocumentType (Schema) + Document (Data) + Template (HTML) + Theme (CSS)
    ↓
Mustache Rendering
    ↓
Data Enrichment (add indices, format values)
    ↓
HTML Output with data-* attributes
    ↓
Apply Theme CSS
    ↓
Enable Inline Editing
```

## Data Flow

### 1. Document Type → Template Mapping

The `DocumentType` defines the structure:
```json
{
  "sections": [
    {
      "id": "sender",
      "fields": [
        {"id": "name", "type": "text"}
      ]
    }
  ]
}
```

The `Template` uses these fields:
```html
<span data-field="sender.name">{{sender.name}}</span>
```

### 2. Data Enrichment

Document Studio automatically enriches data before rendering:

**Array Index Injection:**
```javascript
// Original data
{items: [{desc: "Item 1"}, {desc: "Item 2"}]}

// Enriched data (adds index to each item)
{items: [
  {index: 0, desc: "Item 1"},
  {index: 1, desc: "Item 2"}
]}
```

**Formatted Values:**
```javascript
// Original data
{invoice: {date: "2024-01-15", total: 1500}}

// Enriched with formatted versions
{
  invoice: {date: "2024-01-15", total: 1500},
  formatted: {
    date: "15/01/2024",
    total: "1,500.00 EUR"
  }
}
```

### 3. Inline Editing Activation

After rendering, Document Studio:
1. Finds all elements with `data-field` attributes
2. Makes them `contenteditable`
3. Binds change handlers
4. Adds array add/delete buttons

## Critical Rules for LLMs

### Rule 1: Every Editable Field MUST Have data-field

❌ **Wrong - Not Editable:**
```html
<div>{{sender.name}}</div>
```

✅ **Correct - Editable:**
```html
<div><span data-field="sender.name">{{sender.name}}</span></div>
```

### Rule 2: Arrays MUST Have Three Components

1. **Container** with `data-array-container`
2. **Item wrapper** with `data-item-index`
3. **Field spans** with `data-field`

❌ **Wrong - Missing Container:**
```html
{{#items}}
<div data-item-index="{{index}}">
  <span data-field="items.{{index}}.name">{{name}}</span>
</div>
{{/items}}
```

✅ **Correct - Complete Structure:**
```html
<div data-array-container="items">
  {{#items}}
  <div data-item-index="{{index}}">
    <span data-field="items.{{index}}.name">{{name}}</span>
  </div>
  {{/items}}
</div>
```

### Rule 3: Field Paths MUST Match Data Structure

The `data-field` attribute must exactly match the data path:

```javascript
// Data structure
{
  sender: {
    name: "John"
  },
  items: [
    {description: "Item 1", price: 100}
  ]
}
```

```html
<!-- Correct paths -->
<span data-field="sender.name">{{sender.name}}</span>
<span data-field="items.{{index}}.description">{{description}}</span>
<span data-field="items.{{index}}.price">{{price}}</span>
```

### Rule 4: Use {{index}} for Array Items

Arrays automatically get an `index` property:

```html
{{#items}}
<tr data-item-index="{{index}}">
  <td><span data-field="items.{{index}}.description">{{description}}</span></td>
  <td><span data-field="items.{{index}}.quantity">{{quantity}}</span></td>
</tr>
{{/items}}
```

## Special Rendering Behaviors

### Skills Transformation (CV Documents)

For skill fields with asterisks, Document Studio applies special rendering:

```html
<!-- Template -->
<span class="skill-items" data-field="skills.{{index}}.items">
  {{items}}
</span>

<!-- Input data -->
"JavaScript***, React**, CSS*"

<!-- Preview mode renders as -->
<span class="skill-items">
  <span style="color: #1976d2; font-size: 13pt;">JavaScript</span>,
  <span style="color: #7b1fa2; font-size: 11pt;">React</span>,
  <span style="color: #388e3c; font-size: 10pt;">CSS</span>
</span>

<!-- Edit mode shows raw -->
"JavaScript***, React**, CSS*"
```

### Conditional Display

Use Mustache conditionals to hide empty fields:

```html
{{#client.email}}
<div class="contact-line">
  📧 <span data-field="client.email">{{client.email}}</span>
</div>
{{/client.email}}
```

**Rendering logic:**
- If `client.email` exists → div is shown
- If `client.email` is empty → div is hidden

### Computed Values

Some values are computed and should NOT have `data-field`:

```html
<!-- Computed total - not editable -->
<div class="total">
  Total: {{formatted.total}}
</div>

<!-- Source values - editable -->
<span data-field="items.{{index}}.quantity">{{quantity}}</span>
<span data-field="items.{{index}}.unit_price">{{unit_price}}</span>
```

## Interactive Elements

### Add/Delete Buttons (Auto-Generated)

Document Studio automatically adds buttons for arrays:

```html
<!-- Your template -->
<div data-array-container="experiences">
  {{#experiences}}
  <div data-item-index="{{index}}">
    ...
  </div>
  {{/experiences}}
</div>

<!-- Rendered with buttons (auto-injected) -->
<div data-array-container="experiences">
  <div data-item-index="0">
    <button class="delete-array-item-btn">🗑️</button>
    ...
  </div>
  <button class="add-array-item-btn">+ Add Experience</button>
</div>
```

**Rules:**
- Don't manually add delete/add buttons in templates
- They're auto-injected based on `data-array-container` and `data-item-index`
- Position is controlled by CSS

### Edit Mode vs Preview Mode

Document Studio has two modes:

**Edit Mode:**
- Shows `data-field` elements as contenteditable
- Shows array add/delete buttons
- Shows raw content (e.g., asterisks in skills)

**Preview Mode:**
- Read-only display
- Hides buttons
- Applies transformations (e.g., colors for skills)

Templates should work in BOTH modes.

## Data Type Handling

### Text Fields
```html
<span data-field="client.name">{{client.name}}</span>
```

### Dates
```html
<!-- Use formatted version for display -->
<span data-field="invoice.date">{{formatted.date}}</span>

<!-- Or raw value -->
<span data-field="invoice.date">{{invoice.date}}</span>
```

### Numbers/Currency
```html
<!-- Formatted -->
<span>{{formatted.total}}</span>

<!-- Raw for editing -->
<span data-field="items.{{index}}.price">{{unit_price}}</span>
```

### Textareas (Multi-line)
```html
<!-- Preserves line breaks -->
<div class="description">
  <span data-field="description">{{description}}</span>
</div>
```

CSS should include:
```css
.description span[data-field] {
  white-space: pre-line;
}
```

## Error Handling

### Missing Fields

If template references a field that doesn't exist:
```html
<span data-field="missing.field">{{missing.field}}</span>
```

Result: Empty span (graceful degradation)

### Invalid data-field

If `data-field` doesn't match data structure:
```html
<!-- Data: {sender: {name: "John"}} -->
<span data-field="sender.wrong">{{sender.name}}</span>
```

Result: Field won't be editable (but displays correctly)

### Type Mismatches

Document Studio validates field types:
```javascript
// Field defined as "number"
{id: "quantity", type: "number"}

// If user enters non-number, validation fails
// Original value is restored
```

## Debugging Templates

### Check Required Attributes

Run this in browser console:
```javascript
// Check all data-fields exist
document.querySelectorAll('[data-field]').forEach(el => {
  console.log(el.getAttribute('data-field'), el.textContent);
});

// Check arrays
document.querySelectorAll('[data-array-container]').forEach(el => {
  console.log('Array:', el.getAttribute('data-array-container'));
  const items = el.querySelectorAll('[data-item-index]');
  console.log('Items:', items.length);
});
```

### Validate Data Paths

```javascript
// Test if data-field paths exist in data
const data = {...}; // Your document data
document.querySelectorAll('[data-field]').forEach(el => {
  const path = el.getAttribute('data-field');
  const value = path.split('.').reduce((obj, key) => obj?.[key], data);
  if (value === undefined) {
    console.warn('Missing data for:', path);
  }
});
```

## Performance Considerations

### Minimize DOM Nesting

❌ **Bad - Deep Nesting:**
```html
<div>
  <div>
    <div>
      <div>
        <span data-field="name">{{name}}</span>
      </div>
    </div>
  </div>
</div>
```

✅ **Good - Flat Structure:**
```html
<div class="name-field">
  <span data-field="name">{{name}}</span>
</div>
```

### Use Efficient Selectors

Document Studio queries for:
- `[data-field]`
- `[data-item-index]`
- `[data-array-container]`

Keep DOM flat to make queries faster.

## Security

### HTML Sanitization

All rendered HTML is sanitized using DOMPurify:
- Removes script tags
- Removes event handlers
- Removes dangerous attributes

### Safe vs Unsafe Output

```html
<!-- Safe - automatically escaped -->
<span>{{user.input}}</span>

<!-- Unsafe - renders HTML (use carefully!) -->
<span>{{{user.html}}}</span>
```

**Rule:** Only use `{{{triple}}}` for trusted, pre-sanitized content.

## Summary Checklist

When creating templates, ensure:

- [ ] Root element has ID `{typeId}-content` and class `{typeId}-preview`
- [ ] ALL editable content wrapped in `<span data-field="...">`
- [ ] Arrays have `data-array-container` on wrapper
- [ ] Array items have `data-item-index="{{index}}"`
- [ ] Array fields use `arrayName.{{index}}.fieldName` format
- [ ] Optional fields wrapped in `{{#field}}...{{/field}}`
- [ ] Empty states for arrays using `{{^array}}...{{/array}}`
- [ ] Computed/formatted values don't have `data-field`
- [ ] Template works with empty/missing data
- [ ] CSS classes match theme
