import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Download, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { useToast } from './Toast';

interface JsonImportExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JsonImportExport({ open, onOpenChange }: JsonImportExportProps) {
  const { t } = useTranslation('ui');
  const { showToast } = useToast();
  const { exportToJson, loadFromJson } = useInvoiceStore();
  const [jsonText, setJsonText] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      const json = exportToJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('success', t('exported'));
      onOpenChange(false);
    } catch (error) {
      showToast('error', t('error'), error instanceof Error ? error.message : 'Export failed');
    }
  };

  const handleImport = (jsonString: string) => {
    try {
      loadFromJson(jsonString);
      showToast('success', t('imported'));
      setJsonText('');
      onOpenChange(false);
    } catch (error) {
      showToast('error', t('invalidJson'), error instanceof Error ? error.message : 'Import failed');
    }
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      handleImport(content);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
      handleFileSelect(file);
    } else {
      showToast('error', t('error'), 'Please drop a valid JSON file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg shadow-lg p-6 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <Dialog.Title className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5" />
            {t('import')} / {t('export')}
          </Dialog.Title>

          <div className="space-y-6">
            {/* Export Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-gray-700">{t('export')}</h3>
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download JSON File
              </button>
            </div>

            <div className="border-t pt-6">
              {/* Import Section */}
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-gray-700">{t('import')}</h3>

                {/* Drag and Drop Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                  `}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">
                    Drag and drop a JSON file here, or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Accepts .json files only
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileInputChange}
                    className="hidden"
                    aria-label="Upload JSON file"
                  />
                </div>

                {/* Text Input */}
                <div className="space-y-2">
                  <label htmlFor="json-input" className="text-xs text-gray-600">
                    Or paste JSON content:
                  </label>
                  <textarea
                    id="json-input"
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder='{"version": "1.0.0", "data": {...}, "template": "..."}'
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleImport(jsonText)}
                    disabled={!jsonText.trim()}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Import from Text
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Dialog.Close className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close">
            <X className="w-4 h-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
