// POST /api/auth/register
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/database';
import { generateVerificationToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const { name, email, area, latitude, longitude } = await request.json();
    
    // Validate input
    if (!name || !email || !area) {
      return NextResponse.json(
        { error: 'Name, email, and area are required' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }
    
    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create user (no password for now - will be set during email verification)
    const result = await query(`
      INSERT INTO users (name, email, area, latitude, longitude, email_verification_token, email_verification_expires)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, area, is_verified, email_verified
    `, [name, email, area, latitude || null, longitude || null, verificationToken, verificationExpires]);
    
    const user = result.rows[0];
    
    // TODO: Send verification email (implement email service)
    console.log('Verification token for', email, ':', verificationToken);
    
    return NextResponse.json({
      message: 'Registration successful. Please check your email for verification.',
      user: user,
      verificationToken // Remove this in production
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}