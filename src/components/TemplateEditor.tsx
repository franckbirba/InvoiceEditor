import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle, RotateCcw, Save } from 'lucide-react';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { validateTemplate } from '../lib/templating';
import { useToast } from './Toast';

// Lazy load Monaco Editor
const Editor = React.lazy(() =>
  import('@monaco-editor/react').then((module) => ({
    default: module.default,
  }))
);

const defaultTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 2rem; }
    .invoice-header { text-align: center; margin-bottom: 2rem; }
    .invoice-info { display: flex; justify-content: space-between; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; margin: 2rem 0; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f5f5f5; font-weight: bold; }
    .total-row { font-weight: bold; font-size: 1.2em; }
  </style>
</head>
<body>
  <div class="invoice-header">
    {{#sender.logo}}
    <img src="{{sender.logo}}" alt="Logo" style="max-height: 80px; margin-bottom: 1rem;">
    {{/sender.logo}}
    <h1>{{invoice.title}}</h1>
  </div>

  <div class="invoice-info">
    <div>
      <h3>From:</h3>
      <p><strong>{{sender.name}}</strong></p>
      {{#sender.address}}<p>{{sender.address}}</p>{{/sender.address}}
      {{#sender.email}}<p>{{sender.email}}</p>{{/sender.email}}
      {{#sender.phone}}<p>{{sender.phone}}</p>{{/sender.phone}}
    </div>
    <div>
      <h3>To:</h3>
      <p><strong>{{client.name}}</strong></p>
      {{#client.address}}<p>{{client.address}}</p>{{/client.address}}
      {{#client.reg}}<p>{{client.reg}}</p>{{/client.reg}}
    </div>
    <div>
      <p><strong>Invoice #:</strong> {{invoice.number}}</p>
      <p><strong>Date:</strong> {{formatted.date}}</p>
      <p><strong>Currency:</strong> {{invoice.currency}}</p>
    </div>
  </div>

  {{#invoice.subject}}
  <p><strong>Subject:</strong> {{invoice.subject}}</p>
  {{/invoice.subject}}

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{#items_with_totals}}
      <tr>
        <td>{{description}}</td>
        <td>{{qty}}</td>
        <td>{{unit_price_formatted}}</td>
        <td>{{line_total_formatted}}</td>
      </tr>
      {{/items_with_totals}}
    </tbody>
  </table>

  <div style="text-align: right; margin-top: 2rem;">
    <p><strong>Subtotal:</strong> {{formatted.subtotal}}</p>
    {{#summary.global_discount}}
    <p><strong>Discount:</strong> {{summary.global_discount}}%</p>
    <p><strong>After Discount:</strong> {{formatted.afterGlobalDiscount}}</p>
    {{/summary.global_discount}}
    {{#summary.taxes}}
    <p><strong>{{label}} ({{rate}}%):</strong> {{formatted.taxAmount}}</p>
    {{/summary.taxes}}
    <p class="total-row"><strong>Total:</strong> {{formatted.total}}</p>
  </div>

  {{#footer.legal}}
  <div style="margin-top: 3rem; font-size: 0.875rem; color: #666;">
    <p>{{footer.legal}}</p>
  </div>
  {{/footer.legal}}
</body>
</html>`;

export function TemplateEditor() {
  const { t } = useTranslation('ui');
  const { showToast } = useToast();
  const { template, setTemplate } = useInvoiceStore();
  const [editorValue, setEditorValue] = React.useState(template);
  const [validation, setValidation] = React.useState<{ valid: boolean; errors: string[] } | null>(null);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    setEditorValue(template);
    setHasChanges(false);
  }, [template]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditorValue(value);
      setHasChanges(value !== template);
    }
  };

  const handleValidate = () => {
    const result = validateTemplate(editorValue);
    setValidation(result);

    if (result.valid) {
      showToast('success', 'Template is valid', 'No errors found in template syntax');
    } else {
      showToast('error', 'Template validation failed', `Found ${result.errors.length} error(s)`);
    }
  };

  const handleSave = () => {
    const result = validateTemplate(editorValue);

    if (!result.valid) {
      setValidation(result);
      showToast('error', 'Cannot save invalid template', 'Please fix validation errors first');
      return;
    }

    setTemplate(editorValue);
    setHasChanges(false);
    setValidation(null);
    showToast('success', t('saved'), 'Template saved successfully');
  };

  const handleRevert = () => {
    if (window.confirm('Revert to default template? This will discard all custom changes.')) {
      setEditorValue(defaultTemplate);
      setTemplate(defaultTemplate);
      setHasChanges(false);
      setValidation(null);
      showToast('success', 'Template reverted', 'Default template restored');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 p-4 border-b bg-white">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900">Template Editor</h2>
          {hasChanges && (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleValidate}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
            {t('validate')}
          </button>
          <button
            onClick={handleRevert}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t('reset')}
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {t('save')}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Loading editor...</div>
            </div>
          }
        >
          <Editor
            height="100%"
            defaultLanguage="html"
            value={editorValue}
            onChange={handleEditorChange}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              tabSize: 2,
            }}
          />
        </React.Suspense>
      </div>

      {/* Validation Errors */}
      {validation && !validation.valid && (
        <div className="border-t bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">Validation Errors:</h3>
              <ul className="space-y-1 text-sm text-red-800">
                {validation.errors.map((error, idx) => (
                  <li key={idx}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {validation && validation.valid && (
        <div className="border-t bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-800">Template is valid and ready to use</p>
          </div>
        </div>
      )}
    </div>
  );
}
