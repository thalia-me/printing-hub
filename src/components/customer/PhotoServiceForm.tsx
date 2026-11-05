'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import {
  PhotoPrintSpec,
  UploadedFileItem,
  PhotoPrintCategory,
} from '@/types';
import {
  calculatePhotoPrice,
} from '@/lib/pricing';
import FileUploader from './FileUploader';
import {
  Check,
  Sparkles,
  Film,
  Grid,
  Image as ImageIcon,
  Camera,
  UploadCloud,
  Trash2,
  RefreshCw,
  Star,
  Plus,
} from 'lucide-react';

interface PhotoServiceFormProps {
  files: UploadedFileItem[];
  onFilesChange: (files: UploadedFileItem[]) => void;
  spec: PhotoPrintSpec;
  onSpecChange: (spec: PhotoPrintSpec) => void;
  hideUpload?: boolean;
}

const CATEGORIES: Array<{ id: PhotoPrintCategory; title: string; subtitle: string; icon: any }> = [
  { id: 'Bundled Packs (Wallet / Instax)', title: 'Value Packs', subtitle: 'Wallet size & Instax sets (8 to 27 pcs)', icon: Grid },
  { id: 'Photostrips (S1, S2, S3)', title: 'Photostrips', subtitle: 'S1 Star Frame, S2 Film Strip, S3 Movie Ticket', icon: Film },
  { id: 'Standard & Instax Inspired', title: 'Standard & Frames', subtitle: '2R, 3R, 4R, 5R, 6R, 8R, A4 & Polaroid', icon: ImageIcon },
];

const BUNDLE_OPTIONS = [
  { id: 'Wallet Size (9 pcs - ₱60)' as const, label: 'Wallet Size (9 pcs)', price: '₱60.00', desc: 'Pocket 2.5x3.5" collection' },
  { id: 'Wallet Size (18 pcs - ₱120)' as const, label: 'Wallet Size (18 pcs)', price: '₱120.00', desc: 'Best value for family & friends' },
  { id: 'Wallet Size (27 pcs - ₱170)' as const, label: 'Wallet Size (27 pcs)', price: '₱170.00', desc: 'Mega wallet batch (Save ₱10)' },
  { id: 'Mini Instax (9 pcs - ₱75)' as const, label: 'Mini Instax (9 pcs)', price: '₱75.00', desc: 'Classic vintage white border look' },
  { id: 'Mini Instax (18 pcs - ₱145)' as const, label: 'Mini Instax (18 pcs)', price: '₱145.00', desc: '18 nostalgic polaroid-style prints' },
  { id: 'Mini Instax (27 pcs - ₱220)' as const, label: 'Mini Instax (27 pcs)', price: '₱220.00', desc: 'Mega instax pack for albums' },
  { id: 'Wide Instax (8 pcs - ₱65)' as const, label: 'Wide Instax (8 pcs)', price: '₱65.00', desc: 'Wider panoramic polaroid ratio' },
  { id: 'Wide Instax (16 pcs - ₱125)' as const, label: 'Wide Instax (16 pcs)', price: '₱125.00', desc: '16 pieces wide instax prints' },
  { id: 'Wide Instax (24 pcs - ₱190)' as const, label: 'Wide Instax (24 pcs)', price: '₱190.00', desc: '24 pieces wide instax collection' },
];

const VALUE_PACK_FORMATS = [
  {
    type: 'wallet',
    title: 'Wallet Size',
    dimensions: '2.5 × 3.5 inches',
    sampleImage: '/images/samples/wallet-size.png',
    tagline: 'Standard pocket size collection',
    defaultBundle: 'Wallet Size (9 pcs - ₱60)' as const,
    priceGuide: '9 pcs = ₱60 • 18 pcs = ₱120 • 27 pcs = ₱170',
    matches: (id: string) => id.startsWith('Wallet Size'),
  },
  {
    type: 'mini_instax',
    title: 'Mini Instax',
    dimensions: '2.1 × 3.4 inches',
    sampleImage: '/images/samples/mini-instax.png',
    tagline: 'Classic vintage white frame',
    defaultBundle: 'Mini Instax (9 pcs - ₱75)' as const,
    priceGuide: '9 pcs = ₱75 • 18 pcs = ₱145 • 27 pcs = ₱220',
    matches: (id: string) => id.startsWith('Mini Instax'),
  },
  {
    type: 'wide_instax',
    title: 'Wide Instax',
    dimensions: '3.4 × 4.2 inches',
    sampleImage: '/images/samples/wide-instax.png',
    tagline: 'Wide panoramic polaroid ratio',
    defaultBundle: 'Wide Instax (8 pcs - ₱65)' as const,
    priceGuide: '8 pcs = ₱65 • 16 pcs = ₱125 • 24 pcs = ₱190',
    matches: (id: string) => id.startsWith('Wide Instax'),
  },
];

