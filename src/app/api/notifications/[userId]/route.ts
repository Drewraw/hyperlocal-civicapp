// GET /api/notifications/[userId] - Get user notifications
// PUT /api/notifications/[id]/read - Mark notification as read
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    const result = await query(`
      SELECT 
        n.*,
        i.title as issue_title,
        u.name as related_user_name
      FROM notifications n
      LEFT JOIN issues i ON n.related_issue_id = i.id
      LEFT JOIN users u ON n.related_user_id = u.id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId]);
    
    return NextResponse.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}