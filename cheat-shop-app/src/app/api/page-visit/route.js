import { NextResponse } from 'next/server';
import { trackPageVisit } from '../../../lib/services/pageVisitService';

export async function POST(request) {
  try {
    const result = await trackPageVisit(request);
    return NextResponse.json({ success: true, isUnique: result.isUnique });
  } catch (error) {
    console.error('Error tracking page visit:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { getPageVisitStats, getPageVisitStatsByPeriod } = await import('../../../lib/services/pageVisitService');
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    
    if (period && ['24H', '7D', '30D'].includes(period)) {
      const stats = await getPageVisitStatsByPeriod(period);
      return NextResponse.json({ success: true, stats, period });
    } else {
      const stats = await getPageVisitStats();
      return NextResponse.json({ success: true, stats });
    }
  } catch (error) {
    console.error('Error getting page visit stats:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}