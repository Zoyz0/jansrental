import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import type { CartItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, customerName, customerPhone } = body as {
      items: CartItem[];
      customerName: string;
      customerPhone: string;
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang kosong' }, { status: 400 });
    }

    const serverTotal = items.reduce((sum, item) => {
      if (item.type === 'food') return sum + item.price * item.qty;
      return sum + item.price;
    }, 0);

    if (serverTotal <= 0) {
      return NextResponse.json({ error: 'Total tidak valid' }, { status: 400 });
    }

    const consoleItem = items.find((i) => i.type === 'console');
    const foodItems = items
      .filter((i) => i.type === 'food')
      .map((i) => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji }));

    const { data: booking } = await supabaseServer()
      .from('bookings')
      .insert({
        console_id: consoleItem?.id || null,
        console_name: consoleItem?.name || 'N/A',
        duration_hours: consoleItem?.durationHours || 0,
        food_items_json: foodItems,
        total_amount: serverTotal,
        status: 'pending',
        payment_method: 'cash',
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
      })
      .select()
      .single();

    return NextResponse.json({
      bookingId: booking?.id,
      totalAmount: serverTotal,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
