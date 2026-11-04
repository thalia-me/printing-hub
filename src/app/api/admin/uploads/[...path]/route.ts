import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/adminAuth';

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  pdf: 'application/pdf',
};

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // 1. Verify Admin Authentication
  const auth = await requireAdmin(req);
  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const rawSegments = params.path || [];
    // Prevent path traversal
    const safeSegments = rawSegments
      .map(s => s.replace(/[^a-zA-Z0-9._-]/g, ''))
      .filter(s => s && s !== '..' && s !== '.');

    if (safeSegments.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid path.' }, { status: 400 });
    }

    const localBaseDir = path.join(process.cwd(), 'data', 'uploads');
    const targetFilePath = path.join(localBaseDir, ...safeSegments);

    // Verify file stays strictly inside localBaseDir
    const normalizedTarget = path.normalize(targetFilePath);
    if (!normalizedTarget.startsWith(path.normalize(localBaseDir))) {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    if (!fs.existsSync(normalizedTarget)) {
      return NextResponse.json({ success: false, error: 'File not found.' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(normalizedTarget);
    const ext = path.extname(normalizedTarget).toLowerCase().replace('.', '');
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': `inline; filename="${path.basename(normalizedTarget)}"`,
      },
    });
  } catch (err: any) {
    console.error('[GET /api/admin/uploads Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve file.' },
      { status: 500 }
    );
  }
}

