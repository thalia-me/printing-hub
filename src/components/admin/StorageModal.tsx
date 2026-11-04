'use client';

import React, { useState, useEffect } from 'react';
import { X, HardDrive, Trash2, AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert } from 'lucide-react';

interface StorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCleanupComplete?: () => void;
}

interface StorageMetrics {
  fileCount: number;
  totalBytes: number;
  totalMb: string;
  totalCapacityMb: number;
  usagePercent: number;
  threshold: number;
  warning: boolean;
}

export default function StorageModal({
  isOpen,
  onClose,
  onCleanupComplete,
}: StorageModalProps) {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupDays, setCleanupDays] = useState<number>(14);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/storage');
      const data = await res.json();
      if (res.ok && data.success) {
        setMetrics(data);
      }
    } catch (e) {
      console.error('Failed to load storage metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setResultMessage(null);
      fetchMetrics();
    }
  }, [isOpen]);

  const handleCleanup = async () => {
    const confirmed = window.confirm(
      `Clean up files from completed and cancelled orders older than ${cleanupDays} days, plus abandoned uploads older than 24 hours?\n\nOrder records will be preserved; only the physical storage files will be removed.`
    );
    if (!confirmed) return;

    try {
      setCleaning(true);
      setResultMessage(null);
      const res = await fetch('/api/admin/storage/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: cleanupDays }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResultMessage(data.message || `Successfully cleaned up files.`);
        await fetchMetrics();
        if (onCleanupComplete) {
          onCleanupComplete();
        }
      } else {
        alert(data.error || 'Cleanup failed. Please try again.');
      }
    } catch (e: any) {
      alert('Cleanup request failed: ' + e.message);
    } finally {
      setCleaning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-clay-milk w-full max-w-lg rounded-5xl border-4 border-clay-milk/60 p-6 sm:p-7 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-clay-paper">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-clay-paper flex items-center justify-center text-clay-wine">
              <HardDrive className="w-5 h-5 text-clay-terracotta" />
            </div>
            <div>
              <h2 className="font-serif font-black text-lg text-clay-wine">
                Free-Tier Storage Manager
              </h2>
              <p className="text-[11px] text-clay-brown-muted">Supabase Free Quota (1 GB File Storage)</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-clay-paper text-clay-brown hover:bg-clay-cream"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Banner if >= 80% */}
        {metrics?.warning && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2.5 animate-pulse">
            <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Storage Threshold Warning ({metrics.usagePercent}%)</p>
              <p className="text-[11px] text-rose-700">
                You have reached over {metrics.threshold}% of the 1 GB free Supabase storage limit. Run cleanup below to prevent upload rejections.
              </p>
            </div>
          </div>
        )}

        {/* Storage Metrics Card */}
        <div className="p-4 rounded-3xl bg-clay-cream border border-clay-paper space-y-3">
          <div className="flex items-center justify-between text-xs font-serif font-bold text-clay-wine">
            <span>Storage Usage:</span>
            <button
              onClick={fetchMetrics}
              disabled={loading}
              className="text-[11px] text-clay-terracotta hover:underline inline-flex items-center gap-1 font-mono"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="w-full h-3 rounded-full bg-clay-paper overflow-hidden p-0.5 border border-clay-paper">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (metrics?.usagePercent || 0) >= 80
                    ? 'bg-rose-600'
                    : (metrics?.usagePercent || 0) >= 60
                    ? 'bg-amber-500'
                    : 'bg-clay-sage'
                }`}
                style={{ width: `${Math.max(2, Math.min(100, metrics?.usagePercent || 0))}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-[11px] text-clay-brown-muted font-mono">
              <span>{metrics?.totalMb || '0.00'} MB used ({metrics?.fileCount || 0} files)</span>
              <span className="font-bold text-clay-wine">{metrics?.usagePercent || 0}% of 1 GB</span>
            </div>
          </div>
        </div>

        {/* Clean Up Action Card */}
        <div className="p-4 rounded-3xl bg-clay-cream border border-clay-paper space-y-3">
          <div>
            <h3 className="font-serif font-bold text-xs text-clay-wine uppercase tracking-wider">
              Clean Up Old & Abandoned Files
            </h3>
            <p className="text-[11px] text-clay-brown-muted mt-0.5">
              Purges files from completed and cancelled orders, plus unattached uploads older than 24h. Order details, totals, and customer notes are kept permanently.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <label className="text-xs font-serif font-bold text-clay-wine whitespace-nowrap">
              Purge orders older than:
            </label>
            <select
              value={cleanupDays}
              onChange={(e) => setCleanupDays(Number(e.target.value))}
              disabled={cleaning}
              className="bg-white border border-clay-paper rounded-xl px-3 py-1.5 text-xs font-serif text-clay-brown focus:outline-none focus:border-clay-terracotta"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days (Recommended)</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleCleanup}
            disabled={cleaning || loading}
            className="w-full py-3 rounded-2xl bg-clay-wine hover:bg-clay-wine-dark text-clay-milk text-xs font-serif font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {cleaning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-clay-milk/40 border-t-clay-milk rounded-full animate-spin"></span>
                <span>Cleaning up files from storage...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 text-clay-pink" />
                <span>Clean Up Files</span>
              </>
            )}
          </button>
        </div>

        {/* Success / Status Message */}
        {resultMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{resultMessage}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-clay-paper hover:bg-clay-cream text-xs font-serif font-bold text-clay-brown transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

