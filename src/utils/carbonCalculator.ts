import type { EmissionScope } from '../types/esg';

// Standard Emission Factors (kg CO2e per unit)
export const EMISSION_FACTORS: Record<string, { factor: number; unit: string; scope: EmissionScope }> = {
  'Diesel Fuel (Fleet/Generators)': { factor: 2.68, unit: 'Liters', scope: 'Scope 1' },
  'Natural Gas (Heating)': { factor: 2.02, unit: 'm³', scope: 'Scope 1' },
  'Grid Electricity': { factor: 0.45, unit: 'kWh', scope: 'Scope 2' },
  'Business Air Travel': { factor: 0.15, unit: 'km', scope: 'Scope 3' },
  'Supply Chain Freight': { factor: 0.11, unit: 'ton-km', scope: 'Scope 3' },
};

export function calculateCO2eTonnes(category: string, amount: number): number {
  const entry = EMISSION_FACTORS[category];
  if (!entry || amount <= 0) return 0;
  // Convert kg CO2e to Metric Tonnes (tCO2e)
  return Number(((amount * entry.factor) / 1000).toFixed(3));
}