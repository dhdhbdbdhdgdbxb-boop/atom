require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 4001;
const UPLOAD_SECRET = process.env.UPLOAD_SECRET;
const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || './uploads');

if (!UPLOAD_SECRET) {
  console.error('UPLOAD_SECRET is not set. Exiting.');
  process.exit(1);
}

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Auth middleware — only Next.js backend can call this server
function requireSecret(req, res, next) {
  const auth = req.headers['x-upload-secret'];
  if (!auth || auth !== UPLOAD_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  next();
}

// Multer — store in memory, we handle writing ourselves
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB hard limit
});

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

// Single image upload (used by /api/upload in Next.js)
app.post('/upload/image', requireSecret, upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'No file provided' });

    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return res.status(400).json({ success: false, error: 'Only JPEG, PNG, GIF, WebP allowed' });
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({ success: false, error: 'File too large. Max 10MB.' });
    }

    const ext = file.originalname.split('.').pop().toLowerCase();
    const subdir = req.body.type || null;
    const ALLOWED_SUBDIRS = ['game', 'category', 'product', 'user'];
    const safeSubdir = ALLOWED_SUBDIRS.includes(subdir) ? subdir : null;

    const targetDir = safeSubdir ? path.join(UPLOADS_DIR, safeSubdir) : UPLOADS_DIR;
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${ext}`;
    fs.writeFileSync(path.join(targetDir, filename), file.buffer);

    const relativePath = safeSubdir ? `/uploads/${safeSubdir}/${filename}` : `/uploads/${filename}`;
    return res.json({ success: true, url: relativePath, imageUrl: relativePath, filename });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, error: 'Upload failed' });
  }
});

// Multi-file upload with video support (used by /api/admin/products/upload in Next.js)
app.post('/upload/media', requireSecret, upload.array('files', 10), async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }

  const uploadedFiles = [];
  let imageCount = 0;
  let videoCount = 0;

  for (const file of files) {
    const mimeType = file.mimetype;
    const isImage = ALLOWED_IMAGE_TYPES.includes(mimeType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(mimeType);

    if (!isImage && !isVideo) continue;
    if (isImage && file.size > MAX_IMAGE_SIZE) continue;
    if (isVideo && file.size > MAX_VIDEO_SIZE) continue;
    if (isImage && imageCount >= 10) continue;
    if (isVideo && videoCount >= 10) continue;

    const ext = file.originalname.split('.').pop().toLowerCase();
    const uniqueName = `${uuidv4()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, uniqueName);
    const timestamp = Date.now();
    const relativePath = `/uploads/${uniqueName}?t=${timestamp}`;

    fs.writeFileSync(filePath, file.buffer);

    let width = null, height = null;

    if (isImage) {
      imageCount++;
      try {
        const meta = await sharp(file.buffer).metadata();
        width = meta.width;
        height = meta.height;
      } catch (_) {}
    } else {
      videoCount++;
    }

    uploadedFiles.push({
      type: isImage ? 'image' : 'video',
      url: relativePath,
      thumbnail: null,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType,
      width,
      height,
      duration: null,
      isMainImage: false,
      sortOrder: uploadedFiles.length,
    });
  }

  if (uploadedFiles.length === 0) {
    return res.status(400).json({ success: false, error: 'No valid files were uploaded.' });
  }

  return res.json({
    success: true,
    files: uploadedFiles,
    message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
    stats: { images: imageCount, videos: videoCount, total: uploadedFiles.length },
  });
});

// Delete file
app.delete('/upload/file', requireSecret, (req, res) => {
  const fileUrl = req.query.file;
  if (!fileUrl) return res.status(400).json({ success: false, error: 'File URL is required' });

  const rawName = fileUrl.split('/').pop()?.split('?')[0];
  if (!rawName || !/^[\w\-]+\.[a-z0-9]+$/i.test(rawName)) {
    return res.status(400).json({ success: false, error: 'Invalid file name' });
  }

  // Search in root and one level of subdirs
  const candidates = [
    path.join(UPLOADS_DIR, rawName),
    ...['game', 'category', 'product', 'user'].map(d => path.join(UPLOADS_DIR, d, rawName)),
  ];

  const found = candidates.find(p => fs.existsSync(p));
  if (!found) return res.status(404).json({ success: false, error: 'File not found' });

  fs.unlinkSync(found);
  return res.json({ success: true, message: 'File deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`Upload server running on port ${PORT}`);
});
