import Dexie, { type Table } from 'dexie';
import type { VatConfig } from './metallurgyEngine';

export interface BatchRecord {
  id?: number;
  batchCode: string; // Format: B-YYYYMMDD-XXX
  vatId: string;
  vatName: string;
  timestamp: string; // ISO 8601 string
  slurryFillDepthMeters: number;
  slurryWeight1LiterGrams: number;
  initialPh: number;
  dryTonnage: number;
  slurrySG: number;
  percentSolids: number;
  limeDosedKg: number;
  cyanideDosedKg: number;
  cycleHours: number;
  notes?: string;
  synced: boolean; // Flag for future cloud sync
}

export class GoldLeachDatabase extends Dexie {
  vats!: Table<VatConfig, string>;
  batches!: Table<BatchRecord, number>;

  constructor() {
    super('GoldLeachDB');
    this.version(1).stores({
      vats: 'id, name, shape',
      batches: '++id, batchCode, vatId, vatName, timestamp, synced',
    });
  }
}

export const db = new GoldLeachDatabase();

/**
 * Seed initial vats if database is newly initialized
 */
export async function seedInitialVats(): Promise<void> {
  try {
    const count = await db.vats.count();
    if (count === 0) {
      await db.vats.bulkAdd([
        {
          id: 'vat-east-01',
          name: 'Vat #1 (East Rectangular)',
          shape: 'rectangular',
          length: 6.0,
          width: 4.0,
          maxHeight: 2.2,
          defaultCycleHours: 36,
        },
        {
          id: 'vat-cyl-02',
          name: 'Vat #2 (Agitated Leach Tank)',
          shape: 'circular',
          diameter: 4.5,
          maxHeight: 3.0,
          defaultCycleHours: 48,
        },
      ]);
    }
  } catch (error) {
    console.error('Failed to seed initial vats:', error);
  }
}

/**
 * Generates an audit-ready batch code: B-YYYYMMDD-XXX
 */
export async function generateNextBatchCode(): Promise<string> {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePrefix = `B-${yyyy}${mm}${dd}`;

  // Count batches created today
  const existingToday = await db.batches
    .filter(b => b.batchCode.startsWith(datePrefix))
    .count();

  const seq = String(existingToday + 1).padStart(3, '0');
  return `${datePrefix}-${seq}`;
}
