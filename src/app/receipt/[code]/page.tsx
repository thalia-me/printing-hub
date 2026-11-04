'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CheckCircle2, 
  Printer, 
  Download, 
  ArrowLeft, 
  Sparkles, 
  AlertCircle,
  PackageCheck
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { getSiteUrl } from '@/lib/siteUrl';
import confetti from 'canvas-confetti';

export default function ReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const orderCode = params.code as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrValue, setQrValue] = useState<string>(() => `${getSiteUrl()}/receipt/${orderCode}`);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQrValue(`${getSiteUrl()}/receipt/${orderCode}`);
  }, [orderCode]);

  const fetchOrder = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const res = await fetch(`/api/orders/${orderCode}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Order not found');
      }

      setOrder(data.order);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder(true);

    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#7a353c', '#d97d64', '#e5aa49', '#8aa28a', '#f4a7a1'],
      });
    } catch (e) {}

    const interval = setInterval(() => {
      fetchOrder(false);
    }, 6000);

    return () => clearInterval(interval);
  }, [orderCode]);

  const downloadQRCode = () => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new (window as any).Image();

    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#fbf4ea';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${order?.orderNumber || 'Dxlea'}-Dxlea-PickupQR.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING': return 1;
      case 'PRINTING': return 2;
      case 'READY': return 3;
      case 'COMPLETED': return 4;
      case 'CANCELLED': return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="w-10 h-10 border-4 border-clay-milk/40 border-t-clay-milk rounded-full animate-spin"></div>
        <p className="text-sm text-clay-milk font-serif">Loading Order Details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-clay-milk p-8 rounded-5xl shadow-clay space-y-4 border-2 border-clay-paper">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-serif font-black text-clay-wine">Order Not Found</h2>
        <p className="text-xs text-clay-brown-muted">
          Could not find an order matching this pickup ticket link.
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-clay-wine text-clay-milk text-xs font-bold hover:bg-clay-wine-dark"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Print Shop</span>
        </button>
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Top Controls */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-xs font-bold text-clay-milk hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Order Another Print</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-full bg-clay-milk text-xs font-bold text-clay-brown hover:bg-clay-cream flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-clay-terracotta" />
            <span className="hidden sm:inline">Print Receipt</span>
          </button>
          <button
            onClick={downloadQRCode}
            className="px-3.5 py-1.5 rounded-full bg-clay-mustard hover:bg-clay-mustard-hover text-xs font-bold text-clay-brown flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-clay-wine" />
            <span className="hidden sm:inline">Save QR Image</span>
          </button>
        </div>
      </div>

      {/* Main Clay Receipt Card */}
      <div className="print-card bg-clay-milk rounded-5xl border-4 border-clay-milk/60 p-6 sm:p-8 space-y-7 shadow-2xl relative overflow-hidden">
        
        {/* Header with Logo */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-clay-pink mx-auto shadow-sm bg-white">
            <Image
              src="/images/logo.jpg"
              alt="Dxlea Logo"
              fill
              className="object-contain p-0.5"
            />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-clay-mustard-light border border-clay-mustard/40 text-clay-brown text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-clay-terracotta" />
            <span>Order Confirmed • Ready for Print Queue</span>
          </div>

          <h1 className="font-serif font-black text-2xl sm:text-3xl text-clay-wine tracking-tight">
            Order Pickup Ticket
          </h1>

          <div className="inline-block bg-clay-pink-soft border border-clay-pink px-4 py-1.5 rounded-2xl font-mono text-clay-wine font-black text-lg tracking-wider">
            {order.orderNumber}
          </div>

          <p className="text-xs text-clay-brown-muted max-w-sm mx-auto">
            Please screenshot or show this QR code at the Dxlea Printing counter when claiming your items.
          </p>
        </div>

        {/* QR Code Card */}
        <div className="flex flex-col items-center justify-center p-6 rounded-4xl bg-clay-cream border-2 border-clay-paper shadow-sm max-w-xs mx-auto">
          <div ref={qrRef} className="p-2.5 bg-white rounded-2xl shadow-sm border border-clay-paper">
            <QRCodeSVG
              value={qrValue}
              size={180}
              level="H"
              fgColor="#382325"
              bgColor="#ffffff"
              includeMargin={true}
            />
          </div>
          <span className="font-mono text-xs font-bold text-clay-wine mt-3 tracking-widest">
            {order.orderNumber}
          </span>
          <span className="text-[10px] text-clay-brown-muted mt-0.5">
            Scan with phone or at counter
          </span>
        </div>

        {/* Live Status Progress Bar */}
        <div className="space-y-4 pt-4 border-t border-clay-paper">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="font-serif text-clay-wine">Order Status:</span>
            <span className={`px-3 py-1 rounded-full uppercase text-[10px] font-bold ${
              order.status === 'READY'
                ? 'bg-clay-sage/30 text-clay-sage-dark border border-clay-sage animate-pulse'
                : order.status === 'PRINTING'
                ? 'bg-clay-mustard-light text-clay-terracotta border border-clay-mustard'
                : order.status === 'COMPLETED'
                ? 'bg-clay-paper text-clay-brown'
                : 'bg-clay-pink/30 text-clay-wine border border-clay-pink'
            }`}>
              {order.status === 'PENDING' && 'Pending in Queue'}
              {order.status === 'PRINTING' && 'Currently Printing'}
              {order.status === 'READY' && 'Ready for Counter Claim!'}
              {order.status === 'COMPLETED' && 'Claimed & Completed'}
              {order.status === 'CANCELLED' && 'Cancelled'}
            </span>
          </div>

          {/* Stepper Indicators */}
          <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
            {[
              { step: 1, label: 'Received' },
              { step: 2, label: 'Printing' },
              { step: 3, label: 'Ready' },
              { step: 4, label: 'Claimed' },
            ].map((s) => {
              const isPastOrCurrent = currentStep >= s.step;
              const isCurrent = currentStep === s.step;
              return (
                <div key={s.step} className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      isCurrent
                        ? 'bg-clay-wine text-clay-milk shadow-md'
                        : isPastOrCurrent
                        ? 'bg-clay-sage text-clay-milk'
                        : 'bg-clay-paper text-clay-brown-muted'
                    }`}
                  >
                    {isPastOrCurrent && !isCurrent ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                  </div>
                  <span className={isPastOrCurrent ? 'text-clay-wine font-bold' : 'text-clay-brown-muted'}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Details Breakdown */}
        <div className="space-y-4 pt-4 border-t border-clay-paper text-xs">
          <div className="grid grid-cols-2 gap-3 p-4 rounded-3xl bg-clay-cream border border-clay-paper">
            <div>
              <span className="text-clay-brown-muted block text-[10px]">Customer:</span>
              <span className="font-bold text-clay-brown">{order.customerName}</span>
            </div>
            <div>
              <span className="text-clay-brown-muted block text-[10px]">Phone:</span>
              <span className="font-bold text-clay-brown font-mono">{order.customerPhone}</span>
            </div>
            <div>
              <span className="text-clay-brown-muted block text-[10px]">Target Claim:</span>
              <span className="font-bold text-clay-terracotta">{order.pickupTime || 'Today'}</span>
            </div>
            <div>
              <span className="text-clay-brown-muted block text-[10px]">Files Attached:</span>
              <span className="font-bold text-clay-brown">{order.files.length} file(s)</span>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm font-bold text-clay-wine pt-2 border-t border-clay-paper">
            <span className="font-serif text-base">Amount Due at Counter:</span>
            <span className="font-mono text-clay-wine text-2xl font-black">
              ₱{order.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Claim Notice */}
        <div className="p-4 rounded-3xl bg-clay-cream border border-clay-paper text-xs text-clay-brown flex items-start gap-3">
          <PackageCheck className="w-5 h-5 text-clay-terracotta flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-serif font-bold text-clay-wine block mb-0.5">How to claim your prints:</span>
            Show this QR code at the Dxlea Printing counter. We will scan your code, hand over your prints, and collect payment (Cash or GCash).
          </div>
        </div>
      </div>
    </div>
  );
}
