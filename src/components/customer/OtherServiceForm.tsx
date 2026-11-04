'use client';

import React from 'react';
import { 
  OtherPrintSpec, 
  UploadedFileItem, 
  LaminationSize, 
  AppointmentAgency 
} from '@/types';
import { DXLEA_LAMINATION_RATES, calculateOtherPrice } from '@/lib/pricing';
import FileUploader from './FileUploader';
import { 
  Sparkles, 
  Shield, 
  Calendar, 
  Edit3, 
  Check, 
  Scan, 
  Layers, 
  Palette, 
  Flag,
  FileCheck
} from 'lucide-react';

interface OtherServiceFormProps {
  files: UploadedFileItem[];
  onFilesChange: (files: UploadedFileItem[]) => void;
  spec: OtherPrintSpec;
  onSpecChange: (spec: OtherPrintSpec) => void;
  hideUpload?: boolean;
}

const OTHER_SERVICES_LIST: Array<{ 
  id: OtherPrintSpec['subType']; 
  label: string; 
  desc: string; 
  priceBadge: string;
  icon: any;
}> = [
  { 
    id: 'Lamination', 
    label: 'Document Lamination', 
    desc: 'Heavy-duty heat seal protection from ID size up to Long', 
    priceBadge: 'From ₱25.00',
    icon: Shield
  },
  { 
    id: 'Scan Document', 
    label: 'Document Scanning', 
    desc: 'High-res scan to PDF or image file (soft copy)', 
    priceBadge: '₱8.00 / page',
    icon: Scan
  },
  { 
    id: 'Sticker Printing', 
    label: 'Sticker Printing', 
    desc: 'Waterproof & glossy vinyl sticker sheets (A4 Half & Full)', 
    priceBadge: 'From ₱35.00',
    icon: Layers
  },
  { 
    id: 'Layout / Graphic Design', 
    label: 'Layout & Graphic Design', 
    desc: 'Invitations, Tarpaulins, Resumes, Business Cards & Signages', 
    priceBadge: 'From ₱150.00',
    icon: Palette
  },
  { 
    id: 'Online Appointment', 
    label: 'Appointment Assistance', 
    desc: 'Online booking for PSA, SSS, Pag-IBIG, PhilHealth, NBI, DFA', 
    priceBadge: '₱60.00',
    icon: Calendar
  },
  { 
    id: 'Document Encoding / Typing', 
    label: 'Encoding / Typing Service', 
    desc: 'Professional document typing, encoding & manuscript prep', 
    priceBadge: '₱25.00 / page',
    icon: Edit3
  },
  { 
    id: 'Tarpaulin / Vinyl Banner', 
    label: 'Tarpaulin Banner', 
    desc: 'Outdoor vinyl banner with metal eyelets for events', 
    priceBadge: '₱25 / sq.ft',
    icon: Flag
  },
];

const LAMINATION_SIZES: LaminationSize[] = [
  'ID Size (2R 2.5x3.5")',
  '3R Size (3.5x5")',
  '4R Size (4x6")',
  '5R Size (5x7")',
  '6R Size (6x8")',
  '8R / Short (8.5x11")',
  'A4 Size (8.27x11.69")',
  'Long Size (8.5x13")',
];

const AGENCIES: AppointmentAgency[] = [
  'PSA (Birth/Marriage Certificate)',
  'SSS Appointment',
  'PAG-IBIG Fund',
  'PHILHEALTH',
  'NBI Clearance',
  'DFA Passport',
  'Other Agency',
];

const LAYOUT_TYPES: Array<NonNullable<OtherPrintSpec['layoutType']>> = [
  'Invitation (Wedding, Birthday, etc.)',
  'Tarpaulin Layout',
  'Thank-You Card',
  'Resume / CV Design',
  'Custom Sticker Design',
  'Business Card',
  'Signage / Banner',
  'Other Custom Layout',
];

