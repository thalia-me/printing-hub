-- ==============================================================================
-- QR-Code Printing Order Website: Supabase Production Schema & Storage Policies
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(30) UNIQUE NOT NULL,
    public_token VARCHAR(64) UNIQUE NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(25) NOT NULL,
    customer_email VARCHAR(100),
    service_type VARCHAR(30) NOT NULL CHECK (service_type IN ('PHOTO', 'ID_PICTURE', 'DOCUMENT', 'OTHER')),
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PRINTING', 'READY', 'COMPLETED', 'CANCELLED')),
    is_rush BOOLEAN DEFAULT FALSE,
    pickup_time VARCHAR(100),
    total_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    files JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on public_token for fast customer lookup
CREATE INDEX IF NOT EXISTS idx_orders_public_token ON public.orders(public_token);

-- 3. Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Restrict direct client-side table access:
-- All customer operations (order creation, receipt lookup) route through server APIs using the service_role key.
-- Admin operations are verified server-side with requireAdmin.
CREATE POLICY "Service role full access on orders" 
ON public.orders FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- 4. Enable Supabase Realtime for instant notification chimes
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- 5. Storage Bucket for uploaded customer print files (Hardened: PRIVATE bucket with 10MB limit & MIME allowlist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
  'order-files', 
  'order-files', 
  false, 
  10485760, 
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET 
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

-- Storage Policy: Drop insecure public read/insert policies
DROP POLICY IF EXISTS "Public upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read order files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;

-- Restrict storage objects to service_role (all customer uploads & admin reads route via server API with signed URLs)
CREATE POLICY "Service role full access on storage objects" 
ON storage.objects FOR ALL 
TO service_role 
USING (true)
WITH CHECK (true);

-- 6. Pending Uploads tracking table (used by Phase 5 cleanup of unlinked/abandoned uploads)
CREATE TABLE IF NOT EXISTS public.pending_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path VARCHAR(255) NOT NULL UNIQUE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pending_uploads_uploaded_at ON public.pending_uploads(uploaded_at);

ALTER TABLE public.pending_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on pending_uploads"
ON public.pending_uploads FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
