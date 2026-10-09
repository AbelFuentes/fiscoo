import { useState } from 'react';
import type { Client } from '../clients/userClients';
import { INCOME_CATEGORIES } from './income.constants';
import type { IncomeInput } from './userIncome';

interface IncomeFormProps {
  clients?: Client[];
  saving?: boolean;
  onSubmit: (input: IncomeInput) => void | Promise<void>;
  onCancel: () => void;
}

type FormState = {
  description: string;
  category: string;
  amount: string;
  received_at: string;
  client_id: string;
  notes: string;
};

const todayLocal = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${now.getFullYear()}-${month}-${day}`;
};

const valueOf = (event: { currentTarget: EventTarget | null }) =>
  (event.currentTarget as HTMLElement & { value?: string })?.value || '';

export default function IncomeForm({
  clients = [],
  saving = false,
  onSubmit,
  onCancel,
}: IncomeFormProps) {
  const [form, setForm] = useState<FormState>({
    description: '',
    category: 'services',
    amount: '',
    received_at: todayLocal(),
    client_id: '',
    notes: '',
  });

  const [validationError, setValidationError] =
    useState<string | null>(null);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  };

  const handleSubmit = async () => {
    const description = form.description.trim();
    const amount = Number(form.amount.replace(/,/g, '').trim());

    if (!description) {
      setValidationError('La descripción es obligatoria.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setValidationError('El monto debe ser mayor a 0.');
      return;
    }

    if (!form.received_at) {
      setValidationError('La fecha es obligatoria.');
      return;
    }

    await onSubmit({
      description,
      category: form.category,
      amount: Math.round(amount * 100) / 100,
      received_at: form.received_at,
      client_id: form.client_id || null,
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
        <h2>Registrar ingreso</h2>

        <p className="income-drawer-subtitle">
          Captura un ingreso recibido.
        </p>
      </div>

      {validationError && (
        <ui-alert tone="danger">
          <span slot="title">Revisa los datos</span>

          {validationError}
        </ui-alert>
      )}

      <ui-stack gap="md">
        <ui-input
          label="Descripción"
          placeholder="Ej. Honorarios de octubre"
          value={form.description}
          onInput={(event) =>
            updateField('description', valueOf(event))
          }
        />

        <ui-input
          label="Monto"
          inputmode="decimal"
          placeholder="0.00"
          value={form.amount}
          onInput={(event) =>
            updateField('amount', valueOf(event))
          }
        />

        <ui-input
          label="Fecha"
          type="date"
          value={form.received_at}
          onInput={(event) =>
            updateField('received_at', valueOf(event))
          }
        />

        <ui-select
          label="Categoría"
          value={form.category}
          onchange={(event) =>
            updateField('category', valueOf(event) || 'other')
          }
        >
          {INCOME_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </ui-select>

        <ui-select
          label="Cliente (opcional)"
          value={form.client_id}
          onchange={(event) =>
            updateField('client_id', valueOf(event))
          }
        >
          <option value="">Sin cliente</option>

          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.legal_name} · {client.rfc}
            </option>
          ))}
        </ui-select>

        <ui-textarea
          label="Notas"
          placeholder="Información adicional..."
          value={form.notes}
          onInput={(event) =>
            updateField('notes', valueOf(event))
          }
        />
      </ui-stack>

      <div className="income-drawer-actions">
        <ui-button
          variant="outline"
          disabled={saving}
          onClick={onCancel}
        >
          Cancelar
        </ui-button>

        <ui-button disabled={saving} onClick={handleSubmit}>
          {saving ? 'Guardando...' : 'Registrar ingreso'}
        </ui-button>
      </div>
    </ui-stack>
  );
}
