import { kv } from '@vercel/kv';

export interface Booking {
  id: number;
  name: string;
  phone: string;
  orders: string;
  timestamp: string;
}

export interface QueueState {
  currentNumber: number;
  bookings: Booking[];
  isOpen: boolean;
  lastBookingId: number;
  maxBookings: number;
}

const DEFAULT_STATE: QueueState = {
  currentNumber: 0,
  bookings: [],
  isOpen: true,
  lastBookingId: 0,
  maxBookings: 100,
};

const KV_KEY = 'kalbarhi_queue_state';

export async function getQueueState(): Promise<QueueState> {
  try {
    const state = await kv.get<QueueState>(KV_KEY);
    return state || DEFAULT_STATE;
  } catch (err) {
    console.error('Failed to get queue state from KV', err);
    return DEFAULT_STATE;
  }
}

export async function saveQueueState(state: QueueState): Promise<void> {
  try {
    await kv.set(KV_KEY, state);
  } catch (err) {
    console.error('Failed to save queue state to KV', err);
  }
}

export async function addBooking(name: string, phone: string, orders: number): Promise<Booking[] | null> {
  const state = await getQueueState();
  if (!state.isOpen) return null;
  
  // Ensure we don't exceed max bookings with the total orders
  if (state.bookings.length + orders > state.maxBookings) return null;

  const newBookings: Booking[] = [];
  for (let i = 0; i < orders; i++) {
    const booking: Booking = {
      id: state.lastBookingId + 1,
      name,
      phone,
      orders: orders.toString(),
      timestamp: new Date().toISOString(),
    };
    state.bookings.push(booking);
    state.lastBookingId += 1;
    newBookings.push(booking);
  }

  await saveQueueState(state);
  return newBookings;
}

export async function nextCustomer(): Promise<Booking | null> {
  const state = await getQueueState();
  if (state.bookings.length === 0) return null;

  // Find the first booking with an ID greater than currentNumber
  const next = state.bookings.find(b => b.id > state.currentNumber);
  if (next) {
    state.currentNumber = next.id;
    await saveQueueState(state);
    return next;
  }
  return null;
}

export async function resetQueue(): Promise<void> {
  const state = await getQueueState();
  const newState: QueueState = {
    ...DEFAULT_STATE,
    maxBookings: state.maxBookings // Keep the current limit
  };
  await saveQueueState(newState);
}

export async function toggleQueue(isOpen: boolean): Promise<void> {
  const state = await getQueueState();
  state.isOpen = isOpen;
  await saveQueueState(state);
}

export async function setMaxBookings(limit: number): Promise<void> {
  const state = await getQueueState();
  state.maxBookings = limit;
  await saveQueueState(state);
}

export async function updateBooking(id: number, updates: Partial<Booking>): Promise<boolean> {
  const state = await getQueueState();
  const index = state.bookings.findIndex(b => b.id === id);
  if (index !== -1) {
    state.bookings[index] = { ...state.bookings[index], ...updates };
    await saveQueueState(state);
    return true;
  }
  return false;
}

export async function deleteBooking(id: number): Promise<boolean> {
  const state = await getQueueState();
  const initialLength = state.bookings.length;
  state.bookings = state.bookings.filter(b => b.id !== id);
  if (state.bookings.length !== initialLength) {
    await saveQueueState(state);
    return true;
  }
  return false;
}
