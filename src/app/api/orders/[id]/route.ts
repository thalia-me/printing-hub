import { NextRequest, NextResponse } from 'next/server';
import { 
  getOrderByPublicTokenAsync, 
  maskPhoneNumber, 
  updateOrderStatusAsync, 
  deleteOrderAsync 
} from '@/lib/orderStore';
import { OrderStatus } from '@/types';
import { requireAdmin } from '@/lib/adminAuth';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = getClientIp(req);

  // Rate-limit public receipt lookup per IP (max 30 requests per minute)
  const rateLimitStatus = checkRateLimit(`lookup:${ip}`, 30, 60 * 1000);
  if (!rateLimitStatus.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please wait a moment.' },
      { status: 429 }
    );
  }

  try {
    const token = params.id;
    // Public lookup strictly requires a valid public_token.
    // Old sequential order numbers (PRT-...) are rejected to prevent enumeration.
    const order = await getOrderByPublicTokenAsync(token);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    // Return only customer-facing receipt fields with masked phone number
    const publicReceiptOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      publicToken: order.publicToken,
      customerName: order.customerName,
      customerPhone: maskPhoneNumber(order.customerPhone),
      serviceType: order.serviceType,
      status: order.status,
      isRush: order.isRush,
      pickupTime: order.pickupTime || 'Today',
      totalPrice: order.totalPrice,
      items: order.items,
      files: (order.files || []).map((f) => ({
        id: f.id,
        name: f.name,
        size: f.size,
        type: f.type,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };

    return NextResponse.json({ success: true, order: publicReceiptOrder });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Failed to retrieve order' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Defense in depth: Verify admin authentication
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { status } = body;

    const validStatuses: OrderStatus[] = ['PENDING', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const updated = await updateOrderStatusAsync(params.id, status);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Defense in depth: Verify admin authentication
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const ok = await deleteOrderAsync(params.id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Order deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
