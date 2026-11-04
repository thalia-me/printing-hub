import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isEmailAdmin } from '@/lib/adminAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const { pathname } = req.nextUrl;
  const method = req.method;

  // Determine if the route is an admin-only API operation
  // GET /api/orders (list all orders)
  // PATCH /api/orders/[id] (update order status)
  // DELETE /api/orders/[id] (delete order)
  // ALL /api/admin/* (orders lookup, uploads, etc., except login/logout)
  const isOrdersListGet = (pathname === '/api/orders' || pathname === '/api/orders/') && method === 'GET';
  const isOrderMutation = pathname.startsWith('/api/orders/') && (method === 'PATCH' || method === 'DELETE');
  const isAdminRoute = pathname.startsWith('/api/admin/') && !pathname.startsWith('/api/admin/login') && !pathname.startsWith('/api/admin/logout');
  const isAdminApi = isOrdersListGet || isOrderMutation || isAdminRoute;

  // Determine if the route is an admin page
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';
  const isLoginPage = pathname === '/admin/login';

  // If the request is not for an admin-protected area, continue immediately
  if (!isAdminApi && !isAdminPage && !isLoginPage) {
    return response;
  }

  // Verify Supabase Auth session & ADMIN_EMAILS allowlist
  let isAdmin = false;

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
          },
          setAll(cookiesToSet, headers) {
            cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
            response = NextResponse.next({
              request: { headers: req.headers },
            });
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

      const { data: { user } } = await supabase.auth.getUser();
      isAdmin = Boolean(user && user.email && isEmailAdmin(user.email));
    } catch {
      isAdmin = false;
    }
  }

  // 1. Block unauthorized admin API requests with 401 JSON
  if (isAdminApi && !isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  // 2. Redirect unauthenticated visitors attempting to access /admin/dashboard to /admin/login
  if (isAdminPage && !isAdmin) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    return NextResponse.redirect(loginUrl);
  }

  // 3. If already authenticated as admin, redirect from /admin/login straight to /admin/dashboard
  if (isLoginPage && isAdmin) {
    const dashboardUrl = req.nextUrl.clone();
    dashboardUrl.pathname = '/admin/dashboard';
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/orders/:path*',
    '/api/admin/:path*',
  ],
};

