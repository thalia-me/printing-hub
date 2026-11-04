'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, X, File, Sparkles, CheckCircle2, Loader2, Cloud, AlertCircle } from 'lucide-react';
import { UploadedFileItem } from '@/types';

interface FileUploaderProps {
  files: UploadedFileItem[];
  onChange: (files: UploadedFileItem[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  label?: string;
}

export default function FileUploader({
  files,
  onChange,
  accept = 'image/jpeg,image/png,image/webp,image/heic,.heic,.heif,.jpg,.jpeg,.png,.webp,.pdf,application/pdf',
  multiple = true,
  maxFiles = 10,
  label = 'Upload photos or document files'
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);

    const filesToUpload = Array.from(fileList).filter((file) => {
      if (file.size === 0) {
        setUploadError(`File "${file.name}" is empty (0 bytes). Please select a valid file.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`File "${file.name}" exceeds the 10MB limit. Please choose a smaller file.`);
        return false;
      }
      return true;
    });

    if (filesToUpload.length === 0) return;

    // Create placeholder items with instant local previews
    const newItems: UploadedFileItem[] = filesToUpload.map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      isUploading: true,
      progress: 0,
      dataUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));

    let currentList = [...files, ...newItems];
    onChange(currentList);

    // Direct-to-Storage upload for each file (bypasses server body size limits)
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      const itemId = newItems[i].id;
      const category = file.type.startsWith('image/') ? 'photos' : 'documents';

      try {
        // 1. Call POST /api/upload/sign to obtain a pre-signed upload URL
        const signRes = await fetch('/api/upload/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: file.name,
            mimeType: file.type || 'application/octet-stream',
            size: file.size,
            category,
          }),
        });

        const signData = await signRes.json();
        if (!signRes.ok || !signData.success) {
          throw new Error(signData.error || `Upload authorization failed for "${file.name}".`);
        }

        // 2. Upload file directly to Supabase Storage with XMLHttpRequest for progress tracking
        if (signData.signedUrl) {
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', signData.signedUrl);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
                currentList = currentList.map((item) =>
                  item.id === itemId ? { ...item, progress: percent } : item
                );
                onChange(currentList);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
              } else {
                reject(new Error(`Direct storage upload failed with status ${xhr.status}.`));
              }
            };

            xhr.onerror = () => reject(new Error('Network error during storage upload.'));
            xhr.send(file);
          });
        }

        // 3. Call POST /api/upload/confirm for magic-byte verification and persistence
        const confirmRes = await fetch('/api/upload/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: signData.storagePath || signData.path,
            filename: file.name,
            category,
          }),
        });

        const confirmData = await confirmRes.json();
        if (!confirmRes.ok || !confirmData.success) {
          throw new Error(confirmData.error || `File verification failed for "${file.name}".`);
        }

        // Upload successfully completed & verified
        currentList = currentList.map((item) =>
          item.id === itemId
            ? {
                ...item,
                dataUrl: confirmData.url || item.dataUrl,
                storagePath: confirmData.storagePath,
                isUploading: false,
                progress: 100,
                storage: confirmData.storage || 'supabase',
              }
            : item
        );
        onChange(currentList);
      } catch (err: any) {
        console.error('File upload failed:', err);
        setUploadError(err.message || `Upload failed for "${file.name}". Please try again.`);
        currentList = currentList.filter((item) => item.id !== itemId);
        onChange(currentList);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    onChange(files.filter(f => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block font-serif font-bold text-sm text-clay-wine">
          {label}
        </label>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-clay-paper text-clay-brown-muted">
          {files.length}/{maxFiles} files added
        </span>
      </div>

      {uploadError && (
        <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="p-1 rounded-full text-rose-500 hover:text-rose-800 hover:bg-rose-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropzone with cozy paper feel */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-clay-terracotta bg-clay-pink-soft scale-[1.01]'
            : 'border-clay-terracotta/40 hover:border-clay-terracotta bg-clay-milk hover:bg-clay-cream/80'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-clay-pink/30 text-clay-wine flex items-center justify-center border border-clay-pink/50">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-clay-brown">
              <span className="text-clay-terracotta underline decoration-clay-mustard underline-offset-2">Tap or drag files here</span> to upload
            </p>
            <p className="text-xs text-clay-brown-muted mt-0.5">
              High resolution JPG, PNG, WEBP, HEIC, or PDF up to 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* Uploaded File Cards */}
      {files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-clay-milk border border-clay-paper text-left shadow-sm group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {file.dataUrl ? (
                  <img
                    src={file.dataUrl}
                    alt={file.name}
                    className="w-11 h-11 rounded-xl object-cover border border-clay-pink/40 flex-shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-clay-paper text-clay-wine flex items-center justify-center flex-shrink-0">
                    <File className="w-5 h-5" />
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-clay-brown truncate max-w-[150px]">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-clay-brown-muted">
                      {formatFileSize(file.size)}
                    </span>
                    {file.isUploading ? (
                      <span className="inline-flex items-center gap-1 text-[9px] text-clay-terracotta font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Uploading {file.progress !== undefined ? `${file.progress}%` : ''}</span>
                      </span>
                    ) : file.dataUrl ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-clay-sage-dark font-semibold">
                        <Cloud className="w-3 h-3" />
                        <span>Saved</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.id);
                }}
                className="p-1.5 rounded-full text-clay-brown-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
