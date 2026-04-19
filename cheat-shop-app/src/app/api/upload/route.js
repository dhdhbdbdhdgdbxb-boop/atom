import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

const UPLOAD_SERVER_URL = process.env.UPLOAD_SERVER_URL || 'http://localhost:4001';
const UPLOAD_SERVER_SECRET = process.env.UPLOAD_SERVER_SECRET;

export async function POST(request) {
  // Only admins can upload
  const adminAuth = await requireAdmin(request);
  if (!adminAuth.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();

    // Forward the same formData to upload-server
    const proxyForm = new FormData();
    const file = formData.get('image') || formData.get('file');
    const type = formData.get('type') || 'general';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    proxyForm.append('file', file, file.name);
    proxyForm.append('type', type);

    const response = await fetch(`${UPLOAD_SERVER_URL}/upload/image`, {
      method: 'POST',
      headers: { 'x-upload-secret': UPLOAD_SERVER_SECRET },
      body: proxyForm,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Upload proxy error:', error);
    return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ success: true, message: 'Upload endpoint active' });
}
