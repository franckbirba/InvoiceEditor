import * as React from 'react';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { renderTemplate } from '../lib/templating';

const A4_WIDTH_PX = 794; // 21cm in pixels
const PADDING = 32; // padding on each side

export function InvoicePreview() {
  const { data, template, theme } = useInvoiceStore();
  const [renderedHtml, setRenderedHtml] = React.useState('');
  const [scale, setScale] = React.useState(1);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      let html = renderTemplate(template, data);

      // Transform skills in preview mode: apply colors and sizes, hide asterisks
      html = html.replace(
        /<span class="skill-items" data-field="([^"]+)">([^<]*)<\/span>/g,
        (match, fieldName, skillsText) => {
          if (!skillsText || !skillsText.trim()) {
            return match;
          }

          // Split by comma to get individual skills
          const skills = skillsText.split(',').map(s => s.trim()).filter(Boolean);

          const styledSkills = skills.map((skill) => {
            // Count asterisks
            const starCount = (skill.match(/\*/g) || []).length;
            const skillName = skill.replace(/\*/g, '').trim();

            // Random color from primary colors
            const colors = ['#1976d2', '#7b1fa2', '#388e3c', '#f57c00', '#c62828'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            // Size based on stars: 0 stars = 10pt, 1 star = 11pt, 2 stars = 13pt, 3+ stars = 15pt
            const sizes = ['10pt', '11pt', '13pt', '15pt'];
            const size = sizes[Math.min(starCount, 3)];

            // Show skill without asterisks
            return `<span class="skill-item" style="color: ${color}; font-size: ${size};">${skillName}</span>`;
          }).join(', ');

          return `<span class="skill-items">${styledSkills}</span>`;
        }
      );

      // Wrap the rendered HTML with the current theme
      const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>${theme}</style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;

      setRenderedHtml(fullHtml);
    } catch (error) {
      console.error('Error rendering template:', error);
      setRenderedHtml(`
        <div style="padding: 2rem; text-align: center; color: #dc2626;">
          <h2>Template Rendering Error</h2>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `);
    }
  }, [data, template, theme]);

  // Auto-scale to fit container
  React.useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth - (PADDING * 2);
      const newScale = Math.min(1, containerWidth / A4_WIDTH_PX);
      setScale(newScale);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto bg-gray-100 p-8 relative"
    >
      {/* Zoom indicator */}
      {scale < 1 && (
        <div className="absolute top-4 right-4 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
          Zoom: {Math.round(scale * 100)}%
        </div>
      )}

      <div className="flex justify-center" style={{ minHeight: '100%' }}>
        <div
          ref={contentRef}
          className="bg-white shadow-lg"
          style={{
            width: `${A4_WIDTH_PX}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out',
          }}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      </div>
    </div>
  );
}
