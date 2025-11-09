// POST /api/auth/login
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';


export async function POST(request: NextRequest) {
  try {
    const { email, verificationToken } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Find user
    const result = await query(`
      SELECT id, name, email, area, latitude, longitude, is_verified, email_verified,
             email_verification_token, email_verification_expires
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
    
    // If verification token provided, verify it
    if (verificationToken) {
      if (user.email_verification_token !== verificationToken) {
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
        SET email_verified = true, email_verification_token = null, email_verification_expires = null
        WHERE id = $1
      `, [user.id]);
      
      user.email_verified = true;
    }
    
    // Generate JWT token
      // JWT logic removed for Google OAuth migration
      return NextResponse.json({
        error: 'Use Google OAuth for authentication.'
      }, { status: 400 });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}