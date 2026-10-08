export interface LandingFeature {
  title: string;
  description: string;
  icon: string;
}

export interface LandingTestimonial {
  name: string;
  role: string;
  quote: string;
  avatar: string;
}

export const LANDING_FEATURES: LandingFeature[] = [
  {
    title: 'Facturación sin complicaciones',
    description:
      'Emite y organiza tus facturas desde un solo lugar, sin procesos innecesarios.',
    icon: '↗',
  },
  {
    title: 'Todo bajo control',
    description:
      'Visualiza ingresos, gastos y movimientos para entender realmente tu negocio.',
    icon: '◫',
  },
  {
    title: 'Clientes organizados',
    description:
      'Mantén toda la información de tus clientes disponible cuando la necesites.',
    icon: '◎',
  },
];

export const LANDING_TESTIMONIALS: LandingTestimonial[] = [
  {
    name: 'Ana López',
    role: 'Diseñadora independiente',
    quote:
      'Por fin puedo llevar mis finanzas sin sentir que necesito una hoja de cálculo para todo.',
    avatar: 'Ana López',
  },
  {
    name: 'Beto Ruiz',
    role: 'Consultor',
    quote:
      'Fiscoo me permite saber rápidamente cómo va mi negocio sin perder tiempo administrándolo.',
    avatar: 'Beto Ruiz',
  },
  {
    name: 'Carla Gil',
    role: 'Emprendedora',
    quote:
      'La interfaz es sencilla y todo está donde espero encontrarlo. Justo lo que necesitaba.',
    avatar: 'Carla Gil',
  },
];

export const LANDING_AVATARS = [
  'Ana López',
  'Beto Ruiz',
  'Carla Gil',
  'Dan Paz',
  'Eva Mar',
];

export const LANDING_PREVIEW_STATS = [
  {
    label: 'Ingresos',
    value: '$48,200',
    delta: '+12%',
    tone: 'success',
  },
  {
    label: 'Facturas',
    value: '1,284',
    delta: '+4%',
    tone: 'success',
  },
  {
    label: 'Clientes',
    value: '892',
    delta: '+2%',
    tone: 'accent',
  },
];

export const LANDING_LOGOS = [
  'Acme',
  'Nexa',
  'Orbit',
  'North',
  'Vertex',
];
