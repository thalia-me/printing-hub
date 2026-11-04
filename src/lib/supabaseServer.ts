import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order, OrderStatus, UploadedFileItem } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl && 
  serviceRoleKey && 
  !supabaseUrl.includes('your-project-id') &&
  !serviceRoleKey.includes('your-service-role-key') &&
  !serviceRoleKey.includes('your-anon-public-key')
);

let serverClient: SupabaseClient | null = null;

export function getServerSupabase(): SupabaseClient | null {
  if (!isServerSupabaseConfigured) return null;
  if (!serverClient) {
    serverClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return serverClient;
}

/**
 * Generate short-lived signed URLs for private Supabase bucket files,
 * or authenticated admin URLs for local development fallback files.
 */
export async function signOrderFilesAsync(files: UploadedFileItem[]): Promise<UploadedFileItem[]> {
  if (!Array.isArray(files) || files.length === 0) return [];

  const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'order-files';
  const supabase = isServerSupabaseConfigured ? getServerSupabase() : null;

  return Promise.all(
    files.map(async (file) => {
      // 1. Supabase Storage files
      if (file.storage === 'supabase' && file.storagePath && supabase) {
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(file.storagePath, 3600); // 1-hour expiration

          if (!error && data?.signedUrl) {
            return {
              ...file,
              dataUrl: data.signedUrl,
            };
          }
        } catch (e) {
          console.warn('[signOrderFilesAsync error]:', e);
        }
      }

      // 2. Local fallback files in development
      if (file.storage === 'local' && file.storagePath) {
        return {
          ...file,
          dataUrl: `/api/admin/uploads/${file.storagePath}`,
        };
      }

      return file;
    })
  );
}

/**
 * Sign files on a single Order object for authenticated admin viewing.
 */
export async function signOrderAsync(order: Order): Promise<Order> {
  if (!order || !Array.isArray(order.files) || order.files.length === 0) {
    return order;
  }
  const signedFiles = await signOrderFilesAsync(order.files);
  return {
    ...order,
    files: signedFiles,
  };
}

/**
 * Sign files on an array of Order objects for authenticated admin viewing.
 */
export async function signOrdersAsync(orders: Order[]): Promise<Order[]> {
  if (!Array.isArray(orders)) return [];
  return Promise.all(orders.map(signOrderAsync));
}

// Convert DB snake_case row to Order object
export function mapRowToOrder(row: any): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    publicToken: row.public_token || `token-${row.id}`,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email || '',
    serviceType: row.service_type,
    status: row.status as OrderStatus,
    isRush: Boolean(row.is_rush),
    pickupTime: row.pickup_time || '',
    totalPrice: Number(row.total_price) || 0,
    notes: row.notes || '',
    items: Array.isArray(row.items) ? row.items : [],
    files: Array.isArray(row.files) ? row.files : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Convert Order object to DB snake_case row
export function mapOrderToRow(order: Order) {
  return {
    order_number: order.orderNumber,
    public_token: order.publicToken,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    customer_email: order.customerEmail || '',
    service_type: order.serviceType,
    status: order.status,
    is_rush: order.isRush,
    pickup_time: order.pickupTime,
    total_price: order.totalPrice,
    notes: order.notes,
    items: order.items,
    files: order.files,
  };
}
