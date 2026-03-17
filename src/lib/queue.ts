import { kv } from '@vercel/kv';

export interface Booking {
  id: number;
  name: string;
  phone: string;
  orders: string;
  timestamp: string;
  isManual: boolean;
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
    if (!state) return DEFAULT_STATE;
    
    // Migration: ensure all bookings have isManual flag
    let migrated = false;
    state.bookings = state.bookings.map(b => {
      if (b.isManual === undefined) {
        migrated = true;
        return { ...b, isManual: false };
      }
      return b;
    });
    
    if (migrated) {
      await saveQueueState(state);
    }
    
    return state;
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

export async function addBooking(name: string, phone: string, orders: number, preferredIds?: number[]): Promise<Booking[] | null> {
  const state = await getQueueState();
  if (!state.isOpen) return null;
  
  // Safety check for order limit
  if (orders < 1 || orders > 3) return null;
  
  const existingIds = state.bookings.map(b => b.id);
  const newBookings: Booking[] = [];
  const timestamp = new Date().toISOString();

  if (preferredIds && preferredIds.length === orders) {
    // Validate preferred IDs
    for (const id of preferredIds) {
      if (id <= state.currentNumber || id > state.maxBookings || existingIds.includes(id)) {
        return null; // Invalid ID selected
      }
    }
    
    for (const id of preferredIds) {
      const booking: Booking = {
        id,
        name,
        phone,
        orders: orders.toString(),
        timestamp,
        isManual: true,
      };
      state.bookings.push(booking);
      newBookings.push(booking);
      if (id > state.lastBookingId) state.lastBookingId = id;
    }
  } else {
    // Sequential fallback
    if (state.bookings.length + orders > state.maxBookings) return null;
    
    let nextId = state.currentNumber + 1;
    for (let i = 0; i < orders; i++) {
      // Find the next truly available ID (skipping any that might have been manually picked)
      while (existingIds.includes(nextId) || nextId <= state.currentNumber) {
        nextId++;
      }
      
      if (nextId > state.maxBookings) return null;

      const booking: Booking = {
        id: nextId,
        name,
        phone,
        orders: orders.toString(),
        timestamp,
        isManual: false,
      };
      state.bookings.push(booking);
      newBookings.push(booking);
      state.lastBookingId = nextId;
      nextId++;
    }
  }

  // Ensure bookings are always sorted by ID
  state.bookings.sort((a, b) => a.id - b.id);

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
  
  // Find the index of the booking to delete
  const deleteIndex = state.bookings.findIndex(b => b.id === id);
  if (deleteIndex === -1) return false;

  // Remove the booking
  state.bookings.splice(deleteIndex, 1);

  // Shifting logic:
  // We only shift automatic (isManual: false) bookings that are ahead of the current serving number.
  const currentNum = state.currentNumber;
  
  // Identify manual bookings and their IDs to avoid overwriting them
  const manualIds = new Set(state.bookings.filter(b => b.isManual).map(b => b.id));
  
  // Get all automatic bookings that are still in queue (ahead of current serving number)
  const automaticToShift = state.bookings
    .filter(b => !b.isManual && b.id > currentNum)
    .sort((a, b) => a.id - b.id);

  let nextAvailableId = currentNum + 1;
  for (const booking of automaticToShift) {
    // Find the next ID that isn't taken by a manual booking
    while (manualIds.has(nextAvailableId)) {
      nextAvailableId++;
    }
    booking.id = nextAvailableId;
    nextAvailableId++;
  }

  // Update lastBookingId based on the new state
  if (state.bookings.length === 0) {
    state.lastBookingId = state.currentNumber;
  } else {
    state.lastBookingId = Math.max(...state.bookings.map(b => b.id));
  }

  // Ensure bookings are always sorted by ID
  state.bookings.sort((a, b) => a.id - b.id);

  await saveQueueState(state);
  return true;
}
