-- ==============================================================================
-- Migration 002: Storage Hardening & Private Bucket Configuration
-- ==============================================================================

-- 1. Ensure the order-files bucket exists and is strictly PRIVATE (public = false)
-- with 10MB file size limit and allowed MIME types as a second line of defense
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-files',
  'order-files',
  false,
  10485760, -- 10 MB limit in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

-- 2. Drop any existing permissive public read or write policies on storage.objects
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Public can view order-files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public upload files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read order files" ON storage.objects;

-- 3. Restrict storage object management to service_role (used by server-side upload & signing API)
CREATE POLICY "Service role full access on storage objects"
ON storage.objects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Pending Uploads tracking table (used by Phase 5 cleanup of unlinked/abandoned uploads)
CREATE TABLE IF NOT EXISTS public.pending_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path VARCHAR(255) NOT NULL UNIQUE,
  file_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient age-based cleanup queries
CREATE INDEX IF NOT EXISTS idx_pending_uploads_uploaded_at ON public.pending_uploads(uploaded_at);

-- RLS: Pending uploads managed strictly via server service_role
ALTER TABLE public.pending_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on pending_uploads"
ON public.pending_uploads FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
