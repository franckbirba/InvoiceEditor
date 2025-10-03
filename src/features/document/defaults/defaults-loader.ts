import type { DocumentType, Template, Theme } from '../document.schema';
import defaultsData from '../../../assets/defaults.json';

/**
 * Centralized defaults loader - fully data-driven from JSON
 * This function loads all default document types, templates, and themes from defaults.json
 *
 * To add a new document type, simply edit /src/assets/defaults.json - no code changes needed!
 */
export function loadDefaults(): {
  documentTypes: DocumentType[];
  templates: Template[];
  themes: Theme[];
} {
  const now = Date.now();

  // Load from JSON and ensure all items have timestamps
  const documentTypes: DocumentType[] = (defaultsData.documentTypes as any[]).map(type => ({
    ...type,
    createdAt: type.createdAt || now,
    updatedAt: type.updatedAt || now,
  } as DocumentType));

  const templates: Template[] = (defaultsData.templates as any[]).map(template => ({
    ...template,
    createdAt: template.createdAt || now,
    updatedAt: template.updatedAt || now,
  } as Template));

  const themes: Theme[] = (defaultsData.themes as any[]).map(theme => ({
    ...theme,
    createdAt: theme.createdAt || now,
    updatedAt: theme.updatedAt || now,
  } as Theme));

  return {
    documentTypes,
    templates,
    themes,
  };
}
