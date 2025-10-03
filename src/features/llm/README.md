# LLM Integration for Document Studio

This directory contains a comprehensive prompt system that enables LLMs to create and manage document types, templates, and themes for Document Studio.

## 🎯 Purpose

Enable LLMs (via MCP, REST API, or other integrations) to:
- **Generate DocumentType schemas** from natural language descriptions
- **Create HTML templates** using Mustache syntax
- **Write CSS themes** following Document Studio conventions
- **Edit document content** intelligently

## 📁 Directory Structure

```
llm/
├── prompts/              # YAML-based prompt definitions
│   ├── system.yaml           # Base system instructions
│   ├── document-types.yaml   # DocumentType generation rules
│   ├── templates.yaml        # Template (HTML) generation rules
│   ├── themes.yaml           # Theme (CSS) generation rules
│   └── examples/             # Real examples for few-shot learning
│       ├── document-types/   # Example DocumentType JSONs
│       ├── templates/        # Example Mustache templates
│       └── themes/           # Example CSS themes
│
├── docs/                 # Technical documentation
│   ├── schemas.md           # JSON schema reference
│   ├── mustache-guide.md    # Mustache template guide
│   ├── css-requirements.md  # CSS requirements and conventions
│   └── rendering-rules.md   # How Document Studio renders
│
├── tools/                # MCP/API tool implementations (to be created)
│   ├── create-document-type.ts
│   ├── create-template.ts
│   ├── create-theme.ts
│   └── edit-document.ts
│
└── README.md            # This file
```

## 🚀 Quick Start

### For LLM Integration Developers

1. **Load the prompt system:**
   ```typescript
   import yaml from 'yaml';
   import fs from 'fs';

   const systemPrompt = yaml.parse(
     fs.readFileSync('./prompts/system.yaml', 'utf8')
   );
   ```

2. **Provide context to LLM:**
   ```typescript
   const context = `
   ${systemPrompt.context}

   ${fs.readFileSync('./docs/schemas.md', 'utf8')}
   ${fs.readFileSync('./docs/mustache-guide.md', 'utf8')}
   `;
   ```

3. **Include examples for few-shot learning:**
   ```typescript
   const examples = {
     documentType: fs.readFileSync('./prompts/examples/document-types/invoice.json', 'utf8'),
     template: fs.readFileSync('./prompts/examples/templates/invoice-template.html', 'utf8'),
     theme: fs.readFileSync('./prompts/examples/themes/terminal-theme.css', 'utf8')
   };
   ```

### For LLMs (Direct Usage)

When you receive a request to create a document type, template, or theme:

1. **Read the relevant YAML prompt** (`document-types.yaml`, `templates.yaml`, or `themes.yaml`)
2. **Review the examples** in the `examples/` directory
3. **Follow the documentation** in the `docs/` directory
4. **Generate valid JSON/HTML/CSS** that adheres to the rules

## 📚 Documentation Guide

### For DocumentType Creation
- Read: `prompts/document-types.yaml`
- Reference: `docs/schemas.md`
- Examples: `examples/document-types/*.json`

### For Template Creation
- Read: `prompts/templates.yaml`
- Reference: `docs/mustache-guide.md` + `docs/rendering-rules.md`
- Examples: `examples/templates/*.html`

### For Theme Creation
- Read: `prompts/themes.yaml`
- Reference: `docs/css-requirements.md`
- Examples: `examples/themes/*.css`

## 🔌 Integration Approaches

### Option A: MCP Server (✅ IMPLEMENTED)

Create an MCP server that exposes tools for document management.

See `/mcp-server/` directory for full implementation and documentation.

**Tools to implement:**
- `create_document_type` - Generate DocumentType from description
- `create_template` - Generate HTML template
- `create_theme` - Generate CSS theme
- `edit_document_content` - Modify document data
- `list_resources` - Browse existing types/templates/themes

