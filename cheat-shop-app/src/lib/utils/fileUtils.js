/**
 * Утилиты для работы с файлами
 */

import fs from 'fs';
import path from 'path';

/**
 * Удаление файла с диска
 * @param {string} filePath - Путь к файлу (может быть URL или относительный путь)
 * @returns {Promise<boolean>} - true если файл удален, false если не найден
 */
export async function deleteFile(filePath) {
  try {
    if (!filePath) return false;

    // Если это URL, извлекаем путь к файлу
    let actualPath = filePath;
    
    // Если путь начинается с /uploads/, это файл в public/uploads/
    if (filePath.startsWith('/uploads/')) {
      actualPath = path.join(process.cwd(), 'public', filePath);
    }
    // Если это полный URL, извлекаем путь после домена
    else if (filePath.startsWith('http')) {
      const url = new URL(filePath);
      if (url.pathname.startsWith('/uploads/')) {
        actualPath = path.join(process.cwd(), 'public', url.pathname);
      } else {
        // Если это внешний URL, не удаляем
        return false;
      }
    }
    // Если это относительный путь от public/
    else if (!path.isAbsolute(filePath)) {
      actualPath = path.join(process.cwd(), 'public', filePath);
    }

    // Проверяем, что файл существует
    if (fs.existsSync(actualPath)) {
      await fs.promises.unlink(actualPath);
      console.log(`🗑️ Файл удален: ${actualPath}`);
      return true;
    } else {
      console.log(`⚠️ Файл не найден для удаления: ${actualPath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Ошибка при удалении файла ${filePath}:`, error);
    return false;
  }
}

/**
 * Удаление нескольких файлов
 * @param {string[]} filePaths - Массив путей к файлам
 * @returns {Promise<{deleted: number, failed: number}>} - Статистика удаления
 */
export async function deleteFiles(filePaths) {
  if (!Array.isArray(filePaths)) {
    return { deleted: 0, failed: 0 };
  }

  let deleted = 0;
  let failed = 0;

  for (const filePath of filePaths) {
    const success = await deleteFile(filePath);
    if (success) {
      deleted++;
    } else {
      failed++;
    }
  }

  console.log(`🗑️ Удаление файлов завершено: удалено=${deleted}, ошибок=${failed}`);
  return { deleted, failed };
}

/**
 * Получение всех медиафайлов продукта
 * @param {number} productId - ID продукта
 * @returns {Promise<string[]>} - Массив путей к файлам
 */
export async function getProductMediaFiles(productId) {
  const { default: prisma } = await import('@/lib/prisma');
  
  try {
    const mediaFiles = await prisma.productMedia.findMany({
      where: { productId },
      select: { url: true, thumbnail: true }
    });

    const filePaths = [];
    
    mediaFiles.forEach(media => {
      if (media.url) filePaths.push(media.url);
      if (media.thumbnail) filePaths.push(media.thumbnail);
    });

    return filePaths;
  } catch (error) {
    console.error(`❌ Ошибка при получении медиафайлов продукта ${productId}:`, error);
    return [];
  }
}

/**
 * Удаление всех медиафайлов продукта с диска
 * @param {number} productId - ID продукта
 * @returns {Promise<{deleted: number, failed: number}>} - Статистика удаления
 */
export async function deleteProductMediaFiles(productId) {
  console.log(`🗑️ Удаляем медиафайлы для продукта ${productId}`);
  
  const filePaths = await getProductMediaFiles(productId);
  
  if (filePaths.length === 0) {
    console.log(`ℹ️ У продукта ${productId} нет медиафайлов для удаления`);
    return { deleted: 0, failed: 0 };
  }

  console.log(`🔍 Найдено ${filePaths.length} файлов для удаления:`, filePaths);
  
  return await deleteFiles(filePaths);
}