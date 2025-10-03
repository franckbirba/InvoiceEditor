import * as React from 'react';
import { useInvoiceStore } from '../features/invoice/useInvoiceStore';
import { renderTemplate, enrichInvoiceData } from '../lib/templating';
import type { InvoiceData } from '../features/invoice/invoice.schema';
import { getDocumentSchema } from '../features/document/schema-registry';
import { getFieldDefinition, fieldParsers } from '../features/document/document-schema';

// Helper to wrap Mustache variables with data-field attributes in template before rendering
function wrapMustacheVariables(template: string): string {
  // Match {{variable}} or {{#section}}{{variable}}{{/section}} patterns
  // We want to wrap {{variable}} with <span data-field="variable">{{variable}}</span>

  return template.replace(/\{\{([^#\/\{][^}]*)\}\}/g, (match, variable) => {
    const cleanVar = variable.trim();

    // Skip ONLY truly calculated/read-only fields
    const isCalculatedField =
      cleanVar.startsWith('formatted.') && cleanVar !== 'formatted.date' ||
      cleanVar.includes('_with_totals') ||
      cleanVar.includes('line_total') ||
      cleanVar === 'index' ||
      cleanVar === 'amount';  // Only amounts are calculated, not labels/rates

    if (isCalculatedField) {
      return match; // Don't wrap calculated fields
    }

    // Map formatted fields to their editable counterparts
    let editableField = cleanVar;

    // Handle formatted date -> actual date field
    if (cleanVar === 'formatted.date') {
      editableField = 'invoice.date';
    }
    // Handle qty_formatted -> qty (in items loop)
    else if (cleanVar === 'qty_formatted') {
      editableField = 'qty';
    }
    // Handle unit_price_formatted -> unit_price (in items loop)
    else if (cleanVar === 'unit_price_formatted') {
      editableField = 'unit_price';
    }
    // discount is already editable, no need to map

    // Wrap with span that has data-field attribute
    return `<span data-field="${editableField}">${match}</span>`;
  });
}

export function InvoicePreviewEditable() {
  const { data, template, theme, updateData } = useInvoiceStore();
  const [renderedHtml, setRenderedHtml] = React.useState('');
  const contentRef = React.useRef<HTMLDivElement>(null);
  const updateTimeoutRef = React.useRef<number | null>(null);
  const activeFieldsRef = React.useRef<Set<string>>(new Set());
  const initialDataRef = React.useRef(data);

  // Track array lengths for structure changes
  const itemsCount = React.useMemo(() => data.items?.length || 0, [data.items?.length]);
  const taxesCount = React.useMemo(() => data.summary?.taxes?.length || 0, [data.summary?.taxes?.length]);

  // Capture data at mount for initial render
  React.useEffect(() => {
    initialDataRef.current = data;
  }, []); // Only on mount

  React.useEffect(() => {
    // Re-render when template/theme changes OR when structure changes (items/taxes added/removed)
    // Update data snapshot when template/theme changes
    initialDataRef.current = data;

    try {
      // Wrap Mustache variables with data-field attributes before rendering
      // ONLY if the template doesn't already have data-field attributes
      let templateWithFields = template;
      const hasDataFields = template.includes('data-field');

      if (!hasDataFields) {
        templateWithFields = wrapMustacheVariables(template);
      }

      // In edit mode, force display of all optional fields by providing default values
      // This ensures empty fields are still visible for editing
      const dataForRendering = JSON.parse(JSON.stringify(data));

      // Ensure all optional fields have at least an empty string to force Mustache to render them
      if (!dataForRendering.sender.email) dataForRendering.sender.email = '\u200B'; // Zero-width space
      if (!dataForRendering.sender.phone) dataForRendering.sender.phone = '\u200B';
      if (!dataForRendering.sender.address) dataForRendering.sender.address = '\u200B';
      if (!dataForRendering.sender.bank) dataForRendering.sender.bank = '\u200B';
      if (!dataForRendering.sender.notes) dataForRendering.sender.notes = '\u200B';

      if (!dataForRendering.client.email) dataForRendering.client.email = '\u200B';
      if (!dataForRendering.client.phone) dataForRendering.client.phone = '\u200B';
      if (!dataForRendering.client.address) dataForRendering.client.address = '\u200B';
      if (!dataForRendering.client.bank) dataForRendering.client.bank = '\u200B';
      if (!dataForRendering.client.reg) dataForRendering.client.reg = '\u200B';
      if (!dataForRendering.client.notes) dataForRendering.client.notes = '\u200B';

      if (!dataForRendering.invoice.subject) dataForRendering.invoice.subject = '\u200B';
      if (!dataForRendering.invoice.payment_terms) dataForRendering.invoice.payment_terms = '\u200B';

      if (!dataForRendering.footer.legal) dataForRendering.footer.legal = '\u200B';
      if (!dataForRendering.footer.signature) dataForRendering.footer.signature = '\u200B';

      // Ensure at least one tax exists for editing
      if (!dataForRendering.summary.taxes || dataForRendering.summary.taxes.length === 0) {
        dataForRendering.summary.taxes = [
          { label: '\u200B', rate: 0 }
        ];
      }

      // Render template with current data
      // Note: we use modified data to force optional fields to show
      let html = renderTemplate(templateWithFields, dataForRendering);

      // Post-process: Add action buttons and fix indices if needed
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Find all table rows and add action buttons
      const rows = doc.querySelectorAll('tr');
      rows.forEach((row) => {
        // Check if this row has item fields with proper indices already
        const hasItemField = row.querySelector('[data-field^="items."]');

        if (hasItemField) {
          // Extract index from data-item-index attribute if present, or from first data-field
          let itemIndex = row.getAttribute('data-item-index');

          if (!itemIndex) {
            const firstField = row.querySelector<HTMLElement>('[data-field^="items."]');
            if (firstField) {
              const match = firstField.getAttribute('data-field')?.match(/items\.(\d+)\./);
              itemIndex = match ? match[1] : '0';
              row.setAttribute('data-item-index', itemIndex);
            }
          }

          // Add delete button cell if not exists
          if (!row.querySelector('.item-actions') && itemIndex !== null) {
            const actionCell = doc.createElement('td');
            actionCell.className = 'item-actions';
            actionCell.style.width = '40px';
            actionCell.style.textAlign = 'center';
            actionCell.innerHTML = `<button class="delete-item-btn" data-item-index="${itemIndex}" style="opacity: 0.3; cursor: pointer; padding: 4px 8px; color: #dc2626; background: transparent; border: none; font-size: 16px; transition: opacity 0.2s;" title="Supprimer">×</button>`;
            row.appendChild(actionCell);
          }
        }
        // Handle rows without proper indices (from auto-wrapped templates)
        else {
          const hasItemData = row.querySelector('[data-field="description"], [data-field="qty"], [data-field="unit_price"]');
          if (hasItemData) {
            // Count previous rows to determine index
            let itemIndex = 0;
            let currentRow = row.previousElementSibling;
            while (currentRow) {
              if (currentRow.querySelector('[data-field="description"]') || currentRow.querySelector('[data-field^="items."]')) {
                itemIndex++;
              }
              currentRow = currentRow.previousElementSibling;
            }

            // Fix all data-field attributes to include the correct index
            const fields = row.querySelectorAll<HTMLElement>('[data-field]');
            fields.forEach((field) => {
              const fieldName = field.getAttribute('data-field');
              if (fieldName && !fieldName.startsWith('items.')) {
                field.setAttribute('data-field', `items.${itemIndex}.${fieldName}`);
              }
            });

            row.setAttribute('data-item-index', itemIndex.toString());

            // Add delete button
            if (!row.querySelector('.item-actions')) {
              const actionCell = doc.createElement('td');
              actionCell.className = 'item-actions';
              actionCell.style.width = '40px';
              actionCell.style.textAlign = 'center';
              actionCell.innerHTML = `<button class="delete-item-btn" data-item-index="${itemIndex}" style="opacity: 0.3; cursor: pointer; padding: 4px 8px; color: #dc2626; background: transparent; border: none; font-size: 16px; transition: opacity 0.2s;" title="Supprimer">×</button>`;
              row.appendChild(actionCell);
            }
          }
        }
      });

      // Find tax rows in summary section and add delete buttons
      const summaryRows = doc.querySelectorAll('.summary-section .summary-row, .summary-row');
      let taxRowIndex = 0;
      summaryRows.forEach((row) => {
        // Check if this row has tax data (label and rate fields, or already indexed fields)
        const hasLabelField = row.querySelector('[data-field="label"], [data-field*="summary.taxes"][data-field*=".label"]');
        const hasRateField = row.querySelector('[data-field="rate"], [data-field*="summary.taxes"][data-field*=".rate"]');

        if (hasLabelField || hasRateField) {
          // This is a tax row - fix all data-field attributes to include index
          const fields = row.querySelectorAll<HTMLElement>('[data-field]');
          fields.forEach((field) => {
            const fieldName = field.getAttribute('data-field');
            if (fieldName && !fieldName.startsWith('summary.taxes.')) {
              field.setAttribute('data-field', `summary.taxes.${taxRowIndex}.${fieldName}`);
            }
          });

          // Set or update data-tax-index
          row.setAttribute('data-tax-index', row.getAttribute('data-tax-index') || taxRowIndex.toString());

          // Add delete button if not exists
          if (!row.querySelector('.delete-tax-btn')) {
            const deleteBtn = doc.createElement('button');
            deleteBtn.className = 'delete-tax-btn';
            deleteBtn.setAttribute('data-tax-index', row.getAttribute('data-tax-index') || taxRowIndex.toString());
            deleteBtn.textContent = '×';
            deleteBtn.style.cssText = 'opacity: 0.3; cursor: pointer; padding: 0 8px; margin-left: 8px; color: #dc2626; background: transparent; border: none; font-size: 16px; transition: opacity 0.2s;';
            deleteBtn.title = 'Supprimer';

            // Insert into the last span (the amount span)
            const spans = row.querySelectorAll(':scope > span');
            if (spans.length > 0) {
              const lastSpan = spans[spans.length - 1];
              lastSpan.appendChild(deleteBtn);
            } else {
              // Fallback: append to row if no spans found
              row.appendChild(deleteBtn);
            }
          }

          taxRowIndex++;
        }
      });

      // Add "Add tax" button in summary section
      const summarySections = doc.querySelectorAll('.summary-section');
      summarySections.forEach((section) => {
        // Check if this summary has tax rows
        if (section.querySelector('[data-field*="summary.taxes"]')) {
          if (!section.querySelector('.add-tax-btn')) {
            const addButton = doc.createElement('button');
            addButton.className = 'add-tax-btn';
            addButton.textContent = '+ Ajouter une taxe/réduction';
            addButton.style.cssText = 'margin-top: 8px; padding: 6px 12px; background: transparent; color: #3b82f6; border: 1px solid #3b82f6; border-radius: 4px; cursor: pointer; font-size: 13px; transition: all 0.2s;';
            section.appendChild(addButton);
          }
        }
      });

      // Add "Add item" button after the table
      const tables = doc.querySelectorAll('table');
      tables.forEach((table) => {
        // Check if this table has items
        if (table.querySelector('[data-field*="items."]')) {
          const wrapper = table.parentElement;
          if (wrapper && !wrapper.querySelector('.add-item-btn')) {
            const addButton = doc.createElement('button');
            addButton.className = 'add-item-btn';
            addButton.textContent = '+ Ajouter une ligne';
            addButton.style.cssText = 'margin-top: 8px; padding: 6px 12px; background: transparent; color: #3b82f6; border: 1px solid #3b82f6; border-radius: 4px; cursor: pointer; font-size: 13px; transition: all 0.2s;';
            wrapper.appendChild(addButton);
          }
        }
      });

      html = doc.body.innerHTML;
      setRenderedHtml(html);
    } catch (error) {
      console.error('Error rendering template:', error);
      setRenderedHtml(`
        <div style="padding: 2rem; text-align: center; color: #dc2626;">
          <h2>Template Rendering Error</h2>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `);
    }
  }, [template, theme, itemsCount, taxesCount]); // Re-render when structure changes (items/taxes added/removed)

  // Inject HTML and make fields editable
  React.useEffect(() => {
    if (!contentRef.current || !renderedHtml) return;

    const container = contentRef.current;

    // First, inject the HTML
    container.innerHTML = renderedHtml;

    // Find all elements with data-field attribute
    const editableFields = container.querySelectorAll<HTMLElement>('[data-field]');

    console.log(`Found ${editableFields.length} editable fields`);

    const updateField = (fieldPath: string, newValue: string) => {
      updateData((currentData: InvoiceData) => {
        const pathParts = fieldPath.split('.');
        const newData = JSON.parse(JSON.stringify(currentData)); // Deep clone

        let obj: any = newData;
        for (let i = 0; i < pathParts.length - 1; i++) {
          const part = pathParts[i];
          const nextPart = pathParts[i + 1];

          // If next part is a number, current part should be an array
          if (!isNaN(Number(nextPart))) {
            if (!Array.isArray(obj[part])) {
              obj[part] = [];
            }
          } else {
            if (!obj[part]) {
              obj[part] = {};
            }
          }
          obj = obj[part];
        }

        const lastKey = pathParts[pathParts.length - 1];

        // Get document schema and field definition
        const schema = getDocumentSchema('invoice');

        // Convert array index paths like "items.0.qty" to "items.*.qty" for schema lookup
        const schemaPath = fieldPath.replace(/\.\d+\./g, '.*.');
        const fieldDef = schema ? getFieldDefinition(schemaPath, schema) : null;

        // Parse the value using the appropriate parser
        if (fieldDef) {
          const parser = fieldParsers[fieldDef.type];
          const locale = currentData.locale === 'fr' ? 'fr-FR' : 'en-US';
          const context = {
            currency: currentData.invoice?.currency || 'USD',
          };

          try {
            const parsedValue = parser.parse(newValue, locale, context);
            obj[lastKey] = parsedValue;
          } catch (error) {
            console.error(`Error parsing field ${fieldPath}:`, error);
            // Fallback to string
            obj[lastKey] = newValue;
          }
        } else {
          // Fallback: use old logic for backward compatibility
          const isNumericField =
            lastKey === 'qty' ||
            lastKey === 'unit_price' ||
            lastKey === 'discount' ||
            lastKey === 'rate';

          if (isNumericField) {
            const num = parseFloat(newValue);
            obj[lastKey] = isNaN(num) ? 0 : num;
          } else {
            obj[lastKey] = newValue;
          }
        }

        return newData;
      });
    };

    const handleFocus = (e: Event) => {
      const target = e.target as HTMLElement;
      const fieldPath = target.getAttribute('data-field');
      if (fieldPath) {
        activeFieldsRef.current.add(fieldPath);

        // Clean zero-width space
        const currentText = target.textContent || '';
        const cleanText = currentText.replace(/\u200B/g, '').trim();

        // For currency and number fields, show raw value without formatting
        const schema = getDocumentSchema('invoice');
        const schemaPath = fieldPath.replace(/\.\d+\./g, '.*.');
        const fieldDef = schema ? getFieldDefinition(schemaPath, schema) : null;

        if (fieldDef && (fieldDef.type === 'currency' || fieldDef.type === 'number' || fieldDef.type === 'percentage')) {
          // For percentage fields, check if the current text is already a valid number
          // This prevents overwriting user edits that haven't propagated to the store yet
          const currentNum = parseFloat(cleanText.replace(/%/g, '').replace(/\s/g, ''));
          const hasValidNumber = !isNaN(currentNum) && cleanText !== '';

          if (!hasValidNumber) {
            // Get the raw value from data only if current content is invalid
            const pathParts = fieldPath.split('.');
            let rawValue: any = data;
            for (const part of pathParts) {
              rawValue = rawValue?.[part];
            }

            // Display only the number, not the formatted version
            if (rawValue !== undefined && rawValue !== null) {
              target.textContent = String(rawValue);
            } else {
              // Empty field
              target.textContent = '';
            }
          } else {
            // Keep the current number (strip formatting symbols)
            target.textContent = String(currentNum);
          }
        } else if (cleanText !== currentText) {
          // For text fields, just clean the zero-width space
          target.textContent = cleanText;
        }

        // Update empty state
        if (!cleanText) {
          target.classList.add('field-empty');
        } else {
          target.classList.remove('field-empty');
        }

        // Select all text for easy editing
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(target);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }

      // Cancel any pending update
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }
    };

    const handleInput = (e: Event) => {
      const target = e.target as HTMLElement;
      const fieldPath = target.getAttribute('data-field');
      if (!fieldPath) return;

      const rawValue = target.textContent || '';

      // Update empty state for placeholder
      const isEmpty = rawValue.replace(/\u200B/g, '').trim() === '';
      if (isEmpty) {
        target.classList.add('field-empty');
      } else {
        target.classList.remove('field-empty');
      }

      // Debounce updates - longer delay to avoid re-renders while typing
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }

      updateTimeoutRef.current = setTimeout(() => {
        updateField(fieldPath, rawValue);
        // Don't remove from activeFields yet - wait for blur
      }, 1000); // Increased from 500ms
    };

    const handleBlur = (e: Event) => {
      const target = e.target as HTMLElement;
      const fieldPath = target.getAttribute('data-field');

      // Force immediate save on blur
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
        updateTimeoutRef.current = null;
      }

      if (fieldPath) {
        let newValue = target.textContent || '';

        // Clean zero-width space used for forcing optional fields to display
        newValue = newValue.replace(/\u200B/g, '').trim();

        console.log('Saving field', fieldPath, '=', newValue);

        // Save to store (but this won't trigger re-render)
        updateField(fieldPath, newValue);

        // For currency, number, and percentage fields, re-format the display
        const schema = getDocumentSchema('invoice');
        const schemaPath = fieldPath.replace(/\.\d+\./g, '.*.');
        const fieldDef = schema ? getFieldDefinition(schemaPath, schema) : null;

        if (fieldDef && (fieldDef.type === 'currency' || fieldDef.type === 'number' || fieldDef.type === 'percentage')) {
          // Parse and re-format the value
          const parser = fieldParsers[fieldDef.type];
          const locale = data.locale === 'fr' ? 'fr-FR' : 'en-US';
          const context = {
            currency: data.invoice?.currency || 'USD',
          };

          try {
            if (newValue) {
              const parsedValue = parser.parse(newValue, locale, context);
              // For percentage fields, don't format with % because it's already in the template
              if (fieldDef.type === 'percentage') {
                target.textContent = String(parsedValue);
              } else {
                const formattedValue = parser.format(parsedValue, locale, context);
                target.textContent = formattedValue;
              }
            } else {
              // Keep field visible but empty
              target.textContent = '\u200B';
            }
          } catch (error) {
            console.error('Error formatting field:', error);
            // Keep the raw value if formatting fails
          }
        } else if (!newValue) {
          // For empty text fields, use zero-width space to keep them visible
          target.textContent = '\u200B';
        }

        // Update empty state class
        const isEmpty = newValue === '';
        if (isEmpty) {
          target.classList.add('field-empty');
        } else {
          target.classList.remove('field-empty');
        }

        // Remove from active fields
        activeFieldsRef.current.delete(fieldPath);
      }
    };

    // Handle date field clicks with date picker
    const handleDateClick = (field: HTMLElement) => {
      const fieldPath = field.getAttribute('data-field');
      if (!fieldPath) return;

      activeFieldsRef.current.add(fieldPath);

      // Hide the field text temporarily
      field.style.opacity = '0.3';

      // Create date input
      const input = document.createElement('input');
      input.type = 'date';

      // Get the date value - prefer data-value attribute which stores ISO format
      let dateValue = '';
      const storedValue = field.getAttribute('data-value');

      if (storedValue) {
        // Use the stored ISO value
        try {
          const date = new Date(storedValue);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            dateValue = `${year}-${month}-${day}`;
          }
        } catch (e) {
          console.error('Error parsing stored date:', e);
        }
      }

      // Fallback: try the data store
      if (!dateValue) {
        const pathParts = fieldPath.split('.');
        let currentValue: any = data;
        for (const part of pathParts) {
          currentValue = currentValue?.[part];
        }

        if (currentValue) {
          try {
            // Parse ISO date or any valid date string
            const date = new Date(currentValue);
            if (!isNaN(date.getTime())) {
              // Format as YYYY-MM-DD
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              dateValue = `${year}-${month}-${day}`;
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        }
      }

      input.value = dateValue || new Date().toISOString().split('T')[0];

      // Position it over the field
      const rect = field.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      input.style.position = 'absolute';
      input.style.left = `${rect.left - containerRect.left}px`;
      input.style.top = `${rect.top - containerRect.top}px`;
      input.style.zIndex = '1000';

      // Add to container
      container.style.position = 'relative';
      container.appendChild(input);
      input.focus();

      // Try to open the date picker immediately
      try {
        input.showPicker?.();
      } catch (e) {
        // showPicker might not be available in all browsers
      }

      // Handle change
      const handleDateChange = () => {
        if (input.value) {
          // Save the new date value (in ISO format)
          const selectedDate = new Date(input.value);
          const isoDate = selectedDate.toISOString();
          updateField(fieldPath!, isoDate);

          // Update the field display immediately
          const locale = data.locale === 'fr' ? 'fr-FR' : 'en-US';
          const formattedDate = new Intl.DateTimeFormat(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }).format(selectedDate);
          field.textContent = formattedDate;

          // Store the ISO value in data-value for next time
          field.setAttribute('data-value', isoDate);
        }
        cleanup();
      };

      const handleDateBlur = () => {
        setTimeout(() => {
          cleanup();
        }, 100);
      };

      const cleanup = () => {
        input.remove();
        field.style.opacity = '1';
        activeFieldsRef.current.delete(fieldPath!);
      };

      input.addEventListener('change', handleDateChange);
      input.addEventListener('blur', handleDateBlur);

      // Allow ESC to cancel
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
        }
      };
      input.addEventListener('keydown', handleKeyDown);
    };

    // Helper to check if field is empty
    const isFieldEmpty = (field: HTMLElement): boolean => {
      const text = field.textContent || '';
      const cleanText = text.replace(/\u200B/g, '').trim();
      return cleanText === '';
    };

    // Make each field editable
    editableFields.forEach((field) => {
      const fieldPath = field.getAttribute('data-field');
      const isDateField = fieldPath?.includes('.date');

      // Get field label from schema for placeholder
      if (fieldPath) {
        const schema = getDocumentSchema('invoice');
        const schemaPath = fieldPath.replace(/\.\d+\./g, '.*.');
        const fieldDef = schema ? getFieldDefinition(schemaPath, schema) : null;

        if (fieldDef) {
          field.setAttribute('data-placeholder', `${fieldDef.label}...`);
        } else {
          // Fallback: generate placeholder from field name
          const lastPart = fieldPath.split('.').pop() || '';
          const placeholder = lastPart
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
          field.setAttribute('data-placeholder', `${placeholder}...`);
        }
      }

      // Set initial empty state
      if (isFieldEmpty(field)) {
        field.classList.add('field-empty');
      }

      if (isDateField) {
        // Date fields: show date picker on click
        field.style.cursor = 'pointer';
        field.classList.add('editable-field');

        // Store the ISO value in data-value attribute for reliable parsing
        if (fieldPath) {
          const pathParts = fieldPath.split('.');
          let dateValue: any = data;
          for (const part of pathParts) {
            dateValue = dateValue?.[part];
          }
          if (dateValue) {
            field.setAttribute('data-value', dateValue);
          }
        }

        field.addEventListener('click', () => handleDateClick(field));
      } else {
        // Text fields: contenteditable
        field.setAttribute('contenteditable', 'true');
        field.classList.add('editable-field');
        field.style.cursor = 'text';
        field.style.outline = 'none';
        field.style.minWidth = '20px';
        field.style.display = 'inline-block';

        field.addEventListener('focus', handleFocus as EventListener);
        field.addEventListener('input', handleInput as EventListener);
        field.addEventListener('blur', handleBlur as EventListener);
      }
    });

    // Handle delete item buttons
    const deleteButtons = container.querySelectorAll<HTMLButtonElement>('.delete-item-btn');
    deleteButtons.forEach((btn) => {
      const handleDelete = () => {
        const itemIndex = parseInt(btn.getAttribute('data-item-index') || '0');
        updateData((currentData: InvoiceData) => {
          const newData = JSON.parse(JSON.stringify(currentData));
          if (newData.items && Array.isArray(newData.items)) {
            newData.items.splice(itemIndex, 1);
          }
          return newData;
        });
      };

      const handleMouseEnter = () => {
        btn.style.opacity = '1';
        const row = btn.closest('tr');
        if (row) {
          row.style.backgroundColor = 'rgba(220, 38, 38, 0.05)';
        }
      };

      const handleMouseLeave = () => {
        btn.style.opacity = '0.3';
        const row = btn.closest('tr');
        if (row) {
          row.style.backgroundColor = '';
        }
      };

      btn.addEventListener('click', handleDelete);
      btn.addEventListener('mouseenter', handleMouseEnter);
      btn.addEventListener('mouseleave', handleMouseLeave);
    });

    // Handle add item button
    const addButtons = container.querySelectorAll<HTMLButtonElement>('.add-item-btn');
    addButtons.forEach((btn) => {
      const handleAdd = () => {
        updateData((currentData: InvoiceData) => {
          const newData = JSON.parse(JSON.stringify(currentData));
          if (!newData.items) {
            newData.items = [];
          }
          newData.items.push({
            description: 'Nouvelle prestation',
            qty: 1,
            unit_price: 0,
          });
          return newData;
        });
      };

      const handleMouseEnter = () => {
        btn.style.backgroundColor = '#3b82f6';
        btn.style.color = 'white';
      };

      const handleMouseLeave = () => {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = '#3b82f6';
      };

      btn.addEventListener('click', handleAdd);
      btn.addEventListener('mouseenter', handleMouseEnter);
      btn.addEventListener('mouseleave', handleMouseLeave);
    });

    // Handle delete tax buttons
    const deleteTaxButtons = container.querySelectorAll<HTMLButtonElement>('.delete-tax-btn');
    deleteTaxButtons.forEach((btn) => {
      const handleDelete = () => {
        const taxIndex = parseInt(btn.getAttribute('data-tax-index') || '0');
        updateData((currentData: InvoiceData) => {
          const newData = JSON.parse(JSON.stringify(currentData));
          if (newData.summary?.taxes && Array.isArray(newData.summary.taxes)) {
            newData.summary.taxes.splice(taxIndex, 1);
          }
          return newData;
        });
      };

      const handleMouseEnter = () => {
        btn.style.opacity = '1';
        const row = btn.closest('.summary-row');
        if (row) {
          (row as HTMLElement).style.backgroundColor = 'rgba(220, 38, 38, 0.05)';
        }
      };

      const handleMouseLeave = () => {
        btn.style.opacity = '0.3';
        const row = btn.closest('.summary-row');
        if (row) {
          (row as HTMLElement).style.backgroundColor = '';
        }
      };

      btn.addEventListener('click', handleDelete);
      btn.addEventListener('mouseenter', handleMouseEnter);
      btn.addEventListener('mouseleave', handleMouseLeave);
    });

    // Handle add tax button
    const addTaxButtons = container.querySelectorAll<HTMLButtonElement>('.add-tax-btn');
    addTaxButtons.forEach((btn) => {
      const handleAdd = () => {
        updateData((currentData: InvoiceData) => {
          const newData = JSON.parse(JSON.stringify(currentData));
          if (!newData.summary) {
            newData.summary = { taxes: [] };
          }
          if (!newData.summary.taxes) {
            newData.summary.taxes = [];
          }
          newData.summary.taxes.push({
            label: 'Nouvelle taxe',
            rate: 0,
          });
          return newData;
        });
      };

      const handleMouseEnter = () => {
        btn.style.backgroundColor = '#3b82f6';
        btn.style.color = 'white';
      };

      const handleMouseLeave = () => {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = '#3b82f6';
      };

      btn.addEventListener('click', handleAdd);
      btn.addEventListener('mouseenter', handleMouseEnter);
      btn.addEventListener('mouseleave', handleMouseLeave);
    });

    // Mark non-editable content areas
    const allTextElements = container.querySelectorAll('td, th, div, span, p, strong');
    allTextElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      // If it doesn't have data-field and contains text, mark it as non-editable
      if (!htmlEl.hasAttribute('data-field') &&
          !htmlEl.querySelector('[data-field]') &&
          htmlEl.textContent?.trim() &&
          !htmlEl.classList.contains('delete-item-btn') &&
          !htmlEl.classList.contains('add-item-btn')) {
        htmlEl.classList.add('non-editable-field');
      }
    });

    // Add styles if not already present
    let style = container.querySelector('style.editable-styles') as HTMLStyleElement;
    if (!style) {
      style = document.createElement('style');
      style.classList.add('editable-styles');
      style.textContent = `
        .editable-field {
          cursor: text;
          min-height: 1em;
          min-width: 50px;
          position: relative;
        }
        .editable-field[data-field*=".date"] {
          cursor: pointer;
        }
        .editable-field.field-empty::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
          pointer-events: none;
        }
        .editable-field.field-empty:focus::before {
          opacity: 0.5;
        }
        .editable-field:hover {
          background-color: rgba(59, 130, 246, 0.1) !important;
          outline: 2px solid rgba(59, 130, 246, 0.3) !important;
          border-radius: 2px;
        }
        .editable-field:focus {
          background-color: rgba(59, 130, 246, 0.05) !important;
          outline: 2px solid rgb(59, 130, 246) !important;
          border-radius: 2px;
        }
        .non-editable-field {
          cursor: not-allowed !important;
        }
        .non-editable-field:hover {
          background-color: rgba(156, 163, 175, 0.1) !important;
          opacity: 0.7;
        }
        tr:hover .delete-item-btn {
          opacity: 1 !important;
        }
        .summary-row:hover .delete-tax-btn {
          opacity: 1 !important;
        }
      `;
      container.appendChild(style);
    }

    // Cleanup
    return () => {
      editableFields.forEach((field) => {
        const fieldPath = field.getAttribute('data-field');
        const isDateField = fieldPath?.includes('.date');

        if (!isDateField) {
          field.removeEventListener('focus', handleFocus as EventListener);
          field.removeEventListener('input', handleInput as EventListener);
          field.removeEventListener('blur', handleBlur as EventListener);
        }
      });

      // Clear timers and active fields on unmount
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      activeFieldsRef.current.clear();
    };
  }, [renderedHtml, updateData]); // Remove data to prevent re-attaching listeners on every change

  // Update calculated fields when data changes (without re-rendering the whole component)
  React.useEffect(() => {
    if (!contentRef.current) return;

    const container = contentRef.current;

    // Re-calculate enriched data with totals
    const enriched = enrichInvoiceData(data);

    // Update line totals in table
    enriched.items_with_totals.forEach((item, index) => {
      // Find the row with this index
      const row = container.querySelector<HTMLElement>(`[data-item-index="${index}"]`);
      if (!row) return;

      // Update line total (usually in the last column)
      const lineTotalCells = row.querySelectorAll('td');
      const lastCell = lineTotalCells[lineTotalCells.length - 2]; // -2 because last is action buttons
      if (lastCell) {
        const strongElement = lastCell.querySelector('strong');
        if (strongElement) {
          strongElement.textContent = item.line_total_formatted;
        } else {
          // If no strong element, update the whole cell content if it looks like a total
          if (lastCell.textContent?.match(/[\d\s,\.]+/)) {
            lastCell.innerHTML = `<strong>${item.line_total_formatted}</strong>`;
          }
        }
      }
    });

    // Update summary totals
    const summarySection = container.querySelector('.summary-section');
    if (summarySection) {
      const rows = summarySection.querySelectorAll('.summary-row');
      rows.forEach((row) => {
        const text = row.textContent || '';

        // Subtotal
        if (text.includes('Sous-total') || text.includes('subtotal')) {
          const valueSpan = row.querySelector('span:last-child');
          if (valueSpan) {
            valueSpan.textContent = enriched.formatted.subtotal;
          }
        }

        // Total
        if (row.classList.contains('total') || text.includes('TOTAL')) {
          const valueSpan = row.querySelector('span:last-child');
          if (valueSpan) {
            valueSpan.textContent = enriched.formatted.total;
          }
        }
      });
    }

    // Update tax amounts if present
    if (enriched.totals.taxes && enriched.totals.taxes.length > 0) {
      enriched.totals.taxes.forEach((tax, index) => {
        const taxRow = container.querySelector<HTMLElement>(`[data-tax-index="${index}"]`);
        if (!taxRow) return;

        // Update the tax amount (usually last span in the row)
        const spans = taxRow.querySelectorAll('span');
        if (spans.length > 0) {
          const lastSpan = spans[spans.length - 1];
          if (lastSpan && !lastSpan.hasAttribute('data-field')) {
            lastSpan.textContent = String(tax.amount);
          }
        }
      });
    }
  }, [data]); // Run when data changes

  return (
    <div className="invoice-preview-editable bg-white shadow-sm p-8">
      <style>{theme}</style>
      <div
        ref={contentRef}
        id="invoice-content"
      />
    </div>
  );
}
