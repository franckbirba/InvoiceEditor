import * as React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Accordion from '@radix-ui/react-accordion';
// Removed unused Radix Label - using native HTML labels instead
import * as Select from '@radix-ui/react-select';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Plus, Trash2, Check } from 'lucide-react';
import type { Currency } from '../features/invoice/invoice.schema';
import { InvoiceDataSchema } from '../features/invoice/invoice.schema';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { useToast } from './Toast';

export function SidebarForm() {
  const { t } = useTranslation('ui');
  const { showToast } = useToast();
  const { data, dataVersion, setData } = useInvoiceStore();
  const [openSections, setOpenSections] = React.useState<string[]>(['sender', 'invoice', 'items']);

  const {
    register,
    control,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(InvoiceDataSchema),
    defaultValues: data,
    mode: 'onChange',
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control,
    name: 'items',
  });

  const { fields: taxFields, append: appendTax, remove: removeTax } = useFieldArray({
    control,
    name: 'summary.taxes',
  });

  // Watch all form values for autosave
  const formData = watch();

  // Debounced autosave
  React.useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const validatedData = InvoiceDataSchema.parse(formData);
        setData(validatedData);
      } catch (error) {
        // Validation errors - don't save
        console.debug('Form validation pending:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formData, setData]);

  // Reset form only when data is updated externally (JSON import, duplicate, etc)
  // Note: data is intentionally not in deps - we only reset on version changes
  React.useEffect(() => {
    reset(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataVersion]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Update via form
        reset({
          ...formData,
          sender: { ...formData.sender, logo: base64 },
        });
        showToast('success', 'Logo uploaded');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full bg-white">
      <form className="p-4 space-y-0">
        <Accordion.Root
          type="multiple"
          value={openSections}
          onValueChange={setOpenSections}
          className="space-y-1"
        >
          {/* Sender Section */}
          <Accordion.Item value="sender" className="border-b border-gray-100">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors group">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('sender')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-3 pb-3 space-y-2.5">
              <div>
                <label htmlFor="sender-name" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('name')} *
                </label>
                <input
                  id="sender-name"
                  {...register('sender.name')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
                {errors.sender?.name && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.sender.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="sender-address" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('address')}
                </label>
                <textarea
                  id="sender-address"
                  {...register('sender.address')}
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="sender-email" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('email')}
                </label>
                <input
                  id="sender-email"
                  type="email"
                  {...register('sender.email')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
                {errors.sender?.email && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.sender.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="sender-phone" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('phone')}
                </label>
                <input
                  id="sender-phone"
                  {...register('sender.phone')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="sender-bank" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('bank')}
                </label>
                <textarea
                  id="sender-bank"
                  {...register('sender.bank')}
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="sender-logo" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('logo')}
                </label>
                <input
                  id="sender-logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-xs"
                />
                {formData.sender?.logo && (
                  <img
                    src={formData.sender.logo}
                    alt="Logo preview"
                    className="mt-1.5 max-h-16 border border-gray-200"
                  />
                )}
              </div>

              <div>
                <label htmlFor="sender-notes" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('notes')}
                </label>
                <textarea
                  id="sender-notes"
                  {...register('sender.notes')}
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>

          {/* Client Section */}
          <Accordion.Item value="client" className="border-b border-gray-100">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors group">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('client')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-3 pb-3 space-y-2.5">
              <div>
                <label htmlFor="client-name" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('name')} *
                </label>
                <input
                  id="client-name"
                  {...register('client.name')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
                {errors.client?.name && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.client.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="client-address" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('address')}
                </label>
                <textarea
                  id="client-address"
                  {...register('client.address')}
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="client-email" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('email')}
                </label>
                <input
                  id="client-email"
                  type="email"
                  {...register('client.email')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
                {errors.client?.email && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.client.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="client-phone" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('phone')}
                </label>
                <input
                  id="client-phone"
                  {...register('client.phone')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="client-bank" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('bank')}
                </label>
                <textarea
                  id="client-bank"
                  {...register('client.bank')}
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="client-reg" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('reg')}
                </label>
                <input
                  id="client-reg"
                  {...register('client.reg')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="client-notes" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('notes')}
                </label>
                <textarea
                  id="client-notes"
                  {...register('client.notes')}
                  rows={2}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>

          {/* Invoice Section */}
          <Accordion.Item value="invoice" className="border-b border-gray-100">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors group">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('invoice')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-3 pb-3 space-y-2.5">
              <div>
                <label htmlFor="invoice-number" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('number')} *
                </label>
                <input
                  id="invoice-number"
                  {...register('invoice.number')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
                {errors.invoice?.number && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.invoice.number.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="invoice-date" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('date')} *
                </label>
                <input
                  id="invoice-date"
                  type="date"
                  {...register('invoice.date')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
                {errors.invoice?.date && (
                  <p className="mt-0.5 text-xs text-red-500">{errors.invoice.date.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="invoice-subject" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('subject')}
                </label>
                <input
                  id="invoice-subject"
                  {...register('invoice.subject')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="invoice-payment-terms" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('paymentTerms')}
                </label>
                <input
                  id="invoice-payment-terms"
                  {...register('invoice.payment_terms')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="invoice-currency" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('currency')} *
                </label>
                <Controller
                  name="invoice.currency"
                  control={control}
                  render={({ field }) => (
                    <Select.Root value={field.value} onValueChange={field.onChange}>
                      <Select.Trigger className="w-full flex items-center justify-between px-2.5 py-1.5 text-sm border border-gray-200 hover:bg-gray-50 focus:outline-none focus:border-gray-400 transition-colors">
                        <Select.Value />
                        <Select.Icon>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="overflow-hidden bg-white rounded-lg shadow-lg border border-gray-200">
                          <Select.Viewport className="p-1">
                            {(['XOF', 'EUR', 'USD'] as Currency[]).map((currency) => (
                              <Select.Item
                                key={currency}
                                value={currency}
                                className="relative flex items-center px-8 py-2 text-sm rounded hover:bg-gray-100 cursor-pointer outline-none data-[highlighted]:bg-gray-100"
                              >
                                <Select.ItemText>{currency}</Select.ItemText>
                                <Select.ItemIndicator className="absolute left-2">
                                  <Check className="w-4 h-4" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  )}
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>

          {/* Items Section */}
          <Accordion.Item value="items" className="border-b border-gray-100">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors group">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('items')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-3 pb-3 space-y-2.5">
              {itemFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-600">Item {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      aria-label={t('remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label htmlFor={`item-description-${index}`} className="block text-xs font-medium text-gray-600 mb-1">{t('description')} *</label>
                    <input
                      id={`item-description-${index}`}
                      {...register(`items.${index}.description`)}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                    {errors.items?.[index]?.description && (
                      <p className="mt-0.5 text-xs text-red-500">
                        {errors.items[index]?.description?.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`item-qty-${index}`} className="block text-xs font-medium text-gray-600 mb-1">{t('qty')} *</label>
                      <input
                        id={`item-qty-${index}`}
                        type="number"
                        step="1"
                        {...register(`items.${index}.qty`, { valueAsNumber: true })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                      />
                      {errors.items?.[index]?.qty && (
                        <p className="mt-0.5 text-xs text-red-500">
                          {errors.items[index]?.qty?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`item-unit-price-${index}`} className="block text-xs font-medium text-gray-600 mb-1">{t('unitPrice')} *</label>
                      <input
                        id={`item-unit-price-${index}`}
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.unit_price`, { valueAsNumber: true })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                      />
                      {errors.items?.[index]?.unit_price && (
                        <p className="mt-0.5 text-xs text-red-500">
                          {errors.items[index]?.unit_price?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`item-discount-${index}`} className="block text-xs font-medium text-gray-600 mb-1">{t('discount')}</label>
                    <input
                      id={`item-discount-${index}`}
                      type="number"
                      step="0.1"
                      {...register(`items.${index}.discount`, { valueAsNumber: true })}
                      className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  appendItem({ description: '', qty: 1, unit_price: 0, discount: 0 })
                }
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('addItem')}
              </button>
            </Accordion.Content>
          </Accordion.Item>

          {/* Summary Section */}
          <Accordion.Item value="summary" className="border-b border-gray-100">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors group">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('summary')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-3 pb-3 space-y-2.5">
              <div>
                <label htmlFor="global-discount" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('globalDiscount')}
                </label>
                <input
                  id="global-discount"
                  type="number"
                  step="0.1"
                  {...register('summary.global_discount', { valueAsNumber: true })}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div className="space-y-3">
                <div className="text-xs font-medium text-gray-600">{t('taxes')}</div>

                {taxFields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">Tax {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeTax(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        aria-label={t('remove')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label htmlFor={`tax-label-${index}`} className="block text-xs font-medium text-gray-600 mb-1">Label *</label>
                      <input
                        id={`tax-label-${index}`}
                        {...register(`summary.taxes.${index}.label`)}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                      />
                      {errors.summary?.taxes?.[index]?.label && (
                        <p className="mt-0.5 text-xs text-red-500">
                          {errors.summary.taxes[index]?.label?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={`tax-rate-${index}`} className="block text-xs font-medium text-gray-600 mb-1">Rate (%) *</label>
                      <input
                        id={`tax-rate-${index}`}
                        type="number"
                        step="0.1"
                        {...register(`summary.taxes.${index}.rate`, { valueAsNumber: true })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                      />
                      {errors.summary?.taxes?.[index]?.rate && (
                        <p className="mt-0.5 text-xs text-red-500">
                          {errors.summary.taxes[index]?.rate?.message}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => appendTax({ label: 'VAT', rate: 18 })}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs border border-dashed border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('addTax')}
                </button>
              </div>
            </Accordion.Content>
          </Accordion.Item>

          {/* Footer Section */}
          <Accordion.Item value="footer" className="border-b border-gray-100">
            <Accordion.Header>
              <Accordion.Trigger className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors group">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('footer')}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform group-data-[state=open]:rotate-180" />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content className="px-3 pb-3 space-y-2.5">
              <div>
                <label htmlFor="footer-legal" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('legal')}
                </label>
                <textarea
                  id="footer-legal"
                  {...register('footer.legal')}
                  rows={3}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="footer-signature" className="block text-xs font-medium text-gray-600 mb-1">
                  {t('signature')}
                </label>
                <input
                  id="footer-signature"
                  {...register('footer.signature')}
                  className="w-full px-2.5 py-1.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                />
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>
      </form>
    </div>
  );
}
