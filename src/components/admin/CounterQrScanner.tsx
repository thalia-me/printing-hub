'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Search } from 'lucide-react';

interface CounterQrScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (orderCode: string) => void;
}

export default function CounterQrScanner({
  isOpen,
  onClose,
  onScanSuccess,
}: CounterQrScannerProps) {
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopScanner();
      return;
    }

    const timer = setTimeout(() => {
      startScanner();
    }, 300);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen]);

  const startScanner = async () => {
    try {
      setCameraError(null);
      const elementId = 'counter-qr-reader';
      const element = document.getElementById(elementId);
      if (!element) return;

      const html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success callback: pass decoded QR text (URL, token, or order number)
          stopScanner();
          onScanSuccess(decodedText.trim());
        },
        () => {
          // Scan failure / searching (ignore per frame)
        }
      );

      setScannerActive(true);
    } catch (err: any) {
      console.warn('Camera scanner access notice:', err);
      setCameraError(
        'Camera access unavailable or permission not granted. You can still type the order code below.'
      );
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().catch(() => {}).finally(() => {
        scannerRef.current = null;
        setScannerActive(false);
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    stopScanner();
    onScanSuccess(manualCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-slate-700 p-6 space-y-4 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Counter QR Scanner</h3>
            <p className="text-xs text-slate-400">Scan customer's phone or receipt QR code</p>
          </div>
        </div>

        {/* Camera Viewport */}
        <div className="relative overflow-hidden rounded-2xl bg-black border border-slate-700 min-h-[260px] flex items-center justify-center">
          <div id="counter-qr-reader" className="w-full h-full"></div>
          
          {cameraError && (
            <div className="p-4 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300">{cameraError}</p>
            </div>
          )}
        </div>

        {/* Manual Code Fallback */}
        <form onSubmit={handleManualSubmit} className="space-y-2 pt-2 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 block">
            Or type customer order reference code:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. PRT-20261029-A1B2"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 uppercase focus:outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white transition-colors"
            >
              Lookup
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
