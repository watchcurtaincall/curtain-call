import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Use VERCEL_GIT_COMMIT_SHA or VERCEL_DEPLOYMENT_ID as the unique version ID
  const version = process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'dev';
  return NextResponse.json({ version });
}
