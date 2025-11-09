// All custom registration logic removed for Google OAuth migration.
// Use Google OAuth for registration.
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Use Google OAuth for registration.' }, { status: 400 });
}