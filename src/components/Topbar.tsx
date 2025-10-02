import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Copy, Download, Upload, Printer, Eye, Code } from 'lucide-react';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { printInvoice } from '../lib/print';
import { JsonImportExport } from './JsonImportExport';
import { LanguageToggle } from './LanguageToggle';
import { ThemeSwitcher } from './ThemeSwitcher';
import { useToast } from './Toast';

export function Topbar() {
  const { t } = useTranslation('ui');
  const { showToast } = useToast();
  const { isEditorMode, toggleEditorMode, resetToSample, duplicateInvoice } = useInvoiceStore();
  const [showImportExport, setShowImportExport] = React.useState(false);

  const handleNew = () => {
    if (window.confirm(t('confirmReset'))) {
      resetToSample();
      showToast('success', 'Invoice reset', 'New invoice created from sample data');
    }
  };

  const handleDuplicate = () => {
    duplicateInvoice();
    showToast('success', 'Invoice duplicated', 'A copy has been created with a new invoice number');
  };

  const handlePrint = async () => {
    try {
      await printInvoice();
      showToast('success', 'Print initiated', 'PDF generation started');
    } catch (error) {
      showToast('error', 'Print failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <>
      <header className="no-print border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('appName')}</h1>
              <p className="text-xs text-gray-500">Professional Invoice Editor</p>
            </div>
          </div>

          {/* Center: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={t('newInvoice')}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{t('newInvoice')}</span>
            </button>

            <button
              onClick={handleDuplicate}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title={t('duplicate')}
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">{t('duplicate')}</span>
            </button>

            <button
              onClick={() => setShowImportExport(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Import/Export"
            >
              <div className="flex items-center">
                <Upload className="w-4 h-4 mr-1" />
                <Download className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline">{t('import')}/{t('export')}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title={t('print')}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{t('print')}</span>
            </button>

            <div className="w-px h-8 bg-gray-300 mx-2" />

            <button
              onClick={toggleEditorMode}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                isEditorMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-gray-300 hover:bg-gray-50'
              }`}
              title={isEditorMode ? t('preview') : t('editTemplate')}
            >
              {isEditorMode ? (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('preview')}</span>
                </>
              ) : (
                <>
                  <Code className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('editTemplate')}</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Settings */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <LanguageToggle />
          </div>
        </div>
      </header>

      <JsonImportExport open={showImportExport} onOpenChange={setShowImportExport} />
    </>
  );
}
