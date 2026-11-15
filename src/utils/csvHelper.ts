import type { EmissionRecord } from '../types/esg';

export function exportRecordsToCSV(records: EmissionRecord[]) {
  const headers = ['ID', 'Date', 'Scope', 'Category', 'Activity Amount', 'Unit', 'CO2e (Tonnes)', 'Status'];
  const rows = records.map((r) => [
    r.id,
    r.date,
    r.scope,
    `"${r.category}"`,
    r.activityAmount,
    r.unit,
    r.co2eTonnes,
    r.status,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `GreenOps_ESG_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}