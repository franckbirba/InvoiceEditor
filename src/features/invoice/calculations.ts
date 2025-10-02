import type { InvoiceItem, InvoiceData } from './invoice.schema';

export function calculateLineTotal(item: InvoiceItem): number {
  const baseTotal = item.qty * item.unit_price;
  const discount = item.discount || 0;
  return baseTotal * (1 - discount / 100);
}

export function calculateSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
}

export function calculateTotals(data: InvoiceData) {
  const subtotal = calculateSubtotal(data.items);
  const globalDiscount = data.summary.global_discount || 0;
  const afterGlobalDiscount = subtotal * (1 - globalDiscount / 100);

  const taxes = data.summary.taxes || [];
  const taxAmount = taxes.reduce((sum, tax) => {
    return sum + (afterGlobalDiscount * tax.rate / 100);
  }, 0);

  const total = afterGlobalDiscount + taxAmount;

  return {
    subtotal,
    globalDiscount,
    afterGlobalDiscount,
    taxAmount,
    total,
    taxes: taxes.map(tax => ({
      ...tax,
      amount: afterGlobalDiscount * tax.rate / 100,
    })),
  };
}
