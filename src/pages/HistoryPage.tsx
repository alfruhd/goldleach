import React, { useState, useEffect, useCallback } from 'react';
import { db, type BatchRecord } from '../lib/db';
import { exportBatchesToCsv } from '../lib/exportCsv';
import {
  Download,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HistoryPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
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
    if (batches.length === 0) return;
    exportBatchesToCsv(batches);
    setNotification('CSV report downloaded successfully.');
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteBatch = async (id?: number) => {
    if (!id) return;
    if (window.confirm('Delete this batch record from local ledger?')) {
      await db.batches.delete(id);
      loadBatches();
      setNotification('Record deleted.');
      setTimeout(() => setNotification(null), 2500);
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
      {/* Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white">Batch History Ledger</h2>
          <p className="text-xs text-slate-400">
            {batches.length} {batches.length === 1 ? 'record' : 'records'} stored on device
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={batches.length === 0}
          className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-200 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Loading ledger...</div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#121722] border border-slate-800 rounded-xl space-y-3">
          <p className="text-xs text-slate-400">No batches have been logged to local storage yet.</p>
          <Link
            to="/"
            className="inline-block px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-semibold border border-slate-700 transition-colors"
          >
            Create first batch
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {batches.map((batch) => (
            <div
              key={batch.id ?? batch.batchCode}
              className="bg-[#121722] border border-slate-800 rounded-xl p-3.5 space-y-2"
            >
              {/* Top line: batchCode (bold) + vatName + timestamp */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-amber-400">{batch.batchCode}</span>
                  <span className="text-slate-300 font-medium">{batch.vatName}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400">
                  <span className="font-mono text-[11px]">{formatTimestamp(batch.timestamp)}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteBatch(batch.id)}
                    className="text-slate-400 hover:text-rose-400 p-1 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics line */}
              <div className="grid grid-cols-3 gap-2 py-2 px-2.5 bg-[#0d1117] rounded-lg border border-slate-800/80 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400">Dry Ore</span>
                  <span className="font-bold text-white font-mono">{batch.dryTonnage} t</span>
                </div>
                <div>
                  <span className="block text-[10px] text-amber-400/80">Lime Added</span>
                  <span className="font-bold text-amber-400 font-mono">{batch.limeDosedKg} kg</span>
                </div>
                <div>
                  <span className="block text-[10px] text-cyan-400/80">Cyanide (NaCN)</span>
                  <span className="font-bold text-cyan-400 font-mono">{batch.cyanideDosedKg} kg</span>
                </div>
              </div>

              {/* Status badge & parameters */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                <div className="space-x-2">
                  <span>Depth: <strong className="text-slate-300 font-mono">{batch.slurryFillDepthMeters}m</strong></span>
                  <span>SG: <strong className="text-slate-300 font-mono">{batch.slurrySG}</strong></span>
                  <span>Solids: <strong className="text-slate-300 font-mono">{batch.percentSolids}%</strong></span>
                  <span>Cycle: <strong className="text-slate-300 font-mono">{batch.cycleHours}h</strong></span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  Stored Locally
                </span>
              </div>

              {batch.notes && (
                <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/60">
                  Note: {batch.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
