import { NextRequest, NextResponse } from 'next/server';
import { fetchOrdersAsync, createOrderAsync } from '@/lib/orderStore';
import { requireAdmin } from '@/lib/adminAuth';
import { consumeRateLimit, getClientIp } from '@/lib/rateLimit';
import { recalculateOrderTotals } from '@/lib/pricing';
import { signOrdersAsync } from '@/lib/supabaseServer';
import { ServiceType, OrderItem, UploadedFileItem } from '@/types';

const ALLOWED_SERVICES: ServiceType[] = ['PHOTO', 'ID_PICTURE', 'DOCUMENT', 'OTHER'];

export async function GET(req: NextRequest) {
  // Defense in depth: Verify admin authentication
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const orders = await fetchOrdersAsync();
    const signedOrders = await signOrdersAsync(orders);
    return NextResponse.json({ success: true, orders: signedOrders });
  } catch (err: any) {
    console.error('[GET /api/orders Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limiting: Max 15 order creation requests per 10 minutes per IP
  const rateLimit = consumeRateLimit(`order_create:${ip}`, 15, 10 * 60 * 1000);
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
    return NextResponse.json(
      {
        success: false,
        error: 'Too many order requests. Please wait a few minutes before trying again.',
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
  } catch (e) {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON request payload.' },
      { status: 400 }
    );
  }

  try {
    // 1. Customer Name Validation
    const customerName = typeof body?.customerName === 'string' ? body.customerName.trim() : '';
    if (!customerName || customerName.length < 2 || customerName.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required and must be between 2 and 100 characters.' },
        { status: 400 }
      );
    }

    // 2. Customer Phone Validation (Philippine mobile: 09XXXXXXXXX or +639XXXXXXXXX)
    const rawPhone = typeof body?.customerPhone === 'string' ? body.customerPhone.trim() : '';
    const cleanPhone = rawPhone.replace(/[\s\-\(\)]/g, '');
    if (!/^(09|\+639)\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please enter a valid Philippine mobile number (e.g., 09171234567 or +639171234567).',
        },
        { status: 400 }
      );
    }

    // 3. Customer Email Validation (Optional, max 100 chars, valid pattern if present)
    const customerEmail = typeof body?.customerEmail === 'string' ? body.customerEmail.trim() : '';
    if (customerEmail) {
      if (customerEmail.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        return NextResponse.json(
          { success: false, error: 'Please enter a valid email address (up to 100 characters).' },
          { status: 400 }
        );
      }
    }

    // 4. Service Type Validation
    const serviceType = body?.serviceType as ServiceType;
    if (!serviceType || !ALLOWED_SERVICES.includes(serviceType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid service type. Must be one of: ${ALLOWED_SERVICES.join(', ')}.`,
        },
        { status: 400 }
      );
    }

    // 5. Pickup Time and Notes Validation
    const pickupTime = typeof body?.pickupTime === 'string'
      ? body.pickupTime.trim().slice(0, 100)
      : 'Today';
    const notes = typeof body?.notes === 'string'
      ? body.notes.trim().slice(0, 1000)
      : '';
    const isRush = Boolean(body?.isRush);

    // 6. Items Validation (1 to 20 items allowed)
    if (!Array.isArray(body?.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item.' },
        { status: 400 }
      );
    }

    if (body.items.length > 20) {
      return NextResponse.json(
        { success: false, error: 'Order exceeds the maximum limit of 20 items.' },
        { status: 400 }
      );
    }

    const validatedItems: OrderItem[] = [];

    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      if (!item || typeof item !== 'object') {
        return NextResponse.json(
          { success: false, error: `Item #${i + 1} is invalid.` },
          { status: 400 }
        );
      }

      const itemServiceType = item.serviceType || serviceType;
      if (!ALLOWED_SERVICES.includes(itemServiceType)) {
        return NextResponse.json(
          { success: false, error: `Item #${i + 1} has an invalid service type.` },
          { status: 400 }
        );
      }

      // Quantity must be a positive integer between 1 and 500
      const qty = item.quantity;
      if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > 500) {
        return NextResponse.json(
          { success: false, error: `Item #${i + 1} quantity must be an integer between 1 and 500.` },
          { status: 400 }
        );
      }

      const spec = item.specifications || {};
      if (typeof spec !== 'object') {
        return NextResponse.json(
          { success: false, error: `Item #${i + 1} specifications must be an object.` },
          { status: 400 }
        );
      }

      // Detailed specifications validation based on service type
      if (itemServiceType === 'PHOTO') {
        const copies = spec.copies ?? 1;
        if (typeof copies !== 'number' || !Number.isInteger(copies) || copies < 1 || copies > 500) {
          return NextResponse.json(
            { success: false, error: `Photo item #${i + 1} copies must be an integer between 1 and 500.` },
            { status: 400 }
          );
        }
      } else if (itemServiceType === 'ID_PICTURE') {
        const copies = spec.copies ?? 1;
        if (typeof copies !== 'number' || !Number.isInteger(copies) || copies < 1 || copies > 500) {
          return NextResponse.json(
            { success: false, error: `ID Picture item #${i + 1} copies/sets must be an integer between 1 and 500.` },
            { status: 400 }
          );
        }
      } else if (itemServiceType === 'DOCUMENT') {
        const copies = spec.copies ?? 1;
        if (typeof copies !== 'number' || !Number.isInteger(copies) || copies < 1 || copies > 500) {
          return NextResponse.json(
            { success: false, error: `Document item #${i + 1} copies must be an integer between 1 and 500.` },
            { status: 400 }
          );
        }
        const pageCount = spec.pageCount ?? 1;
        if (typeof pageCount !== 'number' || !Number.isInteger(pageCount) || pageCount < 1 || pageCount > 2000) {
          return NextResponse.json(
            { success: false, error: `Document item #${i + 1} page count must be an integer between 1 and 2,000.` },
            { status: 400 }
          );
        }
      } else if (itemServiceType === 'OTHER') {
        if (spec.quantity !== undefined) {
          if (typeof spec.quantity !== 'number' || !Number.isInteger(spec.quantity) || spec.quantity < 1 || spec.quantity > 500) {
            return NextResponse.json(
              { success: false, error: `Service item #${i + 1} quantity must be an integer between 1 and 500.` },
              { status: 400 }
            );
          }
        }
        if (spec.scanPages !== undefined) {
          if (typeof spec.scanPages !== 'number' || !Number.isInteger(spec.scanPages) || spec.scanPages < 1 || spec.scanPages > 2000) {
            return NextResponse.json(
              { success: false, error: `Scan pages for item #${i + 1} must be an integer between 1 and 2,000.` },
              { status: 400 }
            );
          }
        }
        if (spec.encodingPages !== undefined) {
          if (typeof spec.encodingPages !== 'number' || !Number.isInteger(spec.encodingPages) || spec.encodingPages < 1 || spec.encodingPages > 2000) {
            return NextResponse.json(
              { success: false, error: `Encoding pages for item #${i + 1} must be an integer between 1 and 2,000.` },
              { status: 400 }
            );
          }
        }
      }

      const itemTitle = typeof item.title === 'string' && item.title.trim()
        ? item.title.trim().slice(0, 200)
        : `${itemServiceType} Order`;

      validatedItems.push({
        id: typeof item.id === 'string' && item.id.trim() ? item.id.slice(0, 64) : `item-${Date.now()}-${i}`,
        serviceType: itemServiceType,
        title: itemTitle,
        specifications: spec,
        quantity: qty,
        unitPrice: 0, // Ignored from client; recomputed below
        subtotal: 0,  // Ignored from client; recomputed below
      });
    }

    // 7. Files Validation (Max 50 files)
    const rawFiles = Array.isArray(body?.files) ? body.files : [];
    if (rawFiles.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Maximum 50 files allowed per order.' },
        { status: 400 }
      );
    }

    const sanitizedFiles: UploadedFileItem[] = rawFiles.map((f: any, idx: number) => ({
      id: typeof f?.id === 'string' ? f.id.slice(0, 64) : `file-${Date.now()}-${idx}`,
      name: typeof f?.name === 'string' ? f.name.slice(0, 255) : `File_${idx + 1}`,
      size: typeof f?.size === 'number' && f.size >= 0 ? f.size : 0,
      type: typeof f?.type === 'string' ? f.type.slice(0, 100) : 'application/octet-stream',
      dataUrl: typeof f?.dataUrl === 'string' ? f.dataUrl : undefined,
      storagePath: typeof f?.storagePath === 'string' ? f.storagePath.slice(0, 255) : undefined,
      storage: f?.storage === 'supabase' ? 'supabase' : 'local',
    }));

    // 8. Recompute Pricing Server-Side (Client-sent unitPrice, subtotal, and totalPrice are discarded)
    const computedTotals = recalculateOrderTotals(validatedItems, isRush);

    // 9. Persist Order in Database / Store
    const newOrder = await createOrderAsync({
      customerName,
      customerPhone: cleanPhone,
      customerEmail,
      serviceType,
      status: 'PENDING', // Forced server-side to PENDING
      isRush,
      pickupTime,
      notes,
      totalPrice: computedTotals.totalPrice,
      items: computedTotals.items,
      files: sanitizedFiles,
    });

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (err: any) {
    // Log unexpected errors server-side without leaking raw internal exception details to the client
    console.error('[POST /api/orders Internal Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create order. Please try again.' },
      { status: 500 }
    );
  }
}
