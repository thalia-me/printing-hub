import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Returns the list of authorized admin email addresses configured in the environment.
 */
export function getAdminEmails(): string[] {
  const envVal = process.env.ADMIN_EMAILS || '';
  return envVal
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Checks whether a given email address matches the authorized admin emails list.
 */
export function isEmailAdmin(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.trim().toLowerCase());
}

/**
 * Creates a server-side Supabase client for authenticating requests using incoming cookies.
 */
export function createAdminAuthClient(req: NextRequest) {
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map(c => ({ name: c.name, value: c.value }));
      },
      setAll() {
        // Read-only inspection in helper; cookie mutations are handled in route handlers / middleware
      },
    },
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  });
}

export interface AdminAuthResult {
  authorized: boolean;
  user?: User;
  error?: string;
}

/**
 * Defense-in-depth helper for server handlers.
 * Verifies that the incoming request contains a valid Supabase session
 * AND that the authenticated user's email is listed in ADMIN_EMAILS.
 */
export async function requireAdmin(req: NextRequest): Promise<AdminAuthResult> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { authorized: false, error: 'Database service is not configured.' };
  }

  try {
    const supabase = createAdminAuthClient(req);
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { authorized: false, error: 'Unauthorized: missing or invalid session.' };
    }

    if (!isEmailAdmin(user.email)) {
      return { authorized: false, error: 'Unauthorized: user is not an authorized administrator.' };
    }

    return { authorized: true, user };
  } catch (err: any) {
    return { authorized: false, error: err.message || 'Authentication verification failed.' };
  }
}

