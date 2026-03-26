/**
 * Global Chat Store — manages chat state across pages
 * Allows 3D explorer to communicate room selection to chat
 */

export interface SelectedRoom {
  id: number;
  room_number: string;
  room_name: string;
  wing: string;
  view_type: string;
  base_price: number;
}

export interface BookingState {
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string; // YYYY-MM-DD
  selectedRoom?: SelectedRoom;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  numGuests?: number;
  specialRequests?: string;
}

type Listener = () => void;

class ChatStore {
  private bookingState: BookingState = {};
  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getState(): BookingState {
    return { ...this.bookingState };
  }

  setState(partial: Partial<BookingState>) {
    this.bookingState = { ...this.bookingState, ...partial };
    this.notify();
  }

  setSelectedRoom(room: SelectedRoom | undefined) {
    this.bookingState.selectedRoom = room;
    this.notify();
  }

  setDates(checkIn: string, checkOut: string) {
    this.bookingState.checkIn = checkIn;
    this.bookingState.checkOut = checkOut;
    this.notify();
  }

  reset() {
    this.bookingState = {};
    this.notify();
  }
}

export const chatStore = new ChatStore();
