const UUID_REGEX =
  /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

export type CfdiVoucherType = 'I' | 'E' | 'T' | 'P' | 'N';

export type CfdiTax = {
  tax: string;
  factor: string;
  rate: number | null;
  base: number;
  amount: number;
};

export type CfdiConcept = {
  product_key: string | null;
  unit_key: string | null;
  unit: string | null;
  identifier: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  discount: number;
  tax_amount: number;
};

export type ParsedCfdi = {
  version: string;
  voucher_type: CfdiVoucherType;
  series: string | null;
  folio: string | null;
  issued_at: string;
  place_of_issue: string | null;
  currency: string;
  exchange_rate: number | null;
  payment_method: string | null;
  payment_form: string | null;
  subtotal: number;
  discount: number;
  total: number;
  tax_total: number;
  transferred: CfdiTax[];
  withheld: CfdiTax[];
  cfdi_seal: string;
  issuer_cert_number: string | null;
  issuer: { rfc: string; name: string | null; regime: string | null };
  receiver: {
    rfc: string;
    name: string | null;
    zip: string | null;
    regime: string | null;
    cfdi_use: string | null;
  };
  concepts: CfdiConcept[];
  stamp: {
    version: string;
    uuid: string;
    stamped_at: string;
    provider_rfc: string;
    legend: string | null;
    cfdi_seal: string;
    sat_cert_number: string;
    sat_seal: string;
  };
};

const VOUCHER_TYPES = ['I', 'E', 'T', 'P', 'N'];

const children = (el: Element | null | undefined, name: string) =>
  el ? Array.from(el.children).filter((c) => c.localName === name) : [];

const child = (el: Element | null | undefined, name: string) =>
  children(el, name)[0] ?? null;

const attr = (el: Element | null | undefined, name: string) =>
  el?.getAttribute(name)?.trim() || null;

const num = (el: Element | null | undefined, name: string) => {
  const value = Number(el?.getAttribute(name));

  return Number.isFinite(value) ? value : 0;
};

const round2 = (value: number) => Math.round(value * 100) / 100;

const parseTaxes = (
  container: Element | null,
  itemName: string,
): CfdiTax[] =>
  children(container, itemName).map((el) => ({
    tax: attr(el, 'Impuesto') ?? '',
    factor: attr(el, 'TipoFactor') ?? '',
    rate: el.hasAttribute('TasaOCuota') ? num(el, 'TasaOCuota') : null,
    base: num(el, 'Base'),
    amount: num(el, 'Importe'),
  }));

