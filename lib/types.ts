export interface Console {
  id: string;
  name: string;
  price_per_hour: number;
  description: string | null;
  icon: string;
  is_active: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  emoji: string | null;
  is_active: boolean;
}

export interface DailyRental {
  id: string;
  name: string;
  category: 'console' | 'box';
  price_per_day: number;
  available_units: number;
  description: string | null;
  emoji: string | null;
  is_active: boolean;
}

export interface Booking {
  id: string;
  console_id: string | null;
  console_name: string;
  duration_hours: number;
  food_items_json: FoodOrder[];
  total_amount: number;
  status: 'pending' | 'paid' | 'expired' | 'failed';
  buatqris_transaction_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface DailyRentalBooking {
  id: string;
  rental_id: string | null;
  rental_name: string;
  customer_name: string;
  customer_phone: string | null;
  start_date: string;
  end_date: string;
  total_days: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
}

export interface FoodOrder {
  id: string;
  name: string;
  price: number;
  qty: number;
  emoji?: string;
}

export interface CartItem {
  type: 'console' | 'food';
  id: string;
  name: string;
  price: number;
  qty: number;
  durationHours?: number;
  emoji?: string;
}

export interface BuatQrisCreateResponse {
  success: boolean;
  message?: string;
  data: {
    transaction_id: string;
    amount: number;
    total_amount: number;
    amount_uniq: number;
    admin_fee: number;
    admin_fee_pct: number;
    credit_amount: number;
    fee_by: string;
    qris_method: string;
    description: string;
    umkm_name: string;
    profile_pic: string;
    qris_image: string;
    qr_url: string;
    qris_url: string | null;
    qris_string: string | null;
    direct_url: string | null;
    expired_at: string;
    status: string;
    payment_url: string;
  };
}

export interface BuatQrisStatusResponse {
  success: boolean;
  message?: string;
  error?: string;
  retry_after?: number;
  data: {
    transaction_id: string;
    status: 'pending' | 'success' | 'expired' | 'failed';
    amount: number;
    total_amount: number;
    admin_fee: number;
    credit_amount: number;
    qris_method: string;
    updated_at: string;
  };
}

export interface BuatQrisWebhookBody {
  event: string;
  transaction_id: string;
  status: string;
  amount: number;
  total_amount: number;
  credit_amount: number;
  admin_fee: number;
  fee_by: string;
  qris_method: string;
  is_test: boolean;
  paid_at?: string;
}
