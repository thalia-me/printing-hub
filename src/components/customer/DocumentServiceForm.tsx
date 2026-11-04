'use client';

import React from 'react';
import { DocumentPrintSpec, UploadedFileItem } from '@/types';
import { getDocPageRate, calculateDocPrice } from '@/lib/pricing';
import FileUploader from './FileUploader';
import { FileText, Palette, BookOpen, Layers, Check, Sparkles } from 'lucide-react';

interface DocumentServiceFormProps {
  files: UploadedFileItem[];
  onFilesChange: (files: UploadedFileItem[]) => void;
  spec: DocumentPrintSpec;
  onSpecChange: (spec: DocumentPrintSpec) => void;
  hideUpload?: boolean;
}

export default function DocumentServiceForm({
  files,
  onFilesChange,
  spec,
  onSpecChange,
  hideUpload = false
}: DocumentServiceFormProps) {
  const currentRate = getDocPageRate(spec);

  return (
    <div className="space-y-6">
      {/* 1. Upload Document (optional) */}
      {!hideUpload && (
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay">
          <FileUploader
            files={files}
            onChange={onFilesChange}
            accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
            multiple={true}
            maxFiles={10}
            label="1. Upload PDF, Word, or Document Scan"
          />
          <p className="text-xs text-clay-brown-muted mt-2">
            📄 PDF is strongly recommended to preserve exact fonts, margins, and page layouts.
          </p>
        </div>
      )}

      {/* 2. Document Type / Coverage Picker (Text Only vs Text with Picture vs Photocopy) */}
      <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-3">
        <label className="font-serif font-bold text-sm text-clay-wine flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-clay-terracotta" />
            {hideUpload ? 'Content Coverage / Print Type' : '2. Content Coverage / Print Type'}
          </span>
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-clay-mustard-light text-clay-brown border border-clay-mustard">
            ₱{currentRate}.00 / page
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              id: 'Text Only' as const,
              title: 'Text Only',
              desc: 'Modules, assignments, contracts & clean text',
            },
            {
              id: 'Text with Picture' as const,
              title: 'Text with Picture',
              desc: 'Reports, coloring pages, charts & illustrations',
            },
            {
              id: 'Photocopy / Scan' as const,
              title: 'Photocopy / Scan',
              desc: 'Certificate copies, ID scans & duplicate pages',
            },
          ].map((typeItem) => {
            const isSelected = spec.docType === typeItem.id;
            return (
              <button
                key={typeItem.id}
                type="button"
                onClick={() => onSpecChange({ ...spec, docType: typeItem.id })}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-clay-terracotta bg-clay-pink-soft shadow-sm ring-2 ring-clay-terracotta/40'
                    : 'border-clay-paper bg-clay-milk hover:border-clay-terracotta/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-serif font-bold ${isSelected ? 'text-clay-wine' : 'text-clay-brown'}`}>
                    {typeItem.title}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-clay-terracotta" />}
                </div>
                <p className="text-[10px] text-clay-brown-muted mt-1 leading-tight">{typeItem.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Color Mode & Paper Size */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Color Mode */}
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-3">
          <label className="font-serif font-bold text-sm text-clay-wine flex items-center gap-2">
            <Palette className="w-4 h-4 text-clay-terracotta" />
            3. Color Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Black & White', 'Partially Colored', 'Fully Colored'] as const).map((col) => {
              const isSelected = spec.colorMode === col;
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => onSpecChange({ ...spec, colorMode: col })}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm'
                      : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'
                  }`}
                >
                  <p className="text-[11px] font-bold">
                    {col === 'Black & White' ? 'B & W' : col.split(' ')[0]}
                  </p>
                  <p className="text-[9px] opacity-80 mt-0.5">
                    {col === 'Partially Colored' ? 'Partial' : col === 'Fully Colored' ? 'Full' : 'Mono'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Paper Size */}
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-3">
          <label className="font-serif font-bold text-sm text-clay-wine flex items-center gap-2">
            <FileText className="w-4 h-4 text-clay-terracotta" />
            4. Paper Size
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['Short', 'A4', 'Long'] as const).map((size) => {
              const isSelected = spec.paperSize === size;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onSpecChange({ ...spec, paperSize: size })}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm'
                      : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'
                  }`}
                >
                  <p className="text-xs font-bold">{size}</p>
                  <p className="text-[9px] opacity-80 mt-0.5">
                    {size === 'Short' ? '8.5x11' : size === 'A4' ? '8.27x11.69' : '8.5x13'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Duplex (Single-Sided vs Back-to-Back) & Page Count */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Duplex */}
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-3">
          <label className="font-serif font-bold text-sm text-clay-wine block">
            5. Printing Sides
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['Single-Sided', 'Back2Back'] as const).map((side) => {
              const isSelected = spec.duplex === side;
              return (
                <button
                  key={side}
                  type="button"
                  onClick={() => onSpecChange({ ...spec, duplex: side })}
                  className={`p-2.5 rounded-2xl border text-center text-xs font-bold transition-all ${
                    isSelected
                      ? 'border-clay-wine bg-clay-wine text-clay-milk shadow-sm'
                      : 'border-clay-paper bg-clay-milk text-clay-brown hover:bg-clay-paper'
                  }`}
                >
                  {side === 'Back2Back' ? 'Back to Back' : 'Single Sided'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Page Count */}
        <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-3">
          <label className="font-serif font-bold text-sm text-clay-wine block">
            6. Total Number of Pages
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              value={spec.pageCount}
              onChange={(e) => onSpecChange({ ...spec, pageCount: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-24 bg-clay-milk border border-clay-paper rounded-2xl px-3.5 py-2 text-clay-wine font-mono font-bold text-base focus:outline-none focus:border-clay-terracotta shadow-clay-inner"
            />
            <span className="text-xs text-clay-brown-muted">
              pages to print
            </span>
          </div>
        </div>
      </div>

      {/* 5. Binding & Formatting Assistance */}
      <div className="bg-clay-cream rounded-4xl p-6 border border-clay-paper shadow-clay space-y-4">
        <label className="font-serif font-bold text-sm text-clay-wine flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-clay-terracotta" />
          7. Binding & Finishing (Optional)
        </label>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'None' as const, label: 'Loose Sheets', price: 'Free' },
            { id: 'Corner Staple' as const, label: 'Corner Staple', price: '+₱5.00' },
            { id: 'Spiral / Ring Bind' as const, label: 'Spiral Bind', price: '+₱45.00' },
            { id: 'Hardbound' as const, label: 'Hardbound', price: '+₱180.00' },
          ].map((b) => {
            const isSelected = spec.binding === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => onSpecChange({ ...spec, binding: b.id })}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'border-clay-terracotta bg-clay-pink-soft shadow-sm ring-1 ring-clay-terracotta'
                    : 'border-clay-paper bg-clay-milk text-clay-brown hover:border-clay-terracotta/40'
                }`}
              >
                <p className="text-xs font-serif font-bold text-clay-wine">{b.label}</p>
                <p className="text-[10px] text-clay-terracotta font-mono font-bold mt-1">{b.price}</p>
              </button>
            );
          })}
        </div>

        {/* Note on editing / formatting */}
        <div className="pt-3 border-t border-clay-paper flex items-center justify-between">
          <div>
            <p className="font-serif font-bold text-xs text-clay-wine">File Formatting / Layout Assistance</p>
            <p className="text-[11px] text-clay-brown-muted">Check this if your file needs margin, layout, or font adjustments (+₱20)</p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(spec.needsFormatting)}
            onChange={(e) => onSpecChange({ ...spec, needsFormatting: e.target.checked })}
            className="w-4 h-4 rounded text-clay-wine focus:ring-clay-wine bg-clay-milk border-clay-paper cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
