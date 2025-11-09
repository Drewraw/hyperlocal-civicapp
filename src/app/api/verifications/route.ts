// POST /api/verifications - Submit verification for an issue
// GET /api/verifications/[issueId] - Get verifications for issue
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { issue_id, user_id, verification_type, has_media, comments } = await request.json();
    
    if (!issue_id || !user_id || !verification_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (!['confirmed', 'disputed', 'additional_info'].includes(verification_type)) {
      return NextResponse.json(
        { error: 'Invalid verification type' },
        { status: 400 }
      );
    }
    
    // Add verification record (with conflict handling)
    const verificationResult = await query(`
      INSERT INTO issue_verifications (issue_id, user_id, verification_type, has_media, comments)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (issue_id, user_id) 
      DO UPDATE SET 
        verification_type = EXCLUDED.verification_type,
        has_media = EXCLUDED.has_media,
        comments = EXCLUDED.comments,
        created_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [issue_id, user_id, verification_type, has_media || false, comments || '']);
    
    const verification = verificationResult.rows[0];
    
    // Add verification comment to issue
    let verificationText = '';
    switch (verification_type) {
      case 'confirmed':
        verificationText = has_media ? '✓ Confirmed (with photo/video)' : '✓ Confirmed by community member';
        break;
      case 'disputed':
        verificationText = has_media ? '✗ Disputed (with evidence)' : '✗ Disputed by community member';
        break;
      case 'additional_info':
        verificationText = `ℹ️ Additional information: ${comments}`;
        break;
    }
    
    await query(`
      INSERT INTO comments (issue_id, user_id, content)
      VALUES ($1, $2, $3)
    `, [issue_id, user_id, verificationText]);
    
    return NextResponse.json({ 
      message: 'Verification submitted successfully',
      verification
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error submitting verification:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}