import * as React from 'react';
import { Save, FileCode, Palette } from 'lucide-react';
import { getTemplate, getTheme, saveTemplate, saveTheme } from '../features/document/document.storage';
import type { Template, Theme } from '../features/document/document.schema';
import { useToast } from './Toast';

// Lazy load Monaco Editor
const Editor = React.lazy(() =>
  import('@monaco-editor/react').then((module) => ({
    default: module.default,
  }))
);

interface TemplateThemeEditorProps {
  type: 'template' | 'theme';
  id: string;
}

export function TemplateThemeEditor({ type, id }: TemplateThemeEditorProps) {
  const { showToast } = useToast();
  const [item, setItem] = React.useState<Template | Theme | null>(null);
  const [content, setContent] = React.useState('');
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    if (type === 'template') {
      const template = getTemplate(id);
      setItem(template);
      setContent(template?.content || '');
    } else {
      const theme = getTheme(id);
      setItem(theme);
      setContent(theme?.content || '');
    }
    setHasChanges(false);
  }, [type, id]);

  const handleSave = () => {
    if (!item) return;

    const updatedItem = {
      ...item,
      content,
      updatedAt: Date.now(),
    };

    if (type === 'template') {
      saveTemplate(updatedItem as Template);
      showToast('success', 'Template sauvegardé', `"${item.name}" a été mis à jour`);
    } else {
      saveTheme(updatedItem as Theme);
      showToast('success', 'Thème sauvegardé', `"${item.name}" a été mis à jour`);
    }

    setHasChanges(false);
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
              {type === 'template' ? 'Template' : 'Thème'}
              {hasChanges && <span className="ml-2 text-yellow-600">• Non sauvegardé</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              hasChanges
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <React.Suspense
          fallback={
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Chargement de l'éditeur...</p>
            </div>
          }
        >
          <Editor
            height="100%"
            language={type === 'template' ? 'html' : 'css'}
            value={content}
            onChange={(value) => {
              setContent(value || '');
              setHasChanges(value !== item.content);
            }}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
            }}
          />
        </React.Suspense>
      </div>
    </div>
  );
}
