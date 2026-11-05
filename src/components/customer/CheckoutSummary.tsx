'use client';

import React from 'react';
import { Zap, Clock, ShieldCheck, ArrowRight, User, Phone, FileText } from 'lucide-react';

interface CheckoutSummaryProps {
  subtotal: number;
  isRush: boolean;
  onRushChange: (rush: boolean) => void;
  customerName: string;
  onCustomerNameChange: (val: string) => void;
  customerPhone: string;
  onCustomerPhoneChange: (val: string) => void;
  customerEmail: string;
  onCustomerEmailChange: (val: string) => void;
  pickupTime: string;
  onPickupTimeChange: (val: string) => void;
  notes: string;
  onNotesChange: (val: string) => void;
  filesCount?: number;
  bringFilesLater?: boolean;
  onBringFilesLaterChange?: (val: boolean) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
}

export default function CheckoutSummary({
  subtotal,
  isRush,
  onRushChange,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  customerEmail,
  onCustomerEmailChange,
  pickupTime,
  onPickupTimeChange,
  notes,
  onNotesChange,
  filesCount = 0,
  bringFilesLater = false,
  onBringFilesLaterChange,
  onSubmit,
  isSubmitting,
  canSubmit,
}: CheckoutSummaryProps) {
  const rushFee = isRush ? subtotal * 0.25 : 0;
  const grandTotal = subtotal + rushFee;

  return (
    <div className="bg-clay-cream p-6 sm:p-7 rounded-4xl border border-clay-paper shadow-clay space-y-6 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-clay-paper">
        <h3 className="font-serif font-bold text-lg text-clay-wine">Order Summary</h3>
        <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-clay-sage/30 text-clay-brown border border-clay-sage/40">
          ⚡ Quick Counter Pickup
        </span>
      </div>

      {/* Customer Contact Details */}
      <div className="space-y-3.5">
        <div>
          <label className="text-xs font-serif font-bold text-clay-wine flex items-center gap-1.5 mb-1">
            <User className="w-3.5 h-3.5 text-clay-terracotta" />
            Your Full Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Maria Santos"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-3.5 py-2.5 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner font-medium"
          />
        </div>

        <div>
          <label className="text-xs font-serif font-bold text-clay-wine flex items-center gap-1.5 mb-1">
            <Phone className="w-3.5 h-3.5 text-clay-terracotta" />
            Contact / Mobile Number *
          </label>
          <input
            type="tel"
            required
            placeholder="e.g. 0917-123-4567"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-3.5 py-2.5 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner font-mono"
          />
        </div>

        <div>
          <label className="text-xs font-serif font-bold text-clay-wine flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-clay-terracotta" />
            Target Claim Time
          </label>
          <select
            value={pickupTime}
            onChange={(e) => onPickupTimeChange(e.target.value)}
            className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-3 py-2.5 text-xs text-clay-brown focus:outline-none focus:border-clay-terracotta shadow-clay-inner font-medium"
          >
            <option value="Walk-in (Waiting at Store)">Walk-in (Waiting at Store)</option>
            <option value="In 30-45 Minutes (Express)">In 30-45 Minutes (Express)</option>
            <option value="Today within 2-3 Hours">Today within 2-3 Hours</option>
            <option value="Today before 6:00 PM Close">Today before 6:00 PM Close</option>
            <option value="Tomorrow Morning (9:00 AM - 12:00 PM)">Tomorrow Morning (9:00 AM - 12:00 PM)</option>
            <option value="Tomorrow Afternoon">Tomorrow Afternoon</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-serif font-bold text-clay-wine flex items-center gap-1.5 mb-1">
            <FileText className="w-3.5 h-3.5 text-clay-terracotta" />
            Special Notes / Requests (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Trim border, glossy finish, call when ready"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-3.5 py-2 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner"
          />
        </div>
      </div>

      {/* Rush Order Switch */}
      <div className="p-3.5 rounded-2xl bg-clay-mustard-light border border-clay-mustard/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-clay-mustard text-clay-milk shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-serif font-bold text-clay-brown">Priority Rush (+25%)</p>
            <p className="text-[10px] text-clay-brown-muted">Fastest turnaround at print queue</p>
          </div>
        </div>
        <input
          type="checkbox"
          checked={isRush}
          onChange={(e) => onRushChange(e.target.checked)}
          className="w-4 h-4 rounded text-clay-wine focus:ring-clay-wine bg-clay-milk border-clay-paper cursor-pointer"
        />
      </div>

      {/* Bring Files Option (USB / Bluetooth / Messenger) */}
      {onBringFilesLaterChange && filesCount === 0 && (
        <label className="p-3 rounded-2xl bg-clay-milk border border-clay-paper flex items-center justify-between cursor-pointer hover:border-clay-terracotta/40 transition-colors">
          <div className="pr-2">
            <p className="text-xs font-serif font-bold text-clay-wine">Transfer files in store</p>
            <p className="text-[10px] text-clay-brown-muted">Bring USB flash drive or send via Messenger at the counter</p>
          </div>
          <input
            type="checkbox"
            checked={bringFilesLater}
            onChange={(e) => onBringFilesLaterChange(e.target.checked)}
            className="w-4 h-4 rounded text-clay-wine focus:ring-clay-wine bg-white border-clay-paper cursor-pointer"
          />
        </label>
      )}

      {/* Pricing Breakdown */}
      <div className="space-y-2 pt-2 border-t border-clay-paper text-xs">
        <div className="flex justify-between text-clay-brown-muted">
          <span>Subtotal:</span>
          <span className="font-mono font-bold text-clay-brown">₱{subtotal.toFixed(2)}</span>
        </div>
        {isRush && (
          <div className="flex justify-between text-clay-terracotta">
            <span>Rush Expedite Fee:</span>
            <span className="font-mono font-bold">+₱{rushFee.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm font-bold text-clay-wine pt-2 border-t border-clay-paper">
          <span className="font-serif">Estimated Total:</span>
          <span className="font-mono text-clay-wine text-xl font-black">
            ₱{grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Submission Checklist Reminder when invalid */}
      {!canSubmit && !isSubmitting && (
        <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
          <p className="font-bold text-[11px] text-amber-800">Remaining to submit:</p>
          <ul className="text-[11px] list-disc list-inside space-y-0.5 text-amber-700">
            {customerName.trim().length <= 1 && <li>Enter your Full Name</li>}
            {customerPhone.trim().length < 7 && <li>Enter Contact Number (at least 7 digits)</li>}
            {filesCount === 0 && !bringFilesLater && <li>Upload a file or check "Transfer files in store"</li>}
          </ul>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="button"
        disabled={!canSubmit || isSubmitting}
        onClick={onSubmit}
        className={`w-full py-3.5 px-4 rounded-full font-serif font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
          canSubmit && !isSubmitting
            ? 'bg-clay-wine hover:bg-clay-wine-dark text-clay-milk shadow-clay active:scale-98'
            : 'bg-clay-paper text-clay-brown-muted cursor-not-allowed border border-clay-paper'
        }`}
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-clay-milk/40 border-t-clay-milk rounded-full animate-spin"></span>
            <span>Uploading & Generating QR...</span>
          </>
        ) : (
          <>
            <span>Submit Order & Get Pickup QR</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-clay-brown-muted text-center pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-clay-sage-dark" />
        <span>Pay cash or GCash at the counter upon claim</span>
      </div>
    </div>
  );
}
