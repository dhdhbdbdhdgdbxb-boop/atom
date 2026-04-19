import { requireAdmin } from '@/lib/adminAuth.js';
import productService from '@/lib/services/productService';
import catalogService from '@/lib/services/catalogService';

export async function GET(request, { params }) {
  try {
    const { success, admin, status, error } = await requireAdmin(request);

    if (!success) {
      return Response.json(
        { success: false, error },
        { status }
      );
    }

    const { id } = await params;

    const product = await productService.getProductById(parseInt(id));

    if (!product) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Логируем информацию о медиа для отладки
    console.log(`GET /api/admin/products/${id}: Found product with`, product.media?.length || 0, 'media files');

    return Response.json({ 
      success: true, 
      product 
    });

  } catch (error) {
    console.error('Get product error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { success, admin, status, error } = await requireAdmin(request);

    if (!success) {
      return Response.json(
        { success: false, error },
        { status }
      );
    }

    const { id } = await params;
    const body = await request.json();

    console.log(`PUT /api/admin/products/${id}: Updating product with`, body.media?.length || 0, 'media files');

    // Валидация входных данных
    if (!body.slug || !body.slug.trim()) {
      return Response.json(
        { success: false, error: 'Product slug is required' },
        { status: 400 }
      );
    }

    // Проверяем обязательные переводы
    const ruTranslation = body.translations?.find(t => t.language === 'ru');
    const enTranslation = body.translations?.find(t => t.language === 'en');
    
    if (!ruTranslation?.name?.trim()) {
      return Response.json(
        { success: false, error: 'Russian product name is required' },
        { status: 400 }
      );
    }

    if (!enTranslation?.name?.trim()) {
      return Response.json(
        { success: false, error: 'English product name is required' },
        { status: 400 }
      );
    }

    // Проверяем медиафайлы
    if (body.media && !Array.isArray(body.media)) {
      return Response.json(
        { success: false, error: 'Media must be an array' },
        { status: 400 }
      );
    }

    // Проверяем лимиты медиа
    if (body.media) {
      const images = body.media.filter(m => m.type === 'image').length;
      const videos = body.media.filter(m => m.type === 'video').length;
      
      if (images > 10) {
        return Response.json(
          { success: false, error: 'Maximum 10 images allowed' },
          { status: 400 }
        );
      }
      
      if (videos > 10) {
        return Response.json(
          { success: false, error: 'Maximum 10 videos allowed' },
          { status: 400 }
        );
      }
    }

    const product = await productService.updateProduct(parseInt(id), body);

    // Инвалидируем кэш каталога
    await catalogService.invalidateCache();

    console.log(`PUT /api/admin/products/${id}: Product updated successfully`);

    return Response.json({ 
      success: true, 
      product,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Update product error:', error);
    
    // Определяем статус ошибки
    let statusCode = 500;
    if (error.message.includes('slug') && error.message.includes('already exists')) {
      statusCode = 409;
    } else if (error.message.includes('not found') || error.message.includes('required')) {
      statusCode = 400;
    } else if (error.message.includes('validation')) {
      statusCode = 422;
    }

    return Response.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: statusCode }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { success, admin, status, error } = await requireAdmin(request);

    if (!success) {
      return Response.json(
        { success: false, error },
        { status }
      );
    }

    const { id } = await params;

    const product = await productService.deleteProduct(parseInt(id));

    // Инвалидируем кэш каталога
    await catalogService.invalidateCache();

    return Response.json({ 
      success: true, 
      message: 'Product deleted successfully',
      product 
    });

  } catch (error) {
    console.error('Delete product error:', error);
    
    let statusCode = 500;
    if (error.message.includes('not found')) {
      statusCode = 404;
    }

    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: statusCode }
    );
  }
}

// Добавляем OPTIONS метод для CORS
export async function OPTIONS(request) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}