const PHOTOSTRIP_STYLES = [
  { id: 'S1: Vintage Star Frame (3 photos)' as const, code: 'S1', title: 'S1: Vintage Star Frame', desc: 'Retro cream background with red star accents (3 photos)', pricing: '1pc = ₱50 • 3pcs = ₱120 • 6pcs = ₱200', slots: 3 },
  { id: 'S2: Film Strip Black Border (4 photos)' as const, code: 'S2', title: 'S2: Film Strip Frame', desc: 'Cinematic black 35mm film border (4 photos)', pricing: '2pcs = ₱75 • 4pcs = ₱120 • 6pcs = ₱180', slots: 4 },
  { id: 'S3: Movie Ticket Header (3 photos)' as const, code: 'S3', title: 'S3: Night Movie Ticket', desc: 'Vintage cinema ticket header + barcode (3 photos)', pricing: '1pc = ₱50 • 3pcs = ₱120 • 6pcs = ₱200', slots: 3 },
];

const STANDARD_SIZES: Array<{ id: NonNullable<PhotoPrintSpec['size']>; label: string; desc: string; price: string }> = [
  { id: '2R (Wallet Size)', label: '2R (Wallet Size)', desc: '2.5 x 3.5 in', price: '₱10.00' },
  { id: '3R', label: '3R Photo', desc: '3.5 x 5.0 in', price: '₱15.00' },
  { id: '4R', label: '4R (Standard)', desc: '4.0 x 6.0 in (Popular)', price: '₱20.00' },
  { id: '5R', label: '5R Photo', desc: '5.0 x 7.0 in', price: '₱35.00' },
  { id: '6R', label: '6R Photo', desc: '6.0 x 8.0 in', price: '₱50.00' },
  { id: '8R', label: '8R Frame Size', desc: '8.0 x 10.0 in', price: '₱85.00' },
  { id: 'A4', label: 'A4 Full Page', desc: '8.27 x 11.69 in', price: '₱110.00' },
  { id: 'Polaroid / Instax', label: 'Instax Single', desc: 'Polaroid style single', price: '₱25.00' },
];

// Sample images for strip slot previews when user hasn't uploaded yet
// Using local placeholder (Next.js remote images need config)
const SAMPLE_STRIP_PLACEHOLDER = '/images/sample-id.png';

