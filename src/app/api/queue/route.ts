import { NextRequest, NextResponse } from 'next/server';
import { getQueueState, addBooking, nextCustomer, resetQueue, toggleQueue, saveQueueState } from '@/lib/queue';

export async function GET() {
  const state = getQueueState();
  // Filter sensitive info if needed, but for now we'll send it all for admin demo
  // Actually, customer should only see currentNumber and isOpen.
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, name, phone, orders } = body;

  if (action === 'book') {
    if (!name || !phone || !orders) {
      return NextResponse.json({ error: 'Missing details' }, { status: 400 });
    }
    const orderCount = parseInt(orders.toString()) || 1;
    const bookings = addBooking(name, phone, orderCount);
    if (!bookings) {
      return NextResponse.json({ error: 'Queue is full or closed' }, { status: 403 });
    }
    return NextResponse.json(bookings);
  }

  // Admin actions (now public as requested)
  if (action === 'next' || action === 'reset' || action === 'toggle' || action === 'setLimit' || action === 'edit' || action === 'delete') {
    const state = getQueueState();

    if (action === 'setLimit') {
      state.maxBookings = parseInt(body.limit);
      saveQueueState(state);
      return NextResponse.json({ maxBookings: state.maxBookings });
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
      toggleQueue(!state.isOpen);
      return NextResponse.json({ isOpen: !state.isOpen });
    }

    if (action === 'edit') {
      const { id, name, phone, orders } = body;
      const index = state.bookings.findIndex((b: any) => b.id === id);
      if (index !== -1) {
        state.bookings[index] = { ...state.bookings[index], name, phone, orders };
        saveQueueState(state);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    if (action === 'delete') {
      const { id } = body;
      state.bookings = state.bookings.filter((b: any) => b.id !== id);
      saveQueueState(state);
      return NextResponse.json({ success: true });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
