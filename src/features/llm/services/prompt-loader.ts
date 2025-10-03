import yaml from 'yaml';

/**
 * Prompt Loader Service
 * Loads and formats YAML prompts for LLM consumption
 */

export interface PromptData {
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

/**
 * Load all prompts and documentation for LLM
 * This runs in browser, so we need to import the files directly
 */
export async function loadPrompts(): Promise<PromptData> {
  // Import YAML prompts
  const systemYaml = await import('../prompts/system.yaml?raw');
  const documentTypesYaml = await import('../prompts/document-types.yaml?raw');
  const templatesYaml = await import('../prompts/templates.yaml?raw');
  const themesYaml = await import('../prompts/themes.yaml?raw');

  // Import examples
  const invoiceTypeExample = await import('../prompts/examples/document-types/invoice.json?raw');
  const cvTypeExample = await import('../prompts/examples/document-types/cv.json?raw');
  const invoiceTemplateExample = await import('../prompts/examples/templates/invoice-template.html?raw');
  const cvTemplateExample = await import('../prompts/examples/templates/cv-template.html?raw');
  const terminalThemeExample = await import('../prompts/examples/themes/terminal-theme.css?raw');
  const cvThemeExample = await import('../prompts/examples/themes/cv-theme.css?raw');

  // Import docs
  const schemasDoc = await import('../docs/schemas.md?raw');
  const mustacheDoc = await import('../docs/mustache-guide.md?raw');
  const cssDoc = await import('../docs/css-requirements.md?raw');
  const renderingDoc = await import('../docs/rendering-rules.md?raw');

  return {
    system: formatYamlAsText(systemYaml.default),
    documentTypes: formatYamlAsText(documentTypesYaml.default),
    templates: formatYamlAsText(templatesYaml.default),
    themes: formatYamlAsText(themesYaml.default),
    examples: {
      documentTypes: [invoiceTypeExample.default, cvTypeExample.default],
      templates: [invoiceTemplateExample.default, cvTemplateExample.default],
      themes: [terminalThemeExample.default, cvThemeExample.default],
    },
    docs: {
      schemas: schemasDoc.default,
      mustacheGuide: mustacheDoc.default,
      cssRequirements: cssDoc.default,
      renderingRules: renderingDoc.default,
    },
  };
}

/**
 * Format YAML content as readable text for LLM
 */
function formatYamlAsText(yamlContent: string): string {
  try {
    const parsed = yaml.parse(yamlContent);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return yamlContent; // Return raw if parsing fails
  }
}

/**
 * Build system prompt for DocumentType creation
 */
export function buildDocumentTypePrompt(prompts: PromptData): string {
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
Follow the schema exactly. Use appropriate field types and sections.
`;
}

/**
 * Build system prompt for Template creation
 */
export function buildTemplatePrompt(prompts: PromptData): string {
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
IMPORTANT: Include ALL required data-* attributes (data-field, data-item-index, data-array-container).
`;
}

/**
 * Build system prompt for Theme creation
 */
export function buildThemePrompt(prompts: PromptData): string {
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
Include all required CSS variables, print styles, and proper scoping.
`;
}
