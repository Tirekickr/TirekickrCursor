import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const requestHeaders = await headers();
  return NextResponse.json({ headers: requestHeaders });
} 