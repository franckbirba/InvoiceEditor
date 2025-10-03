# Document Studio MCP Server

Model Context Protocol server for Document Studio LLM integration.

## Overview

This MCP server exposes tools and resources that enable LLMs to:
- Create DocumentTypes from natural language
- Generate Mustache HTML templates
- Write CSS themes
- Access complete prompt documentation and examples

## Installation

```bash
cd mcp-server
npm install
npm run build
```

## Usage with Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "document-studio": {
      "command": "node",
      "args": ["/absolute/path/to/invoice-studio-react/mcp-server/dist/index.js"]
    }
  }
}
```

## Available Tools

### `create_document_type`

Create a new DocumentType from natural language.

**Input:**
- `description` (string): Description of the document type

**Example:**
```
Create a legal contract document type with sections for parties, terms, obligations, and signatures
```

### `create_template`

Generate a Mustache HTML template for a document type.

**Input:**
- `typeId` (string): Document type ID
- `description` (string): Template style description
- `documentTypeJson` (optional string): DocumentType JSON for reference

**Example:**
```
typeId: "legal-contract"
description: "Create a professional legal contract template with a header, numbered clauses, and signature blocks"
```

### `create_theme`

Generate a CSS theme.

**Input:**
- `name` (string): Theme name
- `description` (string): Style description
- `typeId` (optional string): Scope to specific document type

**Example:**
```
name: "Professional Legal"
description: "A formal theme with serif fonts, blue accents, and clean typography"
```

### `get_prompts`

Retrieve prompt system documentation.

**Input:**
- `section` (optional): "documentTypes", "templates", "themes", or "all"

## Available Resources

The server exposes these resources via MCP:

- `prompt://document-types` - Complete DocumentType generation prompt
- `prompt://templates` - Complete Template generation prompt
- `prompt://themes` - Complete Theme generation prompt
- `example://document-types/invoice` - Invoice DocumentType example
- `example://document-types/cv` - CV DocumentType example
- `example://templates/invoice` - Invoice template example
- `example://templates/cv` - CV template example
- `example://themes/terminal` - Terminal theme example
- `example://themes/cv` - CV theme example

## Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Start
npm start
```

## How It Works

1. **Prompt Loading**: Server loads YAML prompts, examples, and docs from `../src/features/llm/`
2. **Tool Invocation**: When a tool is called, the server provides the complete prompt system to the LLM
3. **Validation**: LLM outputs are validated against Zod schemas
4. **Output**: Returns validated JSON ready for Document Studio

## Integration Flow

```
Claude Desktop
    ↓
MCP Protocol
    ↓
Document Studio MCP Server
    ↓
Prompt System (YAML + Examples + Docs)
    ↓
LLM generates JSON/HTML/CSS
    ↓
Validation (Zod schemas)
    ↓
Valid output returned to Claude
    ↓
User saves to Document Studio
```

## Validation

All outputs are validated for:

**DocumentTypes:**
- Kebab-case ID
- At least one section
- Each section has fields
- Valid field types

**Templates:**
- Kebab-case ID
- Valid Mustache syntax
- Required data-* attributes
- Root element with proper id/class

**Themes:**
- Kebab-case ID
- All required CSS variables
- Print styles (@media print, @page)
- Proper scoping

## Troubleshooting

**Server not appearing in Claude:**
- Check config path is absolute
- Ensure `npm run build` completed
- Restart Claude Desktop

**Invalid outputs:**
- Check console for validation errors
- Review examples in `src/features/llm/prompts/examples/`
- Use `get_prompts` tool to see full documentation
