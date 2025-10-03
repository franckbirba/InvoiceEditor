import { z } from 'zod';

// Field definition schema
export const FieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['text', 'number', 'date', 'email', 'textarea', 'tel', 'url']),
  required: z.boolean().optional().default(false),
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
});

export const ArrayFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.literal('array'),
  required: z.boolean().optional().default(false),
  itemSchema: z.array(FieldSchema),
});

export const FieldDefinitionSchema = z.union([FieldSchema, ArrayFieldSchema]);

// Section definition schema
export const SectionSchema = z.object({
  id: z.string(),
  name: z.string(),
  fields: z.array(FieldDefinitionSchema),
});

// DocumentType defines the structure and schema for a type of document
export const DocumentTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  sections: z.array(SectionSchema),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Template defines the HTML structure using Mustache
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  typeId: z.string(), // reference to DocumentType
  content: z.string(), // Mustache HTML
  isDefault: z.boolean().optional().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Theme defines the CSS styling
export const ThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(), // CSS content
  isDefault: z.boolean().optional().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Project/Folder for organizing documents (with hierarchy support)
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().optional(), // reference to parent project for hierarchy
  color: z.string().optional(),
  icon: z.string().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Tag for categorizing documents
export const TagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
});

// Document is an instance of a DocumentType
export const DocumentSchema = z.object({
  id: z.string(),
  typeId: z.string(), // reference to DocumentType
  name: z.string(),
  data: z.record(z.string(), z.any()), // actual field values
  templateId: z.string(),
  themeId: z.string(),
  projectId: z.string().optional(), // reference to Project
  tags: z.array(z.string()).optional(), // array of tag IDs
  createdAt: z.number(),
  updatedAt: z.number(),
});

// TypeScript types
export type Field = z.infer<typeof FieldSchema>;
export type ArrayField = z.infer<typeof ArrayFieldSchema>;
export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>;
export type Section = z.infer<typeof SectionSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type Template = z.infer<typeof TemplateSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Tag = z.infer<typeof TagSchema>;
export type Document = z.infer<typeof DocumentSchema>;
