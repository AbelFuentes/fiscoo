export const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Alimentos' },
  { value: 'transport', label: 'Transporte' },
  { value: 'housing', label: 'Vivienda' },
  { value: 'services', label: 'Servicios' },
  { value: 'health', label: 'Salud' },
  { value: 'education', label: 'Educación' },
  { value: 'entertainment', label: 'Entretenimiento' },
  { value: 'work', label: 'Trabajo' },
  { value: 'other', label: 'Otro' },
] as const;

export const categoryLabel = (value: string) =>
  EXPENSE_CATEGORIES.find((item) => item.value === value)?.label ?? value;
