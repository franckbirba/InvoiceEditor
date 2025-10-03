import { z } from 'zod';

// Currency enum
export type Currency = 'XOF' | 'EUR' | 'USD';

// Zod schemas
export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  qty: z.number().min(0, 'Quantity must be positive'),
  unit_price: z.number().min(0, 'Unit price must be positive'),
  discount: z.number().min(0).max(100).optional(),
});

export const TaxSchema = z.object({
  label: z.string().min(1, 'Tax label is required'),
  rate: z.number().min(0).max(100, 'Tax rate must be between 0 and 100'),
});

export const InvoiceDataSchema = z.object({
  version: z.string().default('1.0.0'),
  locale: z.enum(['fr', 'en']).default('fr'),
  theme: z.string().default('cv-default'),

  sender: z.object({
    name: z.string().min(1, 'Sender name is required'),
    address: z.string().optional(),
    email: z.union([z.literal(''), z.string().email()]).optional(),
    phone: z.string().optional(),
    bank: z.string().optional(),
    logo: z.string().optional(), // DataURL
    notes: z.string().optional(),
  }),

  client: z.object({
    name: z.string().min(1, 'Client name is required'),
    address: z.string().optional(),
    email: z.union([z.literal(''), z.string().email()]).optional(),
    phone: z.string().optional(),
    bank: z.string().optional(),
    reg: z.string().optional(), // RCCM/IFU
    notes: z.string().optional(),
  }),

  invoice: z.object({
    number: z.string().min(1, 'Invoice number is required'),
    date: z.string().min(1, 'Invoice date is required'),
    subject: z.string().optional(),
    payment_terms: z.string().optional(),
    currency: z.enum(['XOF', 'EUR', 'USD']).default('XOF'),
  }),

  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),

  summary: z.object({
    global_discount: z.number().min(0).max(100).optional(),
    taxes: z.array(TaxSchema).optional(),
  }),

  footer: z.object({
    legal: z.string().optional(),
    signature: z.string().optional(),
  }),
});

// TypeScript types
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
export type Tax = z.infer<typeof TaxSchema>;
export type InvoiceData = z.infer<typeof InvoiceDataSchema>;

// Export data with template
export const ExportDataSchema = z.object({
  version: z.string(),
  data: InvoiceDataSchema,
  template: z.string(),
  theme: z.string(),
});

export type ExportData = z.infer<typeof ExportDataSchema>;
