import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getClients, type Client } from '../clients/userClients';
import IncomeForm from './IncomeForm';
import { incomeCategoryLabel } from './income.constants';
import {
  createIncome,
  getIncome,
  type IncomeInput,
  type IncomeRecord,
} from './userIncome';
import './income.css';

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

export default function Income() {
  const { user } = useAuth();

  const drawerRef = useRef<HTMLElement>(null);

  const [income, setIncome] = useState<IncomeRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setIncome([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadIncome = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const [data, clientsData] = await Promise.all([
          getIncome(user.id),
          getClients(user.id),
        ]);

        if (!mounted) return;

        setIncome(data);
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading income:', error);

        if (!mounted) return;

        setLoadError('No se pudieron cargar tus ingresos.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadIncome();

    return () => {
      mounted = false;
    };
  }, [user]);

  const clientNames = useMemo(
    () =>
      new Map(clients.map((client) => [client.id, client.legal_name])),
    [clients],
  );

  const filteredIncome = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return income;
    }

    return income.filter(
      (item) =>
        item.description.toLowerCase().includes(value) ||
        incomeCategoryLabel(item.category).toLowerCase().includes(value) ||
        (item.client_id &&
          clientNames.get(item.client_id)?.toLowerCase().includes(value)),
    );
  }, [income, search, clientNames]);

  const rows = useMemo(
    () =>
      filteredIncome.map((item) => ({
        id: item.id,
        received_at: formatDate(item.received_at),
        description: item.description,
        client: item.client_id
          ? clientNames.get(item.client_id) || '—'
          : '—',
        category: incomeCategoryLabel(item.category),
        amount: formatMoney(item.amount, item.currency),
      })),
    [filteredIncome, clientNames],
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

  const handleCreate = async (input: IncomeInput) => {
    if (!user) {
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const record = await createIncome(user.id, input);

      setIncome((current) =>
        [record, ...current].sort((a, b) =>
          b.received_at.localeCompare(a.received_at),
        ),
      );

      setFormKey((current) => current + 1);

      const drawer = drawerRef.current as any;

      drawer?.close();
    } catch (error) {
      console.error('Error creating income:', error);

      setSaveError('No se pudo registrar el ingreso.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ui-stack gap="lg">
        <div className="income-header">
          <div>
            <h1 className="income-title">Ingresos</h1>

            <p className="income-subtitle">
              Registra y consulta tus ingresos.
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

            Nuevo ingreso
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
              placeholder="Buscar por descripción, categoría o cliente..."
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
              <div className="income-loading">
                <ui-stack gap="sm">
                  <ui-skeleton height="3rem" />
                  <ui-skeleton height="3rem" />
                  <ui-skeleton height="3rem" />
                </ui-stack>
              </div>
            ) : income.length === 0 ? (
              <div className="income-empty">
                <ui-stack gap="sm" align="center">
                  <h2>Aún no tienes ingresos</h2>

                  <p>Registra tu primer ingreso para comenzar.</p>

                  <ui-button onClick={openCreateDrawer}>
                    Registrar primer ingreso
                  </ui-button>
                </ui-stack>
              </div>
            ) : filteredIncome.length === 0 ? (
              <div className="income-empty">
                <ui-stack gap="sm" align="center">
                  <h2>No encontramos ingresos</h2>

                  <p>Prueba con otra búsqueda.</p>
                </ui-stack>
              </div>
            ) : (
              <ui-table
                columns={[
                  { key: 'received_at', label: 'Fecha' },
                  { key: 'description', label: 'Descripción' },
                  { key: 'client', label: 'Cliente' },
                  { key: 'category', label: 'Categoría' },
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

        <IncomeForm
          key={formKey}
          clients={clients}
          saving={saving}
          onSubmit={handleCreate}
          onCancel={closeCreateDrawer}
        />
      </ui-drawer>
    </>
  );
}
