import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import type { Invoice } from '../invoices/userInvoices';
import {
  getDashboardSummary,
  getRecentInvoices,
  type DashboardSummary,
} from './dashboardSummary';
import './dashboard.css';

type Stat = {
  label: string;
  value: string;
  delta: string | null;
  tone: 'success' | 'danger' | 'accent';
  progress: number | null;
};

const formatMoney = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(value);

const formatInvoiceMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  }).format(value);

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const percentChange = (current: number, previous: number) => {
  if (previous === 0) {
    return null;
  }

  const pct = Math.round(((current - previous) / previous) * 100);

  return `${pct > 0 ? '+' : ''}${pct}%`;
};

const ratio = (value: number, max: number) =>
  max > 0
    ? Math.round(Math.min(Math.max(value / max, 0), 1) * 100)
    : 0;

const counterpartOf = (invoice: Invoice) =>
  invoice.direction === 'received'
    ? invoice.issuer_name || invoice.issuer_rfc
    : invoice.receiver_name || invoice.receiver_rfc;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const tableRef = useRef<HTMLElement>(null);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recent, setRecent] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const [summaryData, recentData] = await Promise.all([
          getDashboardSummary(),
          getRecentInvoices(user.id),
        ]);

        if (!mounted) return;

        setSummary(summaryData);
        setRecent(recentData);
      } catch (error) {
        console.error('Error loading dashboard:', error);

        if (!mounted) return;

        setLoadError('No se pudo cargar el resumen.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [user]);

  const stats = useMemo<Stat[]>(() => {
    if (!summary) {
      return [];
    }

    const incomeDelta = percentChange(
      summary.income_30d,
      summary.income_prev_30d,
    );
    const expensesDelta = percentChange(
      summary.expenses_30d,
      summary.expenses_prev_30d,
    );
    const invoicesDelta = percentChange(
      summary.invoices_30d,
      summary.invoices_prev_30d,
    );

    const maxFlow = Math.max(summary.income_30d, summary.expenses_30d);
    const balance = summary.income_30d - summary.expenses_30d;

    return [
      {
        label: 'Ingresos',
        value: formatMoney(summary.income_30d),
        delta: incomeDelta,
        tone: incomeDelta?.startsWith('-') ? 'danger' : 'success',
        progress: ratio(summary.income_30d, maxFlow),
      },
      {
        label: 'Gastos',
        value: formatMoney(summary.expenses_30d),
        delta: expensesDelta,
        tone: expensesDelta?.startsWith('-') ? 'success' : 'danger',
        progress: ratio(summary.expenses_30d, maxFlow),
      },
      {
        label: 'Balance',
        value: formatMoney(balance),
        delta: null,
        tone: balance < 0 ? 'danger' : 'accent',
        progress: ratio(balance, summary.income_30d),
      },
      {
        label: 'Facturas',
        value: String(summary.invoices_30d),
        delta: invoicesDelta,
        tone: 'accent',
        progress: ratio(
          summary.invoices_30d,
          Math.max(summary.invoices_30d, summary.invoices_prev_30d),
        ),
      },
      {
        label: 'Clientes',
        value: String(summary.clients_count),
        delta: null,
        tone: 'accent',
        progress: null,
      },
    ];
  }, [summary]);

  useEffect(() => {
    const table = tableRef.current as any;

    if (!table) {
      return;
    }

    table.columns = [
      {
        key: 'issued_at',
        label: 'Fecha',
        sortable: true,
        render: (row: Invoice) => formatDate(row.issued_at),
      },
      {
        key: 'counterpart',
        label: 'Emisor / Receptor',
        render: (row: Invoice) => {
          const element = document.createElement('div');

          element.style.cssText =
            'display:flex;align-items:center;gap:.7em';

          element.innerHTML =
            '<ui-avatar size="sm"></ui-avatar><span></span>';

          const avatar = element.firstElementChild as HTMLElement;
          const name = element.lastElementChild as HTMLElement;
          const label = counterpartOf(row);

          avatar.setAttribute('name', label);
          name.textContent = label;

          return element;
        },
      },
      {
        key: 'direction',
        label: 'Tipo',
        render: (row: Invoice) => {
          const badge = document.createElement('ui-badge');

          badge.setAttribute(
            'tone',
            row.direction === 'issued' ? 'success' : 'warning',
          );

          badge.textContent =
            row.direction === 'issued' ? 'Emitida' : 'Recibida';

          return badge;
        },
      },
      {
        key: 'status',
        label: 'Estado',
        render: (row: Invoice) => {
          const badge = document.createElement('ui-badge');

          badge.setAttribute(
            'tone',
            row.status === 'active' ? 'success' : 'danger',
          );

          badge.setAttribute('dot', '');

          badge.textContent =
            row.status === 'active' ? 'Vigente' : 'Cancelada';

          return badge;
        },
      },
      {
        key: 'total',
        label: 'Total',
        sortable: true,
        align: 'right',
        render: (row: Invoice) =>
          formatInvoiceMoney(row.total, row.currency),
      },
    ];

    table.rows = recent;
  }, [recent, loading]);

  return (
    <ui-stack gap="lg">
      <div className="dashboard-content-header">
        <div>
          <h1 className="dashboard-title">Resumen</h1>

          <p className="dashboard-subtitle">Últimos 30 días</p>
        </div>
      </div>

      {loadError && (
        <ui-alert tone="danger">
          <span slot="title">Ocurrió un problema</span>

          {loadError}
        </ui-alert>
      )}

      {!loadError && (
        <>
          <ui-grid min="13rem">
            {loading
              ? [0, 1, 2, 3, 4].map((index) => (
                  <ui-skeleton key={index} height="6rem" />
                ))
              : stats.map((stat) => (
                  <ui-card
                    key={stat.label}
                    padding="sm"
                    variant="outlined"
                  >
                    <span
                      slot="header"
                      className="dashboard-stat-label"
                    >
                      {stat.label}
                    </span>

                    <div className="dashboard-stat-content">
                      <span className="dashboard-stat-value">
                        {stat.value}
                      </span>

                      {stat.delta && (
                        <ui-badge tone={stat.tone as any} size="sm">
                          {stat.delta}
                        </ui-badge>
                      )}
                    </div>

                    {stat.progress !== null && (
                      <ui-progress
                        value={stat.progress}
                        size="sm"
                        className="dashboard-stat-progress"
                      />
                    )}
                  </ui-card>
                ))}
          </ui-grid>

          <ui-stack gap="md">
            <div className="dashboard-content-header">
              <h2>Facturas recientes</h2>

              <ui-button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/invoices')}
              >
                Ver todas
              </ui-button>
            </div>

            {loading ? (
              <ui-stack gap="sm">
                <ui-skeleton height="3rem" />
                <ui-skeleton height="3rem" />
                <ui-skeleton height="3rem" />
              </ui-stack>
            ) : recent.length === 0 ? (
              <p className="dashboard-subtitle">
                Aún no tienes facturas registradas.
              </p>
            ) : (
              <ui-table ref={tableRef as any} />
            )}
          </ui-stack>
        </>
      )}
    </ui-stack>
  );
}
