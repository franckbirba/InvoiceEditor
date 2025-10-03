import { useEffect, useState, useRef } from 'react';
import { useInvoiceStore } from './features/invoice/useInvoiceStore';
import { Topbar } from './components/Topbar';
import { ProjectSidebar } from './components/ProjectSidebar';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoicePreviewEditable } from './components/InvoicePreviewEditable';
import { TemplateEditor } from './components/TemplateEditor';
import { TemplateThemeEditor } from './components/TemplateThemeEditor';
import { TemplateThemePreview } from './components/TemplateThemePreview';
import { DocumentTypeEditor, type DocumentTypeEditorRef } from './components/DocumentTypeEditor';
import { ToastProvider, useToast } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initializeDocumentSystem } from './features/document/initialize';
import { initializeDocumentTypes } from './features/document/initialize-document-types';
import './lib/i18n';

const SIDEBAR_OPEN_KEY = 'document-studio-sidebar-open';

function AppContent() {
  const { showToast } = useToast();
  const isEditorMode = useInvoiceStore((state) => state.isEditorMode);
  const isInlineEditMode = useInvoiceStore((state) => state.isInlineEditMode);
  const activeView = useInvoiceStore((state) => state.activeView);
  const setActiveView = useInvoiceStore((state) => state.setActiveView);
  const toggleViewMode = useInvoiceStore((state) => state.toggleViewMode);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_OPEN_KEY);
    return saved ? JSON.parse(saved) : true;
  });
  const documentTypeEditorRef = useRef<DocumentTypeEditorRef | null>(null);

  // Initialize document system on first load
  useEffect(() => {
    initializeDocumentTypes();
    const result = initializeDocumentSystem();
    if (result.migrated) {
      console.log(`Migrated ${result.documentCount} documents to new format`);
    }
  }, []);

  // Save sidebar state
  useEffect(() => {
    localStorage.setItem(SIDEBAR_OPEN_KEY, JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'p') {
        e.preventDefault();
        window.print();
      }

      if (modifier && e.key === 's') {
        e.preventDefault();
        const store = useInvoiceStore.getState();
        const json = store.exportToJson();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      }

      if (modifier && e.key === 'e') {
        e.preventDefault();
        useInvoiceStore.getState().toggleEditorMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <Topbar
        viewingItem={activeView && (activeView.type === 'template' || activeView.type === 'theme' || activeView.type === 'documentType') ? activeView : null}
        onEditItem={toggleViewMode}
        documentTypeEditorRef={documentTypeEditorRef as React.RefObject<DocumentTypeEditorRef>}
        onDocumentTypeSave={() => showToast('success', 'Sauvegardé', 'Le type de document a été sauvegardé')}
        onDocumentTypeError={(error) => showToast('error', 'Erreur', error)}
      />

          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Project Sidebar */}
            <ProjectSidebar
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              onEditTemplate={(id) => setActiveView({ type: 'template', id, mode: 'preview' })}
              onEditTheme={(id) => setActiveView({ type: 'theme', id, mode: 'preview' })}
              onEditDocumentType={(id) => setActiveView({ type: 'documentType', id, mode: 'edit' })}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8 min-w-0">
              {activeView?.type === 'template' ? (
                activeView.mode === 'preview' ? (
                  <TemplateThemePreview
                    type="template"
                    id={activeView.id}
                  />
                ) : (
                  <TemplateThemeEditor
                    type="template"
                    id={activeView.id}
                  />
                )
              ) : activeView?.type === 'theme' ? (
                activeView.mode === 'preview' ? (
                  <TemplateThemePreview
                    type="theme"
                    id={activeView.id}
                  />
                ) : (
                  <TemplateThemeEditor
                    type="theme"
                    id={activeView.id}
                  />
                )
              ) : activeView?.type === 'documentType' ? (
                <DocumentTypeEditor
                  ref={documentTypeEditorRef}
                  id={activeView.id}
                  onSave={() => showToast('success', 'Sauvegardé', 'Le type de document a été sauvegardé')}
                  onError={(error) => showToast('error', 'Erreur', error)}
                />
              ) : isEditorMode ? (
                <TemplateEditor />
              ) : isInlineEditMode ? (
                <InvoicePreviewEditable />
              ) : (
                <InvoicePreview />
              )}
            </main>
          </div>
        </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
