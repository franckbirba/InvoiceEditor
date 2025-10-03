import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { getDocumentType, saveDocumentType, type StoredDocumentType } from '../features/document/document-type-storage';
import type { DocumentTypeDefinition } from '../features/document/document-schema';

interface DocumentTypeEditorProps {
  id: string;
  onSave?: () => void;
  onError?: (error: string) => void;
}

export interface DocumentTypeEditorRef {
  save: () => void;
  format: () => void;
  togglePreview: () => void;
}

export const DocumentTypeEditor = forwardRef<DocumentTypeEditorRef, DocumentTypeEditorProps>(
  ({ id, onSave, onError }, ref) => {
    const [documentType, setDocumentType] = useState<StoredDocumentType | null>(null);
    const [jsonContent, setJsonContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const type = getDocumentType(id);
    if (type) {
      setDocumentType(type);
      setJsonContent(JSON.stringify(type.definition, null, 2));
    }
  }, [id]);

    const handleSave = () => {
      try {
        setError(null);
        const parsed = JSON.parse(jsonContent) as DocumentTypeDefinition;

        // Basic validation
        if (!parsed.type || !parsed.name || !parsed.sections) {
          throw new Error('Le schéma doit contenir type, name et sections');
        }

        if (!Array.isArray(parsed.sections)) {
          throw new Error('sections doit être un tableau');
        }

        // Save
        const updated: StoredDocumentType = {
          ...documentType!,
          definition: parsed,
          updatedAt: Date.now(),
        };

        saveDocumentType(updated);
        setDocumentType(updated);
        onSave?.();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Erreur de parsing JSON';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };

    const handleFormat = () => {
      try {
        const parsed = JSON.parse(jsonContent);
        setJsonContent(JSON.stringify(parsed, null, 2));
        setError(null);
      } catch (err) {
        setError('JSON invalide - impossible de formater');
      }
    };

    // Expose methods to parent via ref
    useImperativeHandle(ref, () => ({
      save: handleSave,
      format: handleFormat,
      togglePreview: () => setShowPreview(prev => !prev),
    }));

    if (!documentType) {
      return (
        <div className="p-8">
          <div className="text-center text-gray-500">Type de document introuvable</div>
        </div>
      );
    }

    return (
      <div className="h-full flex bg-white">
        {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className={`${showPreview ? 'w-1/2' : 'w-full'} flex flex-col border-r`}>
          <div className="px-6 py-3 border-b bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700">Schéma JSON</h3>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <textarea
              value={jsonContent}
              onChange={(e) => setJsonContent(e.target.value)}
              disabled={documentType.isBuiltIn}
              className="w-full h-full font-mono text-sm p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed"
              spellCheck={false}
            />
          </div>
          {error && (
            <div className="px-4 py-3 bg-red-50 border-t border-red-200 text-red-700 text-sm">
              <strong>Erreur:</strong> {error}
            </div>
          )}
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-1/2 flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700">Aperçu de la structure</h3>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {(() => {
                try {
                  const parsed = JSON.parse(jsonContent) as DocumentTypeDefinition;
                  return (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{parsed.name}</h4>
                        {parsed.description && (
                          <p className="text-sm text-gray-600 mt-1">{parsed.description}</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        {parsed.sections.map((section, idx) => (
                          <div key={idx} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <h5 className="font-medium text-gray-900">{section.title}</h5>
                              {section.repeatable && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                  Répétable
                                </span>
                              )}
                            </div>
                            {section.description && (
                              <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                            )}
                            <div className="space-y-1">
                              {section.fields.map((field, fieldIdx) => (
                                <div key={fieldIdx} className="text-sm flex items-center gap-2">
                                  <span className="text-gray-500">{field.path}</span>
                                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                                    {field.type}
                                  </span>
                                  {field.required && (
                                    <span className="text-xs text-red-600">*</span>
                                  )}
                                  {!field.editable && (
                                    <span className="text-xs text-gray-500">(lecture seule)</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch {
                  return (
                    <div className="text-center text-gray-500 py-8">
                      JSON invalide - impossible d'afficher l'aperçu
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
    );
  }
);
