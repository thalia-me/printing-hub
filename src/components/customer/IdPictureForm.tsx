'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { IdPictureSpec, UploadedFileItem, IdPackageType } from '@/types';
import { DXLEA_ID_RATES } from '@/lib/pricing';
import {
  UserSquare2,
  Shirt,
  Check,
  UploadCloud,
  Camera,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Info,
  Scissors,
} from 'lucide-react';

interface IdPictureFormProps {
  files: UploadedFileItem[];
  onFilesChange: (files: UploadedFileItem[]) => void;
  spec: IdPictureSpec;
  onSpecChange: (spec: IdPictureSpec) => void;
  hideUpload?: boolean;
}

interface PackageMeta {
  id: IdPackageType;
  pkgNum: string;
  title: string;
  inclusion: string;
  price: string;
  counts: { twoByTwo: number; oneByOne: number; passport: number; oneHalf: number };
}

const ALL_ID_PACKAGES: PackageMeta[] = [
  { id: 'Package 1 (2pcs 2x2 & 4pcs 1x1) - ₱50', pkgNum: 'Package 1', title: '2pcs 2x2 & 4pcs 1x1', inclusion: 'Popular combo for school & job applications', price: '₱50.00', counts: { twoByTwo: 2, oneByOne: 4, passport: 0, oneHalf: 0 } },
  { id: 'Package 2 (4pcs 2x2 & 3pcs 1x1) - ₱50', pkgNum: 'Package 2', title: '4pcs 2x2 & 3pcs 1x1', inclusion: '4 pieces 2x2 + 3 pieces 1x1 prints', price: '₱50.00', counts: { twoByTwo: 4, oneByOne: 3, passport: 0, oneHalf: 0 } },
  { id: 'Package 3 (8pcs 1x1) - ₱50', pkgNum: 'Package 3', title: '8pcs 1x1', inclusion: 'Standard 1x1 batch for clearance & IDs', price: '₱50.00', counts: { twoByTwo: 0, oneByOne: 8, passport: 0, oneHalf: 0 } },
  { id: 'Package 4 (6pcs 2x2) - ₱50', pkgNum: 'Package 4', title: '6pcs 2x2', inclusion: 'Standard 2x2 batch for visa & exams', price: '₱50.00', counts: { twoByTwo: 6, oneByOne: 0, passport: 0, oneHalf: 0 } },
  { id: 'Package 5 (6pcs Passport Size) - ₱65', pkgNum: 'Package 5', title: '6pcs Passport Size', inclusion: 'Official 35x45mm DFA & Visa format', price: '₱65.00', counts: { twoByTwo: 0, oneByOne: 0, passport: 6, oneHalf: 0 } },
  { id: 'Package 6 (4pcs Passport Size & 2pcs 2x2) - ₱60', pkgNum: 'Package 6', title: '4pcs Passport & 2pcs 2x2', inclusion: 'Convenient passport + 2x2 combination', price: '₱60.00', counts: { twoByTwo: 2, oneByOne: 0, passport: 4, oneHalf: 0 } },
  { id: 'Package 7 (3pcs Passport Size & 6pcs 1x1) - ₱75', pkgNum: 'Package 7', title: '3pcs Passport & 6pcs 1x1', inclusion: 'All-around passport with 1x1 photos', price: '₱75.00', counts: { twoByTwo: 0, oneByOne: 6, passport: 3, oneHalf: 0 } },
  { id: 'Package 8 (6pcs 1.5x1.5) - ₱50', pkgNum: 'Package 8', title: '6pcs 1.5 x 1.5', inclusion: 'Specialty 1.5 inch square format', price: '₱50.00', counts: { twoByTwo: 0, oneByOne: 0, passport: 0, oneHalf: 6 } },
];

const BG_COLORS: Array<{ id: IdPictureSpec['backgroundColor']; label: string; colorClass: string; hexColor: string }> = [
  { id: 'White', label: 'White', colorClass: 'bg-white text-slate-800 border-slate-300', hexColor: '#FFFFFF' },
  { id: 'Royal Blue', label: 'Royal Blue', colorClass: 'bg-blue-600 text-white border-blue-500', hexColor: '#2563EB' },
  { id: 'Red', label: 'Red', colorClass: 'bg-red-600 text-white border-red-500', hexColor: '#DC2626' },
  { id: 'Neutral Gray', label: 'Soft Gray', colorClass: 'bg-stone-400 text-white border-stone-400', hexColor: '#9CA3AF' },
  { id: 'Original (As-Is)', label: 'Keep As-Is', colorClass: 'bg-amber-100 text-amber-900 border-amber-300', hexColor: '#FAF7F0' },
];

