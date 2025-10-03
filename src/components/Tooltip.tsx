import * as React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactElement;
  delay?: number;
}

export function Tooltip({ text, children, delay = 300 }: TooltipProps) {
  const [show, setShow] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const timeoutRef = React.useRef<number | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.right + 8,
      y: rect.top + rect.height / 2,
    });

    timeoutRef.current = window.setTimeout(() => {
      setShow(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    setShow(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {React.cloneElement(children, {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      } as React.HTMLAttributes<HTMLElement>)}
      {show && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg border border-gray-700 pointer-events-none whitespace-nowrap"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translateY(-50%)',
          }}
        >
          {text}
        </div>
      )}
    </>
  );
}
