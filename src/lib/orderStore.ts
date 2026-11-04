import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Order, OrderStatus } from '@/types';
import { 
  getServerSupabase, 
  isServerSupabaseConfigured, 
  mapRowToOrder, 
  mapOrderToRow 
} from './supabaseServer';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'orders.json');

/**
 * Generate a cryptographically secure random token (144-bit entropy, base64url).
 * Safe for use in customer receipt URLs and QR codes.
 */
export function generatePublicToken(): string {
  return crypto.randomBytes(18).toString('base64url');
}

/**
 * Masks a phone number for public receipt display (e.g. 0946****772).
 */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return '';
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length <= 4) {
    return '****';
  }
  if (digitsOnly.length === 11) {
    // Standard Philippine mobile e.g. 09461234772 -> 0946****772
    return `${digitsOnly.slice(0, 4)}****${digitsOnly.slice(8)}`;
  }
  if (digitsOnly.length > 7) {
    const prefixLen = Math.min(4, Math.floor(digitsOnly.length / 3));
    const suffixLen = Math.min(3, Math.floor(digitsOnly.length / 3));
    return `${digitsOnly.slice(0, prefixLen)}****${digitsOnly.slice(digitsOnly.length - suffixLen)}`;
  }
  return `${digitsOnly.slice(0, 2)}****${digitsOnly.slice(digitsOnly.length - 2)}`;
}

const shouldLoadDemoOrders = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_DATA === 'true';

