import { useEffect, useState, useRef } from 'react';
import { useInvoiceStore } from './features/invoice/useInvoiceStore';
import { Topbar } from './components/Topbar';
import { SidebarForm } from './components/SidebarForm';
import { InvoicePreview } from './components/InvoicePreview';
import { InvoicePreviewEditable } from './components/InvoicePreviewEditable';
import { TemplateEditor } from './components/TemplateEditor';
import { ToastProvider } from './components/Toast';
import { initializeDocumentSystem } from './features/document/initialize';
import './lib/i18n';

const SIDEBAR_WIDTH_KEY = 'invoice-studio-sidebar-width';
const DEFAULT_SIDEBAR_WIDTH = 384; // 24rem / w-96
const MIN_SIDEBAR_WIDTH = 280;
const MAX_SIDEBAR_WIDTH = 600;

function App() {
  const isEditorMode = useInvoiceStore((state) => state.isEditorMode);
  const isInlineEditMode = useInvoiceStore((state) => state.isInlineEditMode);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_SIDEBAR_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Initialize document system on first load
  useEffect(() => {
    const result = initializeDocumentSystem();
    if (result.migrated) {
      console.log(`Migrated ${result.documentCount} documents to new format`);
    }
  }, []);

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

  // Resize handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth);
        localStorage.setItem(SIDEBAR_WIDTH_KEY, newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <ToastProvider>
      <div className="h-screen bg-gray-50 flex flex-col">
        <Topbar />

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Sidebar Form - Hidden in inline edit mode */}
          {!isInlineEditMode && (
            <aside
              ref={sidebarRef}
              style={{ width: `${sidebarWidth}px` }}
              className="flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto no-print relative"
            >
              <SidebarForm />

              {/* Resize Handle */}
              <div
                className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500 transition-colors group"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                }}
              >
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-gray-300 group-hover:bg-blue-500 transition-colors rounded-l" />
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-8 min-w-0">
            {isEditorMode ? (
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
