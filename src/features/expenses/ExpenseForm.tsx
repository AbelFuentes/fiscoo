import { useState } from 'react';
import { EXPENSE_CATEGORIES } from './expenses.constants';
import type { ExpenseInput } from './userExpenses';

interface ExpenseFormProps {
  saving?: boolean;
  onSubmit: (input: ExpenseInput) => void | Promise<void>;
  onCancel: () => void;
}

type FormState = {
  description: string;
  category: string;
  amount: string;
  spent_at: string;
  is_deductible: boolean;
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

export default function ExpenseForm({
  saving = false,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [form, setForm] = useState<FormState>({
    description: '',
    category: 'other',
    amount: '',
    spent_at: todayLocal(),
    is_deductible: false,
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

    if (!form.spent_at) {
      setValidationError('La fecha es obligatoria.');
      return;
    }

    await onSubmit({
      description,
      category: form.category,
      amount: Math.round(amount * 100) / 100,
      spent_at: form.spent_at,
      is_deductible: form.is_deductible,
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
        <h2>Registrar gasto</h2>

        <p className="expenses-drawer-subtitle">
          Captura un gasto personal o fiscal.
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
          placeholder="Ej. Despensa del mes"
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
          value={form.spent_at}
          onInput={(event) =>
            updateField('spent_at', valueOf(event))
          }
        />

        <ui-select
          label="Categoría"
          value={form.category}
          onchange={(event) =>
            updateField('category', valueOf(event) || 'other')
          }
        >
          {EXPENSE_CATEGORIES.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </ui-select>

        <ui-checkbox
          checked={form.is_deductible}
          onchange={(event) =>
            updateField(
              'is_deductible',
              Boolean(
                (event.currentTarget as HTMLElement & {
                  checked?: boolean;
                }).checked,
              ),
            )
          }
        >
          Es deducible
        </ui-checkbox>

        <ui-textarea
          label="Notas"
          placeholder="Información adicional..."
          value={form.notes}
          onInput={(event) =>
            updateField('notes', valueOf(event))
          }
        />
      </ui-stack>

      <div className="expenses-drawer-actions">
        <ui-button
          variant="outline"
          disabled={saving}
          onClick={onCancel}
        >
          Cancelar
        </ui-button>

        <ui-button disabled={saving} onClick={handleSubmit}>
          {saving ? 'Guardando...' : 'Registrar gasto'}
        </ui-button>
      </div>
    </ui-stack>
  );
}
