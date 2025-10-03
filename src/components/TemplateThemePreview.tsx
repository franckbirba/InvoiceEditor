import * as React from 'react';
import { X, Edit, FileCode, Palette, Trash2, Copy, Code, Plus } from 'lucide-react';
import { getTemplate, getTheme, getThemes, deleteTemplate, deleteTheme, saveTemplate, saveTheme } from '../features/document/document.storage';
import type { Template, Theme } from '../features/document/document.schema';
import { useToast } from './Toast';
import { renderTemplate } from '../lib/templating';
import { sampleInvoiceData } from '../lib/sampleData';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';

interface TemplateThemePreviewProps {
  type: 'template' | 'theme';
  id: string;
  onClose: () => void;
  onEdit: () => void;
}

export function TemplateThemePreview({ type, id, onClose, onEdit }: TemplateThemePreviewProps) {
  const { showToast } = useToast();
  const { theme: currentInvoiceTheme, setTemplateById, setThemeById, createDocument } = useInvoiceStore();
  const [item, setItem] = React.useState<Template | Theme | null>(null);
  const [showCode, setShowCode] = React.useState(false);
  const [renderedHtml, setRenderedHtml] = React.useState('');
  const [selectedThemeId, setSelectedThemeId] = React.useState('theme-cv-default');
  const [availableThemes, setAvailableThemes] = React.useState<Theme[]>([]);

  // Load available themes
  React.useEffect(() => {
    setAvailableThemes(getThemes());
  }, []);

  React.useEffect(() => {
    if (type === 'template') {
      const template = getTemplate(id);
      setItem(template);
      if (template) {
        try {
          // Render template with enriched sample data
          const html = renderTemplate(template.content, sampleInvoiceData);

          // Use the selected theme for template preview
          const selectedTheme = getTheme(selectedThemeId);
          const themeCSS = selectedTheme?.content || currentInvoiceTheme;

          // Wrap in a complete HTML document with the theme
          const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>${themeCSS}</style>
            </head>
            <body>
              ${html}
            </body>
            </html>
          `;
          setRenderedHtml(fullHtml);
        } catch (error) {
          console.error('Error rendering template:', error);
          setRenderedHtml('<div style="padding: 20px; color: red;">Erreur de rendu du template</div>');
        }
      }
    } else {
      const theme = getTheme(id);
      setItem(theme);
      // For themes, we'll render with the default template and this theme
      if (theme) {
        try {
          // Get the default template
          const defaultTemplate = getTemplate('facture-cv-default');
          const templateContent = defaultTemplate?.content || '';

          // Render with enriched data
          const html = renderTemplate(templateContent, sampleInvoiceData);

          // Wrap with this theme's CSS
          const fullHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <style>${theme.content}</style>
            </head>
            <body>
              ${html}
            </body>
            </html>
          `;
          setRenderedHtml(fullHtml);
        } catch (error) {
          console.error('Error rendering theme preview:', error);
          setRenderedHtml('<div style="padding: 20px; color: red;">Erreur de rendu du thème</div>');
        }
      }
    }
  }, [type, id, currentInvoiceTheme, selectedThemeId]);

  const handleDelete = () => {
    if (!item) return;

    if (item.isDefault) {
      showToast('error', 'Impossible de supprimer', 'Les templates/thèmes par défaut ne peuvent pas être supprimés');
      return;
    }

    const confirmMsg = `Êtes-vous sûr de vouloir supprimer "${item.name}" ?`;
    if (!window.confirm(confirmMsg)) return;

    if (type === 'template') {
      deleteTemplate(id);
      showToast('success', 'Template supprimé', `"${item.name}" a été supprimé`);
    } else {
      deleteTheme(id);
      showToast('success', 'Thème supprimé', `"${item.name}" a été supprimé`);
    }

    onClose();
  };

  const handleDuplicate = () => {
    if (!item) return;

    const newItem = {
      ...item,
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${item.name} (copie)`,
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (type === 'template') {
      saveTemplate(newItem as Template);
      showToast('success', 'Template dupliqué', `"${newItem.name}" a été créé`);
    } else {
      saveTheme(newItem as Theme);
      showToast('success', 'Thème dupliqué', `"${newItem.name}" a été créé`);
    }

    // Refresh to show the new item
    window.location.reload();
  };

  const handleCreateDocument = () => {
    if (type === 'template') {
      // Create a new document with this template and selected theme
      setTemplateById(id);
      setThemeById(selectedThemeId);
      createDocument();
      showToast('success', 'Document créé', 'Un nouveau document a été créé avec ce template et thème');
      onClose();
    } else {
      // For themes, create with current template and this theme
      setThemeById(id);
      createDocument();
      showToast('success', 'Document créé', 'Un nouveau document a été créé avec ce thème');
      onClose();
    }
  };

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b">
        <div className="flex items-center gap-3">
          {type === 'template' ? (
            <FileCode className="w-5 h-5 text-purple-500" />
          ) : (
            <Palette className="w-5 h-5 text-pink-500" />
          )}
          <div>
            <h2 className="font-semibold text-gray-900">{item.name}</h2>
            <p className="text-xs text-gray-500">
              {type === 'template' ? `Template - ${(item as Template).typeId}` : 'Thème CSS'}
              {item.isDefault && <span className="ml-2 text-blue-600">• Par défaut</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme selector for templates */}
          {type === 'template' && (
            <select
              value={selectedThemeId}
              onChange={(e) => setSelectedThemeId(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {availableThemes.map((theme) => (
                <option key={theme.id} value={theme.id}>
                  {theme.name}
                </option>
              ))}
            </select>
          )}
          
          <button
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title={showCode ? 'Voir le rendu' : 'Voir le code'}
          >
            <Code className="w-4 h-4" />
            {showCode ? 'Rendu' : 'Code'}
          </button>
          
          <button
            onClick={handleCreateDocument}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Créer un nouveau document avec ce template/thème"
          >
            <Plus className="w-4 h-4" />
            Créer un document
          </button>
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Dupliquer"
          >
            <Copy className="w-4 h-4" />
            Dupliquer
          </button>
          {!item.isDefault && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Éditer
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-auto bg-gray-100">
        {showCode ? (
          // Code view
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">Code source</h3>
                <span className="text-xs text-gray-500">
                  {item.content.split('\n').length} lignes
                </span>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs leading-relaxed font-mono">
                <code>{item.content}</code>
              </pre>
            </div>
          </div>
        ) : (
          // Rendered view
          <div className="p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
              <iframe
                srcDoc={renderedHtml}
                title="Preview"
                className="w-full border-0"
                style={{ minHeight: '800px', height: '100%' }}
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
