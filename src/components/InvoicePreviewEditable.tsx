import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { InlineEditableField } from './InlineEditableField';
import { Plus, Trash2 } from 'lucide-react';

export function InvoicePreviewEditable() {
  const { data, updateData, theme } = useInvoiceStore();

  const updateField = (path: string, value: any) => {
    updateData((current) => {
      const keys = path.split('.');
      const newData = JSON.parse(JSON.stringify(current));
      let target: any = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]];
      }

      target[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const addItem = () => {
    updateData((current) => ({
      ...current,
      items: [
        ...current.items,
        {
          description: 'Nouvelle prestation',
          qty: 1,
          unit_price: 0,
          discount: 0,
        },
      ],
    }));
  };

  const removeItem = (index: number) => {
    updateData((current) => ({
      ...current,
      items: current.items.filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    updateData((current) => ({
      ...current,
      items: current.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const calculateLineTotal = (item: any) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.unit_price) || 0;
    const discount = Number(item.discount) || 0;
    const subtotal = qty * price;
    return subtotal - (subtotal * discount) / 100;
  };

  const calculateSubtotal = () => {
    return data.items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  };

  const calculateTotal = () => {
    let total = calculateSubtotal();

    // Apply global discount
    if (data.summary.global_discount) {
      total -= (total * data.summary.global_discount) / 100;
    }

    // Apply taxes
    if (data.summary.taxes) {
      data.summary.taxes.forEach((tax) => {
        total += (total * tax.rate) / 100;
      });
    }

    return total;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <style>{theme}</style>
      <div className="invoice-preview bg-white shadow-sm" id="invoice-content">
      {/* Header */}
      <div className="invoice-header">
        <div className="invoice-title">FACTURE</div>
        <div className="header-separator"></div>
        <div className="invoice-meta">
          <div>
            <strong>N°</strong>{' '}
            <InlineEditableField
              value={data.invoice.number}
              onChange={(v) => updateField('invoice.number', v)}
            />
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            <InlineEditableField
              value={data.sender.name}
              onChange={(v) => updateField('sender.name', v)}
            />
          </div>
          <div>
            <strong>DATE:</strong>{' '}
            <InlineEditableField
              value={data.invoice.date}
              onChange={(v) => updateField('invoice.date', v)}
              type="date"
            />
          </div>
        </div>
        <div className="header-separator"></div>
      </div>

      {/* Sender & Client */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0' }}>
        <div>
          <div className="section-title">Émetteur</div>
          <div className="info-box" style={{ marginBottom: 0 }}>
            <strong>
              <InlineEditableField
                value={data.sender.name}
                onChange={(v) => updateField('sender.name', v)}
              />
            </strong>
            <br />
            <InlineEditableField
              value={data.sender.address || ''}
              onChange={(v) => updateField('sender.address', v)}
              multiline
              placeholder="Adresse"
            />
            <br />
            📧{' '}
            <InlineEditableField
              value={data.sender.email || ''}
              onChange={(v) => updateField('sender.email', v)}
              type="email"
              placeholder="Email"
            />
            <br />
            📱{' '}
            <InlineEditableField
              value={data.sender.phone || ''}
              onChange={(v) => updateField('sender.phone', v)}
              type="tel"
              placeholder="Téléphone"
            />
            <br />
            <InlineEditableField
              value={data.sender.bank || ''}
              onChange={(v) => updateField('sender.bank', v)}
              multiline
              placeholder="Coordonnées bancaires"
            />
          </div>
        </div>
        <div>
          <div className="section-title">Client</div>
          <div className="info-box" style={{ marginBottom: 0 }}>
            <strong>
              <InlineEditableField
                value={data.client.name}
                onChange={(v) => updateField('client.name', v)}
              />
            </strong>
            <br />
            <InlineEditableField
              value={data.client.address || ''}
              onChange={(v) => updateField('client.address', v)}
              multiline
              placeholder="Adresse"
            />
            <br />
            📧{' '}
            <InlineEditableField
              value={data.client.email || ''}
              onChange={(v) => updateField('client.email', v)}
              type="email"
              placeholder="Email"
            />
            <br />
            📱{' '}
            <InlineEditableField
              value={data.client.phone || ''}
              onChange={(v) => updateField('client.phone', v)}
              type="tel"
              placeholder="Téléphone"
            />
            <br />
            <InlineEditableField
              value={data.client.reg || ''}
              onChange={(v) => updateField('client.reg', v)}
              placeholder="RCCM/IFU"
            />
          </div>
        </div>
      </div>

      {/* Subject */}
      {data.invoice.subject && (
        <>
          <div className="section-title" style={{ marginTop: '8px' }}>
            Objet
          </div>
          <div className="highlight-box">
            <InlineEditableField
              value={data.invoice.subject}
              onChange={(v) => updateField('invoice.subject', v)}
              multiline
            />
          </div>
        </>
      )}

      {/* Items Table */}
      <div className="section-title">Prestations</div>
      <div className="table-wrapper">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>DÉSIGNATION</th>
              <th style={{ textAlign: 'center' }}>QTÉ</th>
              <th style={{ textAlign: 'right' }}>P.U.</th>
              <th style={{ textAlign: 'right' }}>TOTAL</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={index} className="group hover:bg-gray-50">
                <td>
                  <InlineEditableField
                    value={item.description}
                    onChange={(v) => updateItem(index, 'description', v)}
                  />
                </td>
                <td style={{ textAlign: 'center' }}>
                  <InlineEditableField
                    value={item.qty}
                    onChange={(v) => updateItem(index, 'qty', Number(v))}
                    type="number"
                  />
                </td>
                <td className="text-right">
                  <InlineEditableField
                    value={item.unit_price}
                    onChange={(v) => updateItem(index, 'unit_price', Number(v))}
                    type="number"
                  />
                </td>
                <td className="text-right">
                  <strong>{formatCurrency(calculateLineTotal(item))}</strong>
                </td>
                <td>
                  <button
                    onClick={() => removeItem(index)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addItem}
        className="flex items-center gap-2 px-3 py-1.5 mt-2 text-sm text-blue-600 hover:bg-blue-50 border border-blue-200 rounded transition-colors no-print"
      >
        <Plus className="w-3.5 h-3.5" />
        Ajouter une ligne
      </button>

      {/* Summary */}
      <div className="section-title">Récapitulatif</div>
      <div className="summary-section">
        <div className="summary-row">
          <span>Sous-total:</span>
          <span>{formatCurrency(calculateSubtotal())} {data.invoice.currency}</span>
        </div>
        {data.summary.taxes?.map((tax, index) => (
          <div key={index} className="summary-row">
            <span>
              {tax.label} ({tax.rate}%):
            </span>
            <span>
              {formatCurrency((calculateSubtotal() * tax.rate) / 100)} {data.invoice.currency}
            </span>
          </div>
        ))}
        <div className="summary-row total">
          <span>TOTAL</span>
          <span>
            {formatCurrency(calculateTotal())} {data.invoice.currency}
          </span>
        </div>
      </div>

      {/* Payment terms */}
      {data.invoice.payment_terms && (
        <>
          <div className="section-title">Conditions de paiement</div>
          <div className="highlight-box">
            <InlineEditableField
              value={data.invoice.payment_terms}
              onChange={(v) => updateField('invoice.payment_terms', v)}
              multiline
            />
          </div>
        </>
      )}

      {/* Footer */}
      {data.footer.legal && (
        <div className="footer-section">
          <InlineEditableField
            value={data.footer.legal}
            onChange={(v) => updateField('footer.legal', v)}
            multiline
          />
        </div>
      )}
      </div>
    </>
  );
}
