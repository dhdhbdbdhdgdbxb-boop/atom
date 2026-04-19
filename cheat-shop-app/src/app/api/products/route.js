import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    console.log('Received data:', JSON.stringify(data, null, 2));
    
    // Валидация данных
    if (!data.slug || !data.gameId) {
      return NextResponse.json(
        { error: 'Missing required fields: slug or gameId' },
        { status: 400 }
      );
    }

    // Проверяем, есть ли переводы
    if (!data.translations || data.translations.length === 0) {
      return NextResponse.json(
        { error: 'Product translations are required' },
        { status: 400 }
      );
    }

    // Проверяем названия на обоих языках
    const ruTranslation = data.translations.find(t => t.language === 'ru');
    const enTranslation = data.translations.find(t => t.language === 'en');
    
    if (!ruTranslation?.name || !enTranslation?.name) {
      return NextResponse.json(
        { error: 'Product name is required in both Russian and English' },
        { status: 400 }
      );
    }

    // Проверяем уникальность slug
    const existingProduct = await prisma.product.findUnique({
      where: { slug: data.slug }
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 400 }
      );
    }

    // Создание товара с транзакцией
    const product = await prisma.$transaction(async (tx) => {
      // Создаем основной продукт
      const newProduct = await tx.product.create({
        data: {
          slug: data.slug,
          gameId: parseInt(data.gameId),
          categoryId: data.categoryId ? parseInt(data.categoryId) : null,
          status: data.status || 'undetected',
          regions: JSON.stringify(data.regions || ['global']),
          subscriptionTypes: JSON.stringify(data.subscriptionTypes || ['full']),
          screenshots: data.screenshots ? JSON.stringify(data.screenshots) : null,
          isActive: data.isActive !== false
        }
      });

      console.log('Created product with ID:', newProduct.id);

      // Создаем переводы
      if (data.translations && data.translations.length > 0) {
        console.log('Creating translations:', data.translations);
        await tx.productTranslation.createMany({
          data: data.translations.map(trans => ({
            productId: newProduct.id,
            language: trans.language,
            name: trans.name,
            description: trans.description || null
          }))
        });
      }

      // Создаем функционал
      if (data.features && data.features.length > 0) {
        console.log('Creating features:', data.features);
        // Сначала создаем основные пункты
        const mainFeatures = data.features.filter(f => !f.parentId);
        for (const feature of mainFeatures) {
          const createdFeature = await tx.productFeature.create({
            data: {
              productId: newProduct.id,
              language: feature.language,
              title: feature.title,
              parentId: null,
              sortOrder: feature.sortOrder || 0
            }
          });

          // Затем создаем подпункты для этого основного пункта
          const subFeatures = data.features.filter(f => f.parentId === feature.id);
          if (subFeatures.length > 0) {
            await tx.productFeature.createMany({
              data: subFeatures.map(sub => ({
                productId: newProduct.id,
                language: sub.language,
                title: sub.title,
                parentId: createdFeature.id,
                sortOrder: sub.sortOrder || 0
              }))
            });
          }
        }
      }

      // Создаем системные требования
      if (data.systemRequirements && data.systemRequirements.length > 0) {
        console.log('Creating system requirements:', data.systemRequirements);
        
        // Создаем основные системные требования
        const createdRequirements = [];
        for (const req of data.systemRequirements) {
          const createdReq = await tx.productSystemRequirements.create({
            data: {
              productId: newProduct.id,
              language: req.language,
              gameClient: req.gameClient || null,
              supportedOS: req.supportedOS ? JSON.stringify(req.supportedOS) : null,
              antiCheats: req.antiCheats ? JSON.stringify(req.antiCheats) : null,
              processors: req.processors ? JSON.stringify(req.processors) : null,
              spoofer: req.spoofer || false,
              gameMode: req.gameMode || false
            }
          });
          createdRequirements.push(createdReq);
          
          // Создаем элементы системных требований с правильными requirementId и productId
          if (req.items && req.items.length > 0) {
            await tx.productSystemRequirementItem.createMany({
              data: req.items.map(item => ({
                requirementId: createdReq.id,  // Устанавливаем requirementId на id системного требования
                productId: newProduct.id,       // Устанавливаем productId на id продукта
                language: item.language || req.language,
                title: item.title,
                description: item.description || null,
                icon: item.icon || null,
                sortOrder: item.sortOrder || 0
              }))
            });
          }
        }
      }

      // Создаем варианты
      if (data.variants && data.variants.length > 0) {
        console.log('Creating variants:', data.variants);
        await tx.productVariant.createMany({
          data: data.variants.map(variant => ({
            productId: newProduct.id,
            type: variant.type,
            region: variant.region,
            days: parseInt(variant.days),
            priceUsd: parseFloat(variant.priceUsd),
            priceRub: parseFloat(variant.priceRub),
            keys: JSON.stringify(variant.keys || []),
            isActive: variant.isActive !== false,
            stock: parseInt(variant.stock) || (variant.keys ? variant.keys.length : 0),
            sortOrder: variant.sortOrder || 0
          }))
        });
      }

      // Создаем медиа-файлы
      if (data.media && data.media.length > 0) {
        console.log('Creating media:', data.media);
        // Проверяем, есть ли основное изображение
        const mainImage = data.media.find(m => m.isMainImage && m.type === 'image');
        
        const mediaData = data.media.map(media => ({
          productId: newProduct.id,
          type: media.type,
          url: media.url,
          thumbnail: media.thumbnail || null,
          fileName: media.fileName || null,
          fileSize: media.fileSize || null,
          mimeType: media.mimeType || null,
          width: media.width || null,
          height: media.height || null,
          duration: media.duration || null,
          isMainImage: media.isMainImage || false,
          sortOrder: media.sortOrder || 0
        }));

        await tx.productMedia.createMany({
          data: mediaData
        });

        // Если есть основное изображение, обновляем ссылку на него в продукте
        if (mainImage) {
          const createdMedia = await tx.productMedia.findFirst({
            where: {
              productId: newProduct.id,
              url: mainImage.url
            }
          });

          if (createdMedia) {
            await tx.product.update({
              where: { id: newProduct.id },
              data: { mainImageId: createdMedia.id }
            });
          }
        }
      }

      // Получаем полный объект продукта
      return await tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          translations: true,
          features: {
            include: {
              children: true
            }
          },
          systemRequirements: true,
          variants: true,
          media: true,
          game: true,
          category: true
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      product,
      message: 'Product created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    const whereClause = search
      ? {
          translations: {
            some: {
              name: {
                contains: search,
                mode: 'insensitive'
              }
            }
          }
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        skip,
        take: limit,
        where: whereClause,
        include: {
          translations: true,
          game: true,
          category: true,
          variants: {
            where: { isActive: true }
          },
          media: {
            where: { isMainImage: true },
            take: 1
          },
          _count: {
            select: { variants: true, media: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where: whereClause })
    ]);

    return NextResponse.json({ 
      success: true, 
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
