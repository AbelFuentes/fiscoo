import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  getInvoice,
  getInvoiceItems,
  type Invoice,
  type InvoiceItem,
  openInvoiceFile,
} from './userInvoices';
import './invoice-detail.css';

const VOUCHER_LABELS: Record<string, string> = {
  I: 'Ingreso',
  E: 'Egreso',
  T: 'Traslado',
  P: 'Pago',
  N: 'Nómina',
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  }).format(value);

function Field({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="invoice-detail-field">
      <span className="invoice-detail-label">{label}</span>

      <span className="invoice-detail-value">{value || '—'}</span>
    </div>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const [invoiceData, itemsData] = await Promise.all([
          getInvoice(user.id, id),
          getInvoiceItems(user.id, id),
        ]);

        if (!mounted) return;

        setInvoice(invoiceData);
        setItems(itemsData);
      } catch (error) {
        console.error('Error loading invoice:', error);

        if (!mounted) return;

        setLoadError('No se pudo cargar la factura.');
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
  }, [user, id]);

  const itemRows = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: String(item.quantity),
        unit_price: formatMoney(
          item.unit_price,
          invoice?.currency ?? 'MXN',
        ),
        amount: formatMoney(item.amount, invoice?.currency ?? 'MXN'),
        tax_amount: formatMoney(
          item.tax_amount,
          invoice?.currency ?? 'MXN',
        ),
      })),
    [items, invoice],
  );

  const renderBreadcrumb = (current: string) => (
    <ui-breadcrumb label="Ruta de navegación">
      <a
        href="/invoices"
        onClick={(event) => {
          event.preventDefault();
          navigate('/invoices');
        }}
      >
        Facturas
      </a>

      <span>{current}</span>
    </ui-breadcrumb>
  );

  if (loading) {
    return (
      <ui-stack gap="lg">
        {renderBreadcrumb('Factura')}

        <ui-skeleton height="4rem" />
        <ui-skeleton height="12rem" />
        <ui-skeleton height="12rem" />
      </ui-stack>
    );
  }

  if (loadError || !invoice) {
    return (
      <ui-stack gap="lg">
        {renderBreadcrumb('Detalle')}

        <ui-alert tone="danger">
          <span slot="title">Ocurrió un problema</span>

          {loadError ?? 'No encontramos esta factura.'}
        </ui-alert>
      </ui-stack>
    );
  }

  const folio = [invoice.series, invoice.folio]
    .filter(Boolean)
    .join('-');

  const handleOpenFile = async (path: string) => {
    try {
      await openInvoiceFile(path);
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  return (
    <ui-stack gap="lg">
      {renderBreadcrumb(folio ? `Factura ${folio}` : 'Factura')}

      <div className="invoice-detail-header">
        <div>
          <h1 className="invoice-detail-title">
            {folio ? `Factura ${folio}` : 'Factura'}
          </h1>

          <div className="invoice-detail-badges">
            <ui-badge
              tone={invoice.direction === 'issued' ? 'success' : 'warning'}
            >
              {invoice.direction === 'issued' ? 'Emitida' : 'Recibida'}
            </ui-badge>

            <ui-badge
              tone={invoice.status === 'active' ? 'success' : 'danger'}
              dot
            >
              {invoice.status === 'active' ? 'Vigente' : 'Cancelada'}
            </ui-badge>
          </div>
        </div>

        <ui-stack direction="row" gap="sm">
          {invoice.xml_path && (
            <ui-button onClick={() => navigate(`/invoices/${invoice.id}/pdf`)}>
              Ver PDF
            </ui-button>
          )}

          {invoice.pdf_path && (
            <ui-button
              variant="outline"
              onClick={() => handleOpenFile(invoice.pdf_path!)}
            >
              PDF original
            </ui-button>
          )}

          {invoice.xml_path && (
            <ui-button
              variant="outline"
              onClick={() => handleOpenFile(invoice.xml_path!)}
            >
              XML
            </ui-button>
          )}
        </ui-stack>
      </div>

      <ui-grid min="18rem">
        <ui-card padding="md" variant="outlined">
          <span slot="header">General</span>

          <div className="invoice-detail-fields">
            <Field label="UUID" value={invoice.cfdi_uuid} />
            <Field label="Fecha de emisión" value={formatDate(invoice.issued_at)} />
            <Field
              label="Tipo de comprobante"
              value={VOUCHER_LABELS[invoice.voucher_type]}
            />
            <Field label="Serie y folio" value={folio} />
            <Field label="Versión CFDI" value={invoice.cfdi_version} />
            <Field label="Moneda" value={invoice.currency} />
          </div>
        </ui-card>

        <ui-card padding="md" variant="outlined">
          <span slot="header">Emisor</span>

          <div className="invoice-detail-fields">
            <Field label="Nombre" value={invoice.issuer_name} />
            <Field label="RFC" value={invoice.issuer_rfc} />
          </div>
        </ui-card>

        <ui-card padding="md" variant="outlined">
          <span slot="header">Receptor</span>

          <div className="invoice-detail-fields">
            <Field label="Nombre" value={invoice.receiver_name} />
            <Field label="RFC" value={invoice.receiver_rfc} />
            <Field label="Uso de CFDI" value={invoice.cfdi_use} />
          </div>
        </ui-card>

        <ui-card padding="md" variant="outlined">
          <span slot="header">Importes</span>

          <div className="invoice-detail-fields">
            <Field
              label="Subtotal"
              value={formatMoney(invoice.subtotal, invoice.currency)}
            />
            <Field
              label="IVA"
              value={formatMoney(invoice.tax_total, invoice.currency)}
            />
            <Field
              label="Total"
              value={formatMoney(invoice.total, invoice.currency)}
            />
          </div>
        </ui-card>

        <ui-card padding="md" variant="outlined">
          <span slot="header">Pago</span>

          <div className="invoice-detail-fields">
            <Field label="Método de pago" value={invoice.payment_method} />
            <Field label="Forma de pago" value={invoice.payment_form} />
          </div>
        </ui-card>

        {invoice.notes && (
          <ui-card padding="md" variant="outlined">
            <span slot="header">Notas</span>

            <div className="invoice-detail-fields">
              <Field label="Comentarios" value={invoice.notes} />
            </div>
          </ui-card>
        )}
      </ui-grid>

      <ui-stack gap="md">
        <h2>Conceptos</h2>

        {itemRows.length === 0 ? (
          <p>
            Esta factura no tiene conceptos registrados. Se llenarán
            al subir el XML.
          </p>
        ) : (
          <ui-table
            columns={[
              { key: 'description', label: 'Descripción' },
              { key: 'quantity', label: 'Cantidad' },
              { key: 'unit_price', label: 'Precio unitario' },
              { key: 'amount', label: 'Importe' },
              { key: 'tax_amount', label: 'IVA' },
            ]}
            rows={itemRows}
          />
        )}
      </ui-stack>
    </ui-stack>
  );
}
