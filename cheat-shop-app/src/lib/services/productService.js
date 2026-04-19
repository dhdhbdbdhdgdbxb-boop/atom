/**
 * Сервис для работы с продуктами
 */

import prisma from '@/lib/prisma';
import productVariantService, { validateVariantData } from './productVariantService';
import { getMinPrice, formatPrice } from '@/lib/utils/variantUtils';

class ProductService {
  /**
   * Получение продукта по ID
   * @param {number} id - ID продукта
   * @returns {Promise<Object>} - Продукт с вариантами
   */
  async getProductById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          include: {
            game: true
          }
        },
        game: true,
        translations: true,
        features: true,
        systemRequirements: true,
        media: true
      }
    });

    if (!product) {
      return null;
    }

    const variants = await productVariantService.getVariantsByProductId(id);

    // Преобразуем данные для удобства использования в форме
    const regions = product.regions ? JSON.parse(product.regions) : ['global'];
    const subscriptionTypes = product.subscriptionTypes ? JSON.parse(product.subscriptionTypes) : ['full'];

    // Преобразуем системные требования
    const systemRequirements = await Promise.all(
      product.systemRequirements.map(async req => {
        const items = await prisma.productSystemRequirementItem.findMany({
          where: { productId: product.id },
          orderBy: { sortOrder: 'asc' }
        });
        
        return {
          ...req,
          supportedOS: req.supportedOS ? JSON.parse(req.supportedOS) : [],
          antiCheats: req.antiCheats ? JSON.parse(req.antiCheats) : [],
          processors: req.processors ? JSON.parse(req.processors) : [],
          items: items.map(item => ({
            ...item,
            id: item.id,
            language: item.language,
            title: item.title,
            description: item.description,
            icon: item.icon,
            sortOrder: item.sortOrder
          }))
        };
      })
    );

    console.log('Product data from DB:', {
      ...product,
      regions,
      subscriptionTypes,
      variants,
      systemRequirements,
      media: product.media
    });

    return {
      ...product,
      regions,
      subscriptionTypes,
      variants,
      systemRequirements,
      media: product.media || []
    };
  }

  /**
   * Получение продукта по slug
   * @param {string} slug - Slug продукта
   * @returns {Promise<Object>} - Продукт с вариантами
   */
  async getProductBySlug(slug) {
    const product = await prisma.product.findFirst({
      where: { slug, isActive: true },
      include: {
        category: {
          include: {
            game: true
          }
        },
        game: true,
        translations: true,
        systemRequirements: true,
        media: true
      }
    });

    if (!product) {
      return null;
    }

    const variants = await productVariantService.getVariantsByProductId(product.id);
    const images = await prisma.productImage.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: 'asc' }
    });

    // Загружаем элементы системных требований
    const systemRequirementItems = await prisma.productSystemRequirementItem.findMany({
      where: { productId: product.id },
      orderBy: { sortOrder: 'asc' }
    });

    return {
      ...product,
      variants,
      images,
      systemRequirementItems
    };
  }

  /**
   * Создание нового продукта
   * @param {Object} productData - Данные продукта
   * @returns {Promise<Object>} - Созданный продукт с вариантами
   */
  async createProduct(productData) {
    console.log('🏭 ProductService.createProduct called with:', JSON.stringify(productData, null, 2));
    
    // Валидация обязательных полей
    if (!productData.slug || !productData.slug.trim()) {
      throw new Error('Product slug is required');
    }

    // Категория не обязательна, если товар создается под игрой
    if (!productData.categoryId && !productData.gameId) {
      throw new Error('Either Category ID or Game ID is required');
    }

    // Проверка обязательных переводов
    const ruTranslation = productData.translations && productData.translations.find(t => t.language === 'ru');
    if (!ruTranslation || !ruTranslation.name) {
      throw new Error('Russian product name is required');
    }

    const enTranslation = productData.translations && productData.translations.find(t => t.language === 'en');
    if (!enTranslation || !enTranslation.name) {
      throw new Error('English product name is required');
    }

    // Проверка уникальности slug
    const existingSlug = await prisma.product.findUnique({
      where: { slug: productData.slug }
    });

    if (existingSlug) {
      throw new Error('Product with this slug already exists');
    }

    // Проверка существования категории, если она указана
    let category = null;
    if (productData.categoryId) {
      category = await prisma.category.findUnique({
        where: { id: parseInt(productData.categoryId) }
      });

      if (!category) {
        throw new Error('Category not found');
      }
    }

    // Проверка вариантов
    if (productData.variants && !Array.isArray(productData.variants)) {
      throw new Error('Variants must be an array');
    }

    if (productData.variants && productData.variants.length === 0) {
      throw new Error('Product must have at least one variant');
    }

    // Валидация каждого варианта
    if (productData.variants) {
      for (const variantData of productData.variants) {
        const validation = validateVariantData(variantData);
        if (!validation.valid) {
          throw new Error(`Variant validation error: ${validation.message}`);
        }
      }
    }

    console.log('✅ Validation passed, creating product in database...');

    // Создание продукта
    const product = await prisma.product.create({
      data: {
        slug: productData.slug.toLowerCase().trim(),
        status: productData.status || 'undetected',
        isActive: productData.isActive !== undefined ? productData.isActive : true,
        categoryId: productData.categoryId ? parseInt(productData.categoryId) : null,
        gameId: parseInt(productData.gameId),
        regions: JSON.stringify(productData.regions || ['global']),
        subscriptionTypes: JSON.stringify(productData.subscriptionTypes || ['full'])
      },
      include: {
        category: {
          include: {
            game: true
          }
        },
        game: true
      }
    });

    console.log('✅ Product created in database:', product.id);

    // Создание переводов для продукта
    if (productData.translations) {
      console.log('📝 Creating translations...');
      const translationPromises = [];
   
      for (const translation of productData.translations) {
        if (translation.name) {
          translationPromises.push(
            prisma.productTranslation.create({
              data: {
                productId: product.id,
                language: translation.language,
                name: translation.name,
                description: translation.description || ''
                // TODO: Добавить SEO поля после обновления production:
                // metaTitle: translation.metaTitle || '',
                // metaDescription: translation.metaDescription || '',
                // metaKeywords: translation.metaKeywords || ''
              }
            })
          );
        }
      }
   
      await Promise.all(translationPromises);
      console.log('✅ Translations created:', translationPromises.length);
    }

    // Создание медиафайлов
    if (productData.media && productData.media.length > 0) {
      console.log('🖼️ Creating media files...');
      const mediaPromises = productData.media.map(media =>
        prisma.productMedia.create({
          data: {
            productId: product.id,
            type: media.type,
            url: media.url,
            thumbnail: media.thumbnail,
            fileName: media.fileName,
            fileSize: media.fileSize,
            mimeType: media.mimeType,
            width: media.width,
            height: media.height,
            duration: media.duration,
            isMainImage: media.isMainImage,
            sortOrder: media.sortOrder || 0
          }
        })
      );
      await Promise.all(mediaPromises);
      console.log('✅ Media files created:', mediaPromises.length);
    }

    // Создание вариантов, если они есть
    if (productData.variants && productData.variants.length > 0) {
      console.log('🔧 Creating variants...');
      for (const variantData of productData.variants) {
        await productVariantService.createVariant(product.id, {
          ...variantData,
          instructions: productVariantService.formatInstructions(variantData.instructions)
        });
      }
      console.log('✅ Variants created:', productData.variants.length);
    }

    // Создание фичей
    if (productData.features && productData.features.length > 0) {
      console.log('⭐ Creating features...');
      console.log('Создание фичей для продукта:', product.id);
      console.log('Общее количество фичей:', productData.features.length);
      console.log('Основные фичи:', productData.features.filter(f => !f.parentId).length);
      console.log('Подпункты:', productData.features.filter(f => f.parentId).length);
      // Сначала создаем все фичи без parentId (для основных пунктов)
      const featuresToCreate = productData.features
        .filter(feature => !feature.parentId) // Только основные пункты
        .map(feature => ({
          productId: product.id,
          language: feature.language,
          title: feature.title,
          parentId: null,
          sortOrder: feature.sortOrder || 0
        }));

      const createdFeatures = [];
      const tempIdToRealIdMap = new Map(); // Карта для сопоставления временных ID с реальными
      
      // Создаем основные фичи по одной, чтобы получить их реальные ID
      for (const featureData of featuresToCreate) {
        const createdFeature = await prisma.productFeature.create({
          data: featureData
        });
        createdFeatures.push(createdFeature);
        
        // Сохраняем сопоставление временного ID с реальным ID
        const originalFeature = productData.features.find(f =>
          f.language === createdFeature.language &&
          f.title === createdFeature.title &&
          !f.parentId
        );
        if (originalFeature && originalFeature.id) {
          tempIdToRealIdMap.set(originalFeature.id, createdFeature.id);
        }
      }

      // Теперь создаем подпункты с правильными parentId
        const subFeaturesToCreate = productData.features
          .filter(feature => feature.parentId) // Только подпункты
          .map(feature => {
            // Находим реальный ID родительской фичи по временному ID
            const parentRealId = tempIdToRealIdMap.get(feature.parentId);
            
            console.log('Создание подпункта:', {
              originalFeature: feature,
              parentRealId,
              title: feature.text || feature.title
            });
            
            return {
              productId: product.id,
              language: feature.language,
              title: feature.text || feature.title, // Используем text в первую очередь
              parentId: parentRealId || null,
              sortOrder: feature.sortOrder || 0
            };
          });

      // Создаем подпункты
      for (const subFeatureData of subFeaturesToCreate) {
        if (subFeatureData.parentId) { // Только если нашли родителя
          try {
            await prisma.productFeature.create({
              data: subFeatureData
            });
          } catch (error) {
            console.error('Ошибка при создании подпункта:', error);
            // Если ошибка из-за уникального ограничения, добавляем суффикс к названию
            if (error.code === 'P2002' && error.meta?.target?.includes('title')) {
              subFeatureData.title = `${subFeatureData.title} (${Date.now()})`;
              await prisma.productFeature.create({
                data: subFeatureData
              });
            }
          }
        }
      }
      console.log('✅ Features created successfully');
    }

    // Создание системных требований
    if (productData.systemRequirements && productData.systemRequirements.length > 0) {
      console.log('💻 Creating system requirements...');
      const reqPromises = productData.systemRequirements.map(req =>
        prisma.productSystemRequirements.create({
          data: {
            productId: product.id,
            language: req.language,
            gameClient: req.gameClient,
            supportedOS: JSON.stringify(req.supportedOS),
            antiCheats: JSON.stringify(req.antiCheats),
            processors: JSON.stringify(req.processors),
            spoofer: req.spoofer,
            gameMode: req.gameMode,
            items: {
              create: req.items ? req.items.map(item => ({
                productId: product.id,
                language: item.language,
                title: item.title,
                description: item.description,
                icon: item.icon,
                sortOrder: item.sortOrder || 0
              })) : []
            }
          }
        })
      );
      await Promise.all(reqPromises);
      console.log('✅ System requirements created:', reqPromises.length);
    }

    console.log('🎉 Product creation completed successfully');

    // Возвращаем продукт с вариантами
    return await this.getProductById(product.id);
  }

  /**
   * Обновление продукта
   * @param {number} id - ID продукта
   * @param {Object} productData - Данные для обновления
   * @returns {Promise<Object>} - Обновленный продукт с вариантами
   */
  async updateProduct(id, productData) {
    // Проверяем существование продукта
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        translations: true,
        features: true,
        systemRequirements: true,
        media: true,
        variants: true
      }
    });

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Валидация - должен быть хотя бы один вариант если variants переданы
    if (productData.variants !== undefined && productData.variants.length === 0) {
      throw new Error('Product must have at least one variant');
    }

    // Обновление продукта
    const product = await prisma.product.update({
      where: { id },
      data: {
        slug: productData.slug,
        status: productData.status,
        isActive: productData.isActive !== undefined ? productData.isActive : existingProduct.isActive,
        categoryId: productData.categoryId,
        gameId: productData.gameId,
        regions: JSON.stringify(productData.regions || ['global']),
        subscriptionTypes: JSON.stringify(productData.subscriptionTypes || ['full'])
      },
      include: {
        category: {
          include: {
            game: true
          }
        },
        game: true
      }
    });

    // Обновление переводов, если они переданы
    if (productData.translations) {
      const translationPromises = [];

      for (const translation of productData.translations) {
        if (translation.name) {
          // Проверяем существование перевода
          const existingTranslation = await prisma.productTranslation.findUnique({
            where: {
              productId_language: {
                productId: product.id,
                language: translation.language
              }
            }
          });

          if (existingTranslation) {
            // Обновляем существующий перевод
            translationPromises.push(
              prisma.productTranslation.update({
                where: { id: existingTranslation.id },
                data: {
                  name: translation.name,
                  description: translation.description || '',
                  metaTitle: translation.metaTitle || '',
                  metaDescription: translation.metaDescription || '',
                  metaKeywords: translation.metaKeywords || ''
                }
              })
            );
          } else {
            // Создаем новый перевод
            translationPromises.push(
              prisma.productTranslation.create({
                data: {
                  productId: product.id,
                  language: translation.language,
                  name: translation.name,
                  description: translation.description || '',
                  metaTitle: translation.metaTitle || '',
                  metaDescription: translation.metaDescription || '',
                  metaKeywords: translation.metaKeywords || ''
                }
              })
            );
          }
        }
      }

      await Promise.all(translationPromises);
    }

    // Обновление фичей, если они переданы
    if (productData.features) {
      // Удаляем старые фичи
      await prisma.productFeature.deleteMany({
        where: { productId: product.id }
      });

      if (productData.features.length > 0) {
        // Сначала создаем все основные фичи (без parentId)
        const mainFeatures = productData.features
          .filter(feature => !feature.parentId)
          .map(feature => ({
            productId: product.id,
            language: feature.language,
            title: feature.title,
            parentId: null,
            sortOrder: feature.sortOrder || 0
          }));

        const createdFeatures = [];
        const tempIdToRealIdMap = new Map(); // Карта для сопоставления временных ID с реальными
        
        // Создаем основные фичи по одной, чтобы получить их реальные ID
        for (const featureData of mainFeatures) {
          const createdFeature = await prisma.productFeature.create({
            data: featureData
          });
          createdFeatures.push(createdFeature);
          
          // Сохраняем сопоставление временного ID с реальным ID
          const originalFeature = productData.features.find(f =>
            f.language === createdFeature.language &&
            f.title === createdFeature.title &&
            !f.parentId
          );
          if (originalFeature && originalFeature.id) {
            tempIdToRealIdMap.set(originalFeature.id, createdFeature.id);
          }
        }

        // Теперь создаем подпункты с правильными parentId
            const subFeatures = productData.features
              .filter(feature => feature.parentId)
              .map(feature => {
                // Находим реальный ID родительской фичи по временному ID
                const parentRealId = tempIdToRealIdMap.get(feature.parentId);
               
                console.log('Обновление подпункта:', {
                  originalFeature: feature,
                  parentRealId,
                  title: feature.text || feature.title
                });
               
                return {
                  productId: product.id,
                  language: feature.language,
                  title: feature.text || feature.title, // Используем text в первую очередь
                  parentId: parentRealId || null,
                  sortOrder: feature.sortOrder || 0
                };
              });

        // Создаем подпункты
        for (const subFeatureData of subFeatures) {
          if (subFeatureData.parentId) { // Только если нашли родителя
            try {
              await prisma.productFeature.create({
                data: subFeatureData
              });
            } catch (error) {
              console.error('Ошибка при создании подпункта:', error);
              // Если ошибка из-за уникального ограничения, добавляем суффикс к названию
              if (error.code === 'P2002' && error.meta?.target?.includes('title')) {
                subFeatureData.title = `${subFeatureData.title} (${Date.now()})`;
                await prisma.productFeature.create({
                  data: subFeatureData
                });
              }
            }
          }
        }
      }
    }

    // Обновление системных требований, если они переданы
    if (productData.systemRequirements) {
      // Сначала удаляем все элементы системных требований для этого продукта
      await prisma.productSystemRequirementItem.deleteMany({
        where: { productId: product.id }
      });

      // Затем удаляем старые системные требования
      await prisma.productSystemRequirements.deleteMany({
        where: { productId: product.id }
      });

      if (productData.systemRequirements.length > 0) {
        // Создаем новые системные требования
        const reqPromises = productData.systemRequirements.map(req =>
          prisma.productSystemRequirements.create({
            data: {
              productId: product.id,
              language: req.language,
              gameClient: req.gameClient,
              supportedOS: JSON.stringify(req.supportedOS),
              antiCheats: JSON.stringify(req.antiCheats),
              processors: JSON.stringify(req.processors),
              spoofer: req.spoofer,
              gameMode: req.gameMode,
              items: {
                create: req.items ? req.items.map(item => ({
                  productId: product.id,  // Устанавливаем productId на id продукта
                  language: item.language,
                  title: item.title,
                  description: item.description,
                  icon: item.icon,
                  sortOrder: item.sortOrder || 0
                })) : []
              }
            }
          })
        );
        await Promise.all(reqPromises);
      }
    }

    // Обновление медиа, если они переданы
    if (productData.media !== undefined) {
      console.log('Updating media for product', product.id, 'with', productData.media.length, 'files');
      
      // Получаем старые медиафайлы для удаления с диска
      const { getProductMediaFiles, deleteFiles } = await import('@/lib/utils/fileUtils');
      const oldMediaFiles = await getProductMediaFiles(product.id);
      
      // Удаляем старые медиа из БД
      await prisma.productMedia.deleteMany({
        where: { productId: product.id }
      });

      if (productData.media.length > 0) {
        // Создаем новые медиа
        const createPromises = productData.media.map((media, index) =>
          prisma.productMedia.create({
            data: {
              productId: product.id,
              type: media.type || 'image',
              url: media.url,
              thumbnail: media.thumbnail,
              fileName: media.fileName,
              fileSize: media.fileSize,
              mimeType: media.mimeType,
              width: media.width,
              height: media.height,
              duration: media.duration,
              isMainImage: media.isMainImage || false,
              sortOrder: media.sortOrder !== undefined ? media.sortOrder : index
            }
          })
        );
        
        await Promise.all(createPromises);
        console.log('Media updated successfully');

        // Определяем, какие файлы нужно удалить (те, что были, но не остались)
        const newMediaFiles = [];
        productData.media.forEach(media => {
          if (media.url) newMediaFiles.push(media.url);
          if (media.thumbnail) newMediaFiles.push(media.thumbnail);
        });

        const filesToDelete = oldMediaFiles.filter(oldFile => !newMediaFiles.includes(oldFile));
        
        if (filesToDelete.length > 0) {
          console.log(`🗑️ Удаляем ${filesToDelete.length} неиспользуемых файлов:`, filesToDelete);
          const deleteResult = await deleteFiles(filesToDelete);
          console.log(`🗑️ Результат удаления файлов:`, deleteResult);
        }
      } else {
        // Если передали пустой массив медиа - удаляем все старые файлы
        if (oldMediaFiles.length > 0) {
          console.log(`🗑️ Удаляем все медиафайлы продукта (${oldMediaFiles.length} файлов)`);
          const deleteResult = await deleteFiles(oldMediaFiles);
          console.log(`🗑️ Результат удаления всех файлов:`, deleteResult);
        }
      }
    }

    // Обновление вариантов, если они переданы
    if (productData.variants) {
      // Сначала получаем все существующие варианты
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId: product.id }
      });

      // Создаем карту для сопоставления существующих вариантов по их характеристикам
      const existingVariantsMap = new Map();
      existingVariants.forEach(variant => {
        const key = `${variant.type}_${variant.region}_${variant.days}`;
        existingVariantsMap.set(key, variant);
      });

      // Создаем карту для новых вариантов по их характеристикам
      const newVariantsMap = new Map();
      productData.variants.forEach(variant => {
        const key = `${variant.type}_${variant.region}_${variant.days}`;
        newVariantsMap.set(key, variant);
      });

      // Определяем, какие варианты нужно создать, обновить или удалить
      const variantsToCreate = [];
      const variantsToUpdate = [];
      const variantsToDelete = [];

      // Проверяем, какие новые варианты нужно создать
      for (const [key, newVariant] of newVariantsMap.entries()) {
        if (!existingVariantsMap.has(key)) {
          variantsToCreate.push(newVariant);
        }
      }

      // Проверяем, какие существующие варианты нужно обновить или удалить
      for (const [key, existingVariant] of existingVariantsMap.entries()) {
        if (newVariantsMap.has(key)) {
          // Вариант существует в новых данных - нужно обновить
          const newVariantData = newVariantsMap.get(key);
          
          // Проверяем, изменились ли данные варианта
          const needsUpdate =
            existingVariant.priceUsd !== parseFloat(newVariantData.priceUsd || 0) ||
            existingVariant.priceRub !== parseFloat(newVariantData.priceRub || 0) ||
            existingVariant.keys !== (Array.isArray(newVariantData.keys) ? JSON.stringify(newVariantData.keys) : (newVariantData.keys || '')) ||
            existingVariant.isActive !== newVariantData.isActive ||
            existingVariant.sortOrder !== newVariantData.sortOrder ||
            existingVariant.instructions !== productVariantService.formatInstructions(newVariantData.instructions);

          if (needsUpdate) {
            variantsToUpdate.push({
              variantId: existingVariant.id,
              variantData: newVariantData
            });
          }
        } else {
          // Варианта нет в новых данных - нужно удалить
          variantsToDelete.push(existingVariant);
        }
      }

      // Обрабатываем варианты для удаления
      for (const variantToDelete of variantsToDelete) {
        // Проверяем, есть ли заказы, связанные с этим вариантом
        const ordersCount = await prisma.order.count({
          where: { variantId: variantToDelete.id }
        });

        if (ordersCount > 0) {
          // Если есть заказы, обновляем их, чтобы они ссылались на null
          await prisma.order.updateMany({
            where: { variantId: variantToDelete.id },
            data: { variantId: null }
          });
        }

        // Удаляем вариант
        await prisma.productVariant.delete({
          where: { id: variantToDelete.id }
        });
      }

      // Обрабатываем варианты для обновления
      for (const update of variantsToUpdate) {
        await productVariantService.updateVariant(update.variantId, {
          ...update.variantData,
          instructions: productVariantService.formatInstructions(update.variantData.instructions)
        });
      }

      // Обрабатываем варианты для создания
      for (const variantData of variantsToCreate) {
        await productVariantService.createVariant(product.id, {
          ...variantData,
          instructions: productVariantService.formatInstructions(variantData.instructions)
        });
      }
    }

    // Возвращаем продукт с вариантами
    return await this.getProductById(product.id);
  }

  /**
   * Удаление продукта
   * @param {number} id - ID продукта
   * @returns {Promise<Object>} - Удаленный продукт
   */
  async deleteProduct(id) {
    // Проверяем существование продукта
    const product = await prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Удаляем медиафайлы с диска перед удалением из БД
    const { deleteProductMediaFiles } = await import('@/lib/utils/fileUtils');
    const deleteResult = await deleteProductMediaFiles(id);
    console.log(`🗑️ Удалено файлов продукта ${id}:`, deleteResult);

    // Сначала удаляем все заказы, связанные с этим продуктом
    // Это необходимо, так как поле productId в Order не является nullable
    await prisma.order.deleteMany({
      where: { productId: id }
    });

    // Теперь можно безопасно удалить продукт
    return await prisma.product.delete({
      where: { id }
    });
  }

  /**
   * Получение минимальной цены для продукта
   * @param {number} productId - ID продукта
   * @param {string} [language] - Язык для отображения
   * @returns {Promise<string>} - Отформатированная минимальная цена
   */
  async getProductMinPrice(productId, language = 'ru') {
    const minPrice = await productVariantService.getMinPrice(productId);
    const variants = await productVariantService.getVariantsByProductId(productId);

    // Берем валюту из первого варианта
    const currency = variants.length > 0 ? variants[0].currency : 'RUB';

    return formatPrice(minPrice, currency, language);
  }

  /**
   * Получение продуктов для каталога
   * @param {Object} params - Параметры фильтрации
   * @returns {Promise<Array>} - Список продуктов с минимальными ценами
   */
  async getProductsForCatalog(params = {}) {
    const { gameId, categoryId, isNew } = params;

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        gameId,
        categoryId,
        isNew
      },
      include: {
        category: {
          include: {
            game: true
          }
        },
        game: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    // Добавляем минимальные цены
    return await Promise.all(
      products.map(async (product) => {
        const variants = await productVariantService.getVariantsByProductId(product.id);
        const minPrice = getMinPrice(variants);
        const currency = variants.length > 0 ? variants[0].currency : 'RUB';
        
        // Получаем основную картинку для использования в карточке
        const mainImage = await prisma.productMedia.findFirst({
          where: { 
            productId: product.id, 
            isMainImage: true,
            type: 'image'
          }
        });

        return {
          ...product,
          minPrice,
          formattedPrice: formatPrice(minPrice, currency, 'ru'),
          variantsCount: variants.length,
          image: mainImage?.url || product.image // Используем основную картинку если есть
        };
      })
    );
  }

  /**
   * Обновление порядка сортировки продуктов
   * @param {Array} updates - Массив обновлений {id, sortOrder}
   * @returns {Promise<Array>} - Обновленные продукты
   */
  async reorderProducts(updates) {
    return await Promise.all(
      updates.map(update =>
        prisma.product.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder }
        })
      )
    );
  }
}

// Создаем экземпляр и присваиваем переменной
const productService = new ProductService();

// Экспортируем экземпляр
export default productService;