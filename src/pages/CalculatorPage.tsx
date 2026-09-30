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
  AlertTriangle,
  CheckCircle2,
  Clock,
  Droplets,
  Layers,
  Scale,
  Sparkles,
  FlaskConical,
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

  // Results & Feedback state
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

  // Handle Vat Selection change
  const handleVatChange = (vatId: string) => {
    setSelectedVatId(vatId);
    const vat = vats.find((v) => v.id === vatId) || null;
    setSelectedVat(vat);
    if (vat) {
      setCycleHours(String(vat.defaultCycleHours));
      // Reset result when vat changes to prevent stale calculations
      setCalculationResult(null);
      setSaveSuccessMessage(null);
    }
  };

  // Perform calculation
  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSaveSuccessMessage(null);

    if (!selectedVat) {
      setValidationError('Please select a valid vat / leach tank.');
      return;
    }

    const depth = parseFloat(slurryFillDepth);
    const weight1L = parseFloat(slurryWeight1L);
    const ph = parseFloat(initialPh);
    const cycle = parseFloat(cycleHours);

    if (isNaN(depth) || depth <= 0) {
      setValidationError('Slurry Fill Depth must be greater than 0 meters.');
      return;
    }

    if (depth > selectedVat.maxHeight) {
      setValidationError(
        `Slurry depth (${depth}m) exceeds vat maximum structural wall height (${selectedVat.maxHeight}m)!`
      );
      return;
    }

    if (isNaN(weight1L) || weight1L < 1000 || weight1L > 2200) {
      setValidationError('1-Liter Slurry Weight must be between 1,000g (water) and 2,200g.');
      return;
    }

    if (isNaN(ph) || ph < 4.0 || ph > 12.0) {
      setValidationError('Initial slurry pH must be between 4.0 and 12.0.');
      return;
    }

    if (isNaN(cycle) || cycle <= 0) {
      setValidationError('Target leaching cycle must be greater than 0 hours.');
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

  // Log batch to IndexedDB
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

      setSaveSuccessMessage(`Batch ${batchCode} logged successfully to local IndexedDB ledger!`);
      // Scroll to top or notification
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset state as specified
      setCalculationResult(null);
      setNotes('');
    } catch (err) {
      console.error('Failed to log batch:', err);
      setValidationError('Failed to write record to local IndexedDB database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to load test case from acceptance specs
  const handleLoadAcceptanceTestCase = () => {
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

  const getVatDimensionLabel = (vat: VatConfig) => {
    if (vat.shape === 'rectangular') {
      return `${vat.length ?? 0}m × ${vat.width ?? 0}m (Max ${vat.maxHeight}m)`;
    }
    return `Ø ${vat.diameter ?? 0}m (Max ${vat.maxHeight}m)`;
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-5">
      {/* Quick Test Case Loader Bar */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-amber-400">Spec Test Preset:</span> 6x4m, 1380g, pH 8.4
        </div>
        <button
          type="button"
          onClick={handleLoadAcceptanceTestCase}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
        >
          <Sparkles className="w-3.5 h-3.5 inline mr-1" />
          Load Benchmark
        </button>
      </div>

      {/* Success Notification */}
      {saveSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 flex items-start space-x-3 shadow-lg animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">
            <p className="font-bold text-emerald-300">Batch Saved to Device</p>
            <p className="text-xs text-emerald-200/90 mt-0.5">{saveSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 flex items-start space-x-3 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">
            <p className="font-bold text-rose-300">Validation Notice</p>
            <p className="text-xs text-rose-200/90 mt-0.5">{validationError}</p>
          </div>
        </div>
      )}

      {/* Input Section (Card Layout) */}
      <form onSubmit={handleCalculate} className="bg-field-card border border-field-border rounded-2xl p-5 shadow-xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white tracking-wide flex items-center">
            <FlaskConical className="w-4 h-4 mr-2 text-amber-400" />
            1. Slurry & Batch Operational Inputs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Measure physical slurry parameters accurately before running dosing arithmetic.
          </p>
        </div>

        {/* 1. Vat Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Select Leach Vat / Tank
          </label>
          <select
            value={selectedVatId}
            onChange={(e) => handleVatChange(e.target.value)}
            className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3.5 py-3 text-white text-sm font-medium focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
          >
            {vats.map((vat) => (
              <option key={vat.id} value={vat.id}>
                {vat.name} — [{vat.shape.toUpperCase()}: {getVatDimensionLabel(vat)}]
              </option>
            ))}
          </select>
          {selectedVat && (
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Max Wall Limit: <strong className="text-slate-200">{selectedVat.maxHeight} m</strong></span>
              <span>Shape: <strong className="text-slate-200 capitalize">{selectedVat.shape}</strong></span>
              <span>Default Cycle: <strong className="text-slate-200">{selectedVat.defaultCycleHours} h</strong></span>
            </div>
          )}
        </div>

        {/* 2 & 3: Slurry Depth and 1-Liter Slurry Weight */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Slurry Depth (m)</span>
              {selectedVat && (
                <span className="text-slate-400 font-normal">Max: {selectedVat.maxHeight}m</span>
              )}
            </label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max={selectedVat?.maxHeight ?? 5.0}
              value={slurryFillDepth}
              onChange={(e) => setSlurryFillDepth(e.target.value)}
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3.5 py-3 text-white text-base font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>1-Liter Slurry Weight (g)</span>
              <span className="text-slate-400 font-normal">1,000 – 1,800g</span>
            </label>
            <input
              type="number"
              step="1"
              min="1000"
              max="2200"
              value={slurryWeight1L}
              onChange={(e) => setSlurryWeight1L(e.target.value)}
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3.5 py-3 text-white text-base font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              placeholder="e.g. 1380"
              required
            />
          </div>
        </div>

        {/* 4 & 6: Initial pH and Leaching Cycle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Initial Slurry pH</span>
              <span className="text-slate-400 font-normal">Target: 10.8</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="4.0"
              max="12.0"
              value={initialPh}
              onChange={(e) => setInitialPh(e.target.value)}
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3.5 py-3 text-white text-base font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              placeholder="e.g. 8.4"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Leach Cycle Time (hrs)</span>
              <span className="text-slate-400 font-normal">{cycleHours} hours</span>
            </label>
            <input
              type="number"
              step="1"
              min="1"
              max="168"
              value={cycleHours}
              onChange={(e) => setCycleHours(e.target.value)}
              className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3.5 py-3 text-white text-base font-semibold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              required
            />
          </div>
        </div>

        {/* 5. Ore Chemistry Profile */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Ore Chemistry Profile (Cyanicide Demand)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: 'clean',
                label: 'Clean Silica / Sand',
                desc: 'Oxide ore, low consumption',
                factors: `Kb=${BUFFER_FACTORS.clean}, Kc=${CYANIDE_MULTIPLIERS.clean}`,
              },
              {
                id: 'moderate_sulfide',
                label: 'Moderate Sulfide',
                desc: 'Pyritic / transition ore',
                factors: `Kb=${BUFFER_FACTORS.moderate_sulfide}, Kc=${CYANIDE_MULTIPLIERS.moderate_sulfide}`,
              },
              {
                id: 'heavy_copper',
                label: 'High Copper / Base Metal',
                desc: 'Refractory / high cyanicide',
                factors: `Kb=${BUFFER_FACTORS.heavy_copper}, Kc=${CYANIDE_MULTIPLIERS.heavy_copper}`,
              },
            ].map((item) => {
              const isSelected = cyanicideProfile === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCyanicideProfile(item.id as CyanicideProfile)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-400 text-white ring-1 ring-amber-400 shadow-md'
                      : 'bg-[#0a0d14] border-slate-700/80 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold leading-snug">{item.label}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400'
                          : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
                  <p className="text-[9px] font-mono text-amber-300/80 mt-1 font-semibold">{item.factors}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Operational Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Batch Log Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Pit #2 oxidized vein ore, screen size -80 mesh"
            className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* 7. Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm tracking-wider uppercase shadow-lg shadow-amber-500/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2"
          >
            <FlaskConical className="w-5 h-5 text-black" />
            <span>CALCULATE BATCH DOSING</span>
          </button>
        </div>
      </form>

      {/* Output Section (Visible only after calculation) */}
      {calculationResult && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-amber-400" />
              Calculated Chemical Reagents & Metrics
            </h2>
            <button
              type="button"
              onClick={() => setCalculationResult(null)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Critical Action Cards (Side-by-side on sm, stacked on mobile) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card A (Lime Required): Amber highlight */}
            <div className="border border-amber-500/40 bg-amber-500/10 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block mr-2" />
                  Hydrated Lime Required
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30">
                  Step 1 (Ca(OH)₂)
                </span>
              </div>
              <div className="flex items-baseline space-x-2 my-2">
                <span className="text-4xl font-black text-amber-400 tracking-tight">
                  {calculationResult.requiredLimeKg}
                </span>
                <span className="text-xl font-bold text-amber-300">kg</span>
              </div>
              <p className="text-xs font-semibold text-amber-200/90 leading-relaxed border-t border-amber-500/20 pt-2 mt-2">
                &ldquo;Dose first, agitate 30 min until pH &ge; 10.5&rdquo;
              </p>
              <p className="text-[10px] text-amber-300/70 mt-1">
                Target setpoint: 10.8 pH (Buffers strictly &ge; 10.5 to prevent deadly HCN gas).
              </p>
            </div>

            {/* Card B (Cyanide Required): Cyan/Blue highlight */}
            <div className="border border-cyan-500/40 bg-cyan-500/10 rounded-2xl p-4 shadow-xl backdrop-blur-sm relative overflow-hidden">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block mr-2" />
                  Sodium Cyanide Charge
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">
                  Step 2 (NaCN 98%)
                </span>
              </div>
              <div className="flex items-baseline space-x-2 my-2">
                <span className="text-4xl font-black text-cyan-400 tracking-tight">
                  {calculationResult.initialCyanideKg}
                </span>
                <span className="text-xl font-bold text-cyan-300">kg</span>
              </div>
              <p className="text-xs font-semibold text-cyan-200/90 leading-relaxed border-t border-cyan-500/20 pt-2 mt-2">
                &ldquo;Dose only after pH check is confirmed&rdquo;
              </p>
              <p className="text-[10px] text-cyan-300/70 mt-1">
                Setpoint: 250 g/m³ active water solution with 98% commercial purity.
              </p>
            </div>
          </div>

          {/* Secondary Operational Metrics Grid */}
          <div className="bg-field-card border border-field-border rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center">
              <Layers className="w-4 h-4 mr-1.5 text-slate-400" />
              Secondary Operational Metrics
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#0a0d14] border border-slate-800 rounded-xl p-3">
                <div className="flex items-center text-[10px] text-slate-400 font-semibold mb-1">
                  <Scale className="w-3.5 h-3.5 mr-1 text-slate-300" /> Dry Ore
                </div>
                <div className="text-lg font-black text-white">
                  {calculationResult.dryOreTonnageTons} <span className="text-xs text-slate-400 font-medium">tons</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Calculated metric dry</div>
              </div>

              <div className="bg-[#0a0d14] border border-slate-800 rounded-xl p-3">
                <div className="flex items-center text-[10px] text-slate-400 font-semibold mb-1">
                  <Layers className="w-3.5 h-3.5 mr-1 text-slate-300" /> Slurry SG & Solids
                </div>
                <div className="text-lg font-black text-white">
                  {calculationResult.slurrySpecificGravity}{' '}
                  <span className="text-xs text-amber-400 font-bold">({calculationResult.percentSolidsByWeight}%)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Taggart quartz relation</div>
              </div>

              <div className="bg-[#0a0d14] border border-slate-800 rounded-xl p-3">
                <div className="flex items-center text-[10px] text-slate-400 font-semibold mb-1">
                  <Droplets className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Active Solution
                </div>
                <div className="text-lg font-black text-white">
                  {calculationResult.waterVolumeM3} <span className="text-xs text-slate-400 font-medium">m³</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Net active water volume</div>
              </div>

              <div className="bg-[#0a0d14] border border-slate-800 rounded-xl p-3">
                <div className="flex items-center text-[10px] text-slate-400 font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" /> Maintenance Rate
                </div>
                <div className="text-lg font-black text-white">
                  {calculationResult.hourlyReplenishmentRateKgPerHour}{' '}
                  <span className="text-xs text-slate-400 font-medium">kg/hr</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">35% top-up over cycle</div>
              </div>
            </div>

            {/* Standard Operating Instructions Box */}
            <div className="mt-3 bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <p className="font-bold text-slate-200">Field Standard Operating Procedures:</p>
              <p><span className="text-amber-400 font-bold">Step 1:</span> {calculationResult.instructions.step1Lime}</p>
              <p><span className="text-cyan-400 font-bold">Step 2:</span> {calculationResult.instructions.step2Cyanide}</p>
              <p><span className="text-emerald-400 font-bold">Step 3:</span> {calculationResult.instructions.step3Monitoring}</p>
            </div>
          </div>

          {/* Save Action Button */}
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveToLedger}
            className="w-full py-4 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-extrabold text-sm tracking-wider uppercase shadow-xl active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5 text-amber-400" />
            <span>{isSubmitting ? 'WRITING TO DATABASE...' : 'LOG BATCH TO LOCAL LEDGER'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
