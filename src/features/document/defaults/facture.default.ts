import type { DocumentType, Template, Theme } from '../document.schema';

// Default Facture DocumentType based on current invoice schema
export const defaultFactureType: DocumentType = {
  id: 'facture',
  name: 'Facture',
  icon: 'FileText',
  description: 'Document de facturation professionnel',
  sections: [
    {
      id: 'sender',
      name: 'Émetteur',
      fields: [
        { id: 'name', name: 'Nom', type: 'text', required: true },
        { id: 'address', name: 'Adresse', type: 'textarea', required: false },
        { id: 'email', name: 'Email', type: 'email', required: false },
        { id: 'phone', name: 'Téléphone', type: 'tel', required: false },
        { id: 'bank', name: 'Coordonnées bancaires', type: 'textarea', required: false },
        { id: 'logo', name: 'Logo', type: 'text', required: false },
        { id: 'notes', name: 'Notes', type: 'textarea', required: false },
      ],
    },
    {
      id: 'client',
      name: 'Client',
      fields: [
        { id: 'name', name: 'Nom', type: 'text', required: true },
        { id: 'address', name: 'Adresse', type: 'textarea', required: false },
        { id: 'email', name: 'Email', type: 'email', required: false },
        { id: 'phone', name: 'Téléphone', type: 'tel', required: false },
        { id: 'bank', name: 'Coordonnées bancaires', type: 'textarea', required: false },
        { id: 'reg', name: 'RCCM/IFU', type: 'text', required: false },
        { id: 'notes', name: 'Notes', type: 'textarea', required: false },
      ],
    },
    {
      id: 'invoice',
      name: 'Facture',
      fields: [
        { id: 'number', name: 'Numéro', type: 'text', required: true },
        { id: 'date', name: 'Date', type: 'date', required: true },
        { id: 'subject', name: 'Objet', type: 'text', required: false },
        { id: 'payment_terms', name: 'Conditions de paiement', type: 'text', required: false },
        { id: 'currency', name: 'Devise', type: 'text', required: false, defaultValue: 'XOF' },
      ],
    },
    {
      id: 'items',
      name: 'Prestations',
      fields: [
        {
          id: 'items',
          name: 'Lignes',
          type: 'array',
          required: true,
          itemSchema: [
            { id: 'description', name: 'Désignation', type: 'text', required: true },
            { id: 'qty', name: 'Quantité', type: 'number', required: true },
            { id: 'unit_price', name: 'Prix unitaire', type: 'number', required: true },
            { id: 'discount', name: 'Remise (%)', type: 'number', required: false },
          ],
        },
      ],
    },
    {
      id: 'summary',
      name: 'Récapitulatif',
      fields: [
        { id: 'global_discount', name: 'Remise globale (%)', type: 'number', required: false },
        {
          id: 'taxes',
          name: 'Taxes',
          type: 'array',
          required: false,
          itemSchema: [
            { id: 'label', name: 'Label', type: 'text', required: true },
            { id: 'rate', name: 'Taux (%)', type: 'number', required: true },
          ],
        },
      ],
    },
    {
      id: 'footer',
      name: 'Pied de page',
      fields: [
        { id: 'legal', name: 'Mentions légales', type: 'textarea', required: false },
        { id: 'signature', name: 'Signature', type: 'text', required: false },
      ],
    },
  ],
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Default template will be loaded from the existing useInvoiceStore template
export const defaultFactureTemplate: Template = {
  id: 'facture-cv-default',
  name: 'Template CV par défaut',
  typeId: 'facture',
  content: '', // Will be populated from existing template
  isDefault: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

// Default theme will be loaded from theme-cv.css
export const defaultFactureTheme: Theme = {
  id: 'theme-cv-default',
  name: 'Thème CV',
  content: '', // Will be populated from theme-cv.css
  isDefault: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
};
