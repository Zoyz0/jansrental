import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import type { BuatQrisStatusResponse } from '@/lib/types';

const BUATQRIS_BASE_URL = 'https://api.buatqris.site';

export async function POST(req: NextRequest) {
  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID diperlukan' }, { status: 400 });
    }

    const accountId = process.env.BUATQRIS_ACCOUNT_ID;
    const secretToken = process.env.BUATQRIS_SECRET_TOKEN;

    if (!accountId || !secretToken) {
      return NextResponse.json(
        { error: 'Konfigurasi pembayaran belum lengkap' },
        { status: 500 }
      );
    }

    const params = new URLSearchParams();
    params.append('account_id', accountId);
    params.append('secret_token', secretToken);
    params.append('action', 'api_check_status');
    params.append('transaction_id', transactionId);

    const statusRes = await fetch(BUATQRIS_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (statusRes.status === 429) {
      const retryData = await statusRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          status: 'pending',
          error: 'rate_limited',
          retryAfter: retryData.retry_after || 20,
        },
        { status: 200 }
      );
    }

    const statusData: BuatQrisStatusResponse = await statusRes.json();

    if (!statusData.success) {
      return NextResponse.json(
        { error: statusData.message || 'Gagal mengecek status' },
        { status: 502 }
      );
    }

    const paymentStatus = statusData.data.status;

    if (paymentStatus === 'success') {
      const sb = supabaseServer();

      const { data: booking } = await sb
        .from('bookings')
        .select('id, food_items_json, status')
        .eq('buatqris_transaction_id', transactionId)
        .maybeSingle();

      if (booking && booking.status !== 'paid') {
        await sb
          .from('bookings')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', booking.id);

        const foodItems = booking.food_items_json as Array<{
          id: string;
          qty: number;
        }>;
        if (foodItems && foodItems.length > 0) {
          for (const food of foodItems) {
            const { data: foodRow } = await sb
              .from('food_items')
              .select('stock')
              .eq('id', food.id)
              .maybeSingle();
            if (foodRow) {
              const newStock = Math.max(0, foodRow.stock - food.qty);
              await sb
                .from('food_items')
                .update({ stock: newStock })
                .eq('id', food.id);
            }
          }
        }
      }
    }

    return NextResponse.json({
      status: paymentStatus,
      transactionId: statusData.data.transaction_id,
      totalAmount: statusData.data.total_amount,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
