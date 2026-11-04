import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getServerSupabase, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { validateUploadMetadata } from '@/lib/fileSecurity';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Rate Limiting: Max 20 upload sign requests per 10 minutes per IP
  const rateLimit = consumeRateLimit(`upload_sign:${ip}`, 20, 10 * 60 * 1000);
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

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  const { filename, mimeType, size, category } = body || {};

  // 2. Validate metadata before issuing signed URL
  const validation = validateUploadMetadata({
    filename,
    mimeType,
    size: Number(size),
    category: typeof category === 'string' ? category.toLowerCase().trim() : '',
  });

  if (!validation.valid || !validation.safeExt) {
    return NextResponse.json(
      { success: false, error: validation.error || 'Invalid upload metadata.' },
      { status: 400 }
    );
  }

  // 3. Generate unguessable server-side storage path
  const uniqueId = crypto.randomUUID();
  const cleanCategory = category.toLowerCase().trim();
  const storagePath = `${cleanCategory}/${uniqueId}.${validation.safeExt}`;

  // 4. Request a Supabase signed upload URL
  if (isServerSupabaseConfigured) {
    const supabase = getServerSupabase();
    if (supabase) {
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'order-files';
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(storagePath);

      if (!error && data?.signedUrl) {
        return NextResponse.json({
          success: true,
          storage: 'supabase',
          signedUrl: data.signedUrl,
          token: data.token,
          storagePath,
          path: storagePath,
        });
      } else {
        console.error('[POST /api/upload/sign Error]:', error?.message);
        return NextResponse.json(
          { success: false, error: 'Failed to generate storage upload URL. Please try again.' },
          { status: 500 }
        );
      }
    }
  }

  // In production, Supabase Storage must be configured
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Storage service unavailable.' },
      { status: 503 }
    );
  }

  // Fallback for local development if Supabase credentials are missing
  return NextResponse.json({
    success: true,
    storage: 'local-dev',
    storagePath,
    path: storagePath,
    localFallback: true,
  });
}

