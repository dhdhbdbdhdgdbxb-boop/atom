import { requireAdmin } from '@/lib/adminAuth.js';
import prisma from '@/lib/prisma.js';

// POST /api/admin/logs/search - Search logs
export async function POST(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { query, field } = await request.json();

    if (!query) {
      return Response.json(
        { success: false, error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Build search conditions based on field
    let whereCondition = {};
    
    if (field === 'id') {
      const logId = parseInt(query);
      if (isNaN(logId)) {
        return Response.json(
          { success: false, error: 'Invalid ID format' },
          { status: 400 }
        );
      }
      whereCondition = { id: logId };
    } else if (field === 'user') {
      // For MySQL, use startsWith/endsWith/contains without mode
      whereCondition = {
        OR: [
          { user: { contains: query } },
          { user: { startsWith: query } },
          { user: { endsWith: query } }
        ]
      };
    } else if (field === 'timestamp') {
      // Try to parse timestamp - can be date string or timestamp
      const timestamp = Date.parse(query);
      if (isNaN(timestamp)) {
        return Response.json(
          { success: false, error: 'Invalid timestamp format' },
          { status: 400 }
        );
      }
      const date = new Date(timestamp);
      const startOfDay = new Date(date.setHours(0, 0, 0, 0)).getTime();
      const endOfDay = new Date(date.setHours(23, 59, 59, 999)).getTime();
      
      whereCondition = {
        timestamp: {
          gte: BigInt(startOfDay),
          lte: BigInt(endOfDay)
        }
      };
    } else if (field === 'description') {
      // For MySQL, use startsWith/endsWith/contains without mode
      whereCondition = {
        OR: [
          { description: { contains: query } },
          { description: { startsWith: query } },
          { description: { endsWith: query } }
        ]
      };
    } else {
      // Search across all fields if no specific field provided
      const queryInt = parseInt(query);
      const conditions = [];
      
      // Add text search conditions
      conditions.push(
        { user: { contains: query } },
        { user: { startsWith: query } },
        { user: { endsWith: query } },
        { description: { contains: query } },
        { description: { startsWith: query } },
        { description: { endsWith: query } }
      );
      
      // Add ID search if query is a valid number
      if (!isNaN(queryInt)) {
        conditions.push({ id: queryInt });
      }
      
      whereCondition = { OR: conditions };
    }

    const logs = await prisma.log.findMany({
      where: whereCondition,
      orderBy: [
        { timestamp: 'desc' }
      ]
    });

    // Преобразуем BigInt в строку для сериализации в JSON
    const serializedLogs = logs.map(log => ({
      ...log,
      timestamp: log.timestamp.toString()
    }));

    return Response.json({
      success: true,
      logs: serializedLogs,
      count: logs.length
    });

  } catch (error) {
    console.error('Search logs error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/logs/search - Get all logs for advanced search (no pagination)
export async function GET(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const logs = await prisma.log.findMany({
      orderBy: [
        { timestamp: 'desc' }
      ]
    });

    // Преобразуем BigInt в строку для сериализации в JSON
    const serializedLogs = logs.map(log => ({
      ...log,
      timestamp: log.timestamp.toString()
    }));

    return Response.json({
      success: true,
      logs: serializedLogs,
      count: logs.length
    });

  } catch (error) {
    console.error('Get all logs error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}