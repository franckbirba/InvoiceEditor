#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import yaml from 'yaml';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Mustache from 'mustache';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Zod schemas (duplicated from main app for server independence)
const FieldTypeSchema = z.enum(['text', 'textarea', 'email', 'tel', 'url', 'number', 'date', 'array']);

const FieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: FieldTypeSchema,
  required: z.boolean().optional(),
  placeholder: z.string().optional(),
  defaultValue: z.union([z.string(), z.number(), z.array(z.any())]).optional(),
  arrayItemSchema: z.record(z.string(), z.any()).optional(),
});

const SectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(FieldSchema),
});

const DocumentTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  sections: z.array(SectionSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  typeId: z.string(),
  description: z.string().optional(),
  content: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  content: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

type DocumentType = z.infer<typeof DocumentTypeSchema>;
type Template = z.infer<typeof TemplateSchema>;
type Theme = z.infer<typeof ThemeSchema>;

interface PromptData {
  system: string;
  documentTypes: string;
  templates: string;
  themes: string;
  examples: {
    documentTypes: string[];
    templates: string[];
    themes: string[];
  };
  docs: {
    schemas: string;
    mustacheGuide: string;
    cssRequirements: string;
    renderingRules: string;
  };
}

class DocumentStudioMCPServer {
  private server: Server;
  private promptsCache: PromptData | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'document-studio-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private async loadPrompts(): Promise<PromptData> {
    if (this.promptsCache) {
      return this.promptsCache;
    }

    const promptsDir = join(__dirname, '../../src/features/llm/prompts');
    const docsDir = join(__dirname, '../../src/features/llm/docs');
    const examplesDir = join(promptsDir, 'examples');

    const [
      systemYaml,
      documentTypesYaml,
      templatesYaml,
      themesYaml,
      invoiceTypeExample,
      cvTypeExample,
      invoiceTemplateExample,
      cvTemplateExample,
      terminalThemeExample,
      cvThemeExample,
      schemasDoc,
      mustacheDoc,
      cssDoc,
      renderingDoc,
    ] = await Promise.all([
      fs.readFile(join(promptsDir, 'system.yaml'), 'utf8'),
      fs.readFile(join(promptsDir, 'document-types.yaml'), 'utf8'),
      fs.readFile(join(promptsDir, 'templates.yaml'), 'utf8'),
      fs.readFile(join(promptsDir, 'themes.yaml'), 'utf8'),
      fs.readFile(join(examplesDir, 'document-types/invoice.json'), 'utf8'),
      fs.readFile(join(examplesDir, 'document-types/cv.json'), 'utf8'),
      fs.readFile(join(examplesDir, 'templates/invoice-template.html'), 'utf8'),
      fs.readFile(join(examplesDir, 'templates/cv-template.html'), 'utf8'),
      fs.readFile(join(examplesDir, 'themes/terminal-theme.css'), 'utf8'),
      fs.readFile(join(examplesDir, 'themes/cv-theme.css'), 'utf8'),
      fs.readFile(join(docsDir, 'schemas.md'), 'utf8'),
      fs.readFile(join(docsDir, 'mustache-guide.md'), 'utf8'),
      fs.readFile(join(docsDir, 'css-requirements.md'), 'utf8'),
      fs.readFile(join(docsDir, 'rendering-rules.md'), 'utf8'),
    ]);

    this.promptsCache = {
      system: this.formatYaml(systemYaml),
      documentTypes: this.formatYaml(documentTypesYaml),
      templates: this.formatYaml(templatesYaml),
      themes: this.formatYaml(themesYaml),
      examples: {
        documentTypes: [invoiceTypeExample, cvTypeExample],
        templates: [invoiceTemplateExample, cvTemplateExample],
        themes: [terminalThemeExample, cvThemeExample],
      },
      docs: {
        schemas: schemasDoc,
        mustacheGuide: mustacheDoc,
        cssRequirements: cssDoc,
        renderingRules: renderingDoc,
      },
    };

    return this.promptsCache;
  }

  private formatYaml(yamlContent: string): string {
    try {
      const parsed = yaml.parse(yamlContent);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return yamlContent;
    }
  }

  private buildDocumentTypePrompt(prompts: PromptData): string {
    return `${prompts.system}

# DocumentType Generation

${prompts.documentTypes}

# Schema Reference

${prompts.docs.schemas}

# Examples

## Invoice Document Type
\`\`\`json
${prompts.examples.documentTypes[0]}
\`\`\`

## CV Document Type
\`\`\`json
${prompts.examples.documentTypes[1]}
\`\`\`

---

Generate a valid DocumentType JSON based on the user's description.
Follow the schema exactly. Use appropriate field types and sections.`;
  }

  private buildTemplatePrompt(prompts: PromptData): string {
    return `${prompts.system}

# Template Generation

${prompts.templates}

# Mustache Guide

${prompts.docs.mustacheGuide}

# Rendering Rules (CRITICAL)

${prompts.docs.renderingRules}

# Examples

## Invoice Template
\`\`\`html
${prompts.examples.templates[0]}
\`\`\`

## CV Template
\`\`\`html
${prompts.examples.templates[1]}
\`\`\`

---

Generate a valid Mustache HTML template based on the document type and user's requirements.
IMPORTANT: Include ALL required data-* attributes (data-field, data-item-index, data-array-container).`;
  }

  private buildThemePrompt(prompts: PromptData): string {
    return `${prompts.system}

# Theme Generation

${prompts.themes}

# CSS Requirements

${prompts.docs.cssRequirements}

# Examples

## Terminal Theme
\`\`\`css
${prompts.examples.themes[0]}
\`\`\`

## CV Theme
\`\`\`css
${prompts.examples.themes[1]}
\`\`\`

---

Generate a complete CSS theme based on the user's style requirements.
Include all required CSS variables, print styles, and proper scoping.`;
  }

  private validateDocumentType(json: unknown): { success: boolean; data?: DocumentType; error?: string; issues?: string[] } {
    try {
      const result = DocumentTypeSchema.safeParse(json);

      if (!result.success) {
        return {
          success: false,
          error: 'Invalid DocumentType schema',
          issues: result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
        };
      }

      const docType = result.data;
      const issues: string[] = [];

      if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(docType.id)) {
        issues.push('ID must be kebab-case (e.g., "legal-contract")');
      }

      if (!docType.sections || docType.sections.length === 0) {
        issues.push('DocumentType must have at least one section');
      }

      docType.sections?.forEach((section, idx) => {
        if (!section.fields || section.fields.length === 0) {
          issues.push(`Section "${section.name}" (index ${idx}) must have at least one field`);
        }
      });

      if (issues.length > 0) {
        return { success: false, error: 'Validation issues found', issues };
      }

      return { success: true, data: docType };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }

  private validateTemplate(json: unknown): { success: boolean; data?: Template; error?: string; issues?: string[] } {
    try {
      const result = TemplateSchema.safeParse(json);

      if (!result.success) {
        return {
          success: false,
          error: 'Invalid Template schema',
          issues: result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
        };
      }

      const template = result.data;
      const issues: string[] = [];

      if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(template.id)) {
        issues.push('ID must be kebab-case');
      }

      try {
        Mustache.parse(template.content);
      } catch (error) {
        issues.push(`Invalid Mustache syntax: ${error instanceof Error ? error.message : 'unknown error'}`);
      }

      const hasRootId = /<[^>]+id=["'][^"']*-content["']/.test(template.content);
      if (!hasRootId) {
        issues.push('Template must have root element with id="{typeId}-content"');
      }

      const hasRootClass = /<[^>]+class=["'][^"']*-preview["']/.test(template.content);
      if (!hasRootClass) {
        issues.push('Template must have root element with class="{typeId}-preview"');
      }

      const hasDataFields = /data-field=["']/.test(template.content);
      if (!hasDataFields) {
        issues.push('Template should include data-field attributes for editing');
      }

      const hasArrays = /{{#\w+}}/.test(template.content);
      const hasDataItemIndex = /data-item-index=/.test(template.content);
      const hasDataArrayContainer = /data-array-container=/.test(template.content);

      if (hasArrays && !hasDataItemIndex) {
        issues.push('Arrays found but missing data-item-index attributes');
      }

      if (hasArrays && !hasDataArrayContainer) {
        issues.push('Arrays found but missing data-array-container attributes');
      }

      if (issues.length > 0) {
        return { success: false, error: 'Template validation issues', issues };
      }

      return { success: true, data: template };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }

  private validateTheme(json: unknown): { success: boolean; data?: Theme; error?: string; issues?: string[] } {
    try {
      const result = ThemeSchema.safeParse(json);

      if (!result.success) {
        return {
          success: false,
          error: 'Invalid Theme schema',
          issues: result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`),
        };
      }

      const theme = result.data;
      const issues: string[] = [];

      if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(theme.id)) {
        issues.push('ID must be kebab-case');
      }

      const requiredVars = [
        '--color-bg',
        '--color-fg',
        '--color-accent',
        '--font-mono',
        '--h1',
        '--h2',
        '--text',
        '--page-w',
        '--page-pad',
      ];

      const hasRootVars = /:root\s*{/.test(theme.content);
      if (!hasRootVars) {
        issues.push('Theme must define CSS variables in :root');
      }

      requiredVars.forEach((varName) => {
        if (!theme.content.includes(varName)) {
          issues.push(`Missing required CSS variable: ${varName}`);
        }
      });

      const hasPrintStyles = /@media\s+print/.test(theme.content);
      if (!hasPrintStyles) {
        issues.push('Theme should include @media print styles for PDF export');
      }

      const hasPageRule = /@page\s*{/.test(theme.content);
      if (!hasPageRule) {
        issues.push('Theme should include @page rule for print setup');
      }

      const hasScopedClasses = /\.\w+-preview\s*{/.test(theme.content);
      if (!hasScopedClasses) {
        issues.push('Theme should scope styles to .{typeId}-preview class');
      }

      if (issues.length > 0) {
        return { success: false, error: 'Theme validation issues', issues };
      }

      return { success: true, data: theme };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }

  private extractJSON(text: string): unknown {
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonText = jsonMatch ? jsonMatch[1] : text;
    return JSON.parse(jsonText.trim());
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_document_type',
          description: 'Create a new DocumentType from a natural language description. Returns a validated DocumentType JSON that can be saved to Document Studio.',
          inputSchema: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Natural language description of the document type (e.g., "Create a legal contract document type with parties, terms, and signature sections")',
              },
            },
            required: ['description'],
          },
        },
        {
          name: 'create_template',
          description: 'Create a Mustache HTML template for a document type. Returns validated HTML with required data-* attributes for inline editing.',
          inputSchema: {
            type: 'object',
            properties: {
              typeId: {
                type: 'string',
                description: 'The DocumentType ID this template is for (e.g., "facture", "cv")',
              },
              description: {
                type: 'string',
                description: 'Description of the template style and layout (e.g., "Create a modern invoice template with a header, itemized table, and totals")',
              },
              documentTypeJson: {
                type: 'string',
                description: 'Optional: JSON string of the DocumentType schema to ensure template matches fields',
              },
            },
            required: ['typeId', 'description'],
          },
        },
        {
          name: 'create_theme',
          description: 'Create a CSS theme for Document Studio. Returns validated CSS with required variables, print styles, and proper scoping.',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Theme name (e.g., "Professional Blue", "Dark Mode", "Minimal")',
              },
              description: {
                type: 'string',
                description: 'Description of the theme style (e.g., "A clean, professional theme with blue accents and serif fonts")',
              },
              typeId: {
                type: 'string',
                description: 'Optional: Document type ID to scope theme to (e.g., "facture", "cv")',
              },
            },
            required: ['name', 'description'],
          },
        },
        {
          name: 'update_document_type',
          description: 'Update an existing DocumentType based on modification requests. Preserves ID and structure while applying requested changes.',
          inputSchema: {
            type: 'object',
            properties: {
              currentJson: {
                type: 'string',
                description: 'JSON string of the current DocumentType to update',
              },
              updateRequest: {
                type: 'string',
                description: 'Natural language description of what to update (e.g., "Add a new section for payment terms")',
              },
            },
            required: ['currentJson', 'updateRequest'],
          },
        },
        {
          name: 'update_template',
          description: 'Update an existing Template based on modification requests. Maintains required data-* attributes while applying changes.',
          inputSchema: {
            type: 'object',
            properties: {
              currentJson: {
                type: 'string',
                description: 'JSON string of the current Template to update',
              },
              updateRequest: {
                type: 'string',
                description: 'Natural language description of what to update (e.g., "Make the header more prominent and add a footer")',
              },
              documentTypeJson: {
                type: 'string',
                description: 'Optional: JSON string of the DocumentType schema for reference',
              },
            },
            required: ['currentJson', 'updateRequest'],
          },
        },
        {
          name: 'update_theme',
          description: 'Update an existing Theme based on modification requests. Preserves required CSS variables while applying style changes.',
          inputSchema: {
            type: 'object',
            properties: {
              currentJson: {
                type: 'string',
                description: 'JSON string of the current Theme to update',
              },
              updateRequest: {
                type: 'string',
                description: 'Natural language description of what to update (e.g., "Change the accent color to green and use a sans-serif font")',
              },
            },
            required: ['currentJson', 'updateRequest'],
          },
        },
        {
          name: 'get_prompts',
          description: 'Get the complete prompt system documentation for reference. Useful for understanding how to structure DocumentTypes, Templates, and Themes.',
          inputSchema: {
            type: 'object',
            properties: {
              section: {
                type: 'string',
                enum: ['documentTypes', 'templates', 'themes', 'all'],
                description: 'Which section to retrieve (default: all)',
              },
            },
          },
        },
      ],
    }));

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'prompt://document-types',
          name: 'DocumentType Prompt System',
          description: 'Complete prompt system for generating DocumentTypes',
          mimeType: 'text/markdown',
        },
        {
          uri: 'prompt://templates',
          name: 'Template Prompt System',
          description: 'Complete prompt system for generating Mustache HTML templates',
          mimeType: 'text/markdown',
        },
        {
          uri: 'prompt://themes',
          name: 'Theme Prompt System',
          description: 'Complete prompt system for generating CSS themes',
          mimeType: 'text/markdown',
        },
        {
          uri: 'example://document-types/invoice',
          name: 'Invoice DocumentType Example',
          description: 'Complete example of an invoice DocumentType',
          mimeType: 'application/json',
        },
        {
          uri: 'example://document-types/cv',
          name: 'CV DocumentType Example',
          description: 'Complete example of a CV/Resume DocumentType',
          mimeType: 'application/json',
        },
        {
          uri: 'example://templates/invoice',
          name: 'Invoice Template Example',
          description: 'Complete Mustache HTML template for invoices',
          mimeType: 'text/html',
        },
        {
          uri: 'example://templates/cv',
          name: 'CV Template Example',
          description: 'Complete Mustache HTML template for CVs',
          mimeType: 'text/html',
        },
        {
          uri: 'example://themes/terminal',
          name: 'Terminal Theme Example',
          description: 'Complete CSS theme with terminal aesthetic',
          mimeType: 'text/css',
        },
        {
          uri: 'example://themes/cv',
          name: 'CV Theme Example',
          description: 'Complete CSS theme for CV documents',
          mimeType: 'text/css',
        },
      ],
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const prompts = await this.loadPrompts();

      if (uri === 'prompt://document-types') {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: this.buildDocumentTypePrompt(prompts),
            },
          ],
        };
      }

      if (uri === 'prompt://templates') {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: this.buildTemplatePrompt(prompts),
            },
          ],
        };
      }

      if (uri === 'prompt://themes') {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: this.buildThemePrompt(prompts),
            },
          ],
        };
      }

      if (uri.startsWith('example://')) {
        const parts = uri.replace('example://', '').split('/');
        const [category, name] = parts;

        if (category === 'document-types') {
          const index = name === 'invoice' ? 0 : 1;
          return {
            contents: [
              {
                uri,
                mimeType: 'application/json',
                text: prompts.examples.documentTypes[index],
              },
            ],
          };
        }

        if (category === 'templates') {
          const index = name === 'invoice' ? 0 : 1;
          return {
            contents: [
              {
                uri,
                mimeType: 'text/html',
                text: prompts.examples.templates[index],
              },
            ],
          };
        }

        if (category === 'themes') {
          const index = name === 'terminal' ? 0 : 1;
          return {
            contents: [
              {
                uri,
                mimeType: 'text/css',
                text: prompts.examples.themes[index],
              },
            ],
          };
        }
      }

      throw new Error(`Unknown resource: ${uri}`);
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (name === 'create_document_type') {
          const { description } = args as { description: string };
          const prompts = await this.loadPrompts();
          const systemPrompt = this.buildDocumentTypePrompt(prompts);

          return {
            content: [
              {
                type: 'text',
                text: `Use this system prompt to generate a DocumentType JSON:\n\n${systemPrompt}\n\nUser request: ${description}\n\nGenerate a valid DocumentType JSON. The JSON must include:\n- id (kebab-case)\n- name\n- sections (array with at least one section)\n- Each section must have fields\n- createdAt and updatedAt timestamps\n\nReturn ONLY the JSON, wrapped in a markdown code block.`,
              },
            ],
          };
        }

        if (name === 'create_template') {
          const { typeId, description, documentTypeJson } = args as { typeId: string; description: string; documentTypeJson?: string };
          const prompts = await this.loadPrompts();
          const systemPrompt = this.buildTemplatePrompt(prompts);

          let contextText = `Type ID: ${typeId}\nDescription: ${description}`;
          if (documentTypeJson) {
            contextText += `\n\nDocumentType schema:\n${documentTypeJson}`;
          }

          return {
            content: [
              {
                type: 'text',
                text: `Use this system prompt to generate a Mustache HTML template:\n\n${systemPrompt}\n\n${contextText}\n\nGenerate a valid Mustache HTML template. The template MUST include:\n- Root element with id="{typeId}-content"\n- Root element with class="{typeId}-preview"\n- data-field attributes on ALL editable content\n- data-item-index on array item containers\n- data-array-container on array wrapper elements\n\nReturn the template as JSON with this structure:\n{\n  "id": "template-id",\n  "name": "Template Name",\n  "typeId": "${typeId}",\n  "content": "HTML here",\n  "createdAt": ${Date.now()},\n  "updatedAt": ${Date.now()}\n}\n\nReturn ONLY the JSON, wrapped in a markdown code block.`,
              },
            ],
          };
        }

        if (name === 'create_theme') {
          const { name: themeName, description, typeId } = args as { name: string; description: string; typeId?: string };
          const prompts = await this.loadPrompts();
          const systemPrompt = this.buildThemePrompt(prompts);

          const contextText = typeId
            ? `Theme name: ${themeName}\nDescription: ${description}\nScope to type: ${typeId}`
            : `Theme name: ${themeName}\nDescription: ${description}`;

          return {
            content: [
              {
                type: 'text',
                text: `Use this system prompt to generate a CSS theme:\n\n${systemPrompt}\n\n${contextText}\n\nGenerate a valid CSS theme. The theme MUST include:\n- All required CSS variables in :root\n- @media print styles\n- @page rule for print setup\n- Proper scoping to .{typeId}-preview class\n\nReturn the theme as JSON with this structure:\n{\n  "id": "theme-id",\n  "name": "${themeName}",\n  "content": "CSS here",\n  "createdAt": ${Date.now()},\n  "updatedAt": ${Date.now()}\n}\n\nReturn ONLY the JSON, wrapped in a markdown code block.`,
              },
            ],
          };
        }

        if (name === 'update_document_type') {
          const { currentJson, updateRequest } = args as { currentJson: string; updateRequest: string };
          const prompts = await this.loadPrompts();
          const systemPrompt = this.buildDocumentTypePrompt(prompts);

          const current = JSON.parse(currentJson);

          return {
            content: [
              {
                type: 'text',
                text: `Use this system prompt to update a DocumentType:\n\n${systemPrompt}\n\nCurrent DocumentType:\n\`\`\`json\n${currentJson}\n\`\`\`\n\nUpdate request: ${updateRequest}\n\nIMPORTANT:\n- Preserve the existing ID: "${current.id}"\n- Keep createdAt: ${current.createdAt}\n- Update updatedAt to: ${Date.now()}\n- Maintain structure unless specifically asked to change it\n- Follow all DocumentType schema requirements\n\nReturn the complete updated DocumentType as JSON in a markdown code block.`,
              },
            ],
          };
        }

        if (name === 'update_template') {
          const { currentJson, updateRequest, documentTypeJson } = args as { currentJson: string; updateRequest: string; documentTypeJson?: string };
          const prompts = await this.loadPrompts();
          const systemPrompt = this.buildTemplatePrompt(prompts);

          const current = JSON.parse(currentJson);
          let contextText = documentTypeJson ? `\n\nDocumentType schema (for reference):\n\`\`\`json\n${documentTypeJson}\n\`\`\`` : '';

          return {
            content: [
              {
                type: 'text',
                text: `Use this system prompt to update a Template:\n\n${systemPrompt}\n\nCurrent Template:\n\`\`\`json\n${currentJson}\n\`\`\`\n\nUpdate request: ${updateRequest}${contextText}\n\nIMPORTANT:\n- Preserve the existing ID: "${current.id}"\n- Keep typeId: "${current.typeId}"\n- Keep createdAt: ${current.createdAt}\n- Update updatedAt to: ${Date.now()}\n- Maintain ALL required data-* attributes\n- Follow all template requirements\n\nReturn the complete updated Template as JSON in a markdown code block.`,
              },
            ],
          };
        }

        if (name === 'update_theme') {
          const { currentJson, updateRequest } = args as { currentJson: string; updateRequest: string };
          const prompts = await this.loadPrompts();
          const systemPrompt = this.buildThemePrompt(prompts);

          const current = JSON.parse(currentJson);

          return {
            content: [
              {
                type: 'text',
                text: `Use this system prompt to update a Theme:\n\n${systemPrompt}\n\nCurrent Theme:\n\`\`\`json\n${currentJson}\n\`\`\`\n\nUpdate request: ${updateRequest}\n\nIMPORTANT:\n- Preserve the existing ID: "${current.id}"\n- Keep createdAt: ${current.createdAt}\n- Update updatedAt to: ${Date.now()}\n- Maintain ALL required CSS variables\n- Keep print styles and proper scoping\n- Follow all theme requirements\n\nReturn the complete updated Theme as JSON in a markdown code block.`,
              },
            ],
          };
        }

        if (name === 'get_prompts') {
          const { section = 'all' } = args as { section?: string };
          const prompts = await this.loadPrompts();

          let text = '';
          if (section === 'all' || section === 'documentTypes') {
            text += `# DocumentType Prompt System\n\n${this.buildDocumentTypePrompt(prompts)}\n\n`;
          }
          if (section === 'all' || section === 'templates') {
            text += `# Template Prompt System\n\n${this.buildTemplatePrompt(prompts)}\n\n`;
          }
          if (section === 'all' || section === 'themes') {
            text += `# Theme Prompt System\n\n${this.buildThemePrompt(prompts)}\n\n`;
          }

          return {
            content: [
              {
                type: 'text',
                text,
              },
            ],
          };
        }

        throw new Error(`Unknown tool: ${name}`);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Document Studio MCP Server running on stdio');
  }
}

const server = new DocumentStudioMCPServer();
server.run().catch(console.error);
