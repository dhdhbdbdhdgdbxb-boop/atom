// Reorder products API route
import { requireAdmin } from '@/lib/adminAuth.js';
import prisma from '@/lib/prisma.js';
import catalogService from '@/lib/services/catalogService.js';

// PATCH /api/admin/products/reorder - Update products sort order
export async function PATCH(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return Response.json(
        { success: false, error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    // Validate updates array
    for (const update of updates) {
      if (!update.id || update.sortOrder === undefined) {
        return Response.json(
          { success: false, error: 'Each update must have id and sortOrder' },
          { status: 400 }
        );
      }
    }

    // Update sort orders
    await Promise.all(
      updates.map(update =>
        prisma.product.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder }
        })
      )
    );

    // Invalidate catalog cache
    await catalogService.invalidateCache();

    return Response.json({
      success: true,
      message: 'Products reordered successfully'
    });

  } catch (error) {
    console.error('Reorder products error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}