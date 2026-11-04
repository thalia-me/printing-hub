import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getServerSupabase, isServerSupabaseConfigured, mapRowToOrder } from '@/lib/supabaseServer';
import { getAllOrders, saveAllOrders } from '@/lib/orderStore';
import { UploadedFileItem, Order } from '@/types';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  // 1. Verify staff administrator session
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const rawDays = Number(body?.days);
  const days = isNaN(rawDays) || rawDays < 1 ? 14 : Math.min(365, Math.floor(rawDays));

  const now = Date.now();
  const orderCutoff = new Date(now - days * 24 * 60 * 60 * 1000);
  const pendingCutoff = new Date(now - 24 * 60 * 60 * 1000); // 24 hours ago

  let removedOrderFilesCount = 0;
  let removedPendingCount = 0;
  let freedBytes = 0;

  try {
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'order-files';

    if (isServerSupabaseConfigured) {
      const supabase = getServerSupabase();
      if (supabase) {
        // A. Clean up files of COMPLETED & CANCELLED orders older than N days
        const { data: dbOrders, error: orderFetchError } = await supabase
          .from('orders')
          .select('*')
          .in('status', ['COMPLETED', 'CANCELLED']);

        if (!orderFetchError && Array.isArray(dbOrders)) {
          for (const row of dbOrders) {
            const updatedAt = new Date(row.updated_at || row.created_at);
            if (updatedAt < orderCutoff && Array.isArray(row.files)) {
              const files: UploadedFileItem[] = row.files;
              const pathsToDelete: string[] = [];
              let orderUpdated = false;

              const updatedFiles = files.map((file) => {
                if (!file.isRemoved && file.storagePath) {
                  pathsToDelete.push(file.storagePath);
                  freedBytes += file.size || 0;
                  removedOrderFilesCount++;
                  orderUpdated = true;
                  return {
                    ...file,
                    isRemoved: true,
                    removedAt: new Date().toISOString(),
                    dataUrl: undefined,
                  };
                }
                return file;
              });

              if (orderUpdated) {
                // Delete objects from Supabase storage
                if (pathsToDelete.length > 0) {
                  await supabase.storage.from(bucket).remove(pathsToDelete);
                }
                // Update order record in database with marked files
                await supabase
                  .from('orders')
                  .update({ files: updatedFiles })
                  .eq('id', row.id);
              }
            }
          }
        }

        // B. Clean up abandoned uploads older than 24 hours
        const { data: abandonedUploads, error: pendingError } = await supabase
          .from('pending_uploads')
          .select('*')
          .lt('uploaded_at', pendingCutoff.toISOString());

        if (!pendingError && Array.isArray(abandonedUploads) && abandonedUploads.length > 0) {
          const abandonedPaths = abandonedUploads.map(u => u.storage_path);
          freedBytes += abandonedUploads.reduce((acc, curr) => acc + (Number(curr.file_size) || 0), 0);
          removedPendingCount += abandonedPaths.length;

          await supabase.storage.from(bucket).remove(abandonedPaths);
          await supabase
            .from('pending_uploads')
            .delete()
            .in('storage_path', abandonedPaths);
        }
      }
    }

    // Local development fallback cleanup
    if (process.env.NODE_ENV !== 'production') {
      const localOrders = getAllOrders();
      let localModified = false;

      const updatedLocalOrders = localOrders.map((order) => {
        const isEligible = (order.status === 'COMPLETED' || order.status === 'CANCELLED') &&
          new Date(order.updatedAt || order.createdAt) < orderCutoff;

        if (isEligible && Array.isArray(order.files)) {
          const updatedFiles = order.files.map((file) => {
            if (!file.isRemoved && file.storagePath) {
              const localPath = path.join(process.cwd(), 'data', 'uploads', file.storagePath);
              try {
                if (fs.existsSync(localPath)) {
                  fs.unlinkSync(localPath);
                }
              } catch {}
              freedBytes += file.size || 0;
              removedOrderFilesCount++;
              localModified = true;
              return {
                ...file,
                isRemoved: true,
                removedAt: new Date().toISOString(),
                dataUrl: undefined,
              };
            }
            return file;
          });
          return { ...order, files: updatedFiles };
        }
        return order;
      });

      if (localModified) {
        saveAllOrders(updatedLocalOrders);
      }
    }

    const freedMb = (freedBytes / (1024 * 1024)).toFixed(2);
    const totalFilesRemoved = removedOrderFilesCount + removedPendingCount;

    return NextResponse.json({
      success: true,
      removedOrderFilesCount,
      removedPendingCount,
      totalFilesRemoved,
      freedBytes,
      freedMb,
      message: `Cleaned up ${totalFilesRemoved} file(s), freeing ${freedMb} MB of storage.`,
    });
  } catch (err: any) {
    console.error('[POST /api/admin/storage/cleanup Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to complete storage cleanup.' },
      { status: 500 }
    );
  }
}

