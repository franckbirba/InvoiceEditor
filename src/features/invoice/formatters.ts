import type { Currency } from './invoice.schema';

export function formatCurrency(amount: number, currency: Currency, locale: string = 'fr-FR'): string {
  const currencyMap: Record<Currency, string> = {
    XOF: 'XOF',
    EUR: 'EUR',
    USD: 'USD',
  };

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyMap[currency],
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string, locale: string = 'fr-FR'): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatNumber(value: number, locale: string = 'fr-FR'): string {
  return new Intl.NumberFormat(locale).format(value);
}
