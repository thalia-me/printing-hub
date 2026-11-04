import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getServerSupabase, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { 
  detectFileType, 
  getMaxUploadSizeBytes, 
  sanitizeDisplayName, 
  isValidCategory 
} from '@/lib/fileSecurity';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  const { path: storagePath, filename, category } = body || {};

  if (!storagePath || typeof storagePath !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Storage path is required.' },
      { status: 400 }
    );
  }

  // Prevent directory traversal in storagePath
  const cleanPath = storagePath.trim();
  const segments = cleanPath.split('/');
  if (segments.length !== 2 || segments.some(s => s === '..' || s === '.' || !s)) {
    return NextResponse.json(
      { success: false, error: 'Invalid storage path format.' },
      { status: 400 }
    );
  }

  const categoryName = segments[0].toLowerCase();
  if (!isValidCategory(categoryName)) {
    return NextResponse.json(
      { success: false, error: 'Invalid category in storage path.' },
      { status: 400 }
    );
  }

  const displayName = sanitizeDisplayName(filename);

  // 1. Verify object in Supabase Storage
  if (isServerSupabaseConfigured) {
    const supabase = getServerSupabase();
    if (supabase) {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'order-files';

      // Download the object to inspect signature and size
      const { data: blob, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(cleanPath);

      if (downloadError || !blob) {
        return NextResponse.json(
          { success: false, error: 'Uploaded file could not be found in storage.' },
          { status: 404 }
        );
      }

      const buffer = Buffer.from(await blob.arrayBuffer());

      // Size check
      const maxBytes = getMaxUploadSizeBytes();
      const maxMb = Math.round(maxBytes / (1024 * 1024));

      if (buffer.length === 0 || buffer.length > maxBytes) {
        // Exceeds allowed limit: Delete object immediately
        await supabase.storage.from(bucket).remove([cleanPath]);
        return NextResponse.json(
          {
            success: false,
            error: buffer.length === 0
              ? 'The uploaded file is empty.'
              : `File size exceeds the ${maxMb} MB limit.`,
          },
          { status: 400 }
        );
      }

      // 2. Magic byte file signature verification
      const detected = detectFileType(buffer);
      if (!detected) {
        // Disguised or disallowed file (e.g. HTML/JS disguised as PNG)
        // Purge immediately from storage
        await supabase.storage.from(bucket).remove([cleanPath]);
        return NextResponse.json(
          {
            success: false,
            error: 'Unsupported file format. Only JPG, PNG, WEBP, HEIC, and PDF files are allowed.',
          },
          { status: 400 }
        );
      }

      // 3. Record upload timestamp and metadata in pending_uploads for Phase 5 cleanup
      try {
        await supabase.from('pending_uploads').upsert(
          {
            storage_path: cleanPath,
            file_name: displayName,
            file_size: buffer.length,
            mime_type: detected.mime,
            category: categoryName,
            uploaded_at: new Date().toISOString(),
          },
          { onConflict: 'storage_path' }
        );
      } catch (err) {
        console.warn('[pending_uploads logging warning]:', err);
      }

      return NextResponse.json({
        success: true,
        storage: 'supabase',
        storagePath: cleanPath,
        name: displayName,
        size: buffer.length,
        type: detected.mime,
      });
    }
  }

  // 4. Local development fallback (when Supabase is unconfigured)
  if (process.env.NODE_ENV !== 'production') {
    const localBaseDir = path.join(process.cwd(), 'data', 'uploads');
    const localFilePath = path.join(localBaseDir, ...segments);

    if (!fs.existsSync(localFilePath)) {
      return NextResponse.json(
        { success: false, error: 'Local file not found.' },
        { status: 404 }
      );
    }

    const buffer = fs.readFileSync(localFilePath);
    const detected = detectFileType(buffer);
    if (!detected) {
      try { fs.unlinkSync(localFilePath); } catch {}
      return NextResponse.json(
        { success: false, error: 'Unsupported file format.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      storage: 'local',
      storagePath: cleanPath,
      url: `/api/admin/uploads/${cleanPath}`,
      name: displayName,
      size: buffer.length,
      type: detected.mime,
    });
  }

  return NextResponse.json(
    { success: false, error: 'Storage service unavailable.' },
    { status: 503 }
  );
}

