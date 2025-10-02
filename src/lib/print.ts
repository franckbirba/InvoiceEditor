import html2pdf from 'html2pdf.js';

export function printInvoice(): void {
  window.print();
}

export async function exportToPDF(elementId: string, filename: string = 'invoice.pdf'): Promise<void> {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error('Element not found for PDF export');
  }

  const options = {
    margin: [12, 15, 12, 15] as [number, number, number, number],
    filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };

  try {
    await html2pdf().set(options).from(element).save();
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}
