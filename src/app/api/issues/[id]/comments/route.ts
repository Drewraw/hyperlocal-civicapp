// POST /api/issues/[id]/comments - Add comment to issue
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user_id, content } = await request.json();
    const issueId = params.id;
    
    if (!content || !user_id) {
      return NextResponse.json(
        { error: 'User ID and comment content are required' },
        { status: 400 }
      );
    }
    
    await query(`
      INSERT INTO comments (issue_id, user_id, content)
      VALUES ($1, $2, $3)
    `, [issueId, user_id, content]);
    
    return NextResponse.json({ message: 'Comment added successfully' });
    
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}