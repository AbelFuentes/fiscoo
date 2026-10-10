import { useRef, useState } from 'react';
import { parseCfdi, type ParsedCfdi } from './cfdi';
import type { InvoiceDirection } from './userInvoices';

const MAX_XML_BYTES = 5 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

interface ImportInvoiceFormProps {
  saving?: boolean;
  onSubmit: (
    cfdi: ParsedCfdi,
    files: { xml: File; pdf?: File | null },
    direction: InvoiceDirection,
  ) => void | Promise<void>;
  onCancel: () => void;
}

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
  }).format(value);

export default function ImportInvoiceForm({
  saving = false,
  onSubmit,
  onCancel,
}: ImportInvoiceFormProps) {
  const xmlInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [cfdi, setCfdi] = useState<ParsedCfdi | null>(null);
  const [direction, setDirection] =
    useState<InvoiceDirection>('received');
  const [error, setError] = useState<string | null>(null);

  const handleXml = async (file: File | undefined) => {
    setError(null);
    setCfdi(null);
    setXmlFile(null);

    if (!file) return;

    if (file.size > MAX_XML_BYTES) {
      setError('El XML pesa más de 5 MB.');
      return;
    }

    try {
      const parsed = parseCfdi(await file.text());

      setXmlFile(file);
      setCfdi(parsed);
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : 'No se pudo leer el XML.',
      );
    }
  };

  const handleSubmit = async () => {
    if (!cfdi || !xmlFile) {
      setError('Selecciona un XML válido.');
      return;
    }

    await onSubmit(cfdi, { xml: xmlFile, pdf: pdfFile }, direction);
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
        <h2>Subir factura</h2>

        <p className="invoices-drawer-subtitle">
          Sube el XML del CFDI. Los datos se leen automáticamente.
        </p>
      </div>

      {error && (
        <ui-alert tone="danger">
          <span slot="title">Revisa el archivo</span>

          {error}
        </ui-alert>
      )}

      <input
        ref={xmlInputRef}
        type="file"
        accept=".xml,text/xml,application/xml"
        hidden
        onChange={(event) => {
          void handleXml(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <input
        ref={pdfInputRef}
        type="file"
        accept=".pdf,application/pdf"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;

          event.target.value = '';

          if (file && file.type !== 'application/pdf') {
            setError('El archivo adjunto debe ser un PDF.');
            return;
          }

          if (file && file.size > MAX_PDF_BYTES) {
            setError('El PDF pesa más de 10 MB.');
            return;
          }

          setError(null);
          setPdfFile(file);
        }}
      />

      <ui-stack gap="md">
        <ui-button
          variant="outline"
          onClick={() => xmlInputRef.current?.click()}
        >
          {xmlFile ? `XML: ${xmlFile.name}` : 'Seleccionar XML'}
        </ui-button>

        <ui-button
          variant="outline"
          onClick={() => pdfInputRef.current?.click()}
        >
          {pdfFile
            ? `PDF: ${pdfFile.name}`
            : 'Adjuntar PDF original (opcional)'}
        </ui-button>

        {cfdi && (
          <ui-card padding="md" variant="outlined">
            <span slot="header">Vista previa</span>

            <ui-stack gap="sm">
              <span>UUID: {cfdi.stamp.uuid}</span>
              <span>
                Emisor: {cfdi.issuer.name || cfdi.issuer.rfc}
              </span>
              <span>
                Receptor: {cfdi.receiver.name || cfdi.receiver.rfc}
              </span>
              <span>
                Total: {formatMoney(cfdi.total, cfdi.currency)}
              </span>
              <span>Conceptos: {cfdi.concepts.length}</span>
            </ui-stack>
          </ui-card>
        )}

        <ui-select
          label="Esta factura es"
          value={direction}
          onchange={(event) => {
            const target = event.currentTarget as HTMLElement & {
              value?: string;
            };

            setDirection(
              (target.value || 'received') as InvoiceDirection,
            );
          }}
        >
          <option value="received">Recibida (gasto)</option>
          <option value="issued">Emitida (ingreso)</option>
        </ui-select>
      </ui-stack>

      <div className="invoices-drawer-actions">
        <ui-button
          variant="outline"
          disabled={saving}
          onClick={onCancel}
        >
          Cancelar
        </ui-button>

        <ui-button
          disabled={saving || !cfdi}
          onClick={handleSubmit}
        >
          {saving ? 'Importando...' : 'Importar factura'}
        </ui-button>
      </div>
    </ui-stack>
  );
}
