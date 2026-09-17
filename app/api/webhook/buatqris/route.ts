import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';
import crypto from 'crypto';
import type { BuatQrisWebhookBody } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('X-BuatQris-Signature') || '';
    const signingSecret = process.env.BUATQRIS_SIGNING_SECRET || '';

    // Verify HMAC SHA-256 if signing secret is configured
    // Signature format: sha256=<hex hmac>
    if (signingSecret) {
      const expectedSignature =
        'sha256=' +
        crypto
          .createHmac('sha256', signingSecret)
          .update(rawBody)
          .digest('hex');

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      if (
        sigBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
      ) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const body: BuatQrisWebhookBody = JSON.parse(rawBody);
    const transactionId = body.transaction_id;

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transaction_id' }, { status: 400 });
    }

    // Respond 200 immediately, process async
    const sb = supabaseServer();
    const payloadHash = crypto
      .createHash('sha256')
      .update(rawBody)
      .digest('hex');

    // Idempotency check
    const { data: existing } = await sb
      .from('processed_webhooks')
      .select('transaction_id')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ status: 'already_processed' });
    }

    await sb.from('processed_webhooks').insert({
      transaction_id: transactionId,
      payload_hash: payloadHash,
    });

    const status = body.status;
    const event = body.event;

    if (event === 'payment.success' || status === 'success') {
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
    } else if (event === 'payment.expired' || status === 'expired') {
      await sb
        .from('bookings')
        .update({ status: 'expired' })
        .eq('buatqris_transaction_id', transactionId);
    } else if (event === 'payment.failed' || status === 'failed') {
      await sb
        .from('bookings')
        .update({ status: 'failed' })
        .eq('buatqris_transaction_id', transactionId);
    }

    return NextResponse.json({ status: 'processed' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
