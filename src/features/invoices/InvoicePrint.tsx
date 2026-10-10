import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { useAuth } from '../../auth/AuthContext';
import {
  buildOriginalChain,
  buildVerificationUrl,
  parseCfdi,
  type ParsedCfdi,
} from './cfdi';
import {
  CFDI_USES,
  PAYMENT_FORMS,
  PAYMENT_METHODS,
  REGIMES,
  TAXES,
  VOUCHER_TYPES,
  withLabel,
} from './cfdi.catalogs';
import { downloadInvoiceText, getInvoice } from './userInvoices';
import './invoice-print.css';

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  }).format(value);

const dateTime = (value: string) =>
  new Date(value).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const taxLabel = (tax: {
  tax: string;
  factor: string;
  rate: number | null;
}) => {
  const name = TAXES[tax.tax] ?? tax.tax;

  if (tax.factor === 'Exento') return `${name} Exento`;

  return tax.rate === null
    ? name
    : `${name} ${(tax.rate * 100).toFixed(2)}%`;
};

export default function InvoicePrint() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cfdi, setCfdi] = useState<ParsedCfdi | null>(null);
  const [qr, setQr] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const invoice = await getInvoice(user.id, id);

        if (!invoice) {
          throw new Error('No encontramos esta factura.');
        }

        if (!invoice.xml_path) {
          throw new Error(
            'Esta factura no tiene XML. Súbela con "Subir XML" para generar el PDF.',
          );
        }

        const parsed = parseCfdi(
          await downloadInvoiceText(invoice.xml_path),
        );

        const qrImage = await QRCode.toDataURL(
          buildVerificationUrl(parsed),
          { margin: 0, width: 240 },
        );

        if (!mounted) return;

        setCfdi(parsed);
        setQr(qrImage);
      } catch (loadError) {
        console.error('Error loading invoice PDF:', loadError);

        if (!mounted) return;

        setError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo generar el PDF.',
        );
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

  const folio = cfdi
    ? [cfdi.series, cfdi.folio].filter(Boolean).join('-')
    : '';

  const toolbar = (
    <div className="ip-toolbar">
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

        <a
          href={`/invoices/${id}`}
          onClick={(event) => {
            event.preventDefault();
            navigate(`/invoices/${id}`);
          }}
        >
          {folio ? `Factura ${folio}` : 'Factura'}
        </a>

        <span>PDF</span>
      </ui-breadcrumb>

      {cfdi && (
        <ui-button onClick={() => window.print()}>
          Imprimir / Guardar PDF
        </ui-button>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="ip-page">
        {toolbar}

        <ui-skeleton height="30rem" />
      </div>
    );
  }

  if (error || !cfdi) {
    return (
      <div className="ip-page">
        {toolbar}

        <ui-alert tone="danger">
          <span slot="title">No se pudo generar el PDF</span>

          {error ?? 'Intenta de nuevo.'}
        </ui-alert>
      </div>
    );
  }

  const { issuer, receiver, stamp } = cfdi;

  return (
    <div className="ip-page">
      {toolbar}

      <article className="ip-paper">
        <header className="ip-header">
          <div>
            <h1 className="ip-issuer">{issuer.name || issuer.rfc}</h1>

            <p className="ip-muted">RFC {issuer.rfc}</p>

            <p className="ip-muted">
              {withLabel(REGIMES, issuer.regime)}
            </p>
          </div>

          <div className="ip-title">
            <span className="ip-pill">
              {VOUCHER_TYPES[cfdi.voucher_type] ?? cfdi.voucher_type}
            </span>

            <h2>Factura</h2>

            {folio && <p className="ip-folio">{folio}</p>}
          </div>
        </header>

        <section className="ip-meta">
          <div>
            <span className="ip-label">Folio fiscal (UUID)</span>
            <span className="ip-value ip-mono">{stamp.uuid}</span>
          </div>

          <div>
            <span className="ip-label">Fecha de emisión</span>
            <span className="ip-value">{dateTime(cfdi.issued_at)}</span>
          </div>

          <div>
            <span className="ip-label">Fecha de certificación</span>
            <span className="ip-value">
              {stamp.stamped_at ? dateTime(stamp.stamped_at) : '—'}
            </span>
          </div>

          <div>
            <span className="ip-label">Lugar de expedición</span>
            <span className="ip-value">{cfdi.place_of_issue || '—'}</span>
          </div>
        </section>

        <section className="ip-parties">
          <div className="ip-box">
            <h3>Emisor</h3>

            <p className="ip-strong">{issuer.name || '—'}</p>
            <p>RFC {issuer.rfc}</p>
            <p>{withLabel(REGIMES, issuer.regime)}</p>
          </div>

          <div className="ip-box">
            <h3>Receptor</h3>

            <p className="ip-strong">{receiver.name || '—'}</p>
            <p>RFC {receiver.rfc}</p>
            <p>C.P. {receiver.zip || '—'}</p>
            <p>{withLabel(REGIMES, receiver.regime)}</p>
            <p>Uso CFDI: {withLabel(CFDI_USES, receiver.cfdi_use)}</p>
          </div>
        </section>

        <table className="ip-table">
          <thead>
            <tr>
              <th>Clave</th>
              <th>Descripción</th>
              <th className="ip-right">Cant.</th>
              <th>Unidad</th>
              <th className="ip-right">P. unitario</th>
              <th className="ip-right">Importe</th>
              <th className="ip-right">IVA</th>
            </tr>
          </thead>

          <tbody>
            {cfdi.concepts.map((concept, index) => (
              <tr key={index}>
                <td className="ip-mono">{concept.product_key || '—'}</td>
                <td>{concept.description}</td>
                <td className="ip-right">{concept.quantity}</td>
                <td>{concept.unit || concept.unit_key || '—'}</td>
                <td className="ip-right">
                  {money(concept.unit_price, cfdi.currency)}
                </td>
                <td className="ip-right">
                  {money(concept.amount, cfdi.currency)}
                </td>
                <td className="ip-right">
                  {money(concept.tax_amount, cfdi.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="ip-summary">
          <div className="ip-payment">
            <p>
              <span className="ip-label">Método de pago</span>
              <span className="ip-value">
                {withLabel(PAYMENT_METHODS, cfdi.payment_method)}
              </span>
            </p>

            <p>
              <span className="ip-label">Forma de pago</span>
              <span className="ip-value">
                {withLabel(PAYMENT_FORMS, cfdi.payment_form)}
              </span>
            </p>

            <p>
              <span className="ip-label">Moneda</span>
              <span className="ip-value">{cfdi.currency}</span>
            </p>
          </div>

          <div className="ip-totals">
            <div>
              <span>Subtotal</span>
              <span>{money(cfdi.subtotal, cfdi.currency)}</span>
            </div>

            {cfdi.discount > 0 && (
              <div>
                <span>Descuento</span>
                <span>-{money(cfdi.discount, cfdi.currency)}</span>
              </div>
            )}

            {cfdi.transferred.map((tax, index) => (
              <div key={`t-${index}`}>
                <span>{taxLabel(tax)}</span>
                <span>{money(tax.amount, cfdi.currency)}</span>
              </div>
            ))}

            {cfdi.withheld.map((tax, index) => (
              <div key={`w-${index}`}>
                <span>Ret. {taxLabel(tax)}</span>
                <span>-{money(tax.amount, cfdi.currency)}</span>
              </div>
            ))}

            <div className="ip-total">
              <span>Total</span>
              <span>{money(cfdi.total, cfdi.currency)}</span>
            </div>
          </div>
        </section>

        <footer className="ip-footer">
          <img className="ip-qr" src={qr} alt="QR de verificación SAT" />

          <div className="ip-seals">
            <p>
              <span className="ip-label">Sello digital del CFDI</span>
              <span className="ip-mono ip-break">{stamp.cfdi_seal}</span>
            </p>

            <p>
              <span className="ip-label">Sello digital del SAT</span>
              <span className="ip-mono ip-break">{stamp.sat_seal}</span>
            </p>

            <p>
              <span className="ip-label">
                Cadena original del complemento de certificación
                digital del SAT
              </span>
              <span className="ip-mono ip-break">
                {buildOriginalChain(cfdi)}
              </span>
            </p>

            <p className="ip-small">
              No. de serie del certificado del emisor:{' '}
              {cfdi.issuer_cert_number || '—'} · No. de serie del
              certificado del SAT: {stamp.sat_cert_number} · RFC del
              proveedor de certificación: {stamp.provider_rfc}
            </p>
          </div>
        </footer>

        <p className="ip-legend">
          Este documento es una representación impresa de un CFDI
        </p>
      </article>
    </div>
  );
}
