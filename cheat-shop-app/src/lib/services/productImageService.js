/**
 * Сервис для работы с картинками продуктов
 */

import prisma from '@lib/prisma';

class ProductImageService {
  /**
   * Получение всех картинок продукта
   * @param {number} productId - ID продукта
   * @returns {Promise<Array>} - Список картинок
   */
  async getProductImages(productId) {
    return await prisma.productImage.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' }
    });
  }

  /**
   * Получение основной картинки продукта
   * @param {number} productId - ID продукта
   * @returns {Promise<Object|null>} - Основная картинка
   */
  async getPrimaryImage(productId) {
    return await prisma.productImage.findFirst({
      where: { productId, isPrimary: true }
    });
  }

  /**
   * Создание новой картинки
   * @param {Object} imageData - Данные картинки {productId, imageUrl, sortOrder, isPrimary}
   * @returns {Promise<Object>} - Созданная картинка
   */
  async createImage(imageData) {
    const { productId, isPrimary = false } = imageData;

    // Если устанавливаем как основную картинку, снимаем метку с других
    if (isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId, isPrimary: true },
        data: { isPrimary: false }
      });
    } else {
      // Если у продукта нет основной — делаем создаваемую основной
      const existingPrimary = await prisma.productImage.findFirst({
        where: { productId, isPrimary: true }
      });

      if (!existingPrimary) {
        imageData.isPrimary = true;
      }
    }

    return await prisma.productImage.create({
      data: imageData
    });
  }

  /**
   * Обновление картинки
   * @param {number} imageId - ID картинки
   * @param {Object} updateData - Данные для обновления
   * @returns {Promise<Object>} - Обновленная картинка
   */
  async updateImage(imageId, updateData) {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Если делаем картинку основной — снимаем метку с других
    if (updateData.isPrimary) {
      await prisma.productImage.updateMany({
        where: { productId: image.productId, isPrimary: true },
        data: { isPrimary: false }
      });
    }

    return await prisma.productImage.update({
      where: { id: imageId },
      data: updateData
    });
  }

  /**
   * Удаление картинки
   * @param {number} imageId - ID картинки
   * @returns {Promise<Object>} - Удаленная картинка
   */
  async deleteImage(imageId) {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId }
    });

    if (!image) {
      throw new Error('Image not found');
    }

    // Если удаляем основную — назначаем следующую
    if (image.isPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { productId: image.productId, id: { not: imageId } },
        orderBy: { sortOrder: 'asc' }
      });

      if (nextImage) {
        await prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true }
        });
      }
    }

    // Удаляем файл с диска
    if (image.imageUrl) {
      const { deleteFile } = await import('@/lib/utils/fileUtils');
      const deleteResult = await deleteFile(image.imageUrl);
      console.log(`🗑️ Удаление файла изображения ${image.imageUrl}: ${deleteResult ? 'успешно' : 'не удалось'}`);
    }

    return await prisma.productImage.delete({
      where: { id: imageId }
    });
  }

  /**
   * Изменение порядка картинок
   * @param {Array} updates - Массив {id, sortOrder}
   * @returns {Promise<Array>}
   */
  async reorderImages(updates) {
    return await Promise.all(
      updates.map(update =>
        prisma.productImage.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder }
        })
      )
    );
  }

  /**
   * Получение URL основной картинки для API
   * @param {number} productId
   * @returns {Promise<string|null>}
   */
  async getPrimaryImageUrl(productId) {
    const primaryImage = await this.getPrimaryImage(productId);
    return primaryImage?.imageUrl || null;
  }

  /**
   * Получение всех URL картинок для API
   * @param {number} productId
   * @returns {Promise<Array>}
   */
  async getAllImageUrls(productId) {
    const images = await this.getProductImages(productId);
    return images.map(img => img.imageUrl);
  }
}

const productImageService = new ProductImageService();

export default productImageService;
