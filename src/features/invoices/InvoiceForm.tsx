import { useState } from 'react';
import type {
  InvoiceDirection,
  InvoiceInput,
  VoucherType,
} from './userInvoices';
import type { Client } from '../clients/userClients';

interface InvoiceFormProps {
  clients?: Client[];
  saving?: boolean;
  onSubmit: (input: InvoiceInput) => void | Promise<void>;
  onCancel: () => void;
}

type FormState = {
  direction: InvoiceDirection;
  voucher_type: VoucherType;
  cfdi_uuid: string;
  series: string;
  folio: string;
  issued_at: string;
  issuer_rfc: string;
  issuer_name: string;
  receiver_rfc: string;
  receiver_name: string;
  currency: string;
  subtotal: string;
  tax_total: string;
  payment_method: string;
  payment_form: string;
  cfdi_use: string;
  notes: string;
};

const defaultForm: FormState = {
  direction: 'received',
  voucher_type: 'I',
  cfdi_uuid: '',
  series: '',
  folio: '',
  issued_at: '',
  issuer_rfc: '',
  issuer_name: '',
  receiver_rfc: '',
  receiver_name: '',
  currency: 'MXN',
  subtotal: '',
  tax_total: '',
  payment_method: 'PUE',
  payment_form: '',
  cfdi_use: 'G03',
  notes: '',
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const valueOf = (event: { currentTarget: EventTarget | null }) =>
  (event.currentTarget as HTMLElement & { value?: string })?.value || '';

const toNumber = (value: string) =>
  Number(value.replace(/,/g, '').trim());

const round2 = (value: number) => Math.round(value * 100) / 100;

export default function InvoiceForm({
  clients = [],
  saving = false,
  onSubmit,
  onCancel,
}: InvoiceFormProps) {
  const [form, setForm] = useState<FormState>(defaultForm);
  const [validationError, setValidationError] =
    useState<string | null>(null);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);

    if (!client) return;

    setForm((current) => ({
      ...current,
      receiver_rfc: client.rfc,
      receiver_name: client.legal_name,
      cfdi_use: client.cfdi_use || current.cfdi_use,
    }));

    setValidationError(null);
  };

  const subtotal = toNumber(form.subtotal || '0');
  const taxTotal = toNumber(form.tax_total || '0');
  const total = round2(
    (Number.isFinite(subtotal) ? subtotal : 0) +
      (Number.isFinite(taxTotal) ? taxTotal : 0),
  );

  const handleSubmit = async () => {
    if (!UUID_REGEX.test(form.cfdi_uuid.trim())) {
      setValidationError('El UUID del CFDI no es válido.');
      return;
    }

    if (!form.issued_at) {
      setValidationError('La fecha de emisión es obligatoria.');
      return;
    }

    if (!form.issuer_rfc.trim() || !form.receiver_rfc.trim()) {
      setValidationError('El RFC del emisor y del receptor son obligatorios.');
      return;
    }

    if (
      !Number.isFinite(subtotal) ||
      !Number.isFinite(taxTotal) ||
      subtotal < 0 ||
      taxTotal < 0
    ) {
      setValidationError('Subtotal e IVA deben ser números válidos.');
      return;
    }

    await onSubmit({
      direction: form.direction,
      voucher_type: form.voucher_type,
      cfdi_uuid: form.cfdi_uuid,
      series: form.series,
      folio: form.folio,
      issued_at: new Date(`${form.issued_at}T12:00:00`).toISOString(),
      issuer_rfc: form.issuer_rfc,
      issuer_name: form.issuer_name,
      receiver_rfc: form.receiver_rfc,
      receiver_name: form.receiver_name,
      currency: form.currency,
      subtotal: round2(subtotal),
      tax_total: round2(taxTotal),
      total,
      payment_method: form.payment_method,
      payment_form: form.payment_form,
      cfdi_use: form.cfdi_use,
      notes: form.notes,
    });
  };

  return (
    <ui-stack
      gap="lg"
      style={{
        padding: '1.5rem',
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div>
        <h2>Registrar factura</h2>

        <p className="invoices-drawer-subtitle">
          Captura los datos del CFDI. Más adelante podrás subir el XML.
        </p>
      </div>

      {validationError && (
        <ui-alert tone="danger">
          <span slot="title">Revisa los datos</span>

          {validationError}
        </ui-alert>
      )}

      <ui-stack gap="md">
        <ui-select
          label="Tipo"
          value={form.direction}
          onchange={(event) =>
            updateField(
              'direction',
              (valueOf(event) || 'received') as InvoiceDirection,
            )
          }
        >
          <option value="received">Recibida (gasto)</option>
          <option value="issued">Emitida (ingreso)</option>
        </ui-select>

        <ui-select
          label="Tipo de comprobante"
          value={form.voucher_type}
          onchange={(event) =>
            updateField(
              'voucher_type',
              (valueOf(event) || 'I') as VoucherType,
            )
          }
        >
          <option value="I">Ingreso</option>
          <option value="E">Egreso</option>
          <option value="T">Traslado</option>
          <option value="P">Pago</option>
          <option value="N">Nómina</option>
        </ui-select>

        {form.direction === 'issued' && (
          <ui-select
            label="Cliente"
            value=""
            onchange={(event) =>
              handleClientChange(valueOf(event))
            }
          >
            <option value="">
              {clients.length === 0
                ? 'Aún no tienes clientes'
                : 'Selecciona un cliente...'}
            </option>

            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.legal_name} · {client.rfc}
              </option>
            ))}
          </ui-select>
        )}

        <ui-input
          label="UUID (folio fiscal)"
          placeholder="00000000-0000-0000-0000-000000000000"
          value={form.cfdi_uuid}
          onInput={(event) =>
            updateField('cfdi_uuid', valueOf(event))
          }
        />

        <ui-input
          label="Fecha de emisión"
          type="date"
          value={form.issued_at}
          onInput={(event) =>
            updateField('issued_at', valueOf(event))
          }
        />

        <ui-input
          label="Serie"
          placeholder="Opcional"
          value={form.series}
          onInput={(event) =>
            updateField('series', valueOf(event))
          }
        />

        <ui-input
          label="Folio"
          placeholder="Opcional"
          value={form.folio}
          onInput={(event) =>
            updateField('folio', valueOf(event))
          }
        />

        <ui-input
          label="RFC emisor"
          maxlength={13}
          value={form.issuer_rfc}
          onInput={(event) =>
            updateField('issuer_rfc', valueOf(event).toUpperCase())
          }
        />

        <ui-input
          label="Nombre del emisor"
          value={form.issuer_name}
          onInput={(event) =>
            updateField('issuer_name', valueOf(event))
          }
        />

        <ui-input
          label="RFC receptor"
          maxlength={13}
          value={form.receiver_rfc}
          onInput={(event) =>
            updateField('receiver_rfc', valueOf(event).toUpperCase())
          }
        />

        <ui-input
          label="Nombre del receptor"
          value={form.receiver_name}
          onInput={(event) =>
            updateField('receiver_name', valueOf(event))
          }
        />

        <ui-input
          label="Moneda"
          maxlength={3}
          value={form.currency}
          onInput={(event) =>
            updateField('currency', valueOf(event).toUpperCase())
          }
        />

        <ui-input
          label="Subtotal"
          inputmode="decimal"
          placeholder="0.00"
          value={form.subtotal}
          onInput={(event) =>
            updateField('subtotal', valueOf(event))
          }
        />

        <ui-input
          label="IVA"
          inputmode="decimal"
          placeholder="0.00"
          value={form.tax_total}
          onInput={(event) =>
            updateField('tax_total', valueOf(event))
          }
        />

        <ui-input
          label="Total (subtotal + IVA)"
          readonly
          value={total.toFixed(2)}
        />

        <ui-select
          label="Método de pago"
          value={form.payment_method}
          onchange={(event) =>
            updateField('payment_method', valueOf(event) || 'PUE')
          }
        >
          <option value="PUE">PUE - Pago en una exhibición</option>
          <option value="PPD">PPD - Pago en parcialidades o diferido</option>
        </ui-select>

        <ui-input
          label="Forma de pago"
          placeholder="Ej. 03"
          value={form.payment_form}
          onInput={(event) =>
            updateField('payment_form', valueOf(event))
          }
        />

        <ui-input
          label="Uso de CFDI"
          placeholder="Ej. G03"
          value={form.cfdi_use}
          onInput={(event) =>
            updateField('cfdi_use', valueOf(event))
          }
        />

        <ui-textarea
          label="Notas"
          placeholder="Información adicional..."
          value={form.notes}
          onInput={(event) =>
            updateField('notes', valueOf(event))
          }
        />
      </ui-stack>

      <div className="invoices-drawer-actions">
        <ui-button
          variant="outline"
          disabled={saving}
          onClick={onCancel}
        >
          Cancelar
        </ui-button>

        <ui-button disabled={saving} onClick={handleSubmit}>
          {saving ? 'Guardando...' : 'Registrar factura'}
        </ui-button>
      </div>
    </ui-stack>
  );
}
