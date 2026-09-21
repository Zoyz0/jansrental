export interface BookingHistoryEntry {
  id: string;
  date: string;
  consoleName: string;
  durationHours: number;
  foodItems: { name: string; qty: number; emoji?: string }[];
  totalAmount: number;
  paymentMethod: 'qris' | 'cash';
  status: 'paid' | 'failed' | 'expired' | 'pending_cash';
  customerName: string;
  customerPhone: string;
  transactionId?: string;
  bookingId?: string;
}

const HISTORY_KEY = 'lineup_booking_history';
const MAX_HISTORY = 50;

export function getBookingHistory(): BookingHistoryEntry[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addBookingHistory(entry: BookingHistoryEntry): void {
  try {
    const history = getBookingHistory();
    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // ignore storage errors
  }
}

export function clearBookingHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignore
  }
}
