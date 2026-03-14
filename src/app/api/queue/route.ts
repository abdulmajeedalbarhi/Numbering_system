import { NextRequest, NextResponse } from 'next/server';
import { 
  getQueueState, 
  addBooking, 
  nextCustomer, 
  resetQueue, 
  toggleQueue, 
  setMaxBookings,
  updateBooking,
  deleteBooking 
} from '@/lib/queue';

export async function GET() {
  const state = await getQueueState();
  return NextResponse.json(state);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, name, phone, orders } = body;

  if (action === 'book') {
    const { name, phone, orders, preferredIds } = body;
    if (!name || !phone || !orders) {
      return NextResponse.json({ error: 'Missing details' }, { status: 400 });
    }
    const orderCount = parseInt(orders.toString()) || 1;
    const bookings = await addBooking(name, phone, orderCount, preferredIds);
    if (!bookings) {
      return NextResponse.json({ error: 'Queue is full or closed' }, { status: 403 });
    }
    return NextResponse.json(bookings);
  }

  // Admin actions
  if (action === 'setLimit') {
    const limit = parseInt(body.limit);
    await setMaxBookings(limit);
    return NextResponse.json({ maxBookings: limit });
  }

  if (action === 'next') {
    const next = await nextCustomer();
    return NextResponse.json(next || { message: 'No more customers' });
  }

  if (action === 'reset') {
    await resetQueue();
    return NextResponse.json({ success: true });
  }

  if (action === 'toggle') {
    const state = await getQueueState();
    const newStatus = !state.isOpen;
    await toggleQueue(newStatus);
    return NextResponse.json({ isOpen: newStatus });
  }

  if (action === 'edit') {
    const { id, name, phone, orders } = body;
    const success = await updateBooking(id, { name, phone, orders });
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  if (action === 'delete') {
    const { id } = body;
    const success = await deleteBooking(id);
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Record not found' }, { status: 404 });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
