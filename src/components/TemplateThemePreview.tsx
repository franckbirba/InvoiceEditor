import * as React from 'react';
import { getTemplate, getTheme } from '../features/document/document.storage';
import type { Template, Theme } from '../features/document/document.schema';
import { renderTemplate } from '../lib/templating';
import { sampleInvoiceData } from '../lib/sampleData';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';

interface TemplateThemePreviewProps {
  type: 'template' | 'theme';
  id: string;
}

export function TemplateThemePreview({ type, id }: TemplateThemePreviewProps) {
  const { theme: currentInvoiceTheme, template: currentInvoiceTemplate } = useInvoiceStore();
  const [item, setItem] = React.useState<Template | Theme | null>(null);
  const [renderedHtml, setRenderedHtml] = React.useState('');

  React.useEffect(() => {
    if (type === 'template') {
      const template = getTemplate(id);
      setItem(template);
      if (template) {
        try {
          // Render template with enriched sample data
          const html = renderTemplate(template.content, sampleInvoiceData);

          // Use the currently selected theme from the store
          const themeCSS = currentInvoiceTheme;

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
      // For themes, use the currently selected template from the store
      if (theme) {
        try {
          // Use the current template content from the store
          const templateContent = currentInvoiceTemplate;

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
  }, [type, id, currentInvoiceTheme, currentInvoiceTemplate]);

  if (!item) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Preview */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <iframe
              srcDoc={renderedHtml}
              title="Preview"
              className="w-full border-0"
              style={{ minHeight: '800px', height: '100%' }}
              sandbox="allow-same-origin allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
