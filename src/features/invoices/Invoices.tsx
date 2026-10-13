import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import InvoiceForm from './InvoiceForm';
import { getClients, type Client } from '../clients/userClients';
import { useNavigate } from 'react-router-dom';
import ImportInvoiceForm from './ImportInvoiceForm';
import type { ParsedCfdi } from './cfdi';
import {
  createInvoice,
  getInvoices,
  type Invoice,
  type InvoiceInput,
  importInvoice,
  type InvoiceDirection,
} from './userInvoices';
import './invoices.css';

type DirectionFilter = 'all' | 'issued' | 'received';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  }).format(value);

const counterpartOf = (invoice: Invoice) =>
  invoice.direction === 'received'
    ? invoice.issuer_name || invoice.issuer_rfc
    : invoice.receiver_name || invoice.receiver_rfc;

export default function Invoices() {
  const { user } = useAuth();

  const drawerRef = useRef<HTMLElement>(null);

  const navigate = useNavigate();
  const tableRef = useRef<HTMLElement>(null);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<DirectionFilter>('all');
  const [formKey, setFormKey] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);

  const importDrawerRef = useRef<HTMLElement>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importKey, setImportKey] = useState(0);

  useEffect(() => {
    if (!user) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadInvoices = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const [data, clientsData] = await Promise.all([
          getInvoices(user.id),
          getClients(user.id),
        ]);

        if (!mounted) return;

        setInvoices(data);
        setClients(clientsData);
      } catch (error) {
        console.error('Error loading invoices:', error);

        if (!mounted) return;

        setLoadError('No se pudieron cargar tus facturas.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadInvoices();

    return () => {
      mounted = false;
    };
  }, [user]);

  const filteredInvoices = useMemo(() => {
    const value = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (direction !== 'all' && invoice.direction !== direction) {
        return false;
      }

      if (!value) {
        return true;
      }

      return [
        invoice.cfdi_uuid,
        invoice.folio,
        invoice.series,
        invoice.issuer_name,
        invoice.issuer_rfc,
        invoice.receiver_name,
        invoice.receiver_rfc,
      ].some((field) => field?.toLowerCase().includes(value));
    });
  }, [invoices, search, direction]);

  const rows = useMemo(
    () =>
      filteredInvoices.map((invoice) => ({
        id: invoice.id,
        issued_at: formatDate(invoice.issued_at),
        direction:
          invoice.direction === 'received' ? 'Recibida' : 'Emitida',
        counterpart: counterpartOf(invoice),
        folio: [invoice.series, invoice.folio].filter(Boolean).join('-') || '—',
        cfdi_uuid: invoice.cfdi_uuid,
        total: formatMoney(invoice.total, invoice.currency),
      })),
    [filteredInvoices],
  );

  useEffect(() => {
    const table = tableRef.current as any;

    if (!table) {
      return;
    }

    table.columns = [
      {
        key: 'actions',
        label: '',
        align: 'right',
        render: (row: { id: string }) => {
          const button = document.createElement('ui-button');

          button.setAttribute('variant', 'ghost');
          button.setAttribute('size', 'sm');
          button.textContent = 'Ver';
          button.addEventListener('click', () =>
            navigate(`/invoices/${row.id}`),
          );

          return button;
        },
      },
      { key: 'issued_at', label: 'Fecha' },
      { key: 'direction', label: 'Tipo' },
      { key: 'counterpart', label: 'Emisor / Receptor' },
      { key: 'folio', label: 'Folio' },
      { key: 'cfdi_uuid', label: 'UUID' },
      { key: 'total', label: 'Total' },
    ];

    table.rows = rows;
  }, [rows, loading, navigate]);

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

    const openImportDrawer = () => {
    setImportError(null);

    const drawer = importDrawerRef.current as any;

    drawer?.show();
  };

  const closeImportDrawer = () => {
    if (importing) {
      return;
    }

    const drawer = importDrawerRef.current as any;

    drawer?.close();
  };

  const handleImport = async (
    cfdi: ParsedCfdi,
    files: { xml: File; pdf?: File | null },
    direction: InvoiceDirection,
  ) => {
    if (!user) {
      return;
    }

    try {
      setImporting(true);
      setImportError(null);

      const invoice = await importInvoice(
        user.id,
        cfdi,
        files,
        direction,
      );

      setInvoices((current) =>
        [invoice, ...current].sort(
          (a, b) =>
            new Date(b.issued_at).getTime() -
            new Date(a.issued_at).getTime(),
        ),
      );

      setImportKey((current) => current + 1);

      const drawer = importDrawerRef.current as any;

      drawer?.close();
    } catch (error) {
      console.error('Error importing invoice:', error);

      const code = (error as { code?: string })?.code;

      setImportError(
        code === '23505'
          ? 'Ya registraste una factura con ese UUID.'
          : 'No se pudo importar la factura.',
      );
    } finally {
      setImporting(false);
    }
  };

  const handleCreate = async (input: InvoiceInput) => {
    if (!user) {
      return;
    }

    try {
      setSaving(true);
      setSaveError(null);

      const invoice = await createInvoice(user.id, input);

      setInvoices((current) =>
        [invoice, ...current].sort(
          (a, b) =>
            new Date(b.issued_at).getTime() -
            new Date(a.issued_at).getTime(),
        ),
      );

      setFormKey((current) => current + 1);

      const drawer = drawerRef.current as any;

      drawer?.close();
    } catch (error) {
      console.error('Error creating invoice:', error);

      const code = (error as { code?: string })?.code;

      setSaveError(
        code === '23505'
          ? 'Ya registraste una factura con ese UUID.'
          : 'No se pudo registrar la factura.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ui-stack gap="lg">
        <div className="invoices-header">
          <div>
            <h1 className="invoices-title">Facturas</h1>

            <p className="invoices-subtitle">
              Consulta y registra tus CFDI emitidos y recibidos.
            </p>
          </div>

          <ui-stack direction="row" gap="sm">
            <ui-button variant="outline" onClick={openImportDrawer}>
              Subir XML
            </ui-button>

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

              Nueva factura
            </ui-button>
          </ui-stack>
        </div>

        {loadError && (
          <ui-alert tone="danger">
            <span slot="title">Ocurrió un problema</span>

            {loadError}
          </ui-alert>
        )}

        {!loadError && (
          <>
            <ui-stack direction="row" gap="sm">
              <ui-input
                type="search"
                placeholder="Buscar por UUID, folio, nombre o RFC..."
                style={{ flex: 1 }}
                value={search}
                onInput={(event) => {
                  const target =
                    event.currentTarget as HTMLElement & {
                      value?: string;
                    };

                  setSearch(target.value || '');
                }}
              />

              <ui-select
                value={direction}
                style={{ width: 'min(10rem,90vw)' }}
                onchange={(event) => {
                  const target =
                    event.currentTarget as HTMLElement & {
                      value?: string;
                    };

                  setDirection(
                    (target.value || 'all') as DirectionFilter,
                  );
                }}
              >
                <option value="all">Todas</option>
                <option value="received">Recibidas</option>
                <option value="issued">Emitidas</option>
              </ui-select>
            </ui-stack>

            {loading ? (
              <div className="invoices-loading">
                <ui-stack gap="sm">
                  <ui-skeleton height="3rem" />
                  <ui-skeleton height="3rem" />
                  <ui-skeleton height="3rem" />
                </ui-stack>
              </div>
            ) : invoices.length === 0 ? (
              <div className="invoices-empty">
                <ui-stack gap="sm" align="center">
                  <h2>Aún no tienes facturas</h2>

                  <p>Registra tu primera factura para comenzar.</p>

                  <ui-button onClick={openCreateDrawer}>
                    Registrar primera factura
                  </ui-button>
                </ui-stack>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="invoices-empty">
                <ui-stack gap="sm" align="center">
                  <h2>No encontramos facturas</h2>

                  <p>Prueba con otra búsqueda o filtro.</p>
                </ui-stack>
              </div>
            ) : (
              <ui-table ref={tableRef as any} />
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

        <InvoiceForm
          key={formKey}
          clients={clients}
          saving={saving}
          onSubmit={handleCreate}
          onCancel={closeCreateDrawer}
        />
      </ui-drawer>

      <ui-drawer ref={importDrawerRef as any} size="lg">
        {importError && (
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
            <span slot="title">No se pudo importar</span>

            {importError}
          </ui-alert>
        )}

        <ImportInvoiceForm
          key={importKey}
          saving={importing}
          onSubmit={handleImport}
          onCancel={closeImportDrawer}
        />
      </ui-drawer>
    </>
  );
}
