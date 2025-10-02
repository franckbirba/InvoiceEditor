import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
      aria-label={`Switch language to ${i18n.language === 'fr' ? 'English' : 'French'}`}
      title={`Current language: ${i18n.language.toUpperCase()}`}
    >
      <Languages className="w-4 h-4" />
      <span className="text-sm font-medium uppercase">{i18n.language}</span>
    </button>
  );
}
