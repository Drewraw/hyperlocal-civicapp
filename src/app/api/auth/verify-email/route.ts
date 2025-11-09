// POST /api/auth/verify-email
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();
    
    if (!email || !token) {
      return NextResponse.json(
        { error: 'Email and token are required' },
        { status: 400 }
      );
    }
    
    // Find user and verify token
    const result = await query(`
      SELECT id, name, email_verification_token, email_verification_expires
      FROM users 
      WHERE email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = result.rows[0];
    
    if (user.email_verification_token !== token) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }
    
    if (new Date() > new Date(user.email_verification_expires)) {
      return NextResponse.json(
        { error: 'Verification token expired' },
        { status: 400 }
      );
    }
    
    // Mark email as verified
    await query(`
      UPDATE users 
      SET email_verified = true, is_verified = true, email_verification_token = null, email_verification_expires = null
      WHERE id = $1
    `, [user.id]);
    
    return NextResponse.json({
      message: 'Email verified successfully'
    });
    
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}