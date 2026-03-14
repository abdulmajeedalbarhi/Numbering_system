import { NextRequest, NextResponse } from 'next/server';
import { getQueueState, addBooking, nextCustomer, resetQueue, toggleQueue } from '@/lib/queue';

export async function GET() {
  const state = getQueueState();
  // Filter sensitive info if needed, but for now we'll send it all for admin demo
  // Actually, customer should only see currentNumber and isOpen.
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, name, phone, orders, username, password } = body;

  if (action === 'book') {
    if (!name || !phone || !orders) {
      return NextResponse.json({ error: 'Missing details' }, { status: 400 });
    }
    const booking = addBooking(name, phone, orders);
    if (!booking) {
      return NextResponse.json({ error: 'Queue is closed' }, { status: 403 });
    }
    return NextResponse.json(booking);
  }

  // Admin actions
  if (action === 'next' || action === 'reset' || action === 'toggle' || action === 'login') {
    if (username !== 'kalbarhi' || password !== 'k@123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'login') {
      return NextResponse.json({ success: true });
    }

    if (action === 'next') {
      const next = nextCustomer();
      return NextResponse.json(next || { message: 'No more customers' });
    }

    if (action === 'reset') {
      resetQueue();
      return NextResponse.json({ success: true });
    }

    if (action === 'toggle') {
      const state = getQueueState();
      toggleQueue(!state.isOpen);
      return NextResponse.json({ isOpen: !state.isOpen });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
