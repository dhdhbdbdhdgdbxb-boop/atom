import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const result = await requireAdmin(request);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const admin = result.admin;

    // Get settings from database
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { 
          success: true, 
          settings: { 
            telegramToken: '', 
            discordWebhook: '' 
          } 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        settings: { 
          telegramToken: settings.telegramToken || '', 
          discordWebhook: settings.discordWebhook || '' 
        } 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const result = await requireAdmin(request);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const admin = result.admin;
    const { telegramToken, discordWebhook } = await request.json();

    if (!telegramToken && !discordWebhook) {
      return NextResponse.json(
        { success: false, error: 'No settings provided' },
        { status: 400 }
      );
    }

    // Update or create settings in database
    const updatedSettings = await prisma.settings.upsert({
      where: { id: 1 },
      update: {
        telegramToken: telegramToken || '',
        discordWebhook: discordWebhook || ''
      },
      create: {
        id: 1,
        telegramToken: telegramToken || '',
        discordWebhook: discordWebhook || ''
      }
    });

    return NextResponse.json(
      { 
        success: true, 
        settings: updatedSettings 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}