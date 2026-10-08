import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@abelfuentes/ui-controls/toast';
import { useAuth } from '../../auth/AuthContext';
import {
  orders,
  stats,
  tones,
  TABLE_PAGE_SIZE,
} from './dashboard.constants';
import './dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const tableRef =
    useRef<HTMLElement>(null);

  const paginationRef =
    useRef<HTMLElement>(null);

  const infoRef =
    useRef<HTMLSpanElement>(null);

  const dropdownRef =
    useRef<HTMLElement>(null);

  useEffect(() => {
    const table =
      tableRef.current as any;

    const pagination =
      paginationRef.current as any;

    const dropdown =
      dropdownRef.current;

    if (!table || !pagination) {
      return;
    }

    const columns = [
      {
        key: 'id',
        label: 'Pedido',
        sortable: true,
      },
      {
        key: 'customer',
        label: 'Cliente',
        sortable: true,
        render: (
          row: (typeof orders)[number],
        ) => {
          const element =
            document.createElement(
              'div',
            );

          element.style.cssText =
            'display:flex;align-items:center;gap:.7em';

          element.innerHTML =
            '<ui-avatar size="sm"></ui-avatar><span></span>';

          const avatar =
            element.firstElementChild as HTMLElement;

          const name =
            element.lastElementChild as HTMLElement;

          avatar.setAttribute(
            'name',
            row.customer,
          );

          name.textContent =
            row.customer;

          return element;
        },
      },
      {
        key: 'status',
        label: 'Estado',
        render: (
          row: (typeof orders)[number],
        ) => {
          const badge =
            document.createElement(
              'ui-badge',
            );

          badge.setAttribute(
            'tone',
            tones[row.status],
          );

          badge.setAttribute(
            'dot',
            '',
          );

          badge.textContent =
            row.status;

          return badge;
        },
      },
      {
        key: 'total',
        label: 'Total',
        sortable: true,
        align: 'right',
        render: (
          row: (typeof orders)[number],
        ) =>
          `$${row.total}`,
      },
    ];

    table.columns = columns;

    const show = (
      page: number,
    ) => {
      table.rows = orders.slice(
        (page - 1) *
          TABLE_PAGE_SIZE,
        page *
          TABLE_PAGE_SIZE,
      );

      if (infoRef.current) {
        infoRef.current.textContent =
          `${(page - 1) * TABLE_PAGE_SIZE + 1}–${Math.min(
            page * TABLE_PAGE_SIZE,
            orders.length,
          )} de ${orders.length}`;
      }
    };

    const handlePageChange = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<{
          page: number;
        }>;

      show(
        customEvent.detail.page,
      );
    };

    const handleMenuSelect = async (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<{
          value: string;
        }>;

      const value =
        customEvent.detail.value;

      if (value === 'logout') {
        try {
          await signOut();
        } catch {
          toast.danger(
            'No se pudo cerrar la sesión',
            {
              title: 'Error',
            },
          );
        }

        return;
      }

      if (value === 'profile') {
        navigate('/settings');
        return;
      }

      toast.info(
        `Acción: ${value}`,
      );
    };

    pagination.addEventListener(
      'change',
      handlePageChange,
    );

    dropdown?.addEventListener(
      'select',
      handleMenuSelect,
    );

    show(1);

    return () => {
      pagination.removeEventListener(
        'change',
        handlePageChange,
      );

      dropdown?.removeEventListener(
        'select',
        handleMenuSelect,
      );
    };
  }, [
    navigate,
    signOut,
  ]);

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email ||
    'Usuario';

  return (
    <ui-app-shell>
      <strong
        slot="header"
        className="dashboard-header-brand"
      >
        Fiscoo
      </strong>

      <ui-input
        slot="header"
        size="sm"
        type="search"
        placeholder="Buscar..."
        className="dashboard-header-search"
      />

      <span
        slot="header"
        style={{ flex: 1 }}
      />

      <ui-theme-switch
        slot="header"
        size="sm"
      />

      <ui-dropdown
        ref={
          dropdownRef as any
        }
        slot="header"
        placement="bottom-end"
      >
        <ui-avatar
          slot="trigger"
          name={displayName}
          size="sm"
          status="online"
        />

        <option value="profile">
          Mi perfil
        </option>

        <option value="billing">
          Facturación
        </option>

        <option data-separator />

        <option
          value="logout"
          data-danger
        >
          Cerrar sesión
        </option>
      </ui-dropdown>

      <ui-stack
        slot="sidebar"
        className="dashboard-sidebar"
      >
        <ui-button
          variant="soft"
          block
        >
          Resumen
        </ui-button>

        <ui-button
          variant="ghost"
          block
        >
          Facturas
        </ui-button>

        <ui-button
          variant="ghost"
          block
        >
          Clientes
        </ui-button>

        <ui-button
          variant="ghost"
          block
        >
          Gastos
        </ui-button>

        <ui-button
          variant="ghost"
          block
        >
          Reportes
        </ui-button>

        <ui-button
          variant="ghost"
          block
        >
          Ajustes
        </ui-button>
      </ui-stack>

      <ui-stack gap="lg">
        <div className="dashboard-content-header">
          <div>
            <h1 className="dashboard-title">
              Resumen
            </h1>

            <p className="dashboard-subtitle">
              Últimos 30 días
            </p>
          </div>

          <ui-button
            onClick={() =>
              toast.success(
                'Pedido creado',
                {
                  title: 'Listo',
                },
              )
            }
          >
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

            Nuevo pedido
          </ui-button>
        </div>

        <ui-grid min="13rem">
          {stats.map((stat) => (
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

                <ui-badge
                  tone={
                    stat.tone as any
                  }
                  size="sm"
                >
                  {stat.delta}
                </ui-badge>
              </div>

              <ui-progress
                value={
                  stat.progress
                }
                size="sm"
                className="dashboard-stat-progress"
              />
            </ui-card>
          ))}
        </ui-grid>

        <ui-tabs
          value="orders"
          variant="pill"
          label="Secciones"
        >
          <section
            data-tab="orders"
            data-label="Pedidos"
          >
            <ui-table
              ref={
                tableRef as any
              }
            />

            <div className="dashboard-table-footer">
              <span
                ref={infoRef}
                className="dashboard-table-info"
              />

              <ui-pagination
                ref={
                  paginationRef as any
                }
                page={1}
                pages={Math.ceil(
                  orders.length /
                    TABLE_PAGE_SIZE,
                )}
                size="sm"
              />
            </div>
          </section>

          <section
            data-tab="goals"
            data-label="Metas"
          >
            <ui-stack
              gap="lg"
              className="dashboard-goals"
            >
              <ui-progress
                value={72}
                label="Ventas del mes"
                show-value
              />

              <ui-progress
                value={45}
                label="Nuevos clientes"
                show-value
              />

              <ui-progress
                value={90}
                label="Satisfacción"
                show-value
              />
            </ui-stack>
          </section>
        </ui-tabs>
      </ui-stack>

      <span
        slot="footer"
        className="dashboard-footer"
      >
        © Fiscoo
      </span>
    </ui-app-shell>
  );
}
