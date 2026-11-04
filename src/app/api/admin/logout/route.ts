import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Signed out successfully.',
  });

  if (supabaseUrl && supabaseAnonKey) {
    try {
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

      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out cleanup notice:', err);
    }
  }

  // Explicitly clear all session cookies from request
  req.cookies.getAll().forEach(cookie => {
    if (
      cookie.name.includes('supabase') || 
      cookie.name.startsWith('sb-') || 
      cookie.name.includes('admin') ||
      cookie.name.includes('auth')
    ) {
      response.cookies.delete(cookie.name);
    }
  });

  return response;
}

