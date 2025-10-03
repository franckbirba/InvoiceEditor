/**
 * Document Schema System
 * Defines the structure, field types, and behavior of document types
 */

export type FieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'email'
  | 'phone'
  | 'percentage'
  | 'textarea'
  | 'url';

export interface FieldDefinition {
  /** Field identifier (e.g., "invoice.number", "sender.name") */
  path: string;
  /** Display label */
  label: string;
  /** Field type determines how to parse/format/edit */
  type: FieldType;
  /** Whether field can be edited */
  editable?: boolean;
  /** Whether field is required */
  required?: boolean;
  /** Validation constraints */
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  /** Default value */
  defaultValue?: any;
  /** Help text for the field */
  help?: string;
}

export interface SectionDefinition {
  /** Section identifier */
  id: string;
  /** Display title */
  title: string;
  /** Section description */
  description?: string;
  /** Fields in this section */
  fields: FieldDefinition[];
  /** Whether this is a repeatable section (like invoice items) */
  repeatable?: boolean;
  /** If repeatable, path to the array in the data */
  arrayPath?: string;
}

export interface DocumentTypeDefinition {
  /** Document type identifier */
  type: string;
  /** Display name */
  name: string;
  /** Document description */
  description?: string;
  /** Sections that make up this document */
  sections: SectionDefinition[];
  /** Default template ID for this document type */
  defaultTemplate?: string;
  /** Available templates for this document type */
  availableTemplates?: string[];
}

/**
 * Field value parser - converts from display format to data format
 */
export interface FieldParser {
  /**
   * Parse a display value (from contentEditable) to data value
   * @param displayValue - The value from contentEditable (string)
   * @param locale - Current locale for parsing
   * @param context - Additional context (e.g., currency code)
   */
  parse(displayValue: string, locale: string, context?: Record<string, any>): any;

  /**
   * Format a data value for display
   * @param dataValue - The raw data value
   * @param locale - Current locale for formatting
   * @param context - Additional context (e.g., currency code)
   */
  format(dataValue: any, locale: string, context?: Record<string, any>): string;

  /**
   * Validate a data value
   * @param dataValue - The value to validate
   * @param field - Field definition with validation rules
   */
  validate(dataValue: any, field: FieldDefinition): { valid: boolean; error?: string };
}

/**
 * Registry of field parsers by type
 */
