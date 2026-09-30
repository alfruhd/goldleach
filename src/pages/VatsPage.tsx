import React, { useState, useEffect, useCallback } from 'react';
import { db, seedInitialVats } from '../lib/db';
import type { VatConfig } from '../lib/metallurgyEngine';
import {
  Plus,
  Edit2,
  Trash2,
  Database,
  X,
  Check,
  RotateCcw,
  Box,
  CircleDot,
  CheckCircle2,
} from 'lucide-react';

export const VatsPage: React.FC = () => {
  const [vats, setVats] = useState<VatConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingVatId, setEditingVatId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [shape, setShape] = useState<'rectangular' | 'circular'>('rectangular');
  const [length, setLength] = useState<string>('6.0');
  const [width, setWidth] = useState<string>('4.0');
  const [diameter, setDiameter] = useState<string>('4.5');
  const [maxHeight, setMaxHeight] = useState<string>('2.5');
  const [defaultCycleHours, setDefaultCycleHours] = useState<string>('36');
  const [formError, setFormError] = useState<string | null>(null);

  const loadVats = useCallback(async () => {
    try {
      setLoading(true);
      await seedInitialVats();
      const allVats = await db.vats.toArray();
      setVats(allVats);
    } catch (err) {
      console.error('Failed to load vats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVats();
  }, [loadVats]);

  const openAddModal = () => {
    setEditingVatId(null);
    setName('');
    setShape('rectangular');
    setLength('6.0');
    setWidth('4.0');
    setDiameter('4.5');
    setMaxHeight('2.5');
    setDefaultCycleHours('36');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (vat: VatConfig) => {
    setEditingVatId(vat.id);
    setName(vat.name);
    setShape(vat.shape);
    setLength(vat.length ? String(vat.length) : '6.0');
    setWidth(vat.width ? String(vat.width) : '4.0');
    setDiameter(vat.diameter ? String(vat.diameter) : '4.5');
    setMaxHeight(String(vat.maxHeight));
    setDefaultCycleHours(String(vat.defaultCycleHours));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVatId(null);
    setFormError(null);
  };

  const handleSaveVat = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Please enter a descriptive vat name.');
      return;
    }

    const heightNum = parseFloat(maxHeight);
    const cycleNum = parseFloat(defaultCycleHours);

    if (isNaN(heightNum) || heightNum <= 0) {
      setFormError('Max wall height must be greater than 0.');
      return;
    }

    if (isNaN(cycleNum) || cycleNum <= 0) {
      setFormError('Default cycle duration must be greater than 0 hours.');
      return;
    }

    let updatedVat: VatConfig;

    if (shape === 'rectangular') {
      const lengthNum = parseFloat(length);
      const widthNum = parseFloat(width);
      if (isNaN(lengthNum) || lengthNum <= 0 || isNaN(widthNum) || widthNum <= 0) {
        setFormError('Length and Width must be greater than 0 for rectangular vats.');
        return;
      }
      updatedVat = {
        id: editingVatId ?? `vat-${Date.now()}`,
        name: name.trim(),
        shape: 'rectangular',
        length: lengthNum,
        width: widthNum,
        maxHeight: heightNum,
        defaultCycleHours: cycleNum,
      };
    } else {
      const diameterNum = parseFloat(diameter);
      if (isNaN(diameterNum) || diameterNum <= 0) {
        setFormError('Diameter must be greater than 0 for circular leach tanks.');
        return;
      }
      updatedVat = {
        id: editingVatId ?? `vat-${Date.now()}`,
        name: name.trim(),
        shape: 'circular',
        diameter: diameterNum,
        maxHeight: heightNum,
        defaultCycleHours: cycleNum,
      };
    }

    try {
      await db.vats.put(updatedVat);
      await loadVats();
      closeModal();
      setNotification(`Vat "${updatedVat.name}" saved successfully.`);
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('Failed to save vat:', err);
      setFormError('Database write error occurred.');
    }
  };

  const handleDeleteVat = async (vat: VatConfig) => {
    if (vats.length <= 1) {
      alert('At least one vat configuration must remain in the system.');
      return;
    }

    if (window.confirm(`Delete configuration for "${vat.name}"?`)) {
      await db.vats.delete(vat.id);
      await loadVats();
      setNotification(`Vat "${vat.name}" deleted.`);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset vats back to factory default configurations?')) {
      await db.vats.clear();
      await seedInitialVats();
      await loadVats();
      setNotification('Restored initial default vats.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const computeTotalVolume = (vat: VatConfig) => {
    if (vat.shape === 'rectangular') {
      return ((vat.length ?? 0) * (vat.width ?? 0) * vat.maxHeight).toFixed(1);
    }
    return (Math.PI * Math.pow((vat.diameter ?? 0) / 2, 2) * vat.maxHeight).toFixed(1);
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-field-card border border-field-border rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center">
            <Database className="w-5 h-5 mr-2 text-amber-400" />
            Tank & Vat Configurations
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Define dimensions and wall heights for mobile field arithmetic
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={openAddModal}
            className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4 text-black stroke-[3]" />
            <span>ADD NEW VAT</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Vats List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading vats...</div>
      ) : (
        <div className="space-y-3">
          {vats.map((vat) => (
            <div
              key={vat.id}
              className="bg-field-card border border-field-border hover:border-slate-700 rounded-2xl p-4 shadow-lg transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white tracking-tight">
                      {vat.name}
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {vat.shape === 'rectangular' ? (
                        <>
                          <Box className="w-3 h-3 mr-1 text-amber-400" />
                          Rectangular
                        </>
                      ) : (
                        <>
                          <CircleDot className="w-3 h-3 mr-1 text-cyan-400" />
                          Circular
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    ID: <code className="text-slate-300 font-mono text-[11px]">{vat.id}</code>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(vat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                    title="Edit Vat"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVat(vat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete Vat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dimension Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0a0d14] rounded-xl p-3 border border-slate-800/80 text-xs">
                {vat.shape === 'rectangular' ? (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Length &times; Width</span>
                      <span className="font-bold text-slate-100">{vat.length}m &times; {vat.width}m</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Base Area</span>
                      <span className="font-bold text-slate-100">{((vat.length ?? 0) * (vat.width ?? 0)).toFixed(1)} m²</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Diameter</span>
                      <span className="font-bold text-slate-100">Ø {vat.diameter}m</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cross-Section</span>
                      <span className="font-bold text-slate-100">{(Math.PI * Math.pow((vat.diameter ?? 0) / 2, 2)).toFixed(1)} m²</span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-slate-400 block text-[10px]">Max Wall Height</span>
                  <span className="font-bold text-amber-400">{vat.maxHeight} m</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Gross Max Volume</span>
                  <span className="font-bold text-cyan-400">{computeTotalVolume(vat)} m³</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-0.5">
                <span>Default Leach Cycle: <strong className="text-slate-200">{vat.defaultCycleHours} hours</strong></span>
              </div>
            </div>
          ))}

          {/* Reset button at bottom */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-500 hover:text-slate-300 inline-flex items-center space-x-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Factory Default Vats</span>
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Vat Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131826] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center">
                <Database className="w-4 h-4 mr-2 text-amber-400" />
                {editingVatId ? 'Edit Vat Configuration' : 'Add New Vat / Tank'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveVat} className="space-y-4">
              {/* Vat Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Vat Name / Identifier
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vat #3 (South Cyanidation Tank)"
                  className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {/* Shape radio selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Vat Geometry / Shape
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setShape('rectangular')}
                    className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                      shape === 'rectangular'
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 ring-1 ring-amber-400 font-bold'
                        : 'bg-[#0a0d14] border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <Box className="w-4 h-4" />
                    <span className="text-xs uppercase">Rectangular</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShape('circular')}
                    className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition-all ${
                      shape === 'circular'
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400 font-bold'
                        : 'bg-[#0a0d14] border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <CircleDot className="w-4 h-4" />
                    <span className="text-xs uppercase">Circular Tank</span>
                  </button>
                </div>
              </div>

              {/* Dimensions: Length & Width (visible only if rectangular) */}
              {shape === 'rectangular' && (
                <div className="grid grid-cols-2 gap-3 bg-[#0a0d14] p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Length (meters)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full bg-[#131826] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Width (meters)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full bg-[#131826] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Dimensions: Diameter (visible only if circular) */}
              {shape === 'circular' && (
                <div className="bg-[#0a0d14] p-3 rounded-xl border border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Diameter (meters)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={diameter}
                    onChange={(e) => setDiameter(e.target.value)}
                    className="w-full bg-[#131826] border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              )}

              {/* Max Wall Height & Default Cycle Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Max Wall Height (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={maxHeight}
                    onChange={(e) => setMaxHeight(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Default Cycle (hrs)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={defaultCycleHours}
                    onChange={(e) => setDefaultCycleHours(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase flex items-center space-x-1.5 shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingVatId ? 'Save Changes' : 'Create Vat'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
