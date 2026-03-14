import { NextRequest, NextResponse } from 'next/server';
import { toggleQueue } from '@/lib/queue';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  
  // Verify that this request is actually coming from Vercel's Cron
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await toggleQueue(false);
    return NextResponse.json({ success: true, message: 'Queue closed automatically at 4 AM Oman' });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to close queue' }, { status: 500 });
  }
}
