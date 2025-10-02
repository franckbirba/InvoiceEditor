import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, FileText, Trash2, Plus } from 'lucide-react';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import {
  getDocumentsList,
  deleteDocument,
  getActiveDocumentId,
  type DocumentMetadata
} from '../lib/storage';

interface DocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentsDialog({ open, onOpenChange }: DocumentsDialogProps) {
  const [documents, setDocuments] = React.useState<DocumentMetadata[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const { loadDocumentById, createDocument } = useInvoiceStore();

  React.useEffect(() => {
    if (open) {
      setDocuments(getDocumentsList());
      setActiveId(getActiveDocumentId());
    }
  }, [open]);

  const handleLoadDocument = (id: string) => {
    loadDocumentById(id);
    onOpenChange(false);
  };

  const handleDeleteDocument = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer ce document ?')) {
      deleteDocument(id);
      setDocuments(getDocumentsList());
      setActiveId(getActiveDocumentId());
    }
  };

  const handleCreateNew = () => {
    createDocument();
    onOpenChange(false);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[80vh] bg-white shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold">Mes factures</Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-gray-100 rounded transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {documents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune facture enregistrée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleLoadDocument(doc.id)}
                    className={`w-full flex items-center gap-3 p-3 border transition-colors text-left ${
                      doc.id === activeId
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{doc.name}</span>
                        {doc.id === activeId && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded">Actif</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {doc.invoiceNumber && <span>N° {doc.invoiceNumber}</span>}
                        {doc.clientName && <span>{doc.clientName}</span>}
                        <span>{formatDate(doc.updatedAt)}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteDocument(doc.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleCreateNew}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 text-white hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle facture
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
