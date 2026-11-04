'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Sparkles, Smartphone, Download, AlertTriangle } from 'lucide-react';
import { getSiteUrl, isPrivateOrLocalAddress } from '@/lib/siteUrl';

interface StorePosterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StorePosterModal({
  isOpen,
  onClose,
}: StorePosterModalProps) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [targetUrl, setTargetUrl] = useState<string>(() => getSiteUrl());
  const [networkIp, setNetworkIp] = useState<string>('');

  const isProduction = process.env.NODE_ENV === 'production';
  const envSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || '';

  // In production, require NEXT_PUBLIC_SITE_URL to be set to a non-private URL
  const isMissingConfigInProd = isProduction && (!envSiteUrl || isPrivateOrLocalAddress(envSiteUrl));

  useEffect(() => {
    if (!isOpen) return;

    if (envSiteUrl) {
      setTargetUrl(getSiteUrl());
      return;
    }

    // In development only, query local IP for phone testing on shop Wi-Fi
    if (!isProduction) {
      fetch('/api/network-ip')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.url) {
            setNetworkIp(data.url);
            if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
              setTargetUrl(data.url);
            } else if (typeof window !== 'undefined') {
              setTargetUrl(window.location.origin);
            }
          }
        })
        .catch(() => {
          if (typeof window !== 'undefined') {
            setTargetUrl(window.location.origin);
          }
        });
    }
  }, [isOpen, envSiteUrl, isProduction]);

  const handleDownloadPng = () => {
    const svg = document.getElementById('store-poster-qr-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new window.Image();
    img.onload = () => {
      // Quiet-zone background margin
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 32, 32, 448, 448);

      const a = document.createElement('a');
      a.download = 'dxlea-storefront-qr.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!isOpen) return null;

  const activeShopUrl = targetUrl || getSiteUrl();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md my-8 space-y-3">
        {/* Action Controls & URL Bar */}
        <div className="no-print bg-clay-milk p-4 rounded-3xl border border-clay-paper shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-clay-wine">Storefront QR Poster</span>
            <div className="flex items-center gap-2">
              {!isMissingConfigInProd && (
                <>
                  <button
                    onClick={handleDownloadPng}
                    className="px-3 py-1.5 rounded-full bg-clay-cream hover:bg-clay-paper text-xs font-bold text-clay-wine flex items-center gap-1.5 border border-clay-paper transition-colors"
                    title="Download high-resolution QR image (512x512 PNG with quiet zone)"
                  >
                    <Download className="w-3.5 h-3.5 text-clay-terracotta" />
                    <span className="hidden sm:inline">Download PNG</span>
                  </button>

                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 rounded-full bg-clay-wine hover:bg-clay-wine-dark text-xs font-bold text-clay-milk flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Poster</span>
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-clay-brown-muted hover:text-clay-brown bg-clay-paper"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Production Missing Configuration Warning */}
          {isMissingConfigInProd ? (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Configuration Required</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Set <strong>NEXT_PUBLIC_SITE_URL</strong> (e.g. <code>https://dxlea-printing.netlify.app</code>) before printing the poster. QR code generation is disabled for localhost or private IP addresses in production.
              </p>
            </div>
          ) : (
            /* Target URL display */
            <div className="bg-clay-cream p-2.5 rounded-2xl border border-clay-paper text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-clay-wine font-bold">
                <span>🌐 Destination Website Address:</span>
                {!isProduction && networkIp && targetUrl !== networkIp && (
                  <button
                    type="button"
                    onClick={() => setTargetUrl(networkIp)}
                    className="text-[10px] text-clay-terracotta underline"
                  >
                    Use Local Wi-Fi IP
                  </button>
                )}
              </div>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://your-shop-domain.com"
                className="w-full bg-white border border-clay-paper rounded-xl px-2.5 py-1.5 text-xs font-mono text-clay-brown focus:outline-none focus:border-clay-terracotta"
              />
              <p className="text-[10px] text-clay-brown-muted">
                Customers scanning this poster will be routed directly to this address.
              </p>
            </div>
          )}
        </div>

        {/* Printable Poster Canvas */}
        <div
          ref={posterRef}
          className="print-card bg-clay-milk text-clay-brown p-8 rounded-5xl shadow-2xl border-4 border-clay-wine text-center space-y-5"
        >
          {/* Logo & Header */}
          <div className="space-y-2">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-clay-pink mx-auto shadow-sm bg-white">
              <Image
                src="/images/logo.jpg"
                alt="Dxlea Logo"
                fill
                className="object-contain p-1"
                priority
              />
            </div>
            
            <h1 className="font-serif font-black text-2xl text-clay-wine uppercase tracking-tight">
              DXLEA PRINTING SERVICES
            </h1>
            <p className="text-xs font-bold text-clay-terracotta">
              • Scan • Upload from Phone • Claim at Counter •
            </p>
          </div>

          {/* Big High-Contrast QR Code or Production Warning */}
          {isMissingConfigInProd ? (
            <div className="p-8 bg-amber-50/60 border-2 border-dashed border-amber-300 rounded-4xl space-y-2 text-center">
              <AlertTriangle className="w-10 h-10 text-amber-600 mx-auto" />
              <p className="text-xs font-serif font-bold text-amber-900">
                Poster QR Blocked
              </p>
              <p className="text-[11px] text-amber-700 max-w-xs mx-auto">
                Set <strong>NEXT_PUBLIC_SITE_URL</strong> in Netlify settings before printing poster to ensure customer phones on mobile data can open your shop.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-clay-cream border-2 border-clay-paper rounded-4xl inline-block shadow-inner">
              <QRCodeSVG
                id="store-poster-qr-svg"
                value={activeShopUrl}
                size={220}
                level="H"
                fgColor="#382325"
                bgColor="#fbf4ea"
                includeMargin={true}
              />
            </div>
          )}

          {/* Scan prompt */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-clay-wine font-serif font-black text-base">
              <Smartphone className="w-4 h-4 text-clay-terracotta" />
              <span>Point Camera & Scan to Order</span>
            </div>
            <p className="text-[11px] text-clay-brown-muted font-mono truncate max-w-xs mx-auto">
              {activeShopUrl}
            </p>
          </div>

          {/* 3 Step Icons */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-clay-paper text-center text-xs">
            <div className="p-1.5">
              <div className="w-6 h-6 mx-auto rounded-full bg-clay-wine text-clay-milk font-bold flex items-center justify-center text-[10px] mb-1">
                1
              </div>
              <p className="font-bold text-clay-wine text-[11px]">Scan QR</p>
              <p className="text-[9px] text-clay-brown-muted">Opens order form</p>
            </div>
            <div className="p-1.5">
              <div className="w-6 h-6 mx-auto rounded-full bg-clay-terracotta text-clay-milk font-bold flex items-center justify-center text-[10px] mb-1">
                2
              </div>
              <p className="font-bold text-clay-wine text-[11px]">Upload Files</p>
              <p className="text-[9px] text-clay-brown-muted">Photo, ID, or Docs</p>
            </div>
            <div className="p-1.5">
              <div className="w-6 h-6 mx-auto rounded-full bg-clay-sage text-clay-milk font-bold flex items-center justify-center text-[10px] mb-1">
                3
              </div>
              <p className="font-bold text-clay-wine text-[11px]">Pick Up Here</p>
              <p className="text-[9px] text-clay-brown-muted">Show pickup QR</p>
            </div>
          </div>

          <div className="pt-1 text-[10px] text-clay-brown-muted font-medium">
            Photo Printing • ID Pictures • Documents • Tarpaulins • Stickers • Laminating
          </div>
        </div>
      </div>
    </div>
  );
}