export const fieldParsers: Record<FieldType, FieldParser> = {
  text: {
    parse: (value) => value.trim(),
    format: (value) => String(value || ''),
    validate: (value, field) => {
      if (field.required && !value) {
        return { valid: false, error: 'This field is required' };
      }
      if (field.validation?.minLength && value.length < field.validation.minLength) {
        return { valid: false, error: `Minimum length is ${field.validation.minLength}` };
      }
      if (field.validation?.maxLength && value.length > field.validation.maxLength) {
        return { valid: false, error: `Maximum length is ${field.validation.maxLength}` };
      }
      return { valid: true };
    },
  },

  number: {
    parse: (value, locale) => {
      // Remove spaces and handle different decimal separators
      const cleaned = value.replace(/\s/g, '');
      const usesComma = locale.startsWith('fr');
      const normalized = usesComma ? cleaned.replace(',', '.') : cleaned;
      const num = parseFloat(normalized);
      return isNaN(num) ? 0 : num;
    },
    format: (value, locale) => {
      const num = typeof value === 'number' ? value : parseFloat(value) || 0;
      return new Intl.NumberFormat(locale).format(num);
    },
    validate: (value, field) => {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) {
        return { valid: false, error: 'Must be a valid number' };
      }
      if (field.validation?.min !== undefined && num < field.validation.min) {
        return { valid: false, error: `Minimum value is ${field.validation.min}` };
      }
      if (field.validation?.max !== undefined && num > field.validation.max) {
        return { valid: false, error: `Maximum value is ${field.validation.max}` };
      }
      return { valid: true };
    },
  },

  currency: {
    parse: (value, locale) => {
      // Extract just the number from formatted currency (e.g., "1 500 XOF" -> 1500)
      const cleaned = value
        .replace(/[A-Z]{3}/g, '') // Remove currency code
        .replace(/\s/g, '') // Remove spaces
        .trim();

      const usesComma = locale.startsWith('fr');
      const normalized = usesComma ? cleaned.replace(',', '.') : cleaned;
      const num = parseFloat(normalized);
      return isNaN(num) ? 0 : num;
    },
    format: (value, locale, context) => {
      const num = typeof value === 'number' ? value : parseFloat(value) || 0;
      const currency = context?.currency || 'USD';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(num);
    },
    validate: (value, field) => {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) {
        return { valid: false, error: 'Must be a valid amount' };
      }
      if (field.validation?.min !== undefined && num < field.validation.min) {
        return { valid: false, error: `Minimum amount is ${field.validation.min}` };
      }
      return { valid: true };
    },
  },

  date: {
    parse: (value) => {
      // Try to parse various date formats
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    },
    format: (value, locale) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat(locale).format(date);
    },
    validate: (value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { valid: false, error: 'Must be a valid date' };
      }
      return { valid: true };
    },
  },

  email: {
    parse: (value) => value.trim().toLowerCase(),
    format: (value) => String(value || ''),
    validate: (value, field) => {
      if (field.required && !value) {
        return { valid: false, error: 'Email is required' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return { valid: false, error: 'Must be a valid email' };
      }
      return { valid: true };
    },
  },

  phone: {
    parse: (value) => value.trim(),
    format: (value) => String(value || ''),
    validate: (value, field) => {
      if (field.required && !value) {
        return { valid: false, error: 'Phone number is required' };
      }
      return { valid: true };
    },
  },

  percentage: {
    parse: (value, locale) => {
      // Remove % sign and parse as number
      const cleaned = value.replace(/%/g, '').replace(/\s/g, '');
      const usesComma = locale.startsWith('fr');
      const normalized = usesComma ? cleaned.replace(',', '.') : cleaned;
      const num = parseFloat(normalized);
      return isNaN(num) ? 0 : num;
    },
    format: (value, locale) => {
      const num = typeof value === 'number' ? value : parseFloat(value) || 0;
      return `${new Intl.NumberFormat(locale).format(num)}%`;
    },
    validate: (value) => {
      const num = typeof value === 'number' ? value : parseFloat(value);
      if (isNaN(num)) {
        return { valid: false, error: 'Must be a valid percentage' };
      }
      if (num < 0 || num > 100) {
        return { valid: false, error: 'Must be between 0 and 100' };
      }
      return { valid: true };
    },
  },

  textarea: {
    parse: (value) => value.trim(),
    format: (value) => String(value || ''),
    validate: (value, field) => {
      if (field.required && !value) {
        return { valid: false, error: 'This field is required' };
      }
      return { valid: true };
    },
  },

  url: {
    parse: (value) => value.trim(),
    format: (value) => String(value || ''),
    validate: (value, field) => {
      if (field.required && !value) {
        return { valid: false, error: 'URL is required' };
      }
      try {
        if (value) new URL(value);
        return { valid: true };
      } catch {
        return { valid: false, error: 'Must be a valid URL' };
      }
    },
  },
};

/**
 * Get the appropriate parser for a field path
 */
export function getFieldParser(fieldPath: string, schema: DocumentTypeDefinition): FieldParser | null {
  // Find the field definition in the schema
  for (const section of schema.sections) {
    const field = section.fields.find(f => f.path === fieldPath);
    if (field) {
      return fieldParsers[field.type];
    }
  }
  return null;
}

/**
 * Get the field definition for a path
 */
export function getFieldDefinition(fieldPath: string, schema: DocumentTypeDefinition): FieldDefinition | null {
  for (const section of schema.sections) {
    const field = section.fields.find(f => f.path === fieldPath);
    if (field) {
      return field;
    }
  }
  return null;
}
