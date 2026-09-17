import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import type { CartItem, BuatQrisCreateResponse } from '@/lib/types';

const BUATQRIS_BASE_URL = 'https://api.buatqris.site';

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

    const description = items
      .map((i) => {
        if (i.type === 'console') return `${i.name} (${i.durationHours}j)`;
        return `${i.name} x${i.qty}`;
      })
      .join(', ');

    const accountId = process.env.BUATQRIS_ACCOUNT_ID;
    const secretToken = process.env.BUATQRIS_SECRET_TOKEN;

    if (!accountId || !secretToken) {
      return NextResponse.json(
        { error: 'Konfigurasi pembayaran belum lengkap' },
        { status: 500 }
      );
    }

    const isSandbox = process.env.NODE_ENV !== 'production';

    const params = new URLSearchParams();
    params.append('account_id', accountId);
    params.append('secret_token', secretToken);
    params.append('action', 'api_create_qris');
    params.append('amount', String(serverTotal));
    params.append('description', description.substring(0, 100));
    if (isSandbox) {
      params.append('test', '1');
    }

    const qrisRes = await fetch(BUATQRIS_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const qrisData: BuatQrisCreateResponse = await qrisRes.json();

    if (!qrisData.success || !qrisData.data?.qr_url) {
      return NextResponse.json(
        { error: qrisData.message || 'Gagal membuat QRIS dari BuatQris' },
        { status: 502 }
      );
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
        buatqris_transaction_id: qrisData.data.transaction_id,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
      })
      .select()
      .single();

    return NextResponse.json({
      transactionId: qrisData.data.transaction_id,
      qrUrl: qrisData.data.qr_url,
      totalAmount: qrisData.data.total_amount,
      bookingId: booking?.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
