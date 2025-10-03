import * as React from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  storageKey: string;
  className?: string;
}

export function ResizablePanel({
  children,
  minWidth = 200,
  maxWidth = 600,
  defaultWidth = 256,
  storageKey,
  className = '',
}: ResizablePanelProps) {
  const [width, setWidth] = React.useState(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? parseInt(saved, 10) : defaultWidth;
  });
  const [isResizing, setIsResizing] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    localStorage.setItem(storageKey, width.toString());
  }, [width, storageKey]);

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      ref={panelRef}
      className={`relative ${className}`}
      style={{ width: `${width}px` }}
    >
      {children}
      <div
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -right-1 w-3" />
      </div>
    </div>
  );
}
