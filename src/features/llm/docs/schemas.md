# Document Studio Schemas

This document describes the JSON schemas for Document Studio's core data types.

## DocumentType Schema

Defines the structure and fields for a type of document.

```typescript
{
  id: string;              // Unique identifier (kebab-case)
  name: string;            // Display name
  icon?: string;           // Lucide icon name (optional)
  description?: string;    // Brief description (optional)
  sections: Section[];     // Array of sections
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}
```

### Section Schema

```typescript
{
  id: string;              // Section identifier
  name: string;            // Section display name
  fields: Field[];         // Array of field definitions
}
```

### Field Schema (Simple)

```typescript
{
  id: string;              // Field identifier
  name: string;            // Display label
  type: 'text' | 'textarea' | 'email' | 'tel' | 'url' | 'number' | 'date';
  required?: boolean;      // Optional, defaults to false
  placeholder?: string;    // Optional placeholder text
  defaultValue?: any;      // Optional default value
}
```

### Field Schema (Array)

```typescript
{
  id: string;              // Field identifier
  name: string;            // Display label
  type: 'array';
  required?: boolean;      // Optional, defaults to false
  itemSchema: Field[];     // Schema for array items
}
```

## Template Schema

Defines the HTML structure using Mustache for rendering.

```typescript
{
  id: string;              // Unique identifier
  name: string;            // Display name
  typeId: string;          // Reference to DocumentType
  content: string;         // Mustache HTML template
  isDefault?: boolean;     // Optional, defaults to false
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}
```

## Theme Schema

Defines the CSS styling for templates.

```typescript
{
  id: string;              // Unique identifier
  name: string;            // Display name
  content: string;         // CSS content
  isDefault?: boolean;     // Optional, defaults to false
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}
```

## Document Schema

Represents an instance of a DocumentType with actual data.

```typescript
{
  id: string;                    // Unique identifier
  typeId: string;                // Reference to DocumentType
  name: string;                  // Document name
  data: Record<string, any>;     // Actual field values
  templateId: string;            // Reference to Template
  themeId: string;               // Reference to Theme
  projectId?: string;            // Optional project reference
  tags?: string[];               // Optional array of tag IDs
  createdAt: number;             // Timestamp
  updatedAt: number;             // Timestamp
}
```

## Validation

All schemas are validated using [Zod](https://github.com/colinhacks/zod) at runtime. See `/src/features/document/document.schema.ts` for the actual Zod definitions.

## Example: Creating a Contract Document Type

```json
{
  "id": "legal-contract",
  "name": "Legal Contract",
  "icon": "FileCheck",
  "description": "Professional legal contract template",
  "sections": [
    {
      "id": "parties",
      "name": "Contracting Parties",
      "fields": [
        {
          "id": "party_a",
          "name": "First Party",
          "type": "text",
          "required": true
        },
        {
          "id": "party_b",
          "name": "Second Party",
          "type": "text",
          "required": true
        }
      ]
    },
    {
      "id": "terms",
      "name": "Terms & Conditions",
      "fields": [
        {
          "id": "effective_date",
          "name": "Effective Date",
          "type": "date",
          "required": true
        },
        {
          "id": "clauses",
          "name": "Contract Clauses",
          "type": "array",
          "required": false,
          "itemSchema": [
            {
              "id": "title",
              "name": "Clause Title",
              "type": "text",
              "required": true
            },
            {
              "id": "content",
              "name": "Clause Content",
              "type": "textarea",
              "required": true
            }
          ]
        }
      ]
    }
  ],
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```
