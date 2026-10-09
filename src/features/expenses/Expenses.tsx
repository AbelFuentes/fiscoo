import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import ExpenseForm from './ExpenseForm';
import { categoryLabel } from './expenses.constants';
import {
  createExpense,
  getExpenses,
  type Expense,
  type ExpenseInput,
} from './userExpenses';
import './expenses.css';

const formatDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);

  return new Date(year, month - 1, day).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  }).format(value);

export default function Expenses() {
  const { user } = useAuth();

  const drawerRef = useRef<HTMLElement>(null);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadExpenses = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const data = await getExpenses(user.id);

        if (!mounted) return;

        setExpenses(data);
      } catch (error) {
        console.error('Error loading expenses:', error);

        if (!mounted) return;

        setLoadError('No se pudieron cargar tus gastos.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadExpenses();

    return () => {
      mounted = false;
    };
  }, [user]);

  const filteredExpenses = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return expenses;
    }

    return expenses.filter(
      (expense) =>
        expense.description.toLowerCase().includes(value) ||
        categoryLabel(expense.category).toLowerCase().includes(value),
    );
  }, [expenses, search]);

  const rows = useMemo(
    () =>
      filteredExpenses.map((expense) => ({
        id: expense.id,
        spent_at: formatDate(expense.spent_at),
        description: expense.description,
        category: categoryLabel(expense.category),
        is_deductible: expense.is_deductible ? 'Sí' : 'No',
        amount: formatMoney(expense.amount, expense.currency),
      })),
    [filteredExpenses],
  );

  const openCreateDrawer = () => {
    setSaveError(null);

    const drawer = drawerRef.current as any;

    drawer?.show();
  };

  const closeCreateDrawer = () => {
    if (saving) {
      return;
    }

    const drawer = drawerRef.current as any;

    drawer?.close();
  };

  const handleCreate = async (input: ExpenseInput) => {
    if (!user) {
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const expense = await createExpense(user.id, input);

      setExpenses((current) =>
        [expense, ...current].sort((a, b) =>
          b.spent_at.localeCompare(a.spent_at),
        ),
      );

      setFormKey((current) => current + 1);

      const drawer = drawerRef.current as any;

      drawer?.close();
    } catch (error) {
      console.error('Error creating expense:', error);

      setSaveError('No se pudo registrar el gasto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ui-stack gap="lg">
        <div className="expenses-header">
          <div>
            <h1 className="expenses-title">Gastos</h1>

            <p className="expenses-subtitle">
              Registra y consulta tus gastos personales y fiscales.
            </p>
          </div>

          <ui-button onClick={openCreateDrawer}>
            <svg
              slot="start"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>

            Nuevo gasto
          </ui-button>
        </div>

        {loadError && (
          <ui-alert tone="danger">
            <span slot="title">Ocurrió un problema</span>

            {loadError}
          </ui-alert>
        )}

        {!loadError && (
          <>
            <ui-input
              type="search"
              placeholder="Buscar por descripción o categoría..."
              value={search}
              onInput={(event) => {
                const target =
                  event.currentTarget as HTMLElement & {
                    value?: string;
                  };

                setSearch(target.value || '');
              }}
            />

            {loading ? (
              <div className="expenses-loading">
                <ui-stack gap="sm">
                  <ui-skeleton height="3rem" />
                  <ui-skeleton height="3rem" />
                  <ui-skeleton height="3rem" />
                </ui-stack>
              </div>
            ) : expenses.length === 0 ? (
              <div className="expenses-empty">
                <ui-stack gap="sm" align="center">
                  <h2>Aún no tienes gastos</h2>

                  <p>Registra tu primer gasto para comenzar.</p>

                  <ui-button onClick={openCreateDrawer}>
                    Registrar primer gasto
                  </ui-button>
                </ui-stack>
              </div>
            ) : filteredExpenses.length === 0 ? (
              <div className="expenses-empty">
                <ui-stack gap="sm" align="center">
                  <h2>No encontramos gastos</h2>

                  <p>Prueba con otra búsqueda.</p>
                </ui-stack>
              </div>
            ) : (
              <ui-table
                columns={[
                  { key: 'spent_at', label: 'Fecha' },
                  { key: 'description', label: 'Descripción' },
                  { key: 'category', label: 'Categoría' },
                  { key: 'is_deductible', label: 'Deducible' },
                  { key: 'amount', label: 'Monto' },
                ]}
                rows={rows}
              />
            )}
          </>
        )}
      </ui-stack>

      <ui-drawer ref={drawerRef as any} size="lg">
        {saveError && (
          <ui-alert
            tone="danger"
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1rem',
              right: '1rem',
              zIndex: 10,
            }}
          >
            <span slot="title">No se pudo guardar</span>

            {saveError}
          </ui-alert>
        )}

        <ExpenseForm
          key={formKey}
          saving={saving}
          onSubmit={handleCreate}
          onCancel={closeCreateDrawer}
        />
      </ui-drawer>
    </>
  );
}
