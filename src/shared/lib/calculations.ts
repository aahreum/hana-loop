export function calculateEmission(quantity: number, factor: number): number {
  return quantity * factor;
}

export function kgToTon(kg: number): number {
  return kg / 1000;
}

export function formatTon(kg: number, decimals = 2): string {
  return kgToTon(kg).toFixed(decimals);
}

export function calcChangeRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}
