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