export default function OtherServiceForm({
  files,
  onFilesChange,
  spec,
  onSpecChange,
  hideUpload = false
}: OtherServiceFormProps) {
  const currentTotal = calculateOtherPrice(spec);

  return (
    <div className="space-y-6">
      {/* 1. Upload File (optional) */}
      {!hideUpload && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay">
          <FileUploader
            files={files}
            onChange={onFilesChange}
            accept="image/*,application/pdf,.doc,.docx"
            multiple={true}
            maxFiles={10}
            label="1. Upload Documents / Design / Reference Files"
          />
          <p className="text-xs text-clay-brown-muted mt-2">
            {spec.subType === 'Online Appointment'
              ? 'Optional: You can upload valid IDs or previous appointment slips if needed.'
              : spec.subType === 'Document Encoding / Typing'
              ? 'Upload photos or scans of your handwritten manuscripts or draft documents.'
              : spec.subType === 'Scan Document'
              ? 'Upload photos of the physical documents, or bring them to the counter for walk-in scan.'
              : 'Upload reference images, layouts, logos, or documents to process.'}
          </p>
        </div>
      )}

      {/* 2. Select Specialized Service */}
      <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
        <label className="font-serif font-bold text-base text-clay-wine flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-clay-terracotta" />
            {hideUpload ? 'Choose Specialized Craft Service' : '2. Choose Specialized Service'}
          </span>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
            Subtotal: ₱{currentTotal.toFixed(2)}
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OTHER_SERVICES_LIST.map((srv) => {
            const isSelected = spec.subType === srv.id;
            const Icon = srv.icon;
            return (
              <button
                key={srv.id}
                type="button"
                onClick={() => onSpecChange({ ...spec, subType: srv.id })}
                className={`p-3.5 rounded-3xl border text-left transition-all ${
                  isSelected
                    ? 'border-clay-terracotta bg-clay-pink-soft shadow-md ring-2 ring-clay-terracotta/40 scale-[1.01]'
                    : 'border-clay-paper bg-clay-milk hover:border-clay-terracotta/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-xl ${isSelected ? 'bg-clay-wine text-clay-milk' : 'bg-clay-cream text-clay-brown'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-serif font-bold ${isSelected ? 'text-clay-wine' : 'text-clay-brown'}`}>
                      {srv.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-clay-terracotta">
                    {srv.priceBadge}
                  </span>
                </div>
                <p className="text-[11px] text-clay-brown-muted mt-2 pl-8 leading-snug">{srv.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Dynamic Configuration per Sub-Service */}
      
      {/* Option A: LAMINATION */}
      {spec.subType === 'Lamination' && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-serif font-bold text-sm text-clay-wine flex items-center gap-2">
              <Shield className="w-4 h-4 text-clay-terracotta" />
              Official Lamination Pricelist by Size
            </label>
            <span className="text-xs font-mono font-bold text-clay-terracotta">
              ₱{DXLEA_LAMINATION_RATES[spec.laminationSize || 'A4 Size (8.27x11.69")']}.00 / pc
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {LAMINATION_SIZES.map((size) => {
              const isSelected = (spec.laminationSize || 'A4 Size (8.27x11.69")') === size;
              const rate = DXLEA_LAMINATION_RATES[size];
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSpecChange({ ...spec, laminationSize: size })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm'
                      : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'
                  }`}
                >
                  <p className="text-xs font-bold leading-tight">{size.split('(')[0]}</p>
                  <p className="text-[10px] opacity-80 mt-0.5 font-mono">{size.includes('(') ? '(' + size.split('(')[1] : ''}</p>
                  <p className={`text-xs font-mono font-black mt-2 ${isSelected ? 'text-clay-mustard' : 'text-clay-terracotta'}`}>
                    ₱{rate}.00
                  </p>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-clay-brown-muted leading-relaxed pt-2 border-t border-clay-paper">
            📌 Note: The laminating fee covers laminating services only. Cutting, trimming, or any other additional requests are charged separately.
          </p>
        </div>
      )}

      {/* Option B: SCAN DOCUMENT */}
      {spec.subType === 'Scan Document' && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-serif font-bold text-sm text-clay-wine flex items-center gap-2">
              <Scan className="w-4 h-4 text-clay-terracotta" />
              Document Scanning Rate
            </label>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
              ₱8.00 / page
            </span>
          </div>

          <div className="flex items-center gap-4 bg-clay-milk p-4 rounded-3xl border border-clay-paper">
            <div>
              <label className="block text-xs font-serif font-bold text-clay-wine mb-1">
                Number of Pages to Scan:
              </label>
              <input
                type="number"
                min="1"
                value={spec.scanPages || 1}
                onChange={(e) => onSpecChange({ ...spec, scanPages: Math.max(1, parseInt(e.target.value) || 1) })}
                className="w-24 bg-clay-cream border border-clay-paper rounded-2xl px-3.5 py-2 text-clay-wine font-mono font-bold text-base focus:outline-none focus:border-clay-terracotta shadow-clay-inner"
              />
            </div>
            <div className="text-xs text-clay-brown-muted">
              <p className="font-bold text-clay-brown">High Resolution Flatbed / ADF Scan</p>
              <p>We convert physical documents to clear, searchable PDF or high-res JPGs.</p>
            </div>
          </div>
        </div>
      )}

      {/* Option C: STICKER PRINTING */}
      {spec.subType === 'Sticker Printing' && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-serif font-bold text-sm text-clay-wine flex items-center gap-2">
              <Layers className="w-4 h-4 text-clay-terracotta" />
              Sticker Sheet Size
            </label>
            <span className="text-xs font-mono font-bold text-clay-terracotta">
              {spec.stickerSize === 'A4 Half (₱35/page)' ? '₱35.00 / sheet' : '₱70.00 / sheet'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { id: 'A4 Half (₱35/page)', label: 'A4 Half Size (A5)', rate: '₱35.00', desc: 'Ideal for small logo batches, product labels & journaling' },
              { id: 'A4 Size (₱70/page)', label: 'A4 Full Sheet', rate: '₱70.00', desc: 'Full sheet yield — maximum number of cut-to-shape stickers' }
            ].map((st) => {
              const isSelected = (spec.stickerSize || 'A4 Size (₱70/page)') === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onSpecChange({ ...spec, stickerSize: st.id as any })}
                  className={`p-4 rounded-3xl border text-left transition-all ${
                    isSelected
                      ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-md'
                      : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold">{st.label}</span>
                    <span className={`text-xs font-mono font-bold ${isSelected ? 'text-clay-mustard' : 'text-clay-terracotta'}`}>
                      {st.rate}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-1 leading-snug">{st.desc}</p>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-clay-brown-muted pt-2 border-t border-clay-paper">
            🏷️ Printed on premium water-resistant vinyl paper. Smudge-proof and long-lasting colors.
          </p>
        </div>
      )}

      {/* Option D: LAYOUT / GRAPHIC DESIGN */}
      {spec.subType === 'Layout / Graphic Design' && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-serif font-bold text-sm text-clay-wine flex items-center gap-2">
              <Palette className="w-4 h-4 text-clay-terracotta" />
              Design & Layout Category
            </label>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
              Starts at ₱150.00
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {LAYOUT_TYPES.map((type) => {
              const isSelected = (spec.layoutType || 'Invitation (Wedding, Birthday, etc.)') === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => onSpecChange({ ...spec, layoutType: type })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm'
                      : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold">{type}</span>
                    {isSelected && <Check className="w-4 h-4 text-clay-mustard" />}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-clay-brown-muted pt-2 border-t border-clay-paper">
            🎨 Includes 2 revision rounds. Please write your preferred theme, colors, and wording in the notes below.
          </p>
        </div>
      )}

      {/* Option E: ONLINE APPOINTMENT */}
      {spec.subType === 'Online Appointment' && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-serif font-bold text-sm text-clay-wine flex items-center gap-2">
              <Calendar className="w-4 h-4 text-clay-terracotta" />
              Select Government / Agency Service
            </label>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
              ₱60.00 / appointment
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {AGENCIES.map((agency) => {
              const isSelected = (spec.appointmentAgency || 'PSA (Birth/Marriage Certificate)') === agency;
              return (
                <button
                  key={agency}
                  type="button"
                  onClick={() => onSpecChange({ ...spec, appointmentAgency: agency })}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm'
                      : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-serif font-bold">{agency}</span>
                    {isSelected && <Check className="w-4 h-4 text-clay-mustard" />}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-clay-brown-muted pt-2 border-t border-clay-paper">
            ✨ Include your appointment reference details or full name and requirements in the notes below.
          </p>
        </div>
      )}

      {/* Option F: DOCUMENT ENCODING */}
      {spec.subType === 'Document Encoding / Typing' && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
          <div className="flex items-center justify-between">
            <label className="font-serif font-bold text-sm text-clay-wine flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-clay-terracotta" />
              Document Encoding / Typing Service
            </label>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
              ₱25.00 / page
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={spec.encodingPages || 1}
              onChange={(e) => onSpecChange({ ...spec, encodingPages: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-24 bg-clay-milk border border-clay-paper rounded-2xl px-3.5 py-2 text-clay-wine font-mono font-bold text-base focus:outline-none focus:border-clay-terracotta shadow-clay-inner"
            />
            <span className="text-xs text-clay-brown-muted">
              Estimated number of pages to encode / type
            </span>
          </div>
        </div>
      )}

      {/* Option G: TARPAULIN / BANNER */}
      {spec.subType === 'Tarpaulin / Vinyl Banner' && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-3">
          <label className="font-serif font-bold text-xs text-clay-wine block">
            Banner Dimensions (Width x Height in feet)
          </label>
          <input
            type="text"
            placeholder="e.g. 2x3 feet, 3x5 ft, or 4x6 ft"
            value={spec.dimensions || ''}
            onChange={(e) => onSpecChange({ ...spec, dimensions: e.target.value })}
            className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-3.5 py-2.5 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner"
          />
        </div>
      )}

      {/* Quantity & Notes */}
      <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-serif font-bold text-xs text-clay-wine block">
            Quantity / Sets:
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSpecChange({ ...spec, quantity: Math.max(1, (spec.quantity || 1) - 1) })}
              className="w-8 h-8 rounded-full bg-clay-paper text-clay-brown font-bold flex items-center justify-center hover:bg-clay-mustard-light"
            >
              -
            </button>
            <span className="w-8 text-center font-bold text-clay-wine font-mono">
              {spec.quantity || 1}
            </span>
            <button
              type="button"
              onClick={() => onSpecChange({ ...spec, quantity: (spec.quantity || 1) + 1 })}
              className="w-8 h-8 rounded-full bg-clay-paper text-clay-brown font-bold flex items-center justify-center hover:bg-clay-mustard-light"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="font-serif font-bold text-xs text-clay-wine block mb-1">
            Finishing Instructions or Details:
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Include 4 corner eyelets; scan softcopy to my email; appointment preferred date/branch"
            value={spec.notes || ''}
            onChange={(e) => onSpecChange({ ...spec, notes: e.target.value })}
            className="w-full bg-clay-milk border border-clay-paper rounded-2xl px-3.5 py-2 text-xs text-clay-brown placeholder-clay-brown-muted focus:outline-none focus:border-clay-terracotta shadow-clay-inner"
          />
        </div>
      </div>
    </div>
  );
}
