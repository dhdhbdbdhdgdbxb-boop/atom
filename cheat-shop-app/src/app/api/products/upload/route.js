import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { requireAdmin } from '@/lib/adminAuth';

// Настройка ffmpeg с использованием ffmpeg-static вместо @ffmpeg-installer
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export async function POST(request) {
  // Require admin auth
  const adminAuth = await requireAdmin(request);
  if (!adminAuth.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const productId = formData.get('productId');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // Проверяем лимит файлов (максимум 5 видео и 5 изображений)
    const uploadedFiles = [];
    let imageCount = 0;
    let videoCount = 0;

    // Создаем директорию для загрузки если её нет
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'products', productId || 'temp');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Обрабатываем каждый файл
    for (const file of files) {
      if (!(file instanceof File)) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name;
      const fileExtension = originalName.split('.').pop().toLowerCase();
      const uniqueName = `${uuidv4()}.${fileExtension}`;
      const filePath = join(uploadDir, uniqueName);
      const relativePath = `/uploads/products/${productId || 'temp'}/${uniqueName}`;

      // Определяем тип файла
      const mimeType = file.type;
      let type = 'other';
      let thumbnail = null;
      let width = null;
      let height = null;
      let duration = null;
      let fileSize = buffer.length;

      // Сохраняем файл
      await writeFile(filePath, buffer);

      if (mimeType.startsWith('image/')) {
        if (imageCount >= 5) {
          continue; // Пропускаем, если достигнут лимит изображений
        }
        
        type = 'image';
        imageCount++;

        try {
          // Получаем метаданные изображения
          const metadata = await sharp(buffer).metadata();
          width = metadata.width;
          height = metadata.height;
        } catch (error) {
          console.error('Error processing image metadata:', error);
        }
      } else if (mimeType.startsWith('video/')) {
        if (videoCount >= 5) {
          continue; // Пропускаем, если достигнут лимит видео
        }
        
        type = 'video';
        videoCount++;

        try {
          // Создаем превью для видео
          const thumbnailName = `${uuidv4()}.jpg`;
          const thumbnailPath = join(uploadDir, thumbnailName);
          const thumbnailRelativePath = `/uploads/products/${productId || 'temp'}/${thumbnailName}`;

          await new Promise((resolve, reject) => {
            ffmpeg(filePath)
              .screenshots({
                timestamps: ['1%'],
                filename: thumbnailName,
                folder: uploadDir,
                size: '640x360'
              })
              .on('end', () => {
                thumbnail = thumbnailRelativePath;
                resolve();
              })
              .on('error', (err) => {
                console.error('Error generating thumbnail:', err);
                // Не прерываем процесс, просто пропускаем превью
                resolve();
              });
          });

          // Получаем длительность видео
          await new Promise((resolve, reject) => {
            ffmpeg.ffprobe(filePath, (err, metadata) => {
              if (!err && metadata.format && metadata.format.duration) {
                duration = Math.round(metadata.format.duration);
              }
              resolve();
            });
          });
        } catch (error) {
          console.error('Error processing video:', error);
          // Продолжаем обработку даже если ошибка с видео
        }
      }

      uploadedFiles.push({
        type,
        url: relativePath,
        thumbnail,
        fileName: originalName,
        fileSize,
        mimeType,
        width,
        height,
        duration,
        isMainImage: false
      });
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `Uploaded ${uploadedFiles.length} files`,
      stats: {
        images: imageCount,
        videos: videoCount,
        total: uploadedFiles.length
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload files',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Добавляем OPTIONS метод для CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}