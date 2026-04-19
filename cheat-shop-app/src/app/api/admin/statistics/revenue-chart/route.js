import { NextResponse } from 'next/server';
import revenueService from '@/lib/services/revenueService';

export async function GET(request) {
  try {
    // Получаем параметры запроса
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7D';
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    
    let days;
    
    // Если указаны кастомные даты
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      // Получаем данные за кастомный период
      const customRevenueData = await revenueService.getRevenueDataByDateRange(start, end);
      
      return NextResponse.json({
        success: true,
        revenueData: customRevenueData
      });
    }
    
    // Определяем количество дней в зависимости от периода
    switch (period) {
      case '7D':
        days = 7;
        break;
      case '30D':
        days = 30;
        break;
      default:
        days = 7;
    }
    
    // Получаем данные о доходах через сервис
    const revenueData = await revenueService.getRevenueData(days);
    
    return NextResponse.json({
      success: true,
      revenueData: revenueData
    });
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch revenue chart data',
      details: error.message
    }, { status: 500 });
  }
}