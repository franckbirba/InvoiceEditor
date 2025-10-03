import { DocumentTypeSchema, TemplateSchema, ThemeSchema } from '../../document/document.schema';
import type { DocumentType, Template, Theme } from '../../document/document.schema';
import Mustache from 'mustache';

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  issues?: string[];
}

/**
 * Validate DocumentType JSON from LLM
 */
export function validateDocumentType(json: unknown): ValidationResult<DocumentType> {
  try {
    const result = DocumentTypeSchema.safeParse(json);

    if (!result.success) {
      return {
        success: false,
        error: 'Invalid DocumentType schema',
        issues: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }

    const docType = result.data;

    // Additional validation
    const issues: string[] = [];

    // Check ID format (kebab-case)
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(docType.id)) {
      issues.push('ID must be kebab-case (e.g., "legal-contract")');
    }

    // Check for at least one section
    if (!docType.sections || docType.sections.length === 0) {
      issues.push('DocumentType must have at least one section');
    }

    // Check each section has fields
    docType.sections?.forEach((section, idx) => {
      if (!section.fields || section.fields.length === 0) {
        issues.push(`Section "${section.name}" (index ${idx}) must have at least one field`);
      }
    });

    if (issues.length > 0) {
      return {
        success: false,
        error: 'Validation issues found',
        issues,
      };
    }

    return {
      success: true,
      data: docType,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validate Template HTML from LLM
 */
export function validateTemplate(json: unknown): ValidationResult<Template> {
  try {
    const result = TemplateSchema.safeParse(json);

    if (!result.success) {
      return {
        success: false,
        error: 'Invalid Template schema',
        issues: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }

    const template = result.data;
    const issues: string[] = [];

    // Check ID format
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(template.id)) {
      issues.push('ID must be kebab-case');
    }

    // Validate Mustache syntax
    try {
      Mustache.parse(template.content);
    } catch (error) {
      issues.push(`Invalid Mustache syntax: ${error instanceof Error ? error.message : 'unknown error'}`);
    }

    // Check for required attributes
    const hasRootId = /<[^>]+id=["'][^"']*-content["']/.test(template.content);
    if (!hasRootId) {
      issues.push('Template must have root element with id="{typeId}-content"');
    }

    const hasRootClass = /<[^>]+class=["'][^"']*-preview["']/.test(template.content);
    if (!hasRootClass) {
      issues.push('Template must have root element with class="{typeId}-preview"');
    }

    // Check for data-field attributes
    const hasDataFields = /data-field=["']/.test(template.content);
    if (!hasDataFields) {
      issues.push('Template should include data-field attributes for editing');
    }

    // Warn about arrays without proper attributes
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
      return {
        success: false,
        error: 'Template validation issues',
        issues,
      };
    }

    return {
      success: true,
      data: template,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Validate Theme CSS from LLM
 */
export function validateTheme(json: unknown): ValidationResult<Theme> {
  try {
    const result = ThemeSchema.safeParse(json);

    if (!result.success) {
      return {
        success: false,
        error: 'Invalid Theme schema',
        issues: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      };
    }

    const theme = result.data;
    const issues: string[] = [];

    // Check ID format
    if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(theme.id)) {
      issues.push('ID must be kebab-case');
    }

    // Check for required CSS variables
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

    // Check for print styles
    const hasPrintStyles = /@media\s+print/.test(theme.content);
    if (!hasPrintStyles) {
      issues.push('Theme should include @media print styles for PDF export');
    }

    const hasPageRule = /@page\s*{/.test(theme.content);
    if (!hasPageRule) {
      issues.push('Theme should include @page rule for print setup');
    }

    // Check for scoping (preview class)
    const hasScopedClasses = /\.\w+-preview\s*{/.test(theme.content);
    if (!hasScopedClasses) {
      issues.push('Theme should scope styles to .{typeId}-preview class');
    }

    if (issues.length > 0) {
      return {
        success: false,
        error: 'Theme validation issues',
        issues,
      };
    }

    return {
      success: true,
      data: theme,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

/**
 * Extract JSON from LLM response (handles markdown code blocks)
 */
export function extractJSON(text: string): unknown {
  // Remove markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonText = jsonMatch ? jsonMatch[1] : text;

  try {
    return JSON.parse(jsonText.trim());
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}
