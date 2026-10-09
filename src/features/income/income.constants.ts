export const INCOME_CATEGORIES = [
  { value: 'services', label: 'Servicios profesionales' },
  { value: 'salary', label: 'Sueldo' },
  { value: 'sales', label: 'Ventas' },
  { value: 'interest', label: 'Intereses' },
  { value: 'rent', label: 'Rentas' },
  { value: 'other', label: 'Otro' },
] as const;

export const incomeCategoryLabel = (value: string) =>
  INCOME_CATEGORIES.find((item) => item.value === value)?.label ?? value;
