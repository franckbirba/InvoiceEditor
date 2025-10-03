# Mustache Template Guide for Document Studio

Document Studio uses [Mustache](https://mustache.github.io/) for template rendering. This guide covers the specific usage patterns required.

## Basic Syntax

### Variables
```mustache
{{variable}}           <!-- Escaped output -->
{{{variable}}}         <!-- Unescaped output (use carefully!) -->
{{section.field}}      <!-- Nested property access -->
```

### Sections (Conditionals)
```mustache
{{#variable}}
  <!-- Content shown if variable is truthy -->
{{/variable}}

{{^variable}}
  <!-- Content shown if variable is falsy (inverted) -->
{{/variable}}
```

### Arrays (Iteration)
```mustache
{{#items}}
  <!-- Repeated for each item -->
  {{description}} - {{price}}
{{/items}}
```

## Required Attributes for Document Studio

### 1. data-field (CRITICAL)

**Purpose:** Enable inline editing of content

**Required on:** ALL user-editable content (wrap in `<span>`)

**Format:**
- Simple fields: `"section.field"`
- Array items: `"arrayName.{{index}}.field"`

**Examples:**
```html
<!-- Simple field -->
<span data-field="sender.name">{{sender.name}}</span>

<!-- Nested field -->
<span data-field="invoice.date">{{invoice.date}}</span>

<!-- Array item field -->
{{#items}}
<span data-field="items.{{index}}.description">{{description}}</span>
{{/items}}
```

### 2. data-item-index

**Purpose:** Identify array items for editing/deletion

**Required on:** Container element of each array item

**Format:** `{{index}}`

**Example:**
```html
{{#experiences}}
<div class="experience-item" data-item-index="{{index}}">
  <span data-field="experiences.{{index}}.company">{{company}}</span>
  <span data-field="experiences.{{index}}.position">{{position}}</span>
</div>
{{/experiences}}
```

### 3. data-array-container

**Purpose:** Enable add/delete buttons for arrays

**Required on:** Wrapper element around array iteration

**Format:** `"arrayFieldName"` (without section prefix)

**Example:**
```html
<div data-array-container="items">
  {{#items}}
  <div data-item-index="{{index}}">
    <span data-field="items.{{index}}.name">{{name}}</span>
  </div>
  {{/items}}
</div>
```

### 4. Root Element IDs and Classes

**Required on:** Main container element

**Format:**
- ID: `{typeId}-content`
- Class: `{typeId}-preview`

**Example:**
```html
<div class="invoice-preview" id="invoice-content">
  <!-- Template content -->
</div>
```

## Common Patterns

### Optional Fields
```html
{{#client.email}}
<div class="contact-line">
  Email: <span data-field="client.email">{{client.email}}</span>
</div>
{{/client.email}}
```

### Empty State for Arrays
```html
<div data-array-container="items">
  {{#items}}
  <div data-item-index="{{index}}">
    <span data-field="items.{{index}}.name">{{name}}</span>
  </div>
  {{/items}}

  {{^items}}
  <p class="empty-state">No items yet. Click add to create one.</p>
  {{/items}}
</div>
```

### Table with Array
```html
<table class="data-table">
  <thead>
    <tr>
      <th>Description</th>
      <th>Quantity</th>
      <th>Price</th>
    </tr>
  </thead>
  <tbody>
    {{#items}}
    <tr data-item-index="{{index}}">
      <td><span data-field="items.{{index}}.description">{{description}}</span></td>
      <td><span data-field="items.{{index}}.quantity">{{quantity}}</span></td>
      <td><span data-field="items.{{index}}.price">{{price}}</span></td>
    </tr>
    {{/items}}
  </tbody>
</table>
```

### Two-Column Layout
```html
<div class="info-grid">
  <div class="info-column">
    <h2>From</h2>
    <div><strong><span data-field="sender.name">{{sender.name}}</span></strong></div>
    {{#sender.address}}
    <div><span data-field="sender.address">{{sender.address}}</span></div>
    {{/sender.address}}
  </div>

  <div class="info-column">
    <h2>To</h2>
    <div><strong><span data-field="client.name">{{client.name}}</span></strong></div>
    {{#client.address}}
    <div><span data-field="client.address">{{client.address}}</span></div>
    {{/client.address}}
  </div>
</div>
```

### Nested Arrays
```html
<div data-array-container="sections">
  {{#sections}}
  <div class="section" data-item-index="{{index}}">
    <h3><span data-field="sections.{{index}}.title">{{title}}</span></h3>

    <div data-array-container="items">
      {{#items}}
      <div data-item-index="{{index}}">
        <span data-field="sections.{{parent_index}}.items.{{index}}.name">{{name}}</span>
      </div>
      {{/items}}
    </div>
  </div>
  {{/sections}}
</div>
```

## Special Variables

### {{index}}
Available inside array iterations. Zero-based index of current item.

```mustache
{{#items}}
  Item #{{index}}: {{name}}
{{/items}}
```

### Pre-formatted Data
Document Studio provides some pre-formatted values:

```mustache
{{formatted.date}}        <!-- Formatted date -->
{{formatted.total}}       <!-- Formatted currency -->
{{formatted.subtotal}}    <!-- Formatted currency -->
```

## Best Practices

### 1. Always Wrap Editable Content
❌ **Wrong:**
```html
<div>{{sender.name}}</div>
```

✅ **Correct:**
```html
<div><span data-field="sender.name">{{sender.name}}</span></div>
```

### 2. Use Semantic HTML
❌ **Wrong:**
```html
<div class="title">{{title}}</div>
```

✅ **Correct:**
```html
<h1><span data-field="title">{{title}}</span></h1>
```

### 3. Handle Missing Data Gracefully
❌ **Wrong:**
```html
<div>{{description}}</div>
```

✅ **Correct:**
```html
{{#description}}
<div><span data-field="description">{{description}}</span></div>
{{/description}}
```

### 4. Arrays Must Have Both Attributes
❌ **Wrong:**
```html
{{#items}}
<div><span data-field="items.{{index}}.name">{{name}}</span></div>
{{/items}}
```

✅ **Correct:**
```html
<div data-array-container="items">
  {{#items}}
  <div data-item-index="{{index}}">
    <span data-field="items.{{index}}.name">{{name}}</span>
  </div>
  {{/items}}
</div>
```

## Testing Your Templates

1. **Check for required attributes:**
   - Every editable field has `data-field`
   - Every array item has `data-item-index`
   - Every array has `data-array-container`

2. **Test with empty data:**
   - Optional fields hidden with `{{#field}}`
   - Empty arrays show helpful message

3. **Test with long content:**
   - Text wraps properly
   - Layout doesn't break

4. **Validate HTML:**
   - Properly nested tags
   - No unclosed elements
   - Semantic structure

## Debugging

### Common Issues

**Issue:** Field not editable
- **Cause:** Missing `data-field` attribute
- **Fix:** Wrap content in `<span data-field="...">`

**Issue:** Array items can't be deleted
- **Cause:** Missing `data-item-index`
- **Fix:** Add `data-item-index="{{index}}"` to item container

**Issue:** Can't add array items
- **Cause:** Missing `data-array-container`
- **Fix:** Wrap array loop in `<div data-array-container="arrayName">`

**Issue:** Content renders as `[object Object]`
- **Cause:** Trying to display object directly
- **Fix:** Access specific properties: `{{object.property}}`
