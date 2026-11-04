import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, recordRateLimitFailure, resetRateLimit, getClientIp } from '@/lib/rateLimit';
import { isEmailAdmin } from '@/lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const GENERIC_ERROR_MESSAGE = 'Invalid email or password.';
const RATE_LIMIT_MESSAGE = 'Too many failed login attempts. Please try again in 10 minutes.';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // 1. Check IP rate limit (max 5 failed attempts per 10 minutes)
  const rateLimitStatus = checkRateLimit(ip, 5, 10 * 60 * 1000);
  if (!rateLimitStatus.allowed) {
    return NextResponse.json(
      { success: false, error: RATE_LIMIT_MESSAGE },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      recordRateLimitFailure(ip);
      return NextResponse.json(
        { success: false, error: GENERIC_ERROR_MESSAGE },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: 'Database service is currently unavailable.' },
        { status: 500 }
      );
    }

    // 2. Prepare response object to receive Supabase session cookies
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful.',
    });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            });
          });
          Object.entries(headers).forEach(([k, v]) => response.headers.set(k, v));
        },
      },
    });

    // 3. Authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user || !data.session) {
      recordRateLimitFailure(ip);
      return NextResponse.json(
        { success: false, error: GENERIC_ERROR_MESSAGE },
        { status: 401 }
      );
    }

    // 4. Verify that the authenticated email is on the authorized ADMIN_EMAILS list
    if (!isEmailAdmin(data.user.email)) {
      // Invalidate the session immediately
      await supabase.auth.signOut();
      recordRateLimitFailure(ip);
      // Return generic error so we do not reveal the account exists
      return NextResponse.json(
        { success: false, error: GENERIC_ERROR_MESSAGE },
        { status: 401 }
      );
    }

    // 5. Successful admin login: clear rate limit
    resetRateLimit(ip);

    return response;
  } catch (err) {
    recordRateLimitFailure(ip);
    return NextResponse.json(
      { success: false, error: GENERIC_ERROR_MESSAGE },
      { status: 401 }
    );
  }
}

