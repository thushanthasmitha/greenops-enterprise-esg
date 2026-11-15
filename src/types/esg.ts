export type EmissionScope = 'Scope 1' | 'Scope 2' | 'Scope 3';
export type UserRole = 'Admin' | 'Auditor' | 'Viewer';

export interface EmissionRecord {
  id: string;
  date: string;
  scope: EmissionScope;
  category: string;
  activityAmount: number;
  unit: string;
  co2eTonnes: number;
  status: 'Verified' | 'Pending Audit';
}

export interface ForecastDataPoint {
  month: string;
  actual?: number;
  predicted: number;
  target: number;
}