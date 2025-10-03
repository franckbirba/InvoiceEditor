import { useEffect, useState } from 'react';
import { useInvoiceStore } from './features/invoice/useInvoiceStore';
import { Topbar } from './components/Topbar';
import { ProjectSidebar } from './components/ProjectSidebar';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoicePreviewEditable } from './components/InvoicePreviewEditable';
import { TemplateEditor } from './components/TemplateEditor';
import { TemplateThemeEditor } from './components/TemplateThemeEditor';
import { TemplateThemePreview } from './components/TemplateThemePreview';
import { ToastProvider } from './components/Toast';
import { initializeDocumentSystem } from './features/document/initialize';
import './lib/i18n';

const SIDEBAR_OPEN_KEY = 'document-studio-sidebar-open';

function App() {
  const isEditorMode = useInvoiceStore((state) => state.isEditorMode);
  const isInlineEditMode = useInvoiceStore((state) => state.isInlineEditMode);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_OPEN_KEY);
    return saved ? JSON.parse(saved) : true;
  });
  const [viewingItem, setViewingItem] = useState<{
    type: 'template' | 'theme';
    id: string;
    mode: 'preview' | 'edit';
  } | null>(null);

  // Initialize document system on first load
  useEffect(() => {
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
    <ToastProvider>
      <div className="h-screen bg-gray-50 flex flex-col">
        <Topbar />

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Project Sidebar */}
          <ProjectSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onEditTemplate={(id) => setViewingItem({ type: 'template', id, mode: 'preview' })}
            onEditTheme={(id) => setViewingItem({ type: 'theme', id, mode: 'preview' })}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-8 min-w-0">
            {viewingItem ? (
              viewingItem.mode === 'preview' ? (
                <TemplateThemePreview
                  type={viewingItem.type}
                  id={viewingItem.id}
                  onClose={() => setViewingItem(null)}
                  onEdit={() =>
                    setViewingItem({ ...viewingItem, mode: 'edit' })
                  }
                />
              ) : (
                <TemplateThemeEditor
                  type={viewingItem.type}
                  id={viewingItem.id}
                  onClose={() => setViewingItem(null)}
                />
              )
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
    </ToastProvider>
  );
}

export default App;
