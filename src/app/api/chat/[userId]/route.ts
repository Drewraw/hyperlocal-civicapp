// GET /api/chat/[userId] - Get chat history for user
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    const result = await query(`
      SELECT * FROM chat_messages 
      WHERE user_id = $1 
      ORDER BY created_at ASC
      LIMIT 50
    `, [userId]);
    
    return NextResponse.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}