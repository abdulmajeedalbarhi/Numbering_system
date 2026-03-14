import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'queue_data.json');

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

// Note: For real production on Vercel, use @vercel/kv or a database.
// This in-memory storage will reset when the serverless function cold-starts.
let globalQueueState: QueueState = {
  currentNumber: 0,
  bookings: [],
  isOpen: true,
  lastBookingId: 0,
  maxBookings: 100,
};

export function getQueueState(): QueueState {
  return globalQueueState;
}

export function saveQueueState(state: QueueState) {
  globalQueueState = state;
}

export function addBooking(name: string, phone: string, orders: number): Booking[] | null {
  const state = getQueueState();
  if (!state.isOpen) return null;
  
  // Ensure we don't exceed max bookings with the total orders
  if (state.bookings.length + orders > state.maxBookings) return null;

  const newBookings: Booking[] = [];
  for (let i = 0; i < orders; i++) {
    const booking: Booking = {
      id: state.lastBookingId + 1,
      name,
      phone,
      orders: orders.toString(), // Store the original total orders for reference
      timestamp: new Date().toISOString(),
    };
    state.bookings.push(booking);
    state.lastBookingId += 1;
    newBookings.push(booking);
  }

  saveQueueState(state);
  return newBookings;
}

export function nextCustomer(): Booking | null {
  const state = getQueueState();
  if (state.bookings.length === 0) return null;

  // In a real system, currentNumber should probably match the ID of the customer being served.
  // We'll just increment the currentNumber and keep the booking in the list for admin view.
  // Actually, let's say "currentNumber" is the ID of the booking currently being processed.
  
  // Find the first booking with an ID greater than currentNumber
  const next = state.bookings.find(b => b.id > state.currentNumber);
  if (next) {
    state.currentNumber = next.id;
    saveQueueState(state);
    return next;
  }
  return null;
}

export function resetQueue() {
  globalQueueState = {
    currentNumber: 0,
    bookings: [],
    isOpen: true,
    lastBookingId: 0,
    maxBookings: globalQueueState.maxBookings, // Keep the current limit
  };
}

export function toggleQueue(isOpen: boolean) {
  const state = getQueueState();
  state.isOpen = isOpen;
  saveQueueState(state);
}
