import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { lookupOrderForStaffAsync } from '@/lib/orderStore';
import { signOrderAsync } from '@/lib/supabaseServer';

export async function GET(req: NextRequest) {
  // 1. Verify staff administrator session
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  const query = req.nextUrl.searchParams.get('query') || req.nextUrl.searchParams.get('code') || '';
  if (!query.trim()) {
    return NextResponse.json(
      { success: false, error: 'Search query or reference code is required.' },
      { status: 400 }
    );
  }

  try {
    // Accepts a scanned receipt URL, a raw public_token, or a typed order number
    const order = await lookupOrderForStaffAsync(query);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found with the provided reference code or token.' },
        { status: 404 }
      );
    }

    // Return the full order (unmasked phone, complete files, notes, etc.) for counter staff
    const signedOrder = await signOrderAsync(order);
    return NextResponse.json({
      success: true,
      order: signedOrder,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Staff lookup failed.' },
      { status: 500 }
    );
  }
}

