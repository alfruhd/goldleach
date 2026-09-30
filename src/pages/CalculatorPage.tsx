import React, { useState, useEffect, useCallback } from 'react';
import { db, seedInitialVats, generateNextBatchCode } from '../lib/db';
import {
  calculateBatchDosing,
  type VatConfig,
  type CyanicideProfile,
  type BatchCalculationResult,
  BUFFER_FACTORS,
  CYANIDE_MULTIPLIERS,
} from '../lib/metallurgyEngine';
import {
  AlertCircle,
  CheckCircle2,
  Save,
  RotateCcw,
} from 'lucide-react';

export const CalculatorPage: React.FC = () => {
  // Vat state
  const [vats, setVats] = useState<VatConfig[]>([]);
  const [selectedVatId, setSelectedVatId] = useState<string>('');
  const [selectedVat, setSelectedVat] = useState<VatConfig | null>(null);

  // Form inputs
  const [slurryFillDepth, setSlurryFillDepth] = useState<string>('2.0');
  const [slurryWeight1L, setSlurryWeight1L] = useState<string>('1380');
  const [initialPh, setInitialPh] = useState<string>('8.4');
  const [cyanicideProfile, setCyanicideProfile] = useState<CyanicideProfile>('clean');
  const [cycleHours, setCycleHours] = useState<string>('36');
  const [notes, setNotes] = useState<string>('');

  // Results & Feedback
  const [calculationResult, setCalculationResult] = useState<BatchCalculationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Load vats on mount
  const loadVats = useCallback(async () => {
    await seedInitialVats();
    const allVats = await db.vats.toArray();
    setVats(allVats);
    if (allVats.length > 0 && !selectedVatId) {
      setSelectedVatId(allVats[0].id);
      setSelectedVat(allVats[0]);
      setCycleHours(String(allVats[0].defaultCycleHours));
    }
  }, [selectedVatId]);

  useEffect(() => {
    loadVats();
  }, [loadVats]);

  const handleVatChange = (vatId: string) => {
    setSelectedVatId(vatId);
    const vat = vats.find((v) => v.id === vatId) || null;
    setSelectedVat(vat);
    if (vat) {
      setCycleHours(String(vat.defaultCycleHours));
      setCalculationResult(null);
      setSaveSuccessMessage(null);
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSaveSuccessMessage(null);

    if (!selectedVat) {
      setValidationError('Please select a valid vat.');
      return;
    }

    const depth = parseFloat(slurryFillDepth);
    const weight1L = parseFloat(slurryWeight1L);
    const ph = parseFloat(initialPh);
    const cycle = parseFloat(cycleHours);

    if (isNaN(depth) || depth <= 0) {
      setValidationError('Slurry fill depth must be greater than 0.');
      return;
    }

    if (depth > selectedVat.maxHeight) {
      setValidationError(
        `Slurry depth (${depth}m) cannot exceed tank wall height (${selectedVat.maxHeight}m).`
      );
      return;
    }

    if (isNaN(weight1L) || weight1L < 1000 || weight1L > 2200) {
      setValidationError('1-Liter slurry weight must be between 1,000g and 2,200g.');
      return;
    }

    if (isNaN(ph) || ph < 4.0 || ph > 12.0) {
      setValidationError('Initial slurry pH must be between 4.0 and 12.0.');
      return;
    }

    if (isNaN(cycle) || cycle <= 0) {
      setValidationError('Cycle duration must be greater than 0 hours.');
      return;
    }

    const result = calculateBatchDosing({
      vat: selectedVat,
      slurryFillDepthMeters: depth,
      slurryWeight1LiterGrams: weight1L,
      initialPh: ph,
      targetCycleHours: cycle,
      cyanicideProfile,
    });

    setCalculationResult(result);
  };

  const handleSaveToLedger = async () => {
    if (!calculationResult || !selectedVat) return;

    try {
      setIsSubmitting(true);
      const batchCode = await generateNextBatchCode();
      const timestamp = new Date().toISOString();

      await db.batches.add({
        batchCode,
        vatId: selectedVat.id,
        vatName: selectedVat.name,
        timestamp,
        slurryFillDepthMeters: parseFloat(slurryFillDepth),
        slurryWeight1LiterGrams: parseFloat(slurryWeight1L),
        initialPh: parseFloat(initialPh),
        dryTonnage: calculationResult.dryOreTonnageTons,
        slurrySG: calculationResult.slurrySpecificGravity,
        percentSolids: calculationResult.percentSolidsByWeight,
        limeDosedKg: calculationResult.requiredLimeKg,
        cyanideDosedKg: calculationResult.initialCyanideKg,
        cycleHours: parseFloat(cycleHours),
        notes: notes.trim() || undefined,
        synced: false,
      });

      setSaveSuccessMessage(`Batch ${batchCode} saved to local ledger.`);
      setCalculationResult(null);
      setNotes('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to log batch:', err);
      setValidationError('Failed to save batch to local database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadDefaults = () => {
    const vat1 = vats.find((v) => v.id === 'vat-east-01') || vats[0];
    if (vat1) {
      setSelectedVatId(vat1.id);
      setSelectedVat(vat1);
    }
    setSlurryFillDepth('2.0');
    setSlurryWeight1L('1380');
    setInitialPh('8.4');
    setCyanicideProfile('clean');
    setCycleHours('36');
    setCalculationResult(null);
    setSaveSuccessMessage(null);
    setValidationError(null);
  };

  const getVatSummary = (vat: VatConfig) => {
    if (vat.shape === 'rectangular') {
      return `${vat.length ?? 0}m × ${vat.width ?? 0}m · Max Wall ${vat.maxHeight}m`;
    }
    return `Ø ${vat.diameter ?? 0}m · Max Wall ${vat.maxHeight}m`;
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Batch Dosing Calculator</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Protective alkalinity &amp; cyanide requirement</p>
        </div>
        <button
          type="button"
          onClick={handleLoadDefaults}
          className="text-xs text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 underline underline-offset-4 transition-colors"
        >
          Load sample data
        </button>
      </div>

      {/* Notifications */}
      {saveSuccessMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessMessage}</span>
        </div>
      )}

      {validationError && (
        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleCalculate} className="bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-4">
        {/* Vat selection */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Target Tank / Vat
          </label>
          <select
            value={selectedVatId}
            onChange={(e) => handleVatChange(e.target.value)}
            className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
          >
            {vats.map((vat) => (
              <option key={vat.id} value={vat.id}>
                {vat.name} ({getVatSummary(vat)})
              </option>
            ))}
          </select>
          {selectedVat && (
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Wall limit: {selectedVat.maxHeight} m</span>
              <span>Default cycle: {selectedVat.defaultCycleHours} hrs</span>
            </div>
          )}
        </div>

        {/* Slurry Depth & Weight */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Slurry Fill Depth
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.05"
                min="0.1"
                max={selectedVat?.maxHeight ?? 5.0}
                value={slurryFillDepth}
                onChange={(e) => setSlurryFillDepth(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white pr-8 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                required
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">m</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              1-Liter Slurry Weight
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1000"
                max="2200"
                value={slurryWeight1L}
                onChange={(e) => setSlurryWeight1L(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white pr-8 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                placeholder="1380"
                required
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">g</span>
            </div>
          </div>
        </div>

        {/* Initial pH & Leach Cycle */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Starting Slurry pH
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="4.0"
                max="12.0"
                value={initialPh}
                onChange={(e) => setInitialPh(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white pr-10 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                placeholder="8.4"
                required
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">pH</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Cycle Duration
            </label>
            <div className="relative">
              <input
                type="number"
                step="1"
                min="1"
                max="168"
                value={cycleHours}
                onChange={(e) => setCycleHours(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white pr-10 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                required
              />
              <span className="absolute right-3 top-2 text-xs text-slate-400 pointer-events-none">hrs</span>
            </div>
          </div>
        </div>

        {/* Ore Chemistry Profile */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Ore Chemistry Profile
          </label>
          <div className="space-y-1.5">
            {[
              {
                id: 'clean',
                name: 'Clean Silica / Sand',
                desc: 'Low cyanicide oxide ore',
                detail: `Kb=${BUFFER_FACTORS.clean} · Kc=${CYANIDE_MULTIPLIERS.clean}`,
              },
              {
                id: 'moderate_sulfide',
                name: 'Moderate Sulfide',
                desc: 'Transition pyritic ore',
                detail: `Kb=${BUFFER_FACTORS.moderate_sulfide} · Kc=${CYANIDE_MULTIPLIERS.moderate_sulfide}`,
              },
              {
                id: 'heavy_copper',
                name: 'High Copper / Base Metal',
                desc: 'High cyanicide refractory ore',
                detail: `Kb=${BUFFER_FACTORS.heavy_copper} · Kc=${CYANIDE_MULTIPLIERS.heavy_copper}`,
              },
            ].map((item) => {
              const isSelected = cyanicideProfile === item.id;
              return (
                <label
                  key={item.id}
                  onClick={() => setCyanicideProfile(item.id as CyanicideProfile)}
                  className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-950 dark:text-white shadow-xs'
                      : 'bg-slate-50 dark:bg-[#0d1117] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <input
                      type="radio"
                      name="cyanicideProfile"
                      checked={isSelected}
                      onChange={() => setCyanicideProfile(item.id as CyanicideProfile)}
                      className="accent-slate-900 dark:accent-amber-400"
                    />
                    <div>
                      <div className="text-xs font-semibold leading-tight">{item.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">{item.detail}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Batch Notes <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Pit #2 oxidized ore, -80 mesh"
            className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
        >
          Calculate Batch Dosing
        </button>
      </form>

      {/* Output Section */}
      {calculationResult && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Calculation Output
            </h3>
            <button
              type="button"
              onClick={() => setCalculationResult(null)}
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          {/* Primary Action Cards (Uniform High-Contrast Design) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Card A: Hydrated Lime */}
            <div className="bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Hydrated Lime Required
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Step 1
                </span>
              </div>
              <div className="my-2.5 flex items-baseline">
                <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white font-mono tracking-tight">
                  {calculationResult.requiredLimeKg}
                </span>
                <span className="text-base font-semibold text-slate-400 dark:text-slate-500 ml-1.5 font-mono">kg</span>
              </div>
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
                <p className="text-xs text-slate-900 dark:text-slate-200 font-semibold">
                  Dose first, agitate 30 min until pH &ge; 10.5
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Target setpoint: 10.8 pH (prevents HCN gas)
                </p>
              </div>
            </div>

            {/* Card B: Sodium Cyanide */}
            <div className="bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Sodium Cyanide Charge
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Step 2
                </span>
              </div>
              <div className="my-2.5 flex items-baseline">
                <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white font-mono tracking-tight">
                  {calculationResult.initialCyanideKg}
                </span>
                <span className="text-base font-semibold text-slate-400 dark:text-slate-500 ml-1.5 font-mono">kg</span>
              </div>
              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 space-y-0.5">
                <p className="text-xs text-slate-900 dark:text-slate-200 font-semibold">
                  Dose only after pH check is confirmed
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  250 g/m³ solution baseline · 98% purity
                </p>
              </div>
            </div>
          </div>

          {/* Secondary Operational Metrics */}
          <div className="bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Operational Metrics
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-slate-50 dark:bg-[#0d1117] p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">Dry Ore</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {calculationResult.dryOreTonnageTons} <span className="text-xs text-slate-400 font-sans">t</span>
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#0d1117] p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">Slurry SG (% Solids)</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {calculationResult.slurrySpecificGravity}{' '}
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">({calculationResult.percentSolidsByWeight}%)</span>
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#0d1117] p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">Active Solution</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {calculationResult.waterVolumeM3} <span className="text-xs text-slate-400 font-sans">m³</span>
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#0d1117] p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
                <span className="block text-[10px] text-slate-500 dark:text-slate-400">Maintenance Rate</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                  {calculationResult.hourlyReplenishmentRateKgPerHour}{' '}
                  <span className="text-xs text-slate-400 font-sans">kg/h</span>
                </span>
              </div>
            </div>
          </div>

          {/* Save Action */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveToLedger}
            className="w-full py-3 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 border border-slate-800 dark:border-slate-700 disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4 text-amber-400" />
            <span>{isSubmitting ? 'Saving...' : 'Log Batch to Local Ledger'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
