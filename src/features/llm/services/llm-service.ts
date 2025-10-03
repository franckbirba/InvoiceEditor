import type { DocumentType, Template, Theme } from '../../document/document.schema';
import { LLMProviderService, type LLMConfig } from './llm-provider';
import { loadPrompts, buildDocumentTypePrompt, buildTemplatePrompt, buildThemePrompt } from './prompt-loader';
import { validateDocumentType, validateTemplate, validateTheme, extractJSON, type ValidationResult } from './validators';

export interface CreateDocumentTypeOptions {
  description: string;
}

export interface CreateTemplateOptions {
  typeId: string;
  description: string;
  documentType?: DocumentType;
}

export interface CreateThemeOptions {
  name: string;
  description: string;
  typeId?: string;
}

/**
 * Document Studio LLM Service
 * High-level API for generating document types, templates, and themes using LLMs
 */
export class DocumentStudioLLMService {
  private llmProvider: LLMProviderService;
  private promptsPromise: ReturnType<typeof loadPrompts>;

  constructor(config: LLMConfig) {
    this.llmProvider = new LLMProviderService(config);
    this.promptsPromise = loadPrompts();
  }

  /**
   * Create a DocumentType from natural language description
   */
  async createDocumentType(options: CreateDocumentTypeOptions): Promise<ValidationResult<DocumentType>> {
    try {
      const prompts = await this.promptsPromise;
      const systemPrompt = buildDocumentTypePrompt(prompts);

      const userPrompt = `${options.description}

Generate a complete DocumentType JSON. Remember:
- Use kebab-case for the ID (e.g., "legal-contract")
- Include at least one section with fields
- Use appropriate field types (text, textarea, email, tel, url, number, date, array)
- Set createdAt and updatedAt to ${Date.now()}

Return ONLY the JSON, wrapped in a markdown code block like this:
\`\`\`json
{...}
\`\`\``;

      const response = await this.llmProvider.complete(systemPrompt, userPrompt);
      const json = extractJSON(response.content);
      return validateDocumentType(json);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating document type',
      };
    }
  }

  /**
   * Create a Template from description and document type
   */
  async createTemplate(options: CreateTemplateOptions): Promise<ValidationResult<Template>> {
    try {
      const prompts = await this.promptsPromise;
      const systemPrompt = buildTemplatePrompt(prompts);

      let userPrompt = `Create a Mustache HTML template for document type: ${options.typeId}

Description: ${options.description}`;

      if (options.documentType) {
        userPrompt += `\n\nDocumentType schema:\n\`\`\`json\n${JSON.stringify(options.documentType, null, 2)}\n\`\`\``;
      }

      userPrompt += `

Generate a complete Template JSON. CRITICAL requirements:
- Root element must have id="${options.typeId}-content"
- Root element must have class="${options.typeId}-preview"
- ALL editable content must have data-field attributes
- Array items must have data-item-index attributes
- Array containers must have data-array-container attributes

Return the template as JSON with this structure:
\`\`\`json
{
  "id": "template-id",
  "name": "Template Name",
  "typeId": "${options.typeId}",
  "description": "Optional description",
  "content": "<div>...HTML here...</div>",
  "createdAt": ${Date.now()},
  "updatedAt": ${Date.now()}
}
\`\`\``;

      const response = await this.llmProvider.complete(systemPrompt, userPrompt);
      const json = extractJSON(response.content);
      return validateTemplate(json);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating template',
      };
    }
  }

  /**
   * Create a Theme from style description
   */
  async createTheme(options: CreateThemeOptions): Promise<ValidationResult<Theme>> {
    try {
      const prompts = await this.promptsPromise;
      const systemPrompt = buildThemePrompt(prompts);

      const scopeInfo = options.typeId ? `\nScope styles to: .${options.typeId}-preview` : '';

      const userPrompt = `Create a CSS theme with the following requirements:

Name: ${options.name}
Description: ${options.description}${scopeInfo}

Generate a complete Theme JSON. Requirements:
- Include ALL required CSS variables in :root
- Include @media print styles for PDF export
- Include @page rule for print setup
- Scope styles appropriately

Return the theme as JSON with this structure:
\`\`\`json
{
  "id": "theme-id",
  "name": "${options.name}",
  "description": "${options.description}",
  "content": "/* CSS here */",
  "createdAt": ${Date.now()},
  "updatedAt": ${Date.now()}
}
\`\`\``;

      const response = await this.llmProvider.complete(systemPrompt, userPrompt);
      const json = extractJSON(response.content);
      return validateTheme(json);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error creating theme',
      };
    }
  }

  /**
   * Edit document content using LLM
   */
  async editDocumentContent(currentData: Record<string, any>, editRequest: string): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const systemPrompt = `You are editing document content in Document Studio.

Rules:
- Preserve the exact structure of the data
- Only modify the values as requested by the user
- Maintain all field types (strings, numbers, arrays, objects)
- Return the complete updated data as JSON
- Do NOT add or remove fields unless explicitly requested

Current data structure should be maintained exactly.`;

      const userPrompt = `Current document data:
\`\`\`json
${JSON.stringify(currentData, null, 2)}
\`\`\`

Edit request: ${editRequest}

Return the complete updated data as JSON in a markdown code block.`;

      const response = await this.llmProvider.complete(systemPrompt, userPrompt);
      const json = extractJSON(response.content);

      if (typeof json !== 'object' || json === null) {
        return {
          success: false,
          error: 'Invalid JSON response from LLM',
        };
      }

      return {
        success: true,
        data: json as Record<string, any>,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error editing document',
      };
    }
  }
}
