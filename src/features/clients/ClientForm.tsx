import { useState } from 'react';
import type {
  ClientInput,
  ClientPersonType,
} from './userClients';

interface ClientFormProps {
  initialValue?: ClientInput;
  saving?: boolean;
  onSubmit: (input: ClientInput) => void | Promise<void>;
  onCancel: () => void;
}

const defaultForm: ClientInput = {
  person_type: 'individual',
  legal_name: '',
  rfc: '',
  tax_regime: '',
  tax_zip_code: '',
  cfdi_use: 'G03',
  email: '',
  phone: '',
  notes: '',
};

export default function ClientForm({
  initialValue,
  saving = false,
  onSubmit,
  onCancel,
}: ClientFormProps) {
  const [form, setForm] = useState<ClientInput>(
    initialValue ?? defaultForm,
  );

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const updateField = <K extends keyof ClientInput>(
    field: K,
    value: ClientInput[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setValidationError(null);
  };

  const handleSubmit = async () => {
    const legalName = form.legal_name.trim();
    const rfc = form.rfc.trim().toUpperCase();
    const taxZipCode = form.tax_zip_code.trim();

    if (!legalName) {
      setValidationError(
        'El nombre o razón social es obligatorio.',
      );
      return;
    }

    if (!rfc) {
      setValidationError(
        'El RFC es obligatorio.',
      );
      return;
    }

    if (!form.tax_regime) {
      setValidationError(
        'El régimen fiscal es obligatorio.',
      );
      return;
    }

    if (!/^\d{5}$/.test(taxZipCode)) {
      setValidationError(
        'El código postal fiscal debe tener 5 dígitos.',
      );
      return;
    }

    if (!form.cfdi_use.trim()) {
      setValidationError(
        'El uso de CFDI es obligatorio.',
      );
      return;
    }

    await onSubmit({
      ...form,
      legal_name: legalName,
      rfc,
      tax_zip_code: taxZipCode,
      tax_regime: form.tax_regime.trim(),
      cfdi_use: form.cfdi_use.trim().toUpperCase(),
      email: form.email?.trim() || null,
      phone: form.phone?.trim() || null,
      notes: form.notes?.trim() || null,
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
        <h2>Crear cliente</h2>

        <p className="clients-drawer-subtitle">
          Captura los datos fiscales necesarios para facturación.
        </p>
      </div>

      {validationError && (
        <ui-alert tone="danger">
          <span slot="title">
            Revisa los datos
          </span>

          {validationError}
        </ui-alert>
      )}

      <ui-stack gap="md">
        <ui-select
          label="Tipo de persona"
          value={form.person_type}
          onchange={(event) => {
            const target =
              event.currentTarget as HTMLElement & {
                value?: string;
              };

            updateField(
              'person_type',
              (target.value || 'individual') as ClientPersonType,
            );
          }}
        >
          <option value="individual">
            Persona física
          </option>

          <option value="business">
            Persona moral
          </option>
        </ui-select>

        <ui-input
          label="Nombre o razón social"
          placeholder="Ej. Juan Pérez López"
          value={form.legal_name}
          onInput={(event) => {
            const target =
              event.currentTarget as HTMLElement & {
                value?: string;
              };

            updateField(
              'legal_name',
              target.value || '',
            );
          }}
        />

        <ui-input
          label="RFC"
          placeholder="Ej. XAXX010101000"
          maxlength={13}
          value={form.rfc}
          onInput={(event) => {
            const target =
              event.currentTarget as HTMLElement & {
                value?: string;
              };

            updateField(
              'rfc',
              (target.value || '').toUpperCase(),
            );
          }}
        />

        <ui-input
          label="Código postal fiscal"
          placeholder="Ej. 22000"
          inputmode="numeric"
          maxlength={5}
          value={form.tax_zip_code}
          onInput={(event) => {
            const target =
              event.currentTarget as HTMLElement & {
                value?: string;
              };

            updateField(
              'tax_zip_code',
              (target.value || '').replace(/\D/g, ''),
            );
          }}
        />

        <ui-input
          label="Régimen fiscal"
          placeholder="Ej. 612"
          value={form.tax_regime}
          onInput={(event) => {
            const target =
              event.currentTarget as HTMLElement & {
                value?: string;
              };

            updateField(
              'tax_regime',
              target.value || '',
            );
          }}
        />

        <ui-input
          label="Uso de CFDI"
          placeholder="Ej. G03"
          value={form.cfdi_use}
          onInput={(event) => {
            const target =
              event.currentTarget as HTMLElement & {
                value?: string;
              };

            updateField(
              'cfdi_use',
              target.value || '',
            );
          }}
        />

        <ui-input
          label="Correo electrónico"
          type="email"
          placeholder="cliente@ejemplo.com"
          value={form.email || ''}
          onInput={(event) => {
            const target =
              event.currentTarget as HTMLElement & {
                value?: string;
              };

            updateField(
              'email',
              target.value || '',
            );
          }}
        />

        <ui-input
          label="Teléfono"
          type="tel"
          placeholder="Opcional"
          value={form.phone || ''}
          onInput={(event) => {
            const target =
              event.currentTarget as HTMLElement & {
                value?: string;
              };

            updateField(
              'phone',
              target.value || '',
            );
          }}
        />

        <ui-textarea
          label="Notas"
          placeholder="Información adicional..."
          value={form.notes || ''}
          onInput={(event) => {
            const target =
              event.currentTarget as HTMLElement & {
                value?: string;
              };

            updateField(
              'notes',
              target.value || '',
            );
          }}
        />
      </ui-stack>

      <div className="clients-drawer-actions">
        <ui-button
          variant="outline"
          disabled={saving}
          onClick={onCancel}
        >
          Cancelar
        </ui-button>

        <ui-button
          disabled={saving}
          onClick={handleSubmit}
        >
          {saving
            ? 'Guardando...'
            : 'Crear cliente'}
        </ui-button>
      </div>
    </ui-stack>
  );
}
