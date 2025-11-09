// POST /api/chat - Send message to AI chat
// GET /api/chat/[userId] - Get chat history for user  
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

// Simple AI chat responses (in production, integrate with OpenAI or similar)
const generateAIResponse = (message: string) => {
  const lower = message.toLowerCase();
  
  if (lower.includes('area') || lower.includes('good') || lower.includes('best')) {
    return "Top Areas: Indiranagar (fast resolution), Koramangala (active community), Jayanagar (well-maintained). Want a detailed comparison?";
  } else if (lower.includes('issue') || lower.includes('nearby') || lower.includes('problem')) {
    return "Recent issues: 1) Pothole on Market Rd (4 confirmed) 2) Water shortage in Koramangala. Want details?";
  } else if (lower.includes('scam') || lower.includes('fraud') || lower.includes('safety')) {
    return "Recent scams: UPI fraud near ATMs (2 reports), fake delivery agents. Stay alert and report suspicious activity!";
  } else if (lower.includes('contact') || lower.includes('department') || lower.includes('office')) {
    return "Key contacts: BBMP - 1913, Water Board - 1916, Traffic Police - 103, Electricity - 1912. Need specific department info?";
  } else if (lower.includes('report') || lower.includes('how to')) {
    return "To report: 1) Take photos/videos 2) Describe location clearly 3) Select correct category 4) Submit. Nearby users will verify!";
  } else {
    return "I can help with area comparisons, nearby issues, scam alerts, department contacts, and reporting guidance. What would you like to know?";
  }
};

export async function POST(request: NextRequest) {
  try {
    const { user_id, message, area } = await request.json();
    
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Generate AI response
    const response = generateAIResponse(message);
    
    // Save chat message
    await query(`
      INSERT INTO chat_messages (user_id, area, message, message_type)
      VALUES ($1, $2, $3, $4)
    `, [user_id || null, area || 'General', message, 'text']);
    
    return NextResponse.json({ 
      response,
      message: 'Message processed successfully'
    });
    
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}