export function parseCfdi(xml: string): ParsedCfdi {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  if (doc.querySelector('parsererror')) {
    throw new Error('El archivo no es un XML válido.');
  }

  const root = doc.documentElement;

  if (root.localName !== 'Comprobante') {
    throw new Error('El XML no es un CFDI.');
  }

  const tfd = doc.getElementsByTagNameNS('*', 'TimbreFiscalDigital')[0];

  if (!UUID_REGEX.test(attr(tfd, 'UUID') ?? '')) {
    throw new Error('El UUID del CFDI no es válido.');
  }

  const voucherType = attr(root, 'TipoDeComprobante') ?? '';

  if (!VOUCHER_TYPES.includes(voucherType)) {
    throw new Error('Tipo de comprobante no soportado.');
  }

  const fecha = attr(root, 'Fecha');

  if (!fecha) {
    throw new Error('El CFDI no tiene fecha.');
  }

  const issuer = child(root, 'Emisor');
  const receiver = child(root, 'Receptor');
  const taxes = child(root, 'Impuestos');

  const transferred = parseTaxes(child(taxes, 'Traslados'), 'Traslado');
  const withheld = parseTaxes(child(taxes, 'Retenciones'), 'Retencion');

  const concepts: CfdiConcept[] = children(
    child(root, 'Conceptos'),
    'Concepto',
  ).map((concept) => {
    const iva = parseTaxes(
      child(child(concept, 'Impuestos'), 'Traslados'),
      'Traslado',
    )
      .filter((tax) => tax.tax === '002')
      .reduce((sum, tax) => sum + tax.amount, 0);

    return {
      product_key: attr(concept, 'ClaveProdServ'),
      unit_key: attr(concept, 'ClaveUnidad'),
      unit: attr(concept, 'Unidad'),
      identifier: attr(concept, 'NoIdentificacion'),
      description: attr(concept, 'Descripcion') ?? '',
      quantity: num(concept, 'Cantidad'),
      unit_price: num(concept, 'ValorUnitario'),
      amount: num(concept, 'Importe'),
      discount: num(concept, 'Descuento'),
      tax_amount: round2(iva),
    };
  });

  const tfdSeal = attr(tfd, 'SelloCFD') ?? '';

  return {
    version: attr(root, 'Version') ?? '',
    voucher_type: voucherType as CfdiVoucherType,
    series: attr(root, 'Serie'),
    folio: attr(root, 'Folio'),
    issued_at: new Date(fecha).toISOString(),
    place_of_issue: attr(root, 'LugarExpedicion'),
    currency: attr(root, 'Moneda') ?? 'MXN',
    exchange_rate: root.hasAttribute('TipoCambio')
      ? num(root, 'TipoCambio')
      : null,
    payment_method: attr(root, 'MetodoPago'),
    payment_form: attr(root, 'FormaPago'),
    subtotal: num(root, 'SubTotal'),
    discount: num(root, 'Descuento'),
    total: num(root, 'Total'),
    tax_total: round2(
      transferred
        .filter((tax) => tax.tax === '002')
        .reduce((sum, tax) => sum + tax.amount, 0),
    ),
    transferred,
    withheld,
    cfdi_seal: attr(root, 'Sello') ?? tfdSeal,
    issuer_cert_number: attr(root, 'NoCertificado'),
    issuer: {
      rfc: attr(issuer, 'Rfc') ?? '',
      name: attr(issuer, 'Nombre'),
      regime: attr(issuer, 'RegimenFiscal'),
    },
    receiver: {
      rfc: attr(receiver, 'Rfc') ?? '',
      name: attr(receiver, 'Nombre'),
      zip: attr(receiver, 'DomicilioFiscalReceptor'),
      regime: attr(receiver, 'RegimenFiscalReceptor'),
      cfdi_use: attr(receiver, 'UsoCFDI'),
    },
    concepts,
    stamp: {
      version: attr(tfd, 'Version') ?? '1.1',
      uuid: (attr(tfd, 'UUID') ?? '').toUpperCase(),
      stamped_at: attr(tfd, 'FechaTimbrado') ?? '',
      provider_rfc: attr(tfd, 'RfcProvCertif') ?? '',
      legend: attr(tfd, 'Leyenda'),
      cfdi_seal: tfdSeal,
      sat_cert_number: attr(tfd, 'NoCertificadoSAT') ?? '',
      sat_seal: attr(tfd, 'SelloSAT') ?? '',
    },
  };
}

export function buildVerificationUrl(cfdi: ParsedCfdi) {
  const total = cfdi.total.toFixed(6).padStart(17, '0');
  const lastSeal = cfdi.cfdi_seal.slice(-8);

  const params = new URLSearchParams({
    id: cfdi.stamp.uuid,
    re: cfdi.issuer.rfc,
    rr: cfdi.receiver.rfc,
    tt: total,
    fe: lastSeal,
  });

  return `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?${params.toString()}`;
}

export function buildOriginalChain(cfdi: ParsedCfdi) {
  const { stamp } = cfdi;

  const parts = [
    stamp.version,
    stamp.uuid,
    stamp.stamped_at,
    stamp.provider_rfc,
  ];

  if (stamp.legend) {
    parts.push(stamp.legend);
  }

  parts.push(stamp.cfdi_seal, stamp.sat_cert_number);

  return `||${parts.join('|')}||`;
}
