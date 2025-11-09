// POST /api/issues/[id]/upvote - Toggle upvote for issue
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user_id } = await request.json();
    const issueId = params.id;
    
    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Check if already voted
    const existingVote = await query(
      'SELECT * FROM votes WHERE issue_id = $1 AND user_id = $2',
      [issueId, user_id]
    );
    
    if (existingVote.rows.length > 0) {
      const currentVote = existingVote.rows[0];
      
      if (currentVote.vote_type === 'upvote') {
        // Remove upvote
        await query(
          'DELETE FROM votes WHERE issue_id = $1 AND user_id = $2',
          [issueId, user_id]
        );
        return NextResponse.json({ message: 'Upvote removed' });
      } else {
        // Change downvote to upvote
        await query(
          'UPDATE votes SET vote_type = $1 WHERE issue_id = $2 AND user_id = $3',
          ['upvote', issueId, user_id]
        );
        return NextResponse.json({ message: 'Changed to upvote' });
      }
    } else {
      // Add new upvote
      await query(
        'INSERT INTO votes (issue_id, user_id, vote_type) VALUES ($1, $2, $3)',
        [issueId, user_id, 'upvote']
      );
      return NextResponse.json({ message: 'Issue upvoted' });
    }
    
  } catch (error) {
    console.error('Error toggling upvote:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}