const DEMO_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'PRT-20261029-A1B2',
    publicToken: 'sample_token_sarah_jenkins_101',
    customerName: 'Sarah Jenkins',
    customerPhone: '0917-555-8921',
    customerEmail: 'sarah.j@example.com',
    serviceType: 'PHOTO',
    status: 'PENDING',
    isRush: true,
    pickupTime: 'Today at 3:00 PM',
    notes: 'Please ensure high gloss finish, for family album.',
    totalPrice: 150.00,
    items: [
      {
        id: 'item-1',
        serviceType: 'PHOTO',
        title: '4R Photo Prints (Glossy)',
        specifications: {
          size: '4R',
          finish: 'Glossy',
          border: 'White Border',
          copies: 6,
        },
        quantity: 6,
        unitPrice: 20.00,
        subtotal: 120.00,
      }
    ],
    files: [
      {
        id: 'f-1',
        name: 'vacation_family_01.jpg',
        size: 2450000,
        type: 'image/jpeg',
        dataUrl: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600&auto=format&fit=crop&q=80',
      },
      {
        id: 'f-2',
        name: 'vacation_beach_02.jpg',
        size: 3100000,
        type: 'image/jpeg',
        dataUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'ord-102',
    orderNumber: 'PRT-20261029-C3D4',
    publicToken: 'sample_token_michael_tan_102',
    customerName: 'Michael Tan',
    customerPhone: '0928-888-1422',
    customerEmail: 'mtan.dev@gmail.com',
    serviceType: 'ID_PICTURE',
    status: 'PRINTING',
    isRush: false,
    pickupTime: 'Today at 5:00 PM',
    notes: 'Need white background change for passport renewal.',
    totalPrice: 90.00,
    items: [
      {
        id: 'item-2',
        serviceType: 'ID_PICTURE',
        title: 'ID Package: Combo (4pcs 2x2 + 8pcs 1x1)',
        specifications: {
          packageType: 'Combo (4pcs 2x2 + 8pcs 1x1)',
          backgroundColor: 'White',
          changeAttire: false,
          copies: 1,
        },
        quantity: 1,
        unitPrice: 90.00,
        subtotal: 90.00,
      }
    ],
    files: [
      {
        id: 'f-3',
        name: 'portrait_selfie.png',
        size: 1450000,
        type: 'image/png',
        dataUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'ord-103',
    orderNumber: 'PRT-20261029-E5F6',
    publicToken: 'sample_token_elena_gomez_103',
    customerName: 'Atty. Elena Gomez',
    customerPhone: '0905-333-7711',
    customerEmail: 'elena.legal@gmail.com',
    serviceType: 'DOCUMENT',
    status: 'READY',
    isRush: true,
    pickupTime: 'Today at 1:30 PM',
    notes: 'Legal size, spiral bind with clear acetate front and leatherette back cover.',
    totalPrice: 195.00,
    items: [
      {
        id: 'item-3',
        serviceType: 'DOCUMENT',
        title: 'Legal Brief Document (B&W + Spiral)',
        specifications: {
          paperSize: 'Legal (Long 8.5x13)',
          colorMode: 'Black & White (Grayscale)',
          paperType: 'Premium Smooth (80gsm)',
          duplex: 'Double-Sided (Back-to-Back)',
          binding: 'Spiral / Ring Bind',
          pageCount: 35,
          copies: 1,
        },
        quantity: 1,
        unitPrice: 195.00,
        subtotal: 195.00,
      }
    ],
    files: [
      {
        id: 'f-4',
        name: 'Affidavit_of_Transfer_Contract.pdf',
        size: 4500000,
        type: 'application/pdf',
      }
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  }
];

const INITIAL_ORDERS: Order[] = shouldLoadDemoOrders ? DEMO_ORDERS : [];

function ensureDirectoryExists() {
  if (process.env.NODE_ENV === 'production') return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getAllOrders(): Order[] {
  // In production, demo fallback file is disabled
  if (process.env.NODE_ENV === 'production' && !shouldLoadDemoOrders) {
    return [];
  }

  try {
    ensureDirectoryExists();
    if (!fs.existsSync(DATA_FILE)) {
      if (shouldLoadDemoOrders) {
        saveAllOrders(INITIAL_ORDERS);
      }
      return INITIAL_ORDERS;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    const orders = JSON.parse(data) as Order[];

    // Ensure all orders have a valid publicToken
    let hasBackfilled = false;
    orders.forEach((order) => {
      if (!order.publicToken) {
        order.publicToken = generatePublicToken();
        hasBackfilled = true;
      }
    });

    if (hasBackfilled) {
      saveAllOrders(orders);
    }

    return orders;
  } catch (err) {
    console.error('Error reading orders file:', err);
    return INITIAL_ORDERS;
  }
}

export function saveAllOrders(orders: Order[]): void {
  // Never write to local disk in production on Netlify
  if (process.env.NODE_ENV === 'production') return;

  try {
    ensureDirectoryExists();
    fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving orders file:', err);
  }
}

export function getOrderByNumber(orderNumber: string): Order | undefined {
  const orders = getAllOrders();
  return orders.find(
    o => o.orderNumber.toUpperCase() === orderNumber.toUpperCase() || o.id === orderNumber
  );
}

export function createNewOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'publicToken' | 'createdAt' | 'updatedAt'>): Order {
  const orders = getAllOrders();
  
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderNumber = `PRT-${dateStr}-${randomChars}`;
  const publicToken = generatePublicToken();

  const newOrder: Order = {
    ...orderData,
    id: `ord-${Date.now()}`,
    orderNumber,
    publicToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.unshift(newOrder); // newest first
  saveAllOrders(orders);
  return newOrder;
}

export function updateOrderStatus(orderIdOrNumber: string, status: OrderStatus): Order | null {
  const orders = getAllOrders();
  const index = orders.findIndex(
    o => o.id === orderIdOrNumber || o.orderNumber.toUpperCase() === orderIdOrNumber.toUpperCase() || o.publicToken === orderIdOrNumber
  );

  if (index === -1) return null;

  orders[index].status = status;
  orders[index].updatedAt = new Date().toISOString();
  saveAllOrders(orders);
  return orders[index];
}

export function deleteOrder(id: string): boolean {
  const orders = getAllOrders();
  const filtered = orders.filter(o => o.id !== id && o.orderNumber !== id && o.publicToken !== id);
  if (filtered.length !== orders.length) {
    saveAllOrders(filtered);
    return true;
  }
  return false;
}

// ============================================================================
// ASYNC FUNCTIONS WITH SUPABASE SUPPORT & RESILIENT LOCAL FALLBACK
// ============================================================================

export async function fetchOrdersAsync(): Promise<Order[]> {
  if (isServerSupabaseConfigured) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const mappedOrders = data.map(mapRowToOrder);
          saveAllOrders(mappedOrders);
          return mappedOrders;
        } else if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`Production database fetch error: ${error.message}`);
          }
          console.warn('Supabase fetch failed, falling back to local orders.json:', error.message);
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === 'production') throw err;
        console.warn('Supabase error:', err.message);
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Supabase database is not configured in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your hosting environment.');
  }

  return getAllOrders();
}

