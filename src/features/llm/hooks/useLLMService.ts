import { useState, useCallback, useMemo } from 'react';
import { DocumentStudioLLMService } from '../services/llm-service';
import type { LLMConfig } from '../services/llm-provider';
import type { DocumentType, Template, Theme } from '../../document/document.schema';
import type { ValidationResult } from '../services/validators';

const LLM_CONFIG_KEY = 'document-studio-llm-config';

interface LLMSettings {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model?: string;
}

/**
 * Get LLM configuration from localStorage
 */
function getLLMConfig(): LLMSettings | null {
  try {
    const stored = localStorage.getItem(LLM_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Save LLM configuration to localStorage
 */
function saveLLMConfig(config: LLMSettings): void {
  localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Clear LLM configuration from localStorage
 */
function clearLLMConfig(): void {
  localStorage.removeItem(LLM_CONFIG_KEY);
}

export interface UseLLMServiceReturn {
  // Configuration
  isConfigured: boolean;
  config: LLMSettings | null;
  configure: (settings: LLMSettings) => void;
  clearConfig: () => void;

  // Document Type creation & update
  createDocumentType: (description: string) => Promise<ValidationResult<DocumentType>>;
  updateDocumentType: (current: DocumentType, updateRequest: string) => Promise<ValidationResult<DocumentType>>;
  isCreatingDocumentType: boolean;
  isUpdatingDocumentType: boolean;

  // Template creation & update
  createTemplate: (typeId: string, description: string, documentType?: DocumentType) => Promise<ValidationResult<Template>>;
  updateTemplate: (current: Template, updateRequest: string, documentType?: DocumentType) => Promise<ValidationResult<Template>>;
  isCreatingTemplate: boolean;
  isUpdatingTemplate: boolean;

  // Theme creation & update
  createTheme: (name: string, description: string, typeId?: string) => Promise<ValidationResult<Theme>>;
  updateTheme: (current: Theme, updateRequest: string) => Promise<ValidationResult<Theme>>;
  isCreatingTheme: boolean;
  isUpdatingTheme: boolean;

  // Document editing
  editDocument: (currentData: Record<string, any>, editRequest: string) => Promise<{ success: boolean; data?: Record<string, any>; error?: string }>;
  isEditingDocument: boolean;

  // Error handling
  lastError: string | null;
  clearError: () => void;
}

/**
 * React hook for LLM service
 * Provides easy access to LLM capabilities for generating document types, templates, and themes
 */
export function useLLMService(): UseLLMServiceReturn {
  const [config, setConfig] = useState<LLMSettings | null>(() => getLLMConfig());
  const [isCreatingDocumentType, setIsCreatingDocumentType] = useState(false);
  const [isUpdatingDocumentType, setIsUpdatingDocumentType] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isUpdatingTemplate, setIsUpdatingTemplate] = useState(false);
  const [isCreatingTheme, setIsCreatingTheme] = useState(false);
  const [isUpdatingTheme, setIsUpdatingTheme] = useState(false);
  const [isEditingDocument, setIsEditingDocument] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const service = useMemo(() => {
    if (!config?.apiKey) return null;
    return new DocumentStudioLLMService({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
    });
  }, [config]);

  const configure = useCallback((settings: LLMSettings) => {
    saveLLMConfig(settings);
    setConfig(settings);
    setLastError(null);
  }, []);

  const clearConfig = useCallback(() => {
    clearLLMConfig();
    setConfig(null);
  }, []);

  const createDocumentType = useCallback(
    async (description: string): Promise<ValidationResult<DocumentType>> => {
      if (!service) {
        const error = { success: false as const, error: 'LLM service not configured' };
        setLastError(error.error);
        return error;
      }

      setIsCreatingDocumentType(true);
      setLastError(null);

      try {
        const result = await service.createDocumentType({ description });
        if (!result.success) {
          setLastError(result.error || 'Failed to create document type');
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLastError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsCreatingDocumentType(false);
      }
    },
    [service]
  );

  const createTemplate = useCallback(
    async (typeId: string, description: string, documentType?: DocumentType): Promise<ValidationResult<Template>> {
      if (!service) {
        const error = { success: false as const, error: 'LLM service not configured' };
        setLastError(error.error);
        return error;
      }

      setIsCreatingTemplate(true);
      setLastError(null);

      try {
        const result = await service.createTemplate({ typeId, description, documentType });
        if (!result.success) {
          setLastError(result.error || 'Failed to create template');
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLastError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsCreatingTemplate(false);
      }
    },
    [service]
  );

  const createTheme = useCallback(
    async (name: string, description: string, typeId?: string): Promise<ValidationResult<Theme>> {
      if (!service) {
        const error = { success: false as const, error: 'LLM service not configured' };
        setLastError(error.error);
        return error;
      }

      setIsCreatingTheme(true);
      setLastError(null);

      try {
        const result = await service.createTheme({ name, description, typeId });
        if (!result.success) {
          setLastError(result.error || 'Failed to create theme');
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLastError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsCreatingTheme(false);
      }
    },
    [service]
  );

  const updateDocumentType = useCallback(
    async (current: DocumentType, updateRequest: string): Promise<ValidationResult<DocumentType>> => {
      if (!service) {
        const error = { success: false as const, error: 'LLM service not configured' };
        setLastError(error.error);
        return error;
      }

      setIsUpdatingDocumentType(true);
      setLastError(null);

      try {
        const result = await service.updateDocumentType({ current, updateRequest });
        if (!result.success) {
          setLastError(result.error || 'Failed to update document type');
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLastError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsUpdatingDocumentType(false);
      }
    },
    [service]
  );

  const updateTemplate = useCallback(
    async (current: Template, updateRequest: string, documentType?: DocumentType): Promise<ValidationResult<Template>> => {
      if (!service) {
        const error = { success: false as const, error: 'LLM service not configured' };
        setLastError(error.error);
        return error;
      }

      setIsUpdatingTemplate(true);
      setLastError(null);

      try {
        const result = await service.updateTemplate({ current, updateRequest, documentType });
        if (!result.success) {
          setLastError(result.error || 'Failed to update template');
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLastError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsUpdatingTemplate(false);
      }
    },
    [service]
  );

  const updateTheme = useCallback(
    async (current: Theme, updateRequest: string): Promise<ValidationResult<Theme>> => {
      if (!service) {
        const error = { success: false as const, error: 'LLM service not configured' };
        setLastError(error.error);
        return error;
      }

      setIsUpdatingTheme(true);
      setLastError(null);

      try {
        const result = await service.updateTheme({ current, updateRequest });
        if (!result.success) {
          setLastError(result.error || 'Failed to update theme');
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLastError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsUpdatingTheme(false);
      }
    },
    [service]
  );

  const editDocument = useCallback(
    async (currentData: Record<string, any>, editRequest: string) => {
      if (!service) {
        const error = { success: false as const, error: 'LLM service not configured' };
        setLastError(error.error);
        return error;
      }

      setIsEditingDocument(true);
      setLastError(null);

      try {
        const result = await service.editDocumentContent(currentData, editRequest);
        if (!result.success) {
          setLastError(result.error || 'Failed to edit document');
        }
        return result;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setLastError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsEditingDocument(false);
      }
    },
    [service]
  );

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  return {
    isConfigured: !!service,
    config,
    configure,
    clearConfig,
    createDocumentType,
    updateDocumentType,
    isCreatingDocumentType,
    isUpdatingDocumentType,
    createTemplate,
    updateTemplate,
    isCreatingTemplate,
    isUpdatingTemplate,
    createTheme,
    updateTheme,
    isCreatingTheme,
    isUpdatingTheme,
    editDocument,
    isEditingDocument,
    lastError,
    clearError,
  };
}
