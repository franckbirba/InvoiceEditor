import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Printer, Eye, User, Pencil, FileCode, Palette, Edit, Trash2, Plus, Copy, Code } from 'lucide-react';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { printInvoice } from '../lib/print';
import { JsonImportExport } from './JsonImportExport';
import { LanguageToggle } from './LanguageToggle';
import { ThemeSwitcher } from './ThemeSwitcher';
import { TemplateSelector } from './TemplateSelector';
import { DocumentsNavigationDialog } from './DocumentsNavigationDialog';
import { useToast } from './Toast';
import { getDocumentTypes, getDocument, getTemplate, getTheme } from '../features/document/document.storage';
import type { Document } from '../features/document/document.schema';

interface TopbarProps {
  viewingItem?: {
    type: 'template' | 'theme';
    id: string;
    mode: 'preview' | 'edit';
  } | null;
  onEditItem?: () => void;
}

export function Topbar({ viewingItem, onEditItem }: TopbarProps) {
  const { t } = useTranslation('ui');
  const { showToast } = useToast();
  const { isEditorMode, toggleEditorMode, activeDocumentId, isInlineEditMode, toggleInlineEditMode, renameTemplate, duplicateTemplate, deleteTemplate, renameTheme, duplicateTheme, deleteTheme, setTemplateById, setThemeById, createDocument } = useInvoiceStore();
  const [showImportExport, setShowImportExport] = React.useState(false);
  const [showDocuments, setShowDocuments] = React.useState(false);
  const [currentDocType, setCurrentDocType] = React.useState<string>('');

  React.useEffect(() => {
    if (activeDocumentId) {
      const doc = getDocument(activeDocumentId);
      if (doc) {
        const types = getDocumentTypes();
        const type = types.find((t) => t.id === doc.typeId);
        setCurrentDocType(type?.name || '');
      }
    }
  }, [activeDocumentId]);

  const handleDocumentSelect = (doc: Document) => {
    // Load the document - will be handled by the store
    useInvoiceStore.getState().loadDocumentById(doc.id);
  };

  const handleNewDocument = (typeId: string, projectId?: string) => {
    // Create new document of specific type
    const types = getDocumentTypes();
    const type = types.find((t) => t.id === typeId);
    if (type) {
      useInvoiceStore.getState().createDocument();

      // If projectId is provided, assign document to project
      if (projectId) {
        // Get the newly created document and update it with projectId
        import('../features/document/document.storage').then(({ getActiveDocumentId, getDocument, saveDocument }) => {
          const docId = getActiveDocumentId();
          if (docId) {
            const doc = getDocument(docId);
            if (doc) {
              saveDocument({ ...doc, projectId });
            }
          }
        });
      }

      showToast('success', 'Nouveau document', `Nouveau ${type.name} créé`);
    }
  };

  const getDocTypeIcon = (typeName: string) => {
    if (typeName.toLowerCase().includes('cv')) return User;
    if (typeName.toLowerCase().includes('facture')) return FileText;
    return FileText;
  };

  const DocIcon = getDocTypeIcon(currentDocType);

  const handlePrint = async () => {
    try {
      await printInvoice();
      showToast('success', 'Print initiated', 'PDF generation started');
    } catch (error) {
      showToast('error', 'Print failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  // Contextual actions for templates/themes
  const handleRename = () => {
    if (!viewingItem) return;
    
    const item = viewingItem.type === 'template' ? getTemplate(viewingItem.id) : getTheme(viewingItem.id);
    if (!item) return;
    
    const newName = prompt('Nouveau nom:', item.name);
    if (newName && newName.trim() && newName !== item.name) {
      if (viewingItem.type === 'template') {
        renameTemplate(viewingItem.id, newName.trim());
      } else {
        renameTheme(viewingItem.id, newName.trim());
      }
      showToast('success', 'Renommé', `"${newName.trim()}" a été renommé`);
    }
  };

  const handleDuplicateItem = () => {
    if (!viewingItem) return;

    if (viewingItem.type === 'template') {
      duplicateTemplate(viewingItem.id);
    } else {
      duplicateTheme(viewingItem.id);
    }
    showToast('success', 'Dupliqué', 'Une copie a été créée');
  };

  const handleDelete = () => {
    if (!viewingItem) return;

    const item = viewingItem.type === 'template' ? getTemplate(viewingItem.id) : getTheme(viewingItem.id);
    if (!item) return;

    if (item.isDefault) {
      showToast('error', 'Impossible', 'Impossible de supprimer un élément par défaut');
      return;
    }

    if (confirm(`Supprimer "${item.name}" ?`)) {
      if (viewingItem.type === 'template') {
        deleteTemplate(viewingItem.id);
      } else {
        deleteTheme(viewingItem.id);
      }
      showToast('success', 'Supprimé', `"${item.name}" a été supprimé`);

      // Navigate to last document or create new one
      const { activeDocumentId, createDocument } = useInvoiceStore.getState();
      if (activeDocumentId) {
        useInvoiceStore.getState().setActiveView({ type: 'document', id: activeDocumentId });
      } else {
        createDocument();
      }
    }
  };

  const handleCreateDocument = () => {
    if (!viewingItem) return;

    if (viewingItem.type === 'template') {
      setTemplateById(viewingItem.id);
    } else {
      setThemeById(viewingItem.id);
    }
    createDocument();
    showToast('success', 'Document créé', 'Un nouveau document a été créé avec ce ' + (viewingItem.type === 'template' ? 'template' : 'thème'));
  };

  return (
    <>
      <header className="no-print border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            {viewingItem ? (
              <>
                <div className={`p-2 rounded-lg ${viewingItem.type === 'template' ? 'bg-purple-600' : 'bg-pink-600'}`}>
                  {viewingItem.type === 'template' ? (
                    <FileCode className="w-5 h-5 text-white" />
                  ) : (
                    <Palette className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {viewingItem.type === 'template' ? getTemplate(viewingItem.id)?.name : getTheme(viewingItem.id)?.name}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {viewingItem.type === 'template' ? 'Template' : 'Thème'} • {viewingItem.mode === 'preview' ? 'Aperçu' : 'Édition'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-blue-600 rounded-lg">
                  <DocIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{t('appName')}</h1>
                  <p className="text-xs text-gray-500">{currentDocType || 'Document Editor'}</p>
                </div>
              </>
            )}
          </div>

          {/* Center: Actions */}
          <div className="flex items-center gap-2">
            {viewingItem ? (
              // Contextual actions for templates/themes
              <>
                <button
                  onClick={handleCreateDocument}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Créer un document"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Créer un document</span>
                </button>

                <button
                  onClick={handleRename}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Renommer"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Renommer</span>
                </button>

                <button
                  onClick={handleDuplicateItem}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Dupliquer"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">Dupliquer</span>
                </button>

                {!getTemplate(viewingItem.id)?.isDefault && !getTheme(viewingItem.id)?.isDefault && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Supprimer</span>
                  </button>
                )}

                <div className="w-px h-8 bg-gray-300 mx-2" />

                <button
                  onClick={() => onEditItem?.()}
                  className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                    viewingItem.mode === 'preview'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                  title={viewingItem.mode === 'preview' ? 'Éditer le code' : 'Retour au preview'}
                >
                  {viewingItem.mode === 'preview' ? (
                    <>
                      <Code className="w-4 h-4" />
                      <span className="hidden sm:inline">Éditer</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Aperçu</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              // Default document actions
              <>
                {/* View Mode Switch */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      if (isInlineEditMode) toggleInlineEditMode();
                      if (isEditorMode) toggleEditorMode();
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                      !isInlineEditMode && !isEditorMode
                        ? 'bg-white shadow-sm font-medium'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={() => {
                      if (!isInlineEditMode) toggleInlineEditMode();
                      if (isEditorMode) toggleEditorMode();
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
                      isInlineEditMode && !isEditorMode
                        ? 'bg-white shadow-sm font-medium'
                        : 'hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="w-px h-8 bg-gray-300 mx-2" />

                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  title={t('print')}
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('print')}</span>
                </button>
              </>
            )}
          </div>

          {/* Right: Settings */}
          <div className="flex items-center gap-3">
            {viewingItem ? (
              // Show theme selector for templates, template selector for themes
              viewingItem.type === 'template' ? (
                <ThemeSwitcher />
              ) : (
                <TemplateSelector />
              )
            ) : (
              // For documents, always reserve space for selectors to prevent layout shift
              <>
                <div className={isInlineEditMode && !isEditorMode ? '' : 'invisible'}>
                  <TemplateSelector />
                </div>
                <div className={isInlineEditMode && !isEditorMode ? '' : 'invisible'}>
                  <ThemeSwitcher />
                </div>
              </>
            )}
            <LanguageToggle />
          </div>
        </div>
      </header>

      <JsonImportExport open={showImportExport} onOpenChange={setShowImportExport} />
      <DocumentsNavigationDialog
        open={showDocuments}
        onOpenChange={setShowDocuments}
        onDocumentSelect={handleDocumentSelect}
        onNewDocument={handleNewDocument}
      />
    </>
  );
}
