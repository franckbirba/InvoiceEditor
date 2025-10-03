import * as React from 'react';
import { ChevronDown, FileCode } from 'lucide-react';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { getTemplates } from '../features/document/document.storage';
import type { Template } from '../features/document/document.schema';

export function TemplateSelector() {
  const { template: currentTemplate, setTemplateById } = useInvoiceStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const [templates, setTemplates] = React.useState<Template[]>([]);

  React.useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  const getCurrentTemplateName = () => {
    // Try to find the current template by content match
    const currentTemplateObj = templates.find(t => t.content === currentTemplate);
    if (currentTemplateObj) {
      return currentTemplateObj.name;
    }
    return 'Template actuel';
  };

  const handleTemplateSelect = (templateId: string) => {
    setTemplateById(templateId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FileCode className="w-4 h-4" />
        <span className="text-xs text-gray-500">Template:</span>
        <span className="text-xs font-medium">{getCurrentTemplateName()}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">Choisir un template</div>
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500">
                    {template.typeId === 'facture' ? 'Facture' : template.typeId === 'cv' ? 'CV' : 'Autre'}
                    {template.isDefault && <span className="ml-2 text-blue-600">• Par défaut</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