**Example MCP tool definition:**
```typescript
{
  name: "create_document_type",
  description: "Create a new document type from a natural language description",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "Natural language description of the document type"
      }
    },
    required: ["description"]
  }
}
```

### Option B: REST API

Add API endpoints to the Vite app.

**Endpoints to create:**
- `POST /api/llm/create-type` - Create document type
- `POST /api/llm/create-template` - Create template
- `POST /api/llm/create-theme` - Create theme
- `POST /api/llm/edit-content` - Edit document content

**Example API endpoint:**
```typescript
app.post('/api/llm/create-type', async (req, res) => {
  const { description } = req.body;

  const systemPrompt = loadYamlPrompt('prompts/system.yaml');
  const typePrompt = loadYamlPrompt('prompts/document-types.yaml');

  const llmResponse = await llm.complete({
    system: [systemPrompt, typePrompt].join('\n\n'),
    user: description,
    response_format: { type: "json_object" }
  });

  const documentType = JSON.parse(llmResponse);

  // Validate with Zod
  const validated = DocumentTypeSchema.parse(documentType);

  // Save to storage
  saveDocumentType(validated);

  res.json(validated);
});
```

### Option C: Browser-Based API (✅ IMPLEMENTED)

Use the browser-based LLM service with Anthropic or OpenAI.

**Implementation:**
```typescript
import { useLLMService } from '@/features/llm';

function MyComponent() {
  const llm = useLLMService();

  // Configure once
  useEffect(() => {
    if (!llm.isConfigured) {
      llm.configure({
        provider: 'anthropic', // or 'openai'
        apiKey: 'your-api-key',
        model: 'claude-3-5-sonnet-20241022' // optional
      });
    }
  }, []);

  // Create a document type
  const handleCreate = async () => {
    const result = await llm.createDocumentType(
      "Create a legal contract document type with parties, terms, and signatures"
    );

    if (result.success) {
      // Save to Document Studio
      documentStore.addDocumentType(result.data);
    } else {
      console.error(result.error, result.issues);
    }
  };

  return <button onClick={handleCreate}>Generate Document Type</button>;
}
```

**Features:**
- ✅ React hook (`useLLMService`)
- ✅ localStorage configuration
- ✅ Automatic validation
- ✅ Loading states
- ✅ Error handling
- ✅ Support for Anthropic Claude and OpenAI

## 🛠️ Validation Layer

All LLM outputs should be validated:

```typescript
import { DocumentTypeSchema, TemplateSchema, ThemeSchema } from '@/features/document/document.schema';

// Validate DocumentType
try {
  const validated = DocumentTypeSchema.parse(llmOutput);
  saveDocumentType(validated);
} catch (error) {
  console.error('Invalid DocumentType:', error);
  // Retry with corrected prompt
}
```

## 📝 Example Workflows

### Creating a New Document Type

**User Request:**
> "Create a business proposal document type"

**LLM Process:**
1. Load `prompts/system.yaml` and `prompts/document-types.yaml`
2. Review example from `examples/document-types/invoice.json`
3. Generate DocumentType JSON with appropriate sections:
   - Executive Summary
   - Problem Statement
   - Proposed Solution
   - Pricing
   - Timeline
4. Validate against schema
5. Save to storage

