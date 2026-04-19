import { NextResponse } from 'next/server';

// GET - Get user's language preference
export async function GET(request) {
  try {
    // In a real application, you would get the user ID from the session/token
    // For now, we'll work with a simple approach
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Here you would fetch from your database
    // For now, return a mock response
    return NextResponse.json({ 
      success: true, 
      data: { 
        language: 'ru' // Default language
      }
    });
  } catch (error) {
    console.error('Error getting language preference:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST - Save user's language preference
export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, language } = body;
    
    if (!userId || !language) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and language are required' 
      }, { status: 400 });
    }

    // Validate language
    const allowedLanguages = ['ru', 'en'];
    if (!allowedLanguages.includes(language)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid language' 
      }, { status: 400 });
    }

    // Here you would save to your database
    // For now, we'll just log and return success
    console.log(`Saving language preference for user ${userId}: ${language}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Language preference saved successfully' 
    });
  } catch (error) {
    console.error('Error saving language preference:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}