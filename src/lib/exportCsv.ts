import type { BatchRecord } from './db';

/**
 * Escapes a cell value according to RFC 4180 standards.
 */
function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts an array of BatchRecord entries to RFC 4180 compliant CSV string.
 */
export function generateBatchCsv(batches: BatchRecord[]): string {
  const headers = [
    'Batch Code',
    'Vat ID',
    'Vat Name',
    'Timestamp (ISO)',
    'Slurry Depth (m)',
    '1L Slurry Weight (g)',
    'Initial pH',
    'Dry Tonnage (t)',
    'Slurry SG',
    'Percent Solids (%)',
    'Hydrated Lime Dosed (kg)',
    'Sodium Cyanide Dosed (kg)',
    'Cycle Duration (hrs)',
    'Notes',
    'Synced',
  ];

  const rows = batches.map(b => [
    escapeCsvCell(b.batchCode),
    escapeCsvCell(b.vatId),
    escapeCsvCell(b.vatName),
    escapeCsvCell(b.timestamp),
    escapeCsvCell(b.slurryFillDepthMeters),
    escapeCsvCell(b.slurryWeight1LiterGrams),
    escapeCsvCell(b.initialPh),
    escapeCsvCell(b.dryTonnage),
    escapeCsvCell(b.slurrySG),
    escapeCsvCell(b.percentSolids),
    escapeCsvCell(b.limeDosedKg),
    escapeCsvCell(b.cyanideDosedKg),
    escapeCsvCell(b.cycleHours),
    escapeCsvCell(b.notes ?? ''),
    escapeCsvCell(b.synced ? 'true' : 'false'),
  ].join(','));

  return [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
}

/**
 * Generates RFC 4180 CSV and triggers browser download: goldleach_audit_YYYYMMDD.csv
 */
export function exportBatchesToCsv(batches: BatchRecord[]): void {
  const csvContent = generateBatchCsv(batches);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const filename = `goldleach_audit_${yyyy}${mm}${dd}.csv`;

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
