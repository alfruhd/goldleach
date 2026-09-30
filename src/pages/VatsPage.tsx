import React, { useState, useEffect, useCallback } from 'react';
import { db, seedInitialVats } from '../lib/db';
import type { VatConfig } from '../lib/metallurgyEngine';
import {
  Plus,
  Edit2,
  Trash2,
  X,
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
      setFormError('Please enter a tank/vat name.');
      return;
    }

    const heightNum = parseFloat(maxHeight);
    const cycleNum = parseFloat(defaultCycleHours);

    if (isNaN(heightNum) || heightNum <= 0) {
      setFormError('Max wall height must be greater than 0.');
      return;
    }

    if (isNaN(cycleNum) || cycleNum <= 0) {
      setFormError('Default cycle duration must be greater than 0.');
      return;
    }

    let updatedVat: VatConfig;

    if (shape === 'rectangular') {
      const lengthNum = parseFloat(length);
      const widthNum = parseFloat(width);
      if (isNaN(lengthNum) || lengthNum <= 0 || isNaN(widthNum) || widthNum <= 0) {
        setFormError('Length and Width must be greater than 0.');
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
        setFormError('Diameter must be greater than 0.');
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
      setNotification(`Vat "${updatedVat.name}" saved.`);
      setTimeout(() => setNotification(null), 2500);
    } catch (err) {
      console.error('Failed to save vat:', err);
      setFormError('Failed to save vat.');
    }
  };

  const handleDeleteVat = async (vat: VatConfig) => {
    if (vats.length <= 1) {
      alert('At least one vat configuration must remain.');
      return;
    }

    if (window.confirm(`Delete configuration for "${vat.name}"?`)) {
      await db.vats.delete(vat.id);
      await loadVats();
      setNotification(`Vat "${vat.name}" deleted.`);
      setTimeout(() => setNotification(null), 2500);
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset vats back to factory default configurations?')) {
      await db.vats.clear();
      await seedInitialVats();
      await loadVats();
      setNotification('Restored default configurations.');
      setTimeout(() => setNotification(null), 2500);
    }
  };

  const computeVolume = (vat: VatConfig) => {
    if (vat.shape === 'rectangular') {
      return ((vat.length ?? 0) * (vat.width ?? 0) * vat.maxHeight).toFixed(1);
    }
    return (Math.PI * Math.pow((vat.diameter ?? 0) / 2, 2) * vat.maxHeight).toFixed(1);
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Tank &amp; Vat Setup</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Dimensions and wall limits for calculations</p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Tank</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading tanks...</div>
      ) : (
        <div className="space-y-2.5">
          {vats.map((vat) => (
            <div
              key={vat.id}
              className="bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{vat.name}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {vat.shape}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-slate-400">
                  <button
                    type="button"
                    onClick={() => openEditModal(vat)}
                    className="p-1.5 rounded hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVat(vat)}
                    className="p-1.5 rounded hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-[#0d1117] rounded-lg p-2.5 border border-slate-200 dark:border-slate-800/80 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Dimensions</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {vat.shape === 'rectangular'
                      ? `${vat.length}m × ${vat.width}m`
                      : `Ø ${vat.diameter}m`}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Wall Height</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{vat.maxHeight} m</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Max Capacity</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">{computeVolume(vat)} m³</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Default Cycle: <span className="text-slate-700 dark:text-slate-300 font-medium font-mono">{vat.defaultCycleHours} hrs</span>
              </div>
            </div>
          ))}

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline underline-offset-4 transition-colors"
            >
              Reset to factory default tanks
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#121722] border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-xl p-4 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {editingVatId ? 'Edit Tank Configuration' : 'Add Tank Configuration'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveVat} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tank Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Vat #3"
                  className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tank Geometry
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShape('rectangular')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      shape === 'rectangular'
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-950 dark:text-white font-semibold shadow-xs'
                        : 'bg-slate-50 dark:bg-[#0d1117] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Rectangular
                  </button>
                  <button
                    type="button"
                    onClick={() => setShape('circular')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                      shape === 'circular'
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-600 text-slate-950 dark:text-white font-semibold shadow-xs'
                        : 'bg-slate-50 dark:bg-[#0d1117] border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Circular Tank
                  </button>
                </div>
              </div>

              {shape === 'rectangular' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Length (m)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Width (m)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Diameter (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={diameter}
                    onChange={(e) => setDiameter(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Max Wall Height (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    value={maxHeight}
                    onChange={(e) => setMaxHeight(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Default Cycle (hrs)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={defaultCycleHours}
                    onChange={(e) => setDefaultCycleHours(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0d1117] border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
                >
                  {editingVatId ? 'Save Changes' : 'Create Tank'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
