import * as React from 'react';
import { ChevronDown, Palette } from 'lucide-react';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { getThemes } from '../features/document/document.storage';
import type { Theme } from '../features/document/document.schema';

export function ThemeSelector() {
  const { theme: currentTheme, setThemeById } = useInvoiceStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const [themes, setThemes] = React.useState<Theme[]>([]);

  React.useEffect(() => {
    setThemes(getThemes());
  }, []);

  const getCurrentThemeName = () => {
    if (currentTheme.includes('--color-accent: #6aaf50')) {
      return 'CV Theme';
    } else if (currentTheme.includes('--color-accent: #3b82f6')) {
      return 'Invoice Theme';
    }
    return 'Custom Theme';
  };

  const handleThemeSelect = (themeId: string) => {
    setThemeById(themeId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Palette className="w-4 h-4" />
        <span className="text-xs text-gray-500">Theme:</span>
        <span className="text-xs font-medium">{getCurrentThemeName()}</span>
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
              <div className="text-xs font-medium text-gray-500 mb-2 px-2">Choisir un thème</div>
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="font-medium">{theme.name}</div>
                  <div className="text-xs text-gray-500">
                    {theme.typeId === 'facture' ? 'Facture' : theme.typeId === 'cv' ? 'CV' : 'Autre'}
                    {theme.isDefault && <span className="ml-2 text-blue-600">• Par défaut</span>}
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