**Generated JSON:**
```json
{
  "id": "business-proposal",
  "name": "Business Proposal",
  "icon": "Briefcase",
  "description": "Professional business proposal template",
  "sections": [
    {
      "id": "executive_summary",
      "name": "Executive Summary",
      "fields": [
        {"id": "title", "name": "Proposal Title", "type": "text", "required": true},
        {"id": "summary", "name": "Summary", "type": "textarea", "required": true}
      ]
    },
    // ... more sections
  ],
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

### Creating a Template

**User Request:**
> "Create a modern template for the business proposal type"

**LLM Process:**
1. Load `prompts/templates.yaml`
2. Review `docs/mustache-guide.md`
3. Check example from `examples/templates/invoice-template.html`
4. Generate HTML with required attributes
5. Validate Mustache syntax
6. Save with typeId reference

### Creating a Theme

**User Request:**
> "Create a professional blue theme"

**LLM Process:**
1. Load `prompts/themes.yaml`
2. Review `docs/css-requirements.md`
3. Check example from `examples/themes/terminal-theme.css`
4. Generate CSS with required variables
5. Include print styles
6. Validate CSS syntax
7. Save

## 🔍 Debugging LLM Output

### Common Issues

**Issue:** Invalid JSON
```typescript
// Solution: Use structured output mode
const response = await llm.complete({
  ...params,
  response_format: { type: "json_object" }
});
```

**Issue:** Missing required fields
```typescript
// Solution: Enhance prompt with schema
const enhancedPrompt = `
${basePrompt}

IMPORTANT: Your JSON MUST include these required fields:
- id (kebab-case string)
- name (string)
- sections (array with at least 1 section)
- createdAt (number, use ${Date.now()})
- updatedAt (number, use ${Date.now()})
`;
```

**Issue:** Invalid Mustache syntax
```typescript
// Solution: Validate before saving
import Mustache from 'mustache';

try {
  Mustache.parse(templateContent);
  // Valid template
} catch (error) {
  // Invalid template - retry
}
```

## 🎨 Advanced Patterns

### Multi-Turn Generation

For complex document types, use multi-turn conversation:

1. **Turn 1:** Generate basic structure
2. **Turn 2:** Refine with user feedback
3. **Turn 3:** Add advanced features
4. **Turn 4:** Optimize and finalize

### Template + Theme Co-Generation

Generate template and theme together for consistency:

```typescript
const result = await llm.complete({
  system: [...systemPrompts, templatePrompt, themePrompt].join('\n\n'),
  user: `Create both a template and theme for a ${documentType.name}`,
  response_format: {
    type: "json_object",
    schema: {
      template: TemplateSchema,
      theme: ThemeSchema
    }
  }
});
```

### Smart Content Editing

Use LLM to intelligently edit document content:

```typescript
const editedData = await llm.complete({
  system: "You are editing a document. Preserve structure, only modify content as requested.",
  user: `
  Current data: ${JSON.stringify(documentData)}
  Request: ${userEditRequest}

  Return the complete updated data as JSON.
  `
});
```

## 📊 Metrics & Monitoring

Track LLM performance:

```typescript
const metrics = {
  successRate: 0.95,        // 95% valid outputs
  avgResponseTime: 2500,    // 2.5s average
  retryRate: 0.15,          // 15% need retry
  userSatisfaction: 4.5     // 4.5/5 rating
};
```

## 🔐 Security Considerations

- **Sanitize all LLM outputs** before rendering (use DOMPurify)
- **Validate against Zod schemas** before saving
- **Rate limit API calls** to prevent abuse
- **Don't expose API keys** in client code
- **Audit LLM-generated code** for security issues

## 🚧 Roadmap

- [x] YAML prompt system
- [x] Example files
- [x] Documentation
- [x] MCP server implementation (see `/mcp-server/`)
- [x] Browser-based LLM API (Anthropic/OpenAI)
- [x] React hooks for easy integration
- [x] Validation layer
- [ ] Visual template editor with LLM assist
- [ ] Template gallery with AI search
- [ ] Multi-language support
- [ ] Streaming responses
- [ ] Cost tracking

## 📖 Additional Resources

- [Mustache Documentation](https://mustache.github.io/)
- [Zod Validation](https://github.com/colinhacks/zod)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Document Studio Docs](../../docs/)

## 🤝 Contributing

When adding new capabilities:

1. Update relevant YAML prompts
2. Add examples to `examples/`
3. Document in `docs/`
4. Test with multiple LLM providers
5. Add validation logic

---

**Built for Document Studio** - A fully extensible, LLM-powered document management system.
