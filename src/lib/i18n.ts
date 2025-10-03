import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { loadFromLocalStorage, saveToLocalStorage, STORAGE_KEYS } from './storage';

const resources = {
  fr: {
    ui: {
      appName: 'Document Studio',
      newInvoice: 'Nouvelle facture',
      duplicate: 'Dupliquer',
      import: 'Importer',
      export: 'Exporter',
      print: 'Imprimer',
      preview: 'Aperçu',
      editTemplate: 'Éditer le template',
      save: 'Sauvegarder',
      cancel: 'Annuler',
      reset: 'Réinitialiser',
      validate: 'Valider',

      // Form sections
      sender: 'Émetteur',
      client: 'Client',
      invoice: 'Facture',
      items: 'Lignes',
      summary: 'Récapitulatif',
      footer: 'Mentions',

      // Fields
      name: 'Nom',
      address: 'Adresse',
      email: 'Email',
      phone: 'Téléphone',
      bank: 'Coordonnées bancaires',
      logo: 'Logo',
      notes: 'Notes',
      reg: 'RCCM/IFU',
      number: 'Numéro',
      date: 'Date',
      subject: 'Objet',
      paymentTerms: 'Conditions de paiement',
      currency: 'Devise',
      description: 'Désignation',
      qty: 'Qté',
      unitPrice: 'Prix unitaire',
      discount: 'Remise (%)',
      total: 'Total',
      globalDiscount: 'Remise globale (%)',
      taxes: 'Taxes',
      legal: 'Mentions légales',
      signature: 'Signature',

      // Actions
      addItem: 'Ajouter une ligne',
      addTax: 'Ajouter une taxe',
      remove: 'Supprimer',

      // Messages
      saved: 'Sauvegardé',
      imported: 'Importé avec succès',
      exported: 'Exporté avec succès',
      error: 'Erreur',
      invalidJson: 'JSON invalide',
      confirmReset: 'Êtes-vous sûr de vouloir réinitialiser ?',
    },
    invoice: {
      title: 'FACTURE',
      invoiceNumber: 'Facture N°',
      date: 'Date',
      subtotal: 'Sous-total',
      discount: 'Remise',
      tax: 'Taxe',
      total: 'Total',
    },
  },
  en: {
    ui: {
      appName: 'Document Studio',
      newInvoice: 'New Invoice',
      duplicate: 'Duplicate',
      import: 'Import',
      export: 'Export',
      print: 'Print',
      preview: 'Preview',
      editTemplate: 'Edit Template',
      save: 'Save',
      cancel: 'Cancel',
      reset: 'Reset',
      validate: 'Validate',

      sender: 'Sender',
      client: 'Client',
      invoice: 'Invoice',
      items: 'Items',
      summary: 'Summary',
      footer: 'Footer',

      name: 'Name',
      address: 'Address',
      email: 'Email',
      phone: 'Phone',
      bank: 'Bank details',
      logo: 'Logo',
      notes: 'Notes',
      reg: 'Registration',
      number: 'Number',
      date: 'Date',
      subject: 'Subject',
      paymentTerms: 'Payment terms',
      currency: 'Currency',
      description: 'Description',
      qty: 'Qty',
      unitPrice: 'Unit price',
      discount: 'Discount (%)',
      total: 'Total',
      globalDiscount: 'Global discount (%)',
      taxes: 'Taxes',
      legal: 'Legal notice',
      signature: 'Signature',

      addItem: 'Add item',
      addTax: 'Add tax',
      remove: 'Remove',

      saved: 'Saved',
      imported: 'Successfully imported',
      exported: 'Successfully exported',
      error: 'Error',
      invalidJson: 'Invalid JSON',
      confirmReset: 'Are you sure you want to reset?',
    },
    invoice: {
      title: 'INVOICE',
      invoiceNumber: 'Invoice No.',
      date: 'Date',
      subtotal: 'Subtotal',
      discount: 'Discount',
      tax: 'Tax',
      total: 'Total',
    },
  },
};

const savedLocale = loadFromLocalStorage<string>(STORAGE_KEYS.LOCALE);

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLocale || 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
  });

// Save locale changes
i18n.on('languageChanged', (lng) => {
  saveToLocalStorage(STORAGE_KEYS.LOCALE, lng);
});

export default i18n;
