'use client';

import React from 'react';
import { Order, OrderStatus } from '@/types';
import { 
  X, 
  Phone, 
  Clock, 
  Download, 
  FileText, 
  Zap,
  Trash2
} from 'lucide-react';

interface OrderDetailModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusUpdate: (orderId: string, status: OrderStatus) => void;
  onDelete?: (orderId: string) => void;
}

export default function OrderDetailModal({
  order,
  onClose,
  onStatusUpdate,
  onDelete,
}: OrderDetailModalProps) {
  if (!order) return null;

  const STATUS_OPTIONS: OrderStatus[] = ['PENDING', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-clay-milk w-full max-w-2xl my-8 rounded-5xl border-4 border-clay-milk/60 p-6 sm:p-8 space-y-6 relative shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base font-bold text-clay-wine">
                {order.orderNumber}
              </span>
              {order.isRush && (
                <span className="px-2.5 py-0.5 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard text-[10px] font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-clay-terracotta" /> Priority Rush
                </span>
              )}
            </div>
            <p className="text-xs text-clay-brown-muted mt-1">
              Received: {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-clay-paper text-clay-brown hover:bg-clay-cream"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Control Bar */}
        <div className="p-3.5 rounded-3xl bg-clay-cream border border-clay-paper flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-serif font-bold text-clay-wine">Update Order Status:</span>
          <div className="flex flex-wrap items-center gap-1.5">
            {STATUS_OPTIONS.map((st) => {
              const isActive = order.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => onStatusUpdate(order.id, st)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? st === 'READY'
                        ? 'bg-clay-sage text-clay-milk shadow-md ring-2 ring-clay-sage'
                        : st === 'PRINTING'
                        ? 'bg-clay-terracotta text-clay-milk ring-2 ring-clay-terracotta'
                        : st === 'COMPLETED'
                        ? 'bg-clay-brown text-clay-milk'
                        : st === 'CANCELLED'
                        ? 'bg-rose-700 text-white'
                        : 'bg-clay-mustard text-clay-brown shadow-sm'
                      : 'bg-clay-milk text-clay-brown hover:bg-clay-paper border border-clay-paper'
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Information Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-3xl bg-clay-cream border border-clay-paper">
          <div>
            <span className="text-[10px] text-clay-brown-muted block">Customer Name</span>
            <span className="font-serif font-bold text-clay-wine text-sm">{order.customerName}</span>
          </div>

          <div>
            <span className="text-[10px] text-clay-brown-muted block">Contact Phone</span>
            <a
              href={`tel:${order.customerPhone}`}
              className="inline-flex items-center gap-1.5 font-bold text-clay-terracotta hover:underline text-xs font-mono"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{order.customerPhone}</span>
            </a>
          </div>

          <div>
            <span className="text-[10px] text-clay-brown-muted block">Target Pickup</span>
            <span className="font-bold text-clay-brown text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-clay-terracotta" />
              {order.pickupTime || 'Standard'}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-clay-brown-muted block">Service Category</span>
            <span className="font-bold text-clay-wine text-xs uppercase">
              {order.serviceType}
            </span>
          </div>

          {order.notes && (
            <div className="sm:col-span-2 pt-2 border-t border-clay-paper">
              <span className="text-[10px] text-clay-brown-muted block">Customer Notes:</span>
              <p className="text-xs text-clay-terracotta font-medium mt-0.5">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Items Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-serif font-bold text-clay-wine uppercase tracking-wider">
            Job Items & Specifications
          </h4>

          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-3xl bg-clay-cream border border-clay-paper space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-serif font-bold text-sm text-clay-wine">{item.title}</span>
                <span className="font-mono font-bold text-clay-wine text-sm">
                  ₱{item.subtotal.toFixed(2)}
                </span>
              </div>

              <div className="bg-clay-milk p-2.5 rounded-2xl border border-clay-paper text-[11px] text-clay-brown font-mono space-y-1">
                {Object.entries(item.specifications || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-clay-brown-muted capitalize">{k}:</span>
                    <span className="text-clay-brown font-semibold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Uploaded Files */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-serif font-bold text-clay-wine uppercase tracking-wider">
              Customer Files ({order.files.length})
            </h4>
            <span className="text-[11px] text-clay-brown-muted">Download for physical printer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {order.files.map((file) => (
              <div
                key={file.id}
                className="p-3 rounded-2xl bg-clay-cream border border-clay-paper flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {file.dataUrl && !file.isRemoved ? (
                    <img
                      src={file.dataUrl}
                      alt={file.name}
                      className="w-12 h-12 rounded-xl object-cover border border-clay-paper flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-clay-paper text-clay-wine flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-clay-brown truncate max-w-[150px]">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-clay-brown-muted">
                      {file.isRemoved ? (
                        <span className="text-rose-700 font-semibold">File removed (Cleaned up)</span>
                      ) : (
                        `${(file.size / 1024).toFixed(0)} KB`
                      )}
                    </p>
                  </div>
                </div>

                {file.isRemoved ? (
                  <span className="px-2.5 py-1 rounded-xl bg-clay-paper text-[10px] font-bold text-clay-brown-muted italic">
                    Removed
                  </span>
                ) : file.dataUrl ? (
                  <a
                    href={file.dataUrl}
                    download={file.name}
                    className="p-2 rounded-xl bg-clay-wine text-clay-milk hover:bg-clay-wine-dark transition-colors"
                    title="Download original file"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-clay-paper flex items-center justify-between">
          <div>
            <span className="text-xs text-clay-brown-muted block font-serif">Counter Total Due:</span>
            <span className="text-2xl font-black text-clay-wine font-mono">
              ₱{order.totalPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete order ${order.orderNumber}?`)) {
                    onDelete(order.id);
                  }
                }}
                className="p-2.5 rounded-full bg-rose-100 text-rose-700 hover:bg-rose-200 text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-clay-wine hover:bg-clay-wine-dark text-xs font-serif font-bold text-clay-milk transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
