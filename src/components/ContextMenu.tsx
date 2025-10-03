import * as React from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  items: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'danger';
    separator?: boolean;
  }>;
}

export function ContextMenu({ x, y, onClose, items }: ContextMenuProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-gray-800 border border-gray-700 rounded shadow-lg py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.separator ? (
            <div className="border-t border-gray-700 my-1" />
          ) : (
            <button
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-gray-700 transition-colors ${
                item.variant === 'danger' ? 'text-red-400' : 'text-gray-200'
              }`}
            >
              {item.icon && <span className="w-4 h-4 flex-shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
