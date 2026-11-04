import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getServerSupabase, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { 
  detectFileType, 
  isValidCategory, 
  getMaxUploadSizeBytes, 
  sanitizeDisplayName,
  DEFAULT_MAX_UPLOAD_SIZE_MB 
} from '@/lib/fileSecurity';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate Limiting: Max 20 uploads per 10 minutes per IP
  const rateLimit = consumeRateLimit(`upload:${ip}`, 20, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      {
        success: false,
        error: 'Upload rate limit reached. Please wait a few minutes before uploading more files.',
      },
      {
        status: 429,
        headers: { 'Retry-After': retryAfter.toString() },
      }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawCategory = (formData.get('category') as string) || 'documents';

    // 1. File Presence Check
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided. Please select a file to upload.' },
        { status: 400 }
      );
    }

    // 2. Category Allowlist Check
    const category = rawCategory.trim().toLowerCase();
    if (!isValidCategory(category)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid upload category. Allowed categories are: photos, ids, documents, other.',
        },
        { status: 400 }
      );
    }

    // 3. File Size Checks (Max 15MB configurable, Reject 0-byte files)
    const maxSizeBytes = getMaxUploadSizeBytes();
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));

    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: 'The selected file is empty (0 bytes). Please choose a valid file.' },
        { status: 400 }
      );
    }

    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the ${maxMb} MB limit. Please select a smaller file or compress it before uploading.`,
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: 'The selected file is empty (0 bytes). Please choose a valid file.' },
        { status: 400 }
      );
    }

    // 4. File Signature (Magic Bytes) Verification
    // Verifies actual binary content, preventing disguised files (e.g. evil.html named evil.png)
    const detected = detectFileType(buffer);
    if (!detected) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unsupported file format. Only JPG, PNG, WEBP, HEIC, and PDF files are allowed.',
        },
        { status: 400 }
      );
    }

    // 5. Generate Unguessable Safe Storage Path Server-Side
    // Original client filename is discarded for disk/cloud storage path (used only as sanitized display metadata)
    const safeExt = detected.ext;
    const uniqueFileId = crypto.randomUUID();
    const storagePath = `${category}/${uniqueFileId}.${safeExt}`;
    const displayName = sanitizeDisplayName(file.name);

    // 6. Primary Storage: Supabase Private Bucket
    if (isServerSupabaseConfigured) {
      const supabase = getServerSupabase();
      if (supabase) {
        const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'order-files';
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(storagePath, buffer, {
            contentType: detected.mime,
            upsert: false,
          });

        if (!uploadError) {
          return NextResponse.json({
            success: true,
            storage: 'supabase',
            storagePath,
            name: displayName,
            size: buffer.length,
            type: detected.mime,
          });
        } else {
          console.warn('[Supabase Storage Upload Warning]:', uploadError.message);
        }
      }
    }

    // 7. Fallback Storage Behavior
    // In production, local disk fallback is strictly disabled to prevent server disk exposure
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        {
          success: false,
          error: 'Storage service is currently unavailable. Please try again shortly.',
        },
        { status: 503 }
      );
    }

    // In development only: Save OUTSIDE public/ (into data/uploads) and serve only through an admin-protected route
    const localBaseDir = path.join(process.cwd(), 'data', 'uploads');
    const localTargetDir = path.join(localBaseDir, category);
    if (!fs.existsSync(localTargetDir)) {
      fs.mkdirSync(localTargetDir, { recursive: true });
    }

    const localFilePath = path.join(localTargetDir, `${uniqueFileId}.${safeExt}`);
    fs.writeFileSync(localFilePath, buffer);

    const devAdminUrl = `/api/admin/uploads/${storagePath}`;

    return NextResponse.json({
      success: true,
      storage: 'local',
      storagePath,
      url: devAdminUrl,
      name: displayName,
      size: buffer.length,
      type: detected.mime,
    });
  } catch (err: any) {
    console.error('[POST /api/upload Error]:', err);
    return NextResponse.json(
      { success: false, error: 'File upload failed. Please try again.' },
      { status: 500 }
    );
  }
}
