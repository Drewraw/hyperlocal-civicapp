// GET /api/users/[id] - Get user profile
// PUT /api/users/[id] - Update user profile
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { verifyToken } from '@/lib/jwt';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    
    const result = await query(`
      SELECT 
        id, name, email, area, latitude, longitude, 
        reputation_score, is_verified, email_verified, 
        created_at
      FROM users 
      WHERE id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id;
    const { name, area, latitude, longitude } = await request.json();
    
    // Verify authorization (you can add JWT verification here)
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const decoded = verifyToken(token);
      if (!decoded || decoded.userId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }
    
    const result = await query(`
      UPDATE users 
      SET name = $1, area = $2, latitude = $3, longitude = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, name, email, area, latitude, longitude, reputation_score, is_verified, email_verified
    `, [name, area, latitude || null, longitude || null, userId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}