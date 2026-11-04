-- ==============================================================================
-- Migration 001: Customer Order Privacy & RLS Hardening
-- ==============================================================================

-- 1. Add public_token column (random 144-bit base64url string)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS public_token VARCHAR(64) UNIQUE;

-- 2. Backfill existing rows with cryptographically random tokens
UPDATE public.orders 
SET public_token = replace(replace(replace(encode(gen_random_bytes(18), 'base64'), '+', '-'), '/', '_'), '=', '')
WHERE public_token IS NULL;

-- 3. Enforce NOT NULL constraint now that existing rows are backfilled
ALTER TABLE public.orders 
ALTER COLUMN public_token SET NOT NULL;

-- 4. Index public_token for efficient receipt lookups
CREATE INDEX IF NOT EXISTS idx_orders_public_token ON public.orders(public_token);

-- 5. Fix RLS: Drop insecure public policies
-- Public clients cannot directly SELECT or INSERT orders through the Supabase client.
-- All customer operations (order creation, receipt lookup) route through server APIs using the service role key.
DROP POLICY IF EXISTS "Public can view their own order by order_number" ON public.orders;
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;

-- 6. Enforce that direct table access is restricted to service_role (used by server APIs)
CREATE POLICY "Service role full access on orders" 
ON public.orders FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

