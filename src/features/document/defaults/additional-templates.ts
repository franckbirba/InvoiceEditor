import type { Template } from '../document.schema';

// Template Dense - Tableau unifié avec récapitulatif intégré
export const denseTemplate: Template = {
  id: 'template-invoice-dense',
  name: 'Facture Dense',
  typeId: 'facture',
  isDefault: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  content: `<div class="invoice-preview" id="invoice-content">
  <!-- Header compact -->
  <div class="invoice-header">
    <div style="display: flex; justify-content: space-between; align-items: start;">
      <div>
        <div class="invoice-title">FACTURE {{invoice.number}}</div>
        <div style="font-size: 12px; margin-top: 4px;">{{formatted.date}}</div>
      </div>
      <div style="text-align: right; font-size: 12px;">
        <strong>{{sender.name}}</strong><br>
        {{#sender.email}}{{sender.email}}{{/sender.email}}
      </div>
    </div>
    <div class="header-separator"></div>
  </div>

  <!-- Client et infos en ligne -->
  <div style="display: flex; gap: 24px; margin-bottom: 20px; font-size: 12px;">
    <div style="flex: 1;">
      <div class="section-title">Facturé à</div>
      <strong>{{client.name}}</strong><br>
      {{#client.address}}{{client.address}}<br>{{/client.address}}
      {{#client.email}}{{client.email}}{{/client.email}}
    </div>
    <div style="flex: 1;">
      {{#invoice.subject}}
      <div class="section-title">Objet</div>
      {{invoice.subject}}
      {{/invoice.subject}}
    </div>
  </div>

  <!-- Tableau unifié : Prestations + Récapitulatif -->
  <div class="table-wrapper">
    <table class="invoice-table">
      <thead>
        <tr>
          <th style="width: 50%;">DÉSIGNATION</th>
          <th style="text-align: center; width: 15%;">QTÉ</th>
          <th style="text-align: right; width: 17%;">P.U.</th>
          <th style="text-align: right; width: 18%;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        {{#items_with_totals}}
        <tr>
          <td>{{description}}</td>
          <td style="text-align: center;">{{qty_formatted}}</td>
          <td class="text-right">{{unit_price_formatted}}</td>
          <td class="text-right">{{line_total_formatted}}</td>
        </tr>
        {{/items_with_totals}}
        <!-- Ligne séparatrice -->
        <tr style="height: 8px; background: transparent;">
          <td colspan="4" style="border: none; padding: 0;"></td>
        </tr>
        <!-- Récapitulatif intégré -->
        <tr>
          <td colspan="3" style="text-align: right; font-weight: normal;">Sous-total:</td>
          <td class="text-right">{{formatted.subtotal}}</td>
        </tr>
        {{#totals.taxes}}
        <tr>
          <td colspan="3" style="text-align: right; font-weight: normal;">{{label}} ({{rate}}%):</td>
          <td class="text-right">{{amount}}</td>
        </tr>
        {{/totals.taxes}}
        <tr style="font-weight: bold; font-size: 15px;">
          <td colspan="3" style="text-align: right;">TOTAL:</td>
          <td class="text-right">{{formatted.total}}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Footer compact -->
  {{#invoice.payment_terms}}
  <div style="margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 4px; font-size: 11px;">
    <strong>Paiement:</strong> {{invoice.payment_terms}}
  </div>
  {{/invoice.payment_terms}}

  <div class="footer-section">
    {{#footer.legal}}{{footer.legal}}{{/footer.legal}}
  </div>
</div>`
};

// Template Moderne - Layout en colonnes asymétriques
export const modernTemplate: Template = {
  id: 'template-invoice-modern',
  name: 'Facture Moderne',
  typeId: 'facture',
  isDefault: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  content: `<div class="invoice-preview" id="invoice-content">
  <!-- Header moderne avec badge -->
  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 32px;">
    <div>
      <div style="display: inline-block; background: #000; color: white; padding: 8px 16px; font-size: 11px; font-weight: 600; letter-spacing: 2px; margin-bottom: 12px;">
        FACTURE
      </div>
      <div class="invoice-title" style="margin: 0;">{{invoice.number}}</div>
      <div style="color: #666; font-size: 13px; margin-top: 4px;">Date d'émission: {{formatted.date}}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-weight: 600; font-size: 14px;">{{sender.name}}</div>
      <div style="font-size: 12px; color: #666; margin-top: 4px;">
        {{#sender.email}}{{sender.email}}<br>{{/sender.email}}
        {{#sender.phone}}{{sender.phone}}{{/sender.phone}}
      </div>
    </div>
  </div>

  <!-- Layout en colonnes -->
  <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 32px; margin-bottom: 32px;">
    <!-- Colonne principale : Client + Prestations -->
    <div>
      <div class="section-title">Client</div>
      <div class="info-box">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">{{client.name}}</div>
        {{#client.address}}{{client.address}}<br>{{/client.address}}
        {{#client.email}}{{client.email}}<br>{{/client.email}}
        {{#client.phone}}{{client.phone}}{{/client.phone}}
      </div>

      {{#invoice.subject}}
      <div class="section-title">Objet de la prestation</div>
      <div class="highlight-box">{{invoice.subject}}</div>
      {{/invoice.subject}}

      <div class="section-title">Détail des prestations</div>
      <div class="table-wrapper">
        <table class="invoice-table">
          <thead>
            <tr>
              <th>DÉSIGNATION</th>
              <th style="text-align: center; width: 80px;">QTÉ</th>
              <th style="text-align: right; width: 100px;">MONTANT</th>
            </tr>
          </thead>
          <tbody>
            {{#items_with_totals}}
            <tr>
              <td>
                <div style="font-weight: 500;">{{description}}</div>
                <div style="font-size: 11px; color: #666; margin-top: 2px;">{{unit_price_formatted}} × {{qty_formatted}}</div>
              </td>
              <td style="text-align: center;">{{qty_formatted}}</td>
              <td class="text-right" style="font-weight: 500;">{{line_total_formatted}}</td>
            </tr>
            {{/items_with_totals}}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Colonne latérale : Récapitulatif sticky -->
    <div>
      <div style="position: sticky; top: 20px;">
        <div class="section-title">Récapitulatif</div>
        <div class="summary-section">
          <div class="summary-row">
            <span style="color: #666;">Sous-total</span>
            <span style="font-weight: 500;">{{formatted.subtotal}}</span>
          </div>
          {{#totals.taxes}}
          <div class="summary-row">
            <span style="color: #666;">{{label}}</span>
            <span style="font-weight: 500;">{{amount}}</span>
          </div>
          {{/totals.taxes}}
          <div class="summary-row total">
            <span>TOTAL</span>
            <span>{{formatted.total}}</span>
          </div>
        </div>

        {{#invoice.payment_terms}}
        <div style="margin-top: 24px; padding: 16px; background: #f5f5f5; border-radius: 4px; font-size: 11px;">
          <div style="font-weight: 600; margin-bottom: 8px; color: #000;">💳 Paiement</div>
          {{invoice.payment_terms}}
        </div>
        {{/invoice.payment_terms}}

        {{#sender.bank}}
        <div style="margin-top: 16px; padding: 12px; background: #f9f9f9; border-radius: 4px; font-size: 11px;">
          <div style="font-weight: 600; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; color: #666;">Coordonnées bancaires</div>
          {{sender.bank}}
        </div>
        {{/sender.bank}}
      </div>
    </div>
  </div>

  <div class="footer-section">
    {{#footer.legal}}{{footer.legal}}{{/footer.legal}}
  </div>
</div>`
};
