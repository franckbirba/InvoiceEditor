import Mustache from 'mustache';
import DOMPurify from 'dompurify';
import type { InvoiceData } from '../features/invoice/invoice.schema';
import { calculateTotals, calculateLineTotal } from '../features/invoice/calculations';
import { formatCurrency, formatDate, formatNumber } from '../features/invoice/formatters';

export interface TemplateData extends InvoiceData {
  totals: ReturnType<typeof calculateTotals>;
  items_with_totals: Array<{
    description: string;
    qty: number;
    unit_price: number;
    discount?: number;
    line_total: number;
    line_total_formatted: string;
  }>;
  formatted: {
    subtotal: string;
    afterGlobalDiscount: string;
    taxAmount: string;
    total: string;
    date: string;
  };
}

export function enrichInvoiceData(data: InvoiceData): TemplateData {
  const totals = calculateTotals(data);
  const locale = data.locale === 'fr' ? 'fr-FR' : 'en-US';
  const currency = data.invoice.currency;

  const items_with_totals = data.items.map((item, index) => ({
    ...item,
    index,
    line_total: calculateLineTotal(item),
    line_total_formatted: formatCurrency(calculateLineTotal(item), currency, locale),
    unit_price_formatted: formatCurrency(item.unit_price, currency, locale),
    qty_formatted: formatNumber(item.qty, locale),
  }));

  // Format tax amounts
  const formattedTaxes = totals.taxes.map(tax => ({
    ...tax,
    amount: formatCurrency(tax.amount, currency, locale) as any,
  }));

  return {
    ...data,
    totals: {
      ...totals,
      taxes: formattedTaxes,
    },
    items_with_totals,
    formatted: {
      subtotal: formatCurrency(totals.subtotal, currency, locale),
      afterGlobalDiscount: formatCurrency(totals.afterGlobalDiscount, currency, locale),
      taxAmount: formatCurrency(totals.taxAmount, currency, locale),
      total: formatCurrency(totals.total, currency, locale),
      date: formatDate(data.invoice.date, locale),
    },
  };
}

export function renderTemplate(template: string, data: InvoiceData): string {
  const enrichedData = enrichInvoiceData(data);

  // Render with Mustache
  const rendered = Mustache.render(template, enrichedData);

  // Sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(rendered, {
    ALLOWED_TAGS: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'ul', 'ol', 'li', 'br', 'hr', 'strong', 'em', 'b', 'i',
      'img', 'section', 'article', 'header', 'footer', 'main'
    ],
    ALLOWED_ATTR: ['class', 'id', 'style', 'src', 'alt', 'width', 'height'],
  });

  return sanitized;
}

export function validateTemplate(template: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    // Parse the template to find all tags
    const tokens = Mustache.parse(template);

    // Extract all variable names
    const variables = tokens
      .filter((token) => token[0] === 'name' || token[0] === '#' || token[0] === '^')
      .map((token) => token[1]);

    // Known valid paths (basic validation)
    const validPaths = [
      'sender', 'client', 'invoice', 'items', 'summary', 'footer', 'totals', 'formatted',
      'sender.name', 'sender.address', 'sender.email', 'sender.phone', 'sender.bank', 'sender.logo', 'sender.notes',
      'client.name', 'client.address', 'client.reg',
      'invoice.number', 'invoice.date', 'invoice.subject', 'invoice.payment_terms', 'invoice.currency',
      'summary.global_discount', 'summary.taxes',
      'footer.legal', 'footer.signature',
      'totals.subtotal', 'totals.total', 'totals.taxAmount',
      'formatted.total', 'formatted.subtotal', 'formatted.date',
      'items_with_totals',
    ];

    const unknownVars = variables.filter((v) => {
      return !validPaths.some(p => p === v || p.startsWith(v) || v.startsWith(p));
    });

    if (unknownVars.length > 0) {
      errors.push(`Unknown placeholders: ${unknownVars.join(', ')}`);
    }
  } catch (error) {
    errors.push(`Template parsing error: ${error}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
