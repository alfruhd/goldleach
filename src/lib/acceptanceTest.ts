import {
  calculateBatchDosing,
  type VatConfig,
} from './metallurgyEngine';
import { generateBatchCsv } from './exportCsv';
import type { BatchRecord } from './db';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runAcceptanceTests() {
  console.log('--- Running GoldLeach Acceptance Tests ---');

  // Test Case from Section 6:
  // Rectangular Vat: L = 6.0m, W = 4.0m, MaxHeight = 2.2m
  // Depth: 2.0m, 1L Slurry Weight: 1380g, Starting pH: 8.4
  // Profile: clean, Cycle: 36h
  const vatRect: VatConfig = {
    id: 'vat-east-01',
    name: 'Vat #1 (East Rectangular)',
    shape: 'rectangular',
    length: 6.0,
    width: 4.0,
    maxHeight: 2.2,
    defaultCycleHours: 36,
  };

  const res = calculateBatchDosing({
    vat: vatRect,
    slurryFillDepthMeters: 2.0,
    slurryWeight1LiterGrams: 1380,
    initialPh: 8.4,
    targetCycleHours: 36,
    cyanicideProfile: 'clean',
  });

  console.log('Result for Acceptance Benchmark:');
  console.log(JSON.stringify(res, null, 2));

  // 1. Total Slurry Volume: 6.0 * 4.0 * 2.0 = 48.00 m³
  assert(res.slurryVolumeM3 === 48.0, `Expected slurry volume 48.00, got ${res.slurryVolumeM3}`);

  // 2. Slurry Specific Gravity: 1380 / 1000 = 1.380
  assert(res.slurrySpecificGravity === 1.38, `Expected slurry SG 1.38, got ${res.slurrySpecificGravity}`);

  // 3. Percent Solids: ~44.2%
  assert(res.percentSolidsByWeight === 44.2, `Expected percent solids 44.2, got ${res.percentSolidsByWeight}`);

  // 4. Dry Ore Metric Tonnage: ~29.3 tons
  assert(res.dryOreTonnageTons === 29.3, `Expected dry ore tonnage 29.3, got ${res.dryOreTonnageTons}`);

  // 5. Active Water Volume: 36.95 m³
  assert(res.waterVolumeM3 === 36.95, `Expected water volume 36.95, got ${res.waterVolumeM3}`);

  // 6. Lime Required: ~39.9 kg
  assert(res.requiredLimeKg === 39.9, `Expected lime 39.9 kg, got ${res.requiredLimeKg}`);

  // 7. Cyanide Required: ~9.4 kg
  assert(res.initialCyanideKg === 9.4, `Expected cyanide 9.4 kg, got ${res.initialCyanideKg}`);

  // 8. Kinetic rate: 0.09 kg/hr
  assert(res.hourlyReplenishmentRateKgPerHour === 0.09, `Expected hourly replenishment rate 0.09 kg/hr, got ${res.hourlyReplenishmentRateKgPerHour}`);

  // Test Circular Vat
  const vatCirc: VatConfig = {
    id: 'vat-cyl-02',
    name: 'Vat #2 (Agitated Leach Tank)',
    shape: 'circular',
    diameter: 4.0,
    maxHeight: 3.0,
    defaultCycleHours: 48,
  };

  const resCirc = calculateBatchDosing({
    vat: vatCirc,
    slurryFillDepthMeters: 2.0,
    slurryWeight1LiterGrams: 1400,
    initialPh: 8.0,
    targetCycleHours: 24,
    cyanicideProfile: 'moderate_sulfide',
  });

  const expectedCircVol = Number((Math.PI * 4 * 2.0).toFixed(2));
  assert(resCirc.slurryVolumeM3 === expectedCircVol, `Circular volume mismatch: expected ${expectedCircVol}, got ${resCirc.slurryVolumeM3}`);

  // Test CSV generator
  const testBatch: BatchRecord = {
    id: 1,
    batchCode: 'B-20260930-001',
    vatId: 'vat-east-01',
    vatName: 'Vat #1 (East Rectangular)',
    timestamp: '2026-09-30T17:00:00.000Z',
    slurryFillDepthMeters: 2.0,
    slurryWeight1LiterGrams: 1380,
    initialPh: 8.4,
    dryTonnage: 29.3,
    slurrySG: 1.38,
    percentSolids: 44.2,
    limeDosedKg: 39.9,
    cyanideDosedKg: 9.4,
    cycleHours: 36,
    notes: 'Test batch verification',
    synced: false,
  };

  const csv = generateBatchCsv([testBatch]);
  assert(csv.includes('B-20260930-001'), 'CSV missing batch code');
  assert(csv.includes('39.9'), 'CSV missing lime kg');
  assert(csv.includes('9.4'), 'CSV missing cyanide kg');

  console.log('✅ ALL ACCEPTANCE AND REAGENT VERIFICATION TESTS PASSED!');
}

runAcceptanceTests();
