// GET /api/verifications/[issueId] - Get all verifications for an issue
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { issueId: string } }
) {
  try {
    const issueId = params.issueId;
    
    const result = await query(`
      SELECT 
        v.*,
        u.name as user_name
      FROM issue_verifications v
      JOIN users u ON v.user_id = u.id
      WHERE v.issue_id = $1
      ORDER BY v.created_at DESC
    `, [issueId]);
    
    return NextResponse.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching verifications:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}