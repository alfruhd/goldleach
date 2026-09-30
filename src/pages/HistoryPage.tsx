import React, { useState, useEffect, useCallback } from 'react';
import { db, type BatchRecord } from '../lib/db';
import { exportBatchesToCsv } from '../lib/exportCsv';
import {
  Download,
  ClipboardList,
  Database,
  Trash2,
  Calendar,
  CheckCircle2,
  HardDrive,
  Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      // Chronological order: newest first
      const allBatches = await db.batches.reverse().toArray();
      setBatches(allBatches);
    } catch (err) {
      console.error('Failed to load batch records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  const handleExportCsv = () => {
    if (batches.length === 0) {
      alert('No batch records found to export.');
      return;
    }
    exportBatchesToCsv(batches);
    setNotification('CSV audit report downloaded successfully.');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteBatch = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to delete this batch record from local storage?')) {
      await db.batches.delete(id);
      loadBatches();
      setNotification('Record removed from local database.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const formatTimestamp = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="pb-28 pt-4 px-4 max-w-2xl mx-auto space-y-4">
      {/* Header bar with prominent EXPORT CSV button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-field-card border border-field-border rounded-2xl p-4 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white tracking-wide flex items-center">
            <ClipboardList className="w-5 h-5 mr-2 text-amber-400" />
            Batch History Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {batches.length} {batches.length === 1 ? 'batch' : 'batches'} recorded on this device
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={batches.length === 0}
          className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-black font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center space-x-2 shrink-0"
        >
          <Download className="w-4 h-4 text-black stroke-[2.5]" />
          <span>EXPORT CSV</span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* List of Batches (Newest First) */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          Loading offline records...
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 px-4 bg-field-card border border-dashed border-slate-800 rounded-2xl space-y-3">
          <Database className="w-12 h-12 text-slate-600 mx-auto stroke-1" />
          <h3 className="text-sm font-bold text-slate-300">No Batches Logged Yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Calculate your first batch dosing and tap &ldquo;Log Batch to Local Ledger&rdquo; to begin your offline audit trail.
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold hover:bg-amber-500/25 transition-colors"
            >
              Go to Calculator
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <div
              key={batch.id ?? batch.batchCode}
              className="bg-field-card border border-field-border hover:border-slate-700 rounded-2xl p-4 shadow-lg transition-all space-y-2.5"
            >
              {/* Top line: batchCode (bold) + vatName + formatted timestamp */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <span className="text-sm font-black text-amber-400 font-mono tracking-tight">
                      {batch.batchCode}
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {batch.vatName}
                    </span>
                  </div>
                  <div className="flex items-center text-[11px] text-slate-400 mt-1 font-medium space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatTimestamp(batch.timestamp)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {/* Status badge: "Stored Locally" (gray/amber) */}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <HardDrive className="w-3 h-3 mr-1" />
                    Stored Locally
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteBatch(batch.id)}
                    title="Delete record"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Metrics line: dryTonnage t ore | limeDosedKg kg lime | cyanideDosedKg kg cyanide */}
              <div className="grid grid-cols-3 gap-2 py-1 bg-[#0a0d14] rounded-xl p-2.5 border border-slate-800/80 text-center">
                <div>
                  <span className="block text-[10px] text-slate-400 font-medium uppercase">Dry Ore</span>
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    {batch.dryTonnage} <span className="text-[10px] text-slate-400">t</span>
                  </span>
                </div>
                <div className="border-x border-slate-800 px-1">
                  <span className="block text-[10px] text-amber-400 font-medium uppercase">Lime Added</span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-400">
                    {batch.limeDosedKg} <span className="text-[10px] text-amber-300/80">kg</span>
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-cyan-400 font-medium uppercase">Cyanide (NaCN)</span>
                  <span className="text-xs sm:text-sm font-extrabold text-cyan-400">
                    {batch.cyanideDosedKg} <span className="text-[10px] text-cyan-300/80">kg</span>
                  </span>
                </div>
              </div>

              {/* Additional Details */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <div className="flex items-center space-x-3">
                  <span>Depth: <strong className="text-slate-300">{batch.slurryFillDepthMeters}m</strong></span>
                  <span>SG: <strong className="text-slate-300">{batch.slurrySG}</strong></span>
                  <span>Solids: <strong className="text-slate-300">{batch.percentSolids}%</strong></span>
                  <span>Cycle: <strong className="text-slate-300">{batch.cycleHours}h</strong></span>
                </div>
                {batch.notes && (
                  <span className="text-[11px] italic text-slate-400 truncate max-w-[140px] flex items-center">
                    <Info className="w-3 h-3 mr-1 inline shrink-0" /> {batch.notes}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