export default function PhotoServiceForm({
  files,
  onFilesChange,
  spec,
  onSpecChange,
  hideUpload = false,
}: PhotoServiceFormProps) {
  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const targetSlotRef = useRef<number>(0);

  const currentTotal = calculatePhotoPrice(spec);
  const currentStripStyle = PHOTOSTRIP_STYLES.find(s => s.id === spec.photostripStyle) || PHOTOSTRIP_STYLES[0];
  const requiredSlots = currentStripStyle.slots;

  // Handle batch upload for all photostrip slots
  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedList = e.target.files;
    if (!selectedList || selectedList.length === 0) return;

    const filesArray = Array.from(selectedList).slice(0, requiredSlots);
    const newItems: UploadedFileItem[] = filesArray.map((file, index) => ({
      id: `strip-photo-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: URL.createObjectURL(file),
      isUploading: false,
    }));

    let currentList = [...newItems];
    onFilesChange(currentList);

    // Background sync
    filesArray.forEach((file, index) => {
      const formData = new FormData();
      formData.append('file', file);
      fetch('/api/upload', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          if (data.url) {
            currentList = currentList.map((it, idx) =>
              idx === index ? { ...it, dataUrl: data.url, storage: data.storage as UploadedFileItem['storage'] } : it
            );
            onFilesChange(currentList);
          }
        })
        .catch(() => {});
    });

    if (e.target) e.target.value = '';
  };

  const handleSlotUpload = (slotIndex: number) => {
    targetSlotRef.current = slotIndex;
    singleFileInputRef.current?.click();
  };

  const handleSingleSlotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const slotIndex = targetSlotRef.current;
    const newItem: UploadedFileItem = {
      id: `strip-slot-${Date.now()}-${slotIndex}`,
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl: URL.createObjectURL(file),
      isUploading: false,
    };

    const updated = [...files];
    updated[slotIndex] = newItem;
    onFilesChange(updated);

    const formData = new FormData();
    formData.append('file', file);
    fetch('/api/upload', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          const refreshed = [...updated];
          refreshed[slotIndex] = { ...newItem, dataUrl: data.url, storage: data.storage as UploadedFileItem['storage'] };
          onFilesChange(refreshed);
        }
      })
      .catch(() => {});

    if (e.target) e.target.value = '';
  };

  const removeSlotPhoto = (slotIndex: number) => {
    onFilesChange(files.filter((_, idx) => idx !== slotIndex));
  };

  return (
    <div className="space-y-6">
      {/* General Upload (hidden for photostrips since they have their own uploader) */}
      {!hideUpload && spec.category !== 'Photostrips (S1, S2, S3)' && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay">
          <FileUploader files={files} onChange={onFilesChange} accept="image/*" multiple maxFiles={30} label="Upload Your Photos" />
          <p className="text-xs text-clay-brown-muted mt-2">🌸 Tip: Upload multiple photos for bundles and standard frame prints.</p>
        </div>
      )}

      {/* Category Selector */}
      <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-serif font-bold text-base text-clay-wine flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-clay-terracotta" />
            Choose Photo Style & Format
          </label>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
            Estimated: ₱{currentTotal.toFixed(2)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {CATEGORIES.map((cat) => {
            const isSelected = spec.category === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  if (cat.id === 'Bundled Packs (Wallet / Instax)') {
                    onSpecChange({ ...spec, category: cat.id, bundlePack: spec.bundlePack || 'Wallet Size (9 pcs - ₱60)' });
                  } else if (cat.id === 'Photostrips (S1, S2, S3)') {
                    onSpecChange({ ...spec, category: cat.id, photostripStyle: spec.photostripStyle || 'S1: Vintage Star Frame (3 photos)', photostripQuantity: '1 pc' });
                  } else {
                    onSpecChange({ ...spec, category: cat.id, size: spec.size || '4R' });
                  }
                }}
                className={`p-3.5 rounded-3xl border text-left transition-all flex flex-col justify-between ${isSelected ? 'border-clay-terracotta bg-clay-pink-soft shadow-md ring-2 ring-clay-terracotta/40 scale-[1.01]' : 'border-clay-paper bg-clay-milk hover:border-clay-terracotta/50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-serif font-bold text-sm text-clay-wine">{cat.title}</span>
                  <Icon className="w-4 h-4 text-clay-terracotta" />
                </div>
                <p className="text-[11px] text-clay-brown-muted leading-tight">{cat.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* A. BUNDLED PACKS                                                  */}
      {/* ================================================================ */}
      {spec.category === 'Bundled Packs (Wallet / Instax)' && (
        <div className="space-y-5">
          {/* Visual Format Preview with Real Samples */}
          <div className="bg-clay-cream rounded-4xl p-5 sm:p-6 border border-clay-paper shadow-clay space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-serif font-bold text-sm text-clay-wine block">
                  1. Visual Format Preview & Samples
                </label>
                <p className="text-xs text-clay-brown-muted">
                  Tap a format to inspect the actual print size and style
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {VALUE_PACK_FORMATS.map((fmt) => {
                const isActive = spec.bundlePack ? fmt.matches(spec.bundlePack) : fmt.type === 'wallet';
                return (
                  <button
                    key={fmt.type}
                    type="button"
                    onClick={() => onSpecChange({ ...spec, bundlePack: fmt.defaultBundle })}
                    className={`p-3.5 rounded-3xl border text-left transition-all flex flex-col justify-between group ${
                      isActive
                        ? 'border-clay-terracotta bg-clay-pink-soft ring-2 ring-clay-terracotta/40 shadow-sm scale-[1.01]'
                        : 'border-clay-paper bg-clay-milk hover:border-clay-terracotta/50'
                    }`}
                  >
                    <div>
                      {/* Realistic Physical Photo Print Mockup */}
                      <div className="w-full h-44 rounded-2xl bg-gradient-to-b from-clay-paper/30 to-clay-paper/70 mb-3 border border-clay-paper/80 flex items-center justify-center p-3 relative overflow-hidden">
                        {fmt.type === 'wallet' && (
                          <div className="relative w-28 h-36 rounded-[3px] shadow-[0_10px_25px_-5px_rgba(50,25,30,0.25)] ring-1 ring-black/10 overflow-hidden bg-white p-1 -rotate-1 group-hover:rotate-0 transition-transform duration-300">
                            <div className="relative w-full h-full rounded-[2px] overflow-hidden">
                              <Image
                                src={fmt.sampleImage}
                                alt={fmt.title}
                                fill
                                className="object-cover"
                                sizes="120px"
                              />
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-white/30 pointer-events-none" />
                            </div>
                          </div>
                        )}

                        {fmt.type === 'mini_instax' && (
                          <div className="relative w-24 h-36 rounded-[3px] shadow-[0_10px_25px_-5px_rgba(50,25,30,0.25)] ring-1 ring-black/10 overflow-hidden bg-white p-1.5 pb-6 rotate-1 group-hover:rotate-0 transition-transform duration-300">
                            <div className="relative w-full h-full rounded-[2px] overflow-hidden">
                              <Image
                                src={fmt.sampleImage}
                                alt={fmt.title}
                                fill
                                className="object-cover"
                                sizes="100px"
                              />
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none" />
                            </div>
                          </div>
                        )}

                        {fmt.type === 'wide_instax' && (
                          <div className="relative w-36 h-28 rounded-[3px] shadow-[0_10px_25px_-5px_rgba(50,25,30,0.25)] ring-1 ring-black/10 overflow-hidden bg-white p-1.5 pb-5 -rotate-1 group-hover:rotate-0 transition-transform duration-300">
                            <div className="relative w-full h-full rounded-[2px] overflow-hidden">
                              <Image
                                src={fmt.sampleImage}
                                alt={fmt.title}
                                fill
                                className="object-cover"
                                sizes="150px"
                              />
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-white/25 pointer-events-none" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-xs text-clay-wine">
                          {fmt.title}
                        </span>
                        {isActive && <Check className="w-3.5 h-3.5 text-clay-terracotta" />}
                      </div>
                      <p className="text-[10px] text-clay-brown-muted mt-0.5">{fmt.dimensions}</p>
                      <p className="text-[11px] text-clay-brown-muted mt-1 leading-tight">{fmt.tagline}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-clay-paper/60">
                      <p className="text-[10px] font-mono font-bold text-clay-terracotta">
                        {fmt.priceGuide}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Package Selection */}
          <div className="bg-clay-cream rounded-4xl p-5 sm:p-6 border border-clay-paper shadow-clay space-y-3">
            <label className="font-serif font-bold text-sm text-clay-wine block">
              2. Select Quantity Pack & Price
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {BUNDLE_OPTIONS.map((pkg) => {
                const isSelected = spec.bundlePack === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => onSpecChange({ ...spec, bundlePack: pkg.id })}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm'
                        : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{pkg.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-clay-mustard" />}
                    </div>
                    <p className="text-[10px] opacity-80 mt-1 leading-tight">{pkg.desc}</p>
                    <p className={`text-xs font-mono font-bold mt-2 ${isSelected ? 'text-clay-mustard' : 'text-clay-terracotta'}`}>
                      {pkg.price}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* B. PHOTOSTRIPS — LIVE PREVIEW + PER-SLOT UPLOADER                */}
      {/* ================================================================ */}
      {spec.category === 'Photostrips (S1, S2, S3)' && (
        <div className="space-y-6">
          {/* Strip Style Selector */}
          <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
            <label className="font-serif font-bold text-sm text-clay-wine block">1. Select Photostrip Style Frame</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PHOTOSTRIP_STYLES.map((st) => {
                const isSelected = spec.photostripStyle === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onSpecChange({ ...spec, photostripStyle: st.id, photostripQuantity: st.code === 'S2' ? '2 pcs' : '1 pc' })}
                    className={`p-4 rounded-3xl border text-left transition-all ${isSelected ? 'border-clay-terracotta bg-clay-pink-soft shadow-sm ring-2 ring-clay-terracotta/40 scale-[1.01]' : 'border-clay-paper bg-clay-milk hover:border-clay-terracotta/40'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-serif font-bold text-xs text-clay-wine">{st.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-clay-terracotta" />}
                    </div>
                    <p className="text-[11px] text-clay-brown-muted leading-snug">{st.desc}</p>
                    <p className="text-[10px] font-mono font-bold text-clay-terracotta mt-2.5">{st.pricing}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Strip Preview + Per-Slot Uploader */}
          <div className="bg-clay-cream rounded-4xl p-6 sm:p-7 border border-clay-paper shadow-clay space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-clay-paper">
              <div>
                <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-clay-terracotta block">Interactive Photo Simulation</span>
                <h3 className="font-serif font-black text-lg text-clay-wine flex items-center gap-2">
                  <Film className="w-5 h-5 text-clay-terracotta" />
                  Photostrip Live Preview & Included Photos
                </h3>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-clay-paper text-clay-wine border border-clay-paper">
                {files.length} of {requiredSlots} photos uploaded
              </span>
            </div>

            {/* Hidden inputs */}
            <input type="file" ref={batchFileInputRef} onChange={handleBatchUpload} accept="image/*" multiple className="hidden" />
            <input type="file" ref={singleFileInputRef} onChange={handleSingleSlotChange} accept="image/*" className="hidden" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT: Photostrip Mockup */}
              <div className="lg:col-span-5 flex justify-center">
                <div className={`w-64 rounded-2xl shadow-xl border-4 overflow-hidden flex flex-col p-3 ${currentStripStyle.code === 'S2' ? 'bg-[#18181B] border-[#27272A] text-zinc-300' : currentStripStyle.code === 'S3' ? 'bg-[#FDFBF7] border-clay-brown text-clay-wine' : 'bg-[#FBF6EE] border-[#E8DCC4] text-clay-wine'}`}>
                  {/* Header */}
                  {currentStripStyle.code === 'S1' && (
                    <div className="text-center py-2 border-b border-dashed border-red-300/60 mb-2">
                      <div className="flex items-center justify-center gap-1.5 text-red-600 mb-0.5">
                        <Star className="w-3 h-3 fill-red-500" />
                        <span className="font-serif font-black tracking-widest text-xs uppercase">Dxlea Photo Booth</span>
                        <Star className="w-3 h-3 fill-red-500" />
                      </div>
                      <span className="text-[9px] font-mono tracking-wider opacity-60">MEMORIES IN S1 STAR FRAME</span>
                    </div>
                  )}
                  {currentStripStyle.code === 'S2' && (
                    <div className="flex items-center justify-between px-1 py-1 mb-2 border-b border-zinc-700 text-[9px] font-mono tracking-widest text-zinc-400">
                      <span>DXLEA 400 FILM</span><span>35MM • ISO 400</span>
                    </div>
                  )}
                  {currentStripStyle.code === 'S3' && (
                    <div className="text-center py-2 border-b-2 border-dashed border-clay-wine/40 mb-2">
                      <span className="text-[9px] font-serif font-black uppercase tracking-widest text-clay-terracotta block">★ CINEMA ADMIT ONE ★</span>
                      <span className="font-serif font-bold text-xs tracking-wide">DXLEA NIGHT THEATER</span>
                    </div>
                  )}

                  {/* Photo Slots */}
                  <div className="space-y-2.5 flex-1">
                    {Array.from({ length: requiredSlots }).map((_, slotIdx) => {
                      const userFile = files[slotIdx];
                      const slotSrc = userFile?.dataUrl || SAMPLE_STRIP_PLACEHOLDER;
                      const isReal = !!userFile;

                      return (
                        <div
                          key={`slot-${slotIdx}`}
                          className={`relative rounded-xl overflow-hidden aspect-[4/3] group ${currentStripStyle.code === 'S2' ? 'border-2 border-zinc-700 bg-zinc-900' : 'border-2 border-clay-paper bg-white'}`}
                        >
                          <Image src={slotSrc} alt={`Frame ${slotIdx + 1}`} fill className="object-cover object-top group-hover:scale-105 transition-transform duration-300" sizes="240px" />

                          {/* Film sprockets for S2 */}
                          {currentStripStyle.code === 'S2' && (
                            <>
                              <div className="absolute left-1 inset-y-0 flex flex-col justify-around py-1 pointer-events-none">
                                {[0,1,2].map(i => <div key={i} className="w-1.5 h-2 rounded-[2px] bg-white/40"></div>)}
                              </div>
                              <div className="absolute right-1 inset-y-0 flex flex-col justify-around py-1 pointer-events-none">
                                {[0,1,2].map(i => <div key={i} className="w-1.5 h-2 rounded-[2px] bg-white/40"></div>)}
                              </div>
                            </>
                          )}

                          <div className="absolute top-1.5 left-1.5 z-10">
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow ${isReal ? 'bg-emerald-600 text-white' : 'bg-black/60 text-white'}`}>
                              {isReal ? `Photo ${slotIdx + 1} ✓` : `Sample ${slotIdx + 1}`}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSlotUpload(slotIdx)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 cursor-pointer"
                          >
                            <Camera className="w-4 h-4 text-clay-mustard" />
                            {isReal ? 'Change Photo' : 'Upload Here'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer */}
                  {currentStripStyle.code === 'S1' && <div className="text-center pt-2 mt-2 border-t border-dashed border-red-300/60"><p className="font-serif italic text-[10px] text-red-700/80">Dxlea Keepsake Photostrip</p></div>}
                  {currentStripStyle.code === 'S2' && <div className="flex items-center justify-between px-1 pt-2 mt-2 border-t border-zinc-700 text-[8px] font-mono text-zinc-500"><span>FRAME 01-{requiredSlots}</span><span>HIGH-GLOSS FINISH</span></div>}
                  {currentStripStyle.code === 'S3' && <div className="text-center pt-2 mt-2 border-t border-clay-paper text-[8px] font-mono tracking-widest opacity-70">║▌║█║▌│║▌║▌█║ 09283-DXL</div>}
                </div>
              </div>

              {/* RIGHT: Slot Controls */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-3xl bg-clay-milk border border-clay-paper space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-clay-wine">Include Your Photos ({files.length} / {requiredSlots})</h4>
                      <p className="text-xs text-clay-brown-muted">Upload {requiredSlots} photos to fill this {currentStripStyle.title}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => batchFileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-clay-wine hover:bg-clay-wine-dark text-clay-milk text-xs font-serif font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-clay-mustard" />
                      Upload All {requiredSlots}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {Array.from({ length: requiredSlots }).map((_, slotIdx) => {
                      const userFile = files[slotIdx];
                      return (
                        <div key={`ctrl-${slotIdx}`} className="flex items-center justify-between p-3 rounded-2xl bg-white border border-clay-paper hover:border-clay-terracotta/40 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            {userFile ? (
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-clay-paper flex-shrink-0">
                                <Image src={userFile.dataUrl || ''} alt={`Slot ${slotIdx + 1}`} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-clay-paper flex items-center justify-center text-clay-brown-muted flex-shrink-0 font-serif font-bold text-xs">
                                #{slotIdx + 1}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-clay-wine truncate">{userFile ? userFile.name : `Photo Slot #${slotIdx + 1} (Empty)`}</p>
                              <p className="text-[10px] text-clay-brown-muted">{userFile ? `${(userFile.size / 1024).toFixed(1)} KB • Ready` : 'Click upload to add photo'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button type="button" onClick={() => handleSlotUpload(slotIdx)} className="px-2.5 py-1.5 rounded-lg bg-clay-paper hover:bg-clay-mustard-light text-clay-wine text-[11px] font-bold transition-colors flex items-center gap-1">
                              {userFile ? <RefreshCw className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              {userFile ? 'Replace' : 'Upload'}
                            </button>
                            {userFile && (
                              <button type="button" onClick={() => removeSlotPhoto(slotIdx)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors" title="Remove">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Strip Quantity */}
                  <div className="pt-3 border-t border-clay-paper space-y-2">
                    <label className="font-serif font-bold text-xs text-clay-wine block">Number of Printed Photostrips</label>
                    <div className="flex flex-wrap gap-2">
                      {spec.photostripStyle?.startsWith('S2') ? (
                        (['2 pcs', '4 pcs', '6 pcs'] as const).map((q) => {
                          const isSel = spec.photostripQuantity === q;
                          const price = q === '2 pcs' ? '₱75' : q === '4 pcs' ? '₱120' : '₱180';
                          return (
                            <button key={q} type="button" onClick={() => onSpecChange({ ...spec, photostripQuantity: q })}
                              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${isSel ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm' : 'border-clay-paper bg-white text-clay-brown hover:bg-clay-paper'}`}>
                              {q} ({price})
                            </button>
                          );
                        })
                      ) : (
                        (['1 pc', '3 pcs', '6 pcs'] as const).map((q) => {
                          const isSel = (spec.photostripQuantity || '1 pc') === q;
                          const price = q === '1 pc' ? '₱50' : q === '3 pcs' ? '₱120' : '₱200';
                          return (
                            <button key={q} type="button" onClick={() => onSpecChange({ ...spec, photostripQuantity: q })}
                              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${isSel ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm' : 'border-clay-paper bg-white text-clay-brown hover:bg-clay-paper'}`}>
                              {q} ({price})
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* C. STANDARD & INSTAX INSPIRED                                     */}
      {/* ================================================================ */}
      {spec.category === 'Standard & Instax Inspired' && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
          <label className="font-serif font-bold text-sm text-clay-wine block">Select Photo Dimensions</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {STANDARD_SIZES.map((sizeOpt) => {
              const isSelected = (spec.size || '4R') === sizeOpt.id;
              return (
                <button key={sizeOpt.id} type="button" onClick={() => onSpecChange({ ...spec, size: sizeOpt.id })}
                  className={`p-3 rounded-2xl border text-left transition-all ${isSelected ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm' : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'}`}>
                  <p className="text-xs font-bold">{sizeOpt.label}</p>
                  <p className="text-[10px] opacity-80 mt-0.5">{sizeOpt.desc}</p>
                  <p className={`text-xs font-mono font-bold mt-2 ${isSelected ? 'text-clay-mustard' : 'text-clay-terracotta'}`}>{sizeOpt.price}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* FINISH & QUANTITY                                                  */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-3">
          <label className="font-serif font-bold text-sm text-clay-wine block">Paper Finish</label>
          <div className="grid grid-cols-3 gap-2">
            {(['Glossy', 'Matte', 'Satin / Rough Matte'] as const).map((finish) => {
              const active = spec.finish === finish;
              return (
                <button key={finish} type="button" onClick={() => onSpecChange({ ...spec, finish })}
                  className={`p-2.5 text-center rounded-2xl border text-xs font-bold transition-all ${active ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm' : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'}`}>
                  {finish.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-3">
          <label className="font-serif font-bold text-sm text-clay-wine block">Border & Quantity</label>
          <div className="grid grid-cols-2 gap-2">
            {(['No Border', 'White Border'] as const).map((border) => (
              <button key={border} type="button" onClick={() => onSpecChange({ ...spec, border })}
                className={`p-2.5 text-center rounded-2xl border text-xs font-bold transition-all ${spec.border === border ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm' : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'}`}>
                {border}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-clay-brown">Copies / Sets:</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => onSpecChange({ ...spec, copies: Math.max(1, (spec.copies || 1) - 1) })}
                className="w-8 h-8 rounded-full bg-clay-paper text-clay-brown font-bold flex items-center justify-center hover:bg-clay-mustard-light">-</button>
              <span className="w-8 text-center font-bold text-clay-wine font-mono">{spec.copies || 1}</span>
              <button type="button" onClick={() => onSpecChange({ ...spec, copies: (spec.copies || 1) + 1 })}
                className="w-8 h-8 rounded-full bg-clay-paper text-clay-brown font-bold flex items-center justify-center hover:bg-clay-mustard-light">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