export default function IdPictureForm({
  files,
  onFilesChange,
  spec,
  onSpecChange,
  hideUpload = false,
}: IdPictureFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentPrice = DXLEA_ID_RATES[spec.packageType] || 50;
  const currentPkg = ALL_ID_PACKAGES.find(p => p.id === spec.packageType) || ALL_ID_PACKAGES[0];

  // Use dataUrl (which holds both object URLs and uploaded URLs)
  const uploadedPhoto = files[0];
  const photoSrc = uploadedPhoto?.dataUrl || '/images/sample-id.jpg';

  const currentBgMeta = BG_COLORS.find(b => b.id === spec.backgroundColor) || BG_COLORS[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const newItem: UploadedFileItem = {
      id: `id-photo-${Date.now()}`,
      name: selected.name,
      size: selected.size,
      type: selected.type,
      dataUrl: URL.createObjectURL(selected),
      isUploading: false,
    };

    onFilesChange([newItem]);

    // Background upload to API
    const formData = new FormData();
    formData.append('file', selected);
    fetch('/api/upload', { method: 'POST', body: formData })
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          onFilesChange([{ ...newItem, dataUrl: data.url, storage: data.storage }]);
        }
      })
      .catch(() => {});
  };

  const removePhoto = () => {
    onFilesChange([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* PHOTO PREVIEW & UPLOADER                                          */}
      {/* ================================================================ */}
      <div className="bg-clay-cream rounded-4xl p-6 sm:p-7 border border-clay-paper shadow-clay space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-clay-paper">
          <div>
            <span className="text-[10px] font-serif font-bold uppercase tracking-wider text-clay-terracotta block">
              Live Photo Simulation
            </span>
            <h3 className="font-serif font-black text-lg text-clay-wine flex items-center gap-2">
              <Camera className="w-5 h-5 text-clay-terracotta" />
              Rush ID Photo & Print Sheet Preview
            </h3>
          </div>
          {uploadedPhoto ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Your Photo Ready
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
              <Info className="w-3.5 h-3.5 text-clay-terracotta" />
              Showing Sample Photo
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Live Rush ID Cut-Sheet (7 cols) */}
          <div className="lg:col-span-7 bg-clay-milk p-5 rounded-3xl border border-clay-paper shadow-sm">
            <div className="flex items-center justify-between mb-3 text-xs text-clay-brown">
              <span className="font-serif font-bold text-clay-wine flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-clay-terracotta" />
                {currentPkg.pkgNum}: {currentPkg.title}
              </span>
              <span className="font-mono text-[11px] opacity-75">Dxlea Rush ID Print Sheet</span>
            </div>

            {/* Realistic ID Print Sheet matching photo studio cutlines */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 border border-zinc-200 shadow-sm max-w-sm mx-auto">
              <div className="flex items-center justify-between pb-1.5 mb-2.5 border-b border-zinc-200 text-[10px] text-zinc-500 font-mono">
                <span className="font-bold text-clay-wine">DXLEA STUDIO • {currentPkg.pkgNum.toUpperCase()}</span>
                <span>{currentPkg.title}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-100 font-bold text-zinc-600">GLOSSY</span>
              </div>

              {/* The exact border cutline grid */}
              <div className="bg-black p-[1px] shadow-sm overflow-hidden mx-auto">
                {/* Package 4 (6pcs 2x2) - EXACT match to user reference screenshot */}
                {spec.packageType === 'Package 4 (6pcs 2x2) - ₱50' && (
                  <div className="grid grid-cols-3 gap-[1px]">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`p4-${i}`} className="relative aspect-square overflow-hidden bg-white">
                        <Image src={photoSrc} alt="2x2 ID Photo" fill className="object-cover object-top" sizes="120px" priority />
                      </div>
                    ))}
                  </div>
                )}

                {/* Package 1 (2pcs 2x2 & 4pcs 1x1) */}
                {spec.packageType === 'Package 1 (2pcs 2x2 & 4pcs 1x1) - ₱50' && (
                  <div className="flex flex-col gap-[1px]">
                    <div className="grid grid-cols-2 gap-[1px]">
                      {[0, 1].map((i) => (
                        <div key={`p1-2x2-${i}`} className="relative aspect-square overflow-hidden bg-white">
                          <Image src={photoSrc} alt="2x2 ID Photo" fill className="object-cover object-top" sizes="160px" priority />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-4 gap-[1px]">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={`p1-1x1-${i}`} className="relative aspect-square overflow-hidden bg-white">
                          <Image src={photoSrc} alt="1x1 ID Photo" fill className="object-cover object-top" sizes="80px" priority />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Package 2 (4pcs 2x2 & 3pcs 1x1) */}
                {spec.packageType === 'Package 2 (4pcs 2x2 & 3pcs 1x1) - ₱50' && (
                  <div className="flex flex-col gap-[1px]">
                    <div className="grid grid-cols-2 gap-[1px]">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={`p2-2x2-${i}`} className="relative aspect-square overflow-hidden bg-white">
                          <Image src={photoSrc} alt="2x2 ID Photo" fill className="object-cover object-top" sizes="150px" priority />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-[1px]">
                      {[0, 1, 2].map((i) => (
                        <div key={`p2-1x1-${i}`} className="relative aspect-square overflow-hidden bg-white">
                          <Image src={photoSrc} alt="1x1 ID Photo" fill className="object-cover object-top" sizes="100px" priority />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Package 3 (8pcs 1x1) */}
                {spec.packageType === 'Package 3 (8pcs 1x1) - ₱50' && (
                  <div className="grid grid-cols-4 gap-[1px]">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={`p3-${i}`} className="relative aspect-square overflow-hidden bg-white">
                        <Image src={photoSrc} alt="1x1 ID Photo" fill className="object-cover object-top" sizes="80px" priority />
                      </div>
                    ))}
                  </div>
                )}

                {/* Package 5 (6pcs Passport Size) */}
                {spec.packageType === 'Package 5 (6pcs Passport Size) - ₱65' && (
                  <div className="grid grid-cols-3 gap-[1px]">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`p5-${i}`} className="relative aspect-[35/45] overflow-hidden bg-white">
                        <Image src={photoSrc} alt="Passport ID Photo" fill className="object-cover object-top" sizes="120px" priority />
                      </div>
                    ))}
                  </div>
                )}

                {/* Package 6 (4pcs Passport & 2pcs 2x2) */}
                {spec.packageType === 'Package 6 (4pcs Passport Size & 2pcs 2x2) - ₱60' && (
                  <div className="flex flex-col gap-[1px]">
                    <div className="grid grid-cols-4 gap-[1px]">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={`p6-pass-${i}`} className="relative aspect-[35/45] overflow-hidden bg-white">
                          <Image src={photoSrc} alt="Passport ID Photo" fill className="object-cover object-top" sizes="85px" priority />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-[1px]">
                      {[0, 1].map((i) => (
                        <div key={`p6-2x2-${i}`} className="relative aspect-square overflow-hidden bg-white">
                          <Image src={photoSrc} alt="2x2 ID Photo" fill className="object-cover object-top" sizes="160px" priority />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Package 7 (3pcs Passport & 6pcs 1x1) */}
                {spec.packageType === 'Package 7 (3pcs Passport Size & 6pcs 1x1) - ₱75' && (
                  <div className="flex flex-col gap-[1px]">
                    <div className="grid grid-cols-3 gap-[1px]">
                      {[0, 1, 2].map((i) => (
                        <div key={`p7-pass-${i}`} className="relative aspect-[35/45] overflow-hidden bg-white">
                          <Image src={photoSrc} alt="Passport ID Photo" fill className="object-cover object-top" sizes="110px" priority />
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-6 gap-[1px]">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={`p7-1x1-${i}`} className="relative aspect-square overflow-hidden bg-white">
                          <Image src={photoSrc} alt="1x1 ID Photo" fill className="object-cover object-top" sizes="60px" priority />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Package 8 (6pcs 1.5x1.5) */}
                {spec.packageType === 'Package 8 (6pcs 1.5x1.5) - ₱50' && (
                  <div className="grid grid-cols-3 gap-[1px]">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={`p8-${i}`} className="relative aspect-square overflow-hidden bg-white">
                        <Image src={photoSrc} alt="1.5x1.5 ID Photo" fill className="object-cover object-top" sizes="120px" priority />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 mt-2.5 border-t border-dashed border-zinc-200 flex items-center justify-between text-[9px] text-zinc-400 font-mono">
                <span>✂ SOLID PRE-CUT STUDIO BORDERS</span>
                <span>260GSM PREMIUM GLOSSY</span>
              </div>
            </div>

            {/* Status Ribbon */}
            <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-clay-brown gap-2 pt-2 border-t border-clay-paper">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-3 h-3 rounded-full border border-slate-300" style={{ backgroundColor: currentBgMeta.hexColor }}></span>
                BG: {currentBgMeta.label}
              </span>
              {spec.changeAttire ? (
                <span className="font-bold text-clay-wine bg-clay-mustard-light px-2.5 py-0.5 rounded-full border border-clay-mustard">
                  👔 Digital Attire: {spec.attireType || 'Formal Suit'} (+₱30)
                </span>
              ) : (
                <span className="text-clay-brown-muted">Standard Attire (As-is)</span>
              )}
            </div>
          </div>

          {/* RIGHT: Photo Uploader (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

            <div className="p-4 rounded-3xl bg-clay-milk border border-clay-paper space-y-3">
              <label className="font-serif font-bold text-xs text-clay-wine block">
                {uploadedPhoto ? 'Your Uploaded Portrait' : 'Upload Your Selfie or Portrait'}
              </label>

              {uploadedPhoto ? (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-clay-paper">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-clay-paper flex-shrink-0">
                    <Image src={uploadedPhoto.dataUrl || '/images/sample-id.png'} alt="Uploaded Portrait" fill className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-clay-wine truncate">{uploadedPhoto.name}</p>
                    <p className="text-[10px] text-clay-brown-muted font-mono mt-0.5">
                      {(uploadedPhoto.size / 1024).toFixed(1)} KB • Ready
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-[11px] font-bold text-clay-wine hover:underline flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /><span>Change</span>
                      </button>
                      <button type="button" onClick={removePhoto} className="text-[11px] font-bold text-red-600 hover:underline flex items-center gap-1">
                        <Trash2 className="w-3 h-3" /><span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 rounded-2xl border-2 border-dashed border-clay-terracotta/40 hover:border-clay-terracotta bg-white hover:bg-clay-pink-soft text-center transition-all group flex flex-col items-center justify-center gap-1.5"
                >
                  <div className="w-10 h-10 rounded-2xl bg-clay-pink-soft group-hover:scale-105 transition-transform flex items-center justify-center">
                    <UploadCloud className="w-5 h-5 text-clay-terracotta" />
                  </div>
                  <span className="font-serif font-bold text-xs text-clay-wine">Click to Upload Your Portrait</span>
                  <span className="text-[10px] text-clay-brown-muted">JPG or PNG selfie • Good lighting recommended</span>
                </button>
              )}

              <p className="text-[11px] text-clay-brown-muted leading-tight">
                💡 <strong className="text-clay-wine">Studio Touch-up Included:</strong> We automatically crop, center, and clean the background to official government and school dimensions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* SELECT RUSH ID PACKAGE                                            */}
      {/* ================================================================ */}
      <div className="bg-clay-cream rounded-4xl p-6 sm:p-7 border border-clay-paper shadow-clay space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-clay-paper">
          <div>
            <h3 className="font-serif font-bold text-base text-clay-wine flex items-center gap-2">
              <UserSquare2 className="w-4 h-4 text-clay-terracotta" />
              Select Rush ID Package
            </h3>
            <p className="text-xs text-clay-brown-muted">Choose your preferred photo dimensions and quantity</p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
            ₱{currentPrice}.00 / set
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ALL_ID_PACKAGES.map((pkg) => {
            const isSelected = spec.packageType === pkg.id;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => onSpecChange({ ...spec, packageType: pkg.id })}
                className={`p-4 rounded-3xl border text-left transition-all ${isSelected ? 'border-clay-terracotta bg-clay-pink-soft shadow-md ring-2 ring-clay-terracotta/40 scale-[1.01]' : 'border-clay-paper bg-clay-milk hover:border-clay-terracotta/50'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-clay-milk border border-clay-paper text-clay-wine">
                    {pkg.pkgNum}
                  </span>
                  <span className="text-xs font-mono font-bold text-clay-terracotta">{pkg.price}</span>
                </div>
                <h4 className="font-serif font-bold text-sm text-clay-wine flex items-center justify-between">
                  <span>{pkg.title}</span>
                  {isSelected && <Check className="w-4 h-4 text-clay-terracotta" />}
                </h4>
                <p className="text-[11px] text-clay-brown-muted mt-1 leading-snug">{pkg.inclusion}</p>

                {/* Size count badges */}
                <div className="mt-3 pt-2.5 border-t border-clay-paper/60 flex flex-wrap items-center gap-1.5">
                  {pkg.counts.twoByTwo > 0 && <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-clay-milk border border-clay-paper text-clay-wine">{pkg.counts.twoByTwo}× 2x2&quot;</span>}
                  {pkg.counts.passport > 0 && <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-clay-mustard-light border border-clay-mustard text-clay-brown">{pkg.counts.passport}× Passport</span>}
                  {pkg.counts.oneHalf > 0 && <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-clay-milk border border-clay-paper text-clay-wine">{pkg.counts.oneHalf}× 1.5&quot;</span>}
                  {pkg.counts.oneByOne > 0 && <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-clay-milk border border-clay-paper text-clay-wine">{pkg.counts.oneByOne}× 1x1&quot;</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* BACKGROUND COLOR                                                  */}
      {/* ================================================================ */}
      <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-3">
        <label className="font-serif font-bold text-sm text-clay-wine block">Select Background Color</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {BG_COLORS.map((bg) => {
            const isSelected = spec.backgroundColor === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => onSpecChange({ ...spec, backgroundColor: bg.id })}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${isSelected ? 'border-clay-wine bg-clay-pink-soft ring-2 ring-clay-wine shadow-sm' : 'border-clay-paper bg-clay-milk hover:bg-clay-paper'}`}
              >
                <span className={`w-6 h-6 rounded-full border shadow-sm ${bg.colorClass}`}></span>
                <span className={`text-xs font-bold ${isSelected ? 'text-clay-wine' : 'text-clay-brown'}`}>{bg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================ */}
      {/* DIGITAL ATTIRE CHANGE                                             */}
      {/* ================================================================ */}
      <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-clay-mustard-light border border-clay-mustard/40">
              <Shirt className="w-5 h-5 text-clay-terracotta" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-clay-wine">Digital Attire Change (Formal Suit / Barong)</p>
              <p className="text-xs text-clay-brown-muted">We digitally edit corporate attire (+₱30.00)</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={spec.changeAttire}
            onChange={(e) => onSpecChange({ ...spec, changeAttire: e.target.checked })}
            className="w-5 h-5 rounded-md border-clay-paper text-clay-wine focus:ring-clay-wine bg-clay-milk cursor-pointer"
          />
        </div>

        {spec.changeAttire && (
          <div className="pt-3 border-t border-clay-paper">
            <label className="text-xs font-bold text-clay-brown block mb-2">Select Attire Style:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Formal Suit', 'Barong / Traditional', 'Collared Shirt'] as const).map((attire) => (
                <button
                  key={attire}
                  type="button"
                  onClick={() => onSpecChange({ ...spec, attireType: attire })}
                  className={`p-2.5 rounded-xl border text-xs font-bold text-center ${spec.attireType === attire ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm' : 'border-clay-paper bg-clay-milk text-clay-brown'}`}
                >
                  {attire}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity / Sets */}
        <div className="pt-3 border-t border-clay-paper flex items-center justify-between">
          <div>
            <p className="font-serif font-bold text-xs text-clay-wine">Number of Packages / Sets</p>
            <p className="text-[11px] text-clay-brown-muted">Order multiple printed sets of this ID package</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSpecChange({ ...spec, copies: Math.max(1, (spec.copies || 1) - 1) })}
              className="w-8 h-8 rounded-full bg-clay-paper text-clay-wine font-bold text-base flex items-center justify-center hover:bg-clay-mustard-light active:scale-95 transition-all"
              aria-label="Decrease sets"
            >
              -
            </button>
            <span className="w-8 text-center font-mono font-bold text-clay-wine text-sm">
              {spec.copies || 1}
            </span>
            <button
              type="button"
              onClick={() => onSpecChange({ ...spec, copies: (spec.copies || 1) + 1 })}
              className="w-8 h-8 rounded-full bg-clay-paper text-clay-wine font-bold text-base flex items-center justify-center hover:bg-clay-mustard-light active:scale-95 transition-all"
              aria-label="Increase sets"
            >
              +
            </button>
            <span className="text-xs text-clay-brown-muted ml-1">
              {(spec.copies || 1) > 1 ? 'sets' : 'set'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
