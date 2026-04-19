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
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Too many files. Maximum 10 files allowed per upload.' },
        { status: 400 }
      );
    }

    // Forward to upload-server
    const proxyForm = new FormData();
    for (const file of files) {
      if (file instanceof File) {
        proxyForm.append('files', file, file.name);
      }
    }

    const response = await fetch(`${UPLOAD_SERVER_URL}/upload/media`, {
      method: 'POST',
      headers: { 'x-upload-secret': UPLOAD_SERVER_SECRET },
      body: proxyForm,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Upload proxy error:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload files' }, { status: 500 });
  }
}

export async function DELETE(request) {
  // Only admins can delete
  const adminAuth = await requireAdmin(request);
  if (!adminAuth.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('file');

    if (!fileUrl) {
      return NextResponse.json({ success: false, error: 'File URL is required' }, { status: 400 });
    }

    const response = await fetch(
      `${UPLOAD_SERVER_URL}/upload/file?file=${encodeURIComponent(fileUrl)}`,
      {
        method: 'DELETE',
        headers: { 'x-upload-secret': UPLOAD_SERVER_SECRET },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete proxy error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete file' }, { status: 500 });
  }
}

export async function GET(request) {
  return NextResponse.json({
    success: true,
    uploadAvailable: true,
    limits: {
      maxImageSize: '10MB',
      maxVideoSize: '100MB',
      maxTotalFiles: 10,
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
