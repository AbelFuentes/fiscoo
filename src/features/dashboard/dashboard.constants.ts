export const names = [
  'Ana López',
  'Beto Ruiz',
  'Carla Gil',
  'Dan Paz',
  'Eva Mar',
  'Fer Soto',
  'Gus Rey',
  'Hugo Lara',
];

export const statuses = [
  'Pagado',
  'Pendiente',
  'Reembolsado',
];

export const tones: Record<string, string> = {
  Pagado: 'success',
  Pendiente: 'warning',
  Reembolsado: 'danger',
};

export const orders = Array.from(
  { length: 47 },
  (_, i) => ({
    id: `#${1001 + i}`,
    customer: names[i % names.length],
    status: statuses[(i * 7) % 3],
    total: 40 + ((i * 53) % 460),
  }),
);

export const TABLE_PAGE_SIZE = 8;

export const stats = [
  {
    label: 'Ingresos',
    value: '$48,200',
    delta: '+12%',
    tone: 'success',
    progress: 72,
  },
  {
    label: 'Pedidos',
    value: '1,284',
    delta: '+4%',
    tone: 'success',
    progress: 58,
  },
  {
    label: 'Clientes',
    value: '892',
    delta: '+2%',
    tone: 'accent',
    progress: 41,
  },
  {
    label: 'Devoluciones',
    value: '23',
    delta: '-8%',
    tone: 'danger',
    progress: 18,
  },
];
