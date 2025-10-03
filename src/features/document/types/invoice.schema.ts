/**
 * Invoice Document Type Definition
 */

import type { DocumentTypeDefinition } from '../document-schema';

export const invoiceDocumentType: DocumentTypeDefinition = {
  type: 'invoice',
  name: 'Invoice',
  description: 'Standard invoice document',

  sections: [
    {
      id: 'sender',
      title: 'Sender Information',
      description: 'Your company information',
      fields: [
        {
          path: 'sender.name',
          label: 'Company Name',
          type: 'text',
          editable: true,
          required: true,
        },
        {
          path: 'sender.address',
          label: 'Address',
          type: 'textarea',
          editable: true,
        },
        {
          path: 'sender.email',
          label: 'Email',
          type: 'email',
          editable: true,
        },
        {
          path: 'sender.phone',
          label: 'Phone',
          type: 'phone',
          editable: true,
        },
        {
          path: 'sender.bank',
          label: 'Bank Details',
          type: 'text',
          editable: true,
        },
        {
          path: 'sender.logo',
          label: 'Logo URL',
          type: 'url',
          editable: true,
        },
        {
          path: 'sender.notes',
          label: 'Notes',
          type: 'textarea',
          editable: true,
        },
      ],
    },

    {
      id: 'client',
      title: 'Client Information',
      description: 'Your client information',
      fields: [
        {
          path: 'client.name',
          label: 'Client Name',
          type: 'text',
          editable: true,
          required: true,
        },
        {
          path: 'client.address',
          label: 'Address',
          type: 'textarea',
          editable: true,
        },
        {
          path: 'client.reg',
          label: 'Registration Number',
          type: 'text',
          editable: true,
        },
      ],
    },

    {
      id: 'invoice',
      title: 'Invoice Details',
      description: 'Invoice metadata',
      fields: [
        {
          path: 'invoice.number',
          label: 'Invoice Number',
          type: 'text',
          editable: true,
          required: true,
        },
        {
          path: 'invoice.date',
          label: 'Date',
          type: 'date',
          editable: true,
          required: true,
        },
        {
          path: 'invoice.subject',
          label: 'Subject',
          type: 'text',
          editable: true,
        },
        {
          path: 'invoice.payment_terms',
          label: 'Payment Terms',
          type: 'text',
          editable: true,
        },
        {
          path: 'invoice.currency',
          label: 'Currency',
          type: 'text',
          editable: true,
          required: true,
          validation: {
            pattern: '^[A-Z]{3}$',
            minLength: 3,
            maxLength: 3,
          },
        },
      ],
    },

    {
      id: 'items',
      title: 'Line Items',
      description: 'Invoice line items',
      repeatable: true,
      arrayPath: 'items',
      fields: [
        {
          path: 'items.*.description',
          label: 'Description',
          type: 'text',
          editable: true,
          required: true,
        },
        {
          path: 'items.*.qty',
          label: 'Quantity',
          type: 'number',
          editable: true,
          required: true,
          validation: {
            min: 0,
          },
        },
        {
          path: 'items.*.unit_price',
          label: 'Unit Price',
          type: 'currency',
          editable: true,
          required: true,
          validation: {
            min: 0,
          },
        },
        {
          path: 'items.*.discount',
          label: 'Discount',
          type: 'percentage',
          editable: true,
          validation: {
            min: 0,
            max: 100,
          },
        },
      ],
    },

    {
      id: 'summary',
      title: 'Summary',
      description: 'Invoice totals and taxes',
      fields: [
        {
          path: 'summary.global_discount',
          label: 'Global Discount',
          type: 'percentage',
          editable: true,
          validation: {
            min: 0,
            max: 100,
          },
        },
      ],
    },

    {
      id: 'taxes',
      title: 'Taxes',
      description: 'Tax rates',
      repeatable: true,
      arrayPath: 'summary.taxes',
      fields: [
        {
          path: 'summary.taxes.*.label',
          label: 'Tax Label',
          type: 'text',
          editable: true,
          required: true,
        },
        {
          path: 'summary.taxes.*.rate',
          label: 'Tax Rate',
          type: 'percentage',
          editable: true,
          required: true,
          validation: {
            min: 0,
            max: 100,
          },
        },
      ],
    },

    {
      id: 'footer',
      title: 'Footer',
      description: 'Footer information',
      fields: [
        {
          path: 'footer.legal',
          label: 'Legal Text',
          type: 'textarea',
          editable: true,
        },
        {
          path: 'footer.signature',
          label: 'Signature',
          type: 'text',
          editable: true,
        },
      ],
    },
  ],

  defaultTemplate: 'default',
  availableTemplates: ['default', 'modern', 'minimal'],
};
