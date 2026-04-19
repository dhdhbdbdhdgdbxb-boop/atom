/**
 * Утилита для очистки неиспользуемых файлов
 */

import fs from 'fs';
import path from 'path';
import prisma from '@/lib/prisma';

/**
 * Получение всех файлов из папки uploads
 * @param {string} uploadsPath - Путь к папке uploads
 * @returns {Promise<string[]>} - Массив путей к файлам
 */
async function getAllUploadedFiles(uploadsPath) {
  const files = [];
  
  try {
    const items = await fs.promises.readdir(uploadsPath, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(uploadsPath, item.name);
      
      if (item.isDirectory()) {
        // Рекурсивно обходим подпапки
        const subFiles = await getAllUploadedFiles(fullPath);
        files.push(...subFiles);
      } else {
        // Добавляем файл в список
        const relativePath = path.relative(path.join(process.cwd(), 'public'), fullPath);
        files.push('/' + relativePath.replace(/\\/g, '/'));
      }
    }
  } catch (error) {
    console.error('Ошибка при чтении папки uploads:', error);
  }
  
  return files;
}

/**
 * Получение всех используемых файлов из базы данных
 * @returns {Promise<Set<string>>} - Множество используемых путей к файлам
 */
async function getUsedFiles() {
  const usedFiles = new Set();
  
  try {
    // Файлы из медиа продуктов
    const productMedia = await prisma.productMedia.findMany({
      select: { url: true, thumbnail: true }
    });
    
    productMedia.forEach(media => {
      if (media.url) usedFiles.add(media.url);
      if (media.thumbnail) usedFiles.add(media.thumbnail);
    });
    
    // Файлы из изображений продуктов (старая система)
    const productImages = await prisma.productImage.findMany({
      select: { imageUrl: true }
    });
    
    productImages.forEach(image => {
      if (image.imageUrl) usedFiles.add(image.imageUrl);
    });
    
    // Файлы из игр
    const games = await prisma.game.findMany({
      select: { image: true, background: true, icon: true }
    });
    
    games.forEach(game => {
      if (game.image) usedFiles.add(game.image);
      if (game.background) usedFiles.add(game.background);
      if (game.icon) usedFiles.add(game.icon);
    });
    
    // Файлы из категорий
    const categories = await prisma.category.findMany({
      select: { image: true, background: true, icon: true }
    });
    
    categories.forEach(category => {
      if (category.image) usedFiles.add(category.image);
      if (category.background) usedFiles.add(category.background);
      if (category.icon) usedFiles.add(category.icon);
    });
    
    console.log(`📊 Найдено ${usedFiles.size} используемых файлов в БД`);
    
  } catch (error) {
    console.error('Ошибка при получении используемых файлов:', error);
  }
  
  return usedFiles;
}

/**
 * Очистка неиспользуемых файлов
 * @param {boolean} dryRun - Если true, только показывает что будет удалено, не удаляет
 * @returns {Promise<{found: number, unused: number, deleted: number, errors: number}>}
 */
export async function cleanupUnusedFiles(dryRun = true) {
  console.log(`🧹 Начинаем очистку неиспользуемых файлов (${dryRun ? 'тестовый режим' : 'реальное удаление'})`);
  
  const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
  
  // Проверяем, существует ли папка uploads
  if (!fs.existsSync(uploadsPath)) {
    console.log('📁 Папка uploads не найдена');
    return { found: 0, unused: 0, deleted: 0, errors: 0 };
  }
  
  // Получаем все файлы из папки uploads
  const allFiles = await getAllUploadedFiles(uploadsPath);
  console.log(`📁 Найдено ${allFiles.length} файлов в папке uploads`);
  
  // Получаем все используемые файлы из БД
  const usedFiles = await getUsedFiles();
  
  // Находим неиспользуемые файлы
  const unusedFiles = allFiles.filter(file => !usedFiles.has(file));
  console.log(`🗑️ Найдено ${unusedFiles.length} неиспользуемых файлов`);
  
  if (unusedFiles.length === 0) {
    console.log('✅ Неиспользуемых файлов не найдено');
    return { found: allFiles.length, unused: 0, deleted: 0, errors: 0 };
  }
  
  // Показываем список неиспользуемых файлов
  console.log('📋 Неиспользуемые файлы:');
  unusedFiles.forEach(file => console.log(`  - ${file}`));
  
  let deleted = 0;
  let errors = 0;
  
  if (!dryRun) {
    // Удаляем неиспользуемые файлы
    const { deleteFiles } = await import('./fileUtils');
    const result = await deleteFiles(unusedFiles);
    deleted = result.deleted;
    errors = result.failed;
  }
  
  const summary = {
    found: allFiles.length,
    unused: unusedFiles.length,
    deleted,
    errors
  };
  
  console.log('📊 Результат очистки:', summary);
  
  return summary;
}

/**
 * API endpoint для очистки файлов
 */
export async function cleanupFilesAPI(dryRun = true) {
  try {
    const result = await cleanupUnusedFiles(dryRun);
    
    return {
      success: true,
      message: dryRun 
        ? `Найдено ${result.unused} неиспользуемых файлов из ${result.found} общих`
        : `Удалено ${result.deleted} файлов, ошибок: ${result.errors}`,
      data: result
    };
  } catch (error) {
    console.error('Ошибка при очистке файлов:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}