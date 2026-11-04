import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getServerSupabase, isServerSupabaseConfigured } from '@/lib/supabaseServer';

const ONE_GB_BYTES = 1024 * 1024 * 1024; // 1,073,741,824 bytes

export async function GET(req: NextRequest) {
  // 1. Verify staff administrator session
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    let fileCount = 0;
    let totalBytes = 0;

    if (isServerSupabaseConfigured) {
      const supabase = getServerSupabase();
      if (supabase) {
        const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'order-files';
        const categories = ['photos', 'ids', 'documents', 'other'];

        for (const cat of categories) {
          const { data, error } = await supabase.storage
            .from(bucket)
            .list(cat, { limit: 1000 });

          if (!error && Array.isArray(data)) {
            for (const item of data) {
              if (item.name && item.id) {
                fileCount++;
                totalBytes += item.metadata?.size || 0;
              }
            }
          }
        }
      }
    }

    const usagePercent = Math.min(100, (totalBytes / ONE_GB_BYTES) * 100);
    const threshold = parseInt(process.env.STORAGE_WARNING_THRESHOLD_PERCENT || '80', 10);
    const isWarning = usagePercent >= threshold;

    return NextResponse.json({
      success: true,
      fileCount,
      totalBytes,
      totalMb: (totalBytes / (1024 * 1024)).toFixed(2),
      totalCapacityMb: 1024,
      usagePercent: Number(usagePercent.toFixed(1)),
      threshold,
      warning: isWarning,
    });
  } catch (err: any) {
    console.error('[GET /api/admin/storage Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve storage metrics.' },
      { status: 500 }
    );
  }
}