/**
 * Public lookup: Retrieves an order by its secret public_token ONLY.
 * Old short order numbers (PRT-...) are NOT accepted by this function for public privacy.
 */
export async function getOrderByPublicTokenAsync(token: string): Promise<Order | null> {
  if (!token) return null;
  const cleanToken = token.trim();

  if (isServerSupabaseConfigured) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('public_token', cleanToken)
          .single();

        if (!error && data) {
          return mapRowToOrder(data);
        }
      } catch (err) {}
    }
  }

  const orders = getAllOrders();
  return orders.find(o => o.publicToken === cleanToken) || null;
}

/**
 * Staff-only lookup: Accepts a public_token, a short order number, or a full scanned URL.
 * Requires admin authentication before invocation.
 */
export async function lookupOrderForStaffAsync(input: string): Promise<Order | null> {
  if (!input) return null;
  let code = input.trim();

  // If input is a URL (e.g. http://.../receipt/<token>), extract the token
  if (code.includes('/receipt/')) {
    const parts = code.split('/receipt/');
    code = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
  }

  if (!code) return null;

  if (isServerSupabaseConfigured) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        // Query by public_token, order_number, or id
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .or(`public_token.eq.${code},order_number.eq.${code.toUpperCase()},id.eq.${code}`)
          .single();

        if (!error && data) {
          return mapRowToOrder(data);
        }
      } catch (err) {}
    }
  }

  const orders = getAllOrders();
  return (
    orders.find(
      o =>
        o.publicToken === code ||
        o.orderNumber.toUpperCase() === code.toUpperCase() ||
        o.id === code
    ) || null
  );
}

/**
 * Legacy lookup helper used internally for backward-compatibility.
 */
export async function getOrderAsync(idOrToken: string): Promise<Order | null> {
  return lookupOrderForStaffAsync(idOrToken);
}

export async function createOrderAsync(orderData: Omit<Order, 'id' | 'orderNumber' | 'publicToken' | 'createdAt' | 'updatedAt'>): Promise<Order> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const orderNumber = `PRT-${dateStr}-${randomChars}`;
  const publicToken = generatePublicToken();

  const localNewOrder: Order = {
    ...orderData,
    id: `ord-${Date.now()}`,
    orderNumber,
    publicToken,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 1. Try saving to Supabase
  if (isServerSupabaseConfigured) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const rowData = mapOrderToRow(localNewOrder);
        const { data, error } = await supabase
          .from('orders')
          .insert([rowData])
          .select()
          .single();

        if (!error && data) {
          const supabaseOrder = mapRowToOrder(data);
          saveAllOrders([supabaseOrder, ...getAllOrders()]);
          return supabaseOrder;
        } else if (error) {
          if (process.env.NODE_ENV === 'production') {
            throw new Error(`Production order creation failed: ${error.message}`);
          }
          console.warn('Supabase insert failed, saving locally:', error.message);
        }
      } catch (err: any) {
        if (process.env.NODE_ENV === 'production') throw err;
        console.warn('Supabase error:', err.message);
      }
    }
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Database service unavailable in production. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  // 2. Fallback to local store (Development only)
  return createNewOrder(orderData);
}

export async function updateOrderStatusAsync(orderIdOrNumber: string, status: OrderStatus): Promise<Order | null> {
  if (isServerSupabaseConfigured) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const isUuid = orderIdOrNumber.length === 36 && orderIdOrNumber.includes('-');
        const query = isUuid
          ? supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderIdOrNumber)
          : supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).or(`order_number.eq.${orderIdOrNumber},public_token.eq.${orderIdOrNumber}`);

        const { data, error } = await query.select().single();
        if (!error && data) {
          const updated = mapRowToOrder(data);
          updateOrderStatus(orderIdOrNumber, status);
          return updated;
        }
      } catch (err) {}
    }
  }

  return updateOrderStatus(orderIdOrNumber, status);
}

export async function deleteOrderAsync(id: string): Promise<boolean> {
  if (isServerSupabaseConfigured) {
    const supabase = getServerSupabase();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .or(`id.eq.${id},order_number.eq.${id},public_token.eq.${id}`);

        if (!error) {
          deleteOrder(id);
          return true;
        }
      } catch (err) {}
    }
  }

  return deleteOrder(id);
}
