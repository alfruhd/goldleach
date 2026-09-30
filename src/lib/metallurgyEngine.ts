/**
 * Dynamic Leach Chemistry & Reagent Calculator Engine
 * Encapsulates all metallurgical calculations according to Taggart's equations
 * and gold vat leaching / CIL protective alkalinity standards.
 */

export interface VatConfig {
  id: string;
  name: string;
  shape: 'rectangular' | 'circular';
  length?: number; // meters (required if shape === 'rectangular')
  width?: number; // meters (required if shape === 'rectangular')
  diameter?: number; // meters (required if shape === 'circular')
  maxHeight: number; // meters (structural wall height)
  defaultCycleHours: number; // e.g., 24, 36, 48
}

export type CyanicideProfile = 'clean' | 'moderate_sulfide' | 'heavy_copper';

export interface BatchCalculationInput {
  vat: VatConfig;
  slurryFillDepthMeters: number; // Measured depth of slurry in meters (must be <= vat.maxHeight)
  slurryWeight1LiterGrams: number; // Measured weight of exactly 1,000 mL slurry in grams (typical: 1,200 - 1,600)
  initialPh: number; // Slurry pH prior to chemical addition (typical: 7.0 - 9.5)
  targetCycleHours: number; // Leaching cycle duration
  cyanicideProfile: CyanicideProfile;
  targetFreeCyanidePpm?: number; // Default: 250 g/m³
  oreSpecificGravity?: number; // Default: 2.65 (standard quartz/greenstone)
}

export interface BatchCalculationResult {
  slurryVolumeM3: number;
  slurrySpecificGravity: number;
  percentSolidsByWeight: number;
  dryOreTonnageTons: number;
  waterVolumeM3: number;
  requiredLimeKg: number;
  initialCyanideKg: number;
  hourlyReplenishmentRateKgPerHour: number;
  instructions: {
    step1Lime: string;
    step2Cyanide: string;
    step3Monitoring: string;
  };
}

export const BUFFER_FACTORS: Record<CyanicideProfile, number> = {
  clean: 0.45,
  moderate_sulfide: 0.65,
  heavy_copper: 0.85,
};

export const CYANIDE_MULTIPLIERS: Record<CyanicideProfile, number> = {
  clean: 1.0,
  moderate_sulfide: 1.3,
  heavy_copper: 1.6,
};

export const DEFAULT_ORE_SG = 2.65;
export const DEFAULT_FREE_CYANIDE_PPM = 250; // g/m³
export const TARGET_PH_SETPOINT = 10.8;
export const COMMERCIAL_NACN_PURITY = 0.98; // 98%

/**
 * Calculates dynamic reagent dosing and metallurgical metrics for a leach batch.
 */
export function calculateBatchDosing(input: BatchCalculationInput): BatchCalculationResult {
  const {
    vat,
    slurryFillDepthMeters,
    slurryWeight1LiterGrams,
    initialPh,
    targetCycleHours,
    cyanicideProfile,
    targetFreeCyanidePpm = DEFAULT_FREE_CYANIDE_PPM,
    oreSpecificGravity = DEFAULT_ORE_SG,
  } = input;

  // Step 1: Slurry Volume (V_slurry in m³)
  let slurryVolumeM3 = 0;
  if (vat.shape === 'rectangular') {
    const length = vat.length ?? 0;
    const width = vat.width ?? 0;
    slurryVolumeM3 = length * width * slurryFillDepthMeters;
  } else {
    const diameter = vat.diameter ?? 0;
    const radius = diameter / 2;
    slurryVolumeM3 = Math.PI * Math.pow(radius, 2) * slurryFillDepthMeters;
  }

  // Step 2: Slurry Specific Gravity (SG_slurry)
  const slurrySpecificGravity = slurryWeight1LiterGrams / 1000;

  // Step 3: Percent Solids by Mass (% Solids) via Taggart's relation
  let percentSolidsByWeight = 0;
  if (slurrySpecificGravity > 1.0 && oreSpecificGravity > 1.0) {
    const numerator = oreSpecificGravity * (slurrySpecificGravity - 1.0);
    const denominator = slurrySpecificGravity * (oreSpecificGravity - 1.0);
    percentSolidsByWeight = (numerator / denominator) * 100;
    if (percentSolidsByWeight < 0) percentSolidsByWeight = 0;
    if (percentSolidsByWeight > 100) percentSolidsByWeight = 100;
  }

  // Step 4: Dry Ore Metric Tonnage (T_dry)
  const totalSlurryMassTons = slurryVolumeM3 * slurrySpecificGravity;
  const dryOreTonnageTons = totalSlurryMassTons * (percentSolidsByWeight / 100);

  // Step 5: Active Water / Solution Volume (V_water in m³)
  const dryOreVolumeSolids = dryOreTonnageTons / oreSpecificGravity;
  const waterVolumeM3 = Math.max(0, slurryVolumeM3 - dryOreVolumeSolids);

  // Step 6: Protective Alkalinity / Lime Addition (M_lime in kg)
  const deltaPh = Math.max(0, TARGET_PH_SETPOINT - initialPh);
  const bufferFactor = BUFFER_FACTORS[cyanicideProfile] ?? 0.45;
  const requiredLimeKg = Number((waterVolumeM3 * deltaPh * bufferFactor).toFixed(1));

  // Step 7: Stoichiometric Cyanide Dosing (M_cyanide in kg)
  const cyanideMultiplier = CYANIDE_MULTIPLIERS[cyanicideProfile] ?? 1.0;
  const targetCyanideMassGrams = waterVolumeM3 * targetFreeCyanidePpm * cyanideMultiplier;
  const initialCyanideKg = Number(
    (targetCyanideMassGrams / (1000 * COMMERCIAL_NACN_PURITY)).toFixed(1)
  );

  // Step 8: Kinetic Replenishment Rate (R_hourly in kg/hr)
  const safeCycleHours = targetCycleHours > 0 ? targetCycleHours : 1;
  const hourlyReplenishmentRateKgPerHour = Number(
    ((initialCyanideKg * 0.35) / safeCycleHours).toFixed(2)
  );

  return {
    slurryVolumeM3: Number(slurryVolumeM3.toFixed(2)),
    slurrySpecificGravity: Number(slurrySpecificGravity.toFixed(3)),
    percentSolidsByWeight: Number(percentSolidsByWeight.toFixed(1)),
    dryOreTonnageTons: Number(dryOreTonnageTons.toFixed(1)),
    waterVolumeM3: Number(waterVolumeM3.toFixed(2)),
    requiredLimeKg,
    initialCyanideKg,
    hourlyReplenishmentRateKgPerHour,
    instructions: {
      step1Lime: `Dose first: Add ${requiredLimeKg} kg hydrated lime into slurry. Agitate 30 min until pH >= 10.5 strictly confirmed.`,
      step2Cyanide: `Dose only after pH check is confirmed >= 10.5: Add ${initialCyanideKg} kg sodium cyanide (NaCN) evenly into the circuit.`,
      step3Monitoring: `Titrate free cyanide periodically. Maintain top-up replenishment at ~${hourlyReplenishmentRateKgPerHour} kg/hr across the ${safeCycleHours}h cycle.`,
    },
  };
}
