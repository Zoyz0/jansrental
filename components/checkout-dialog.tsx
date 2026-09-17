'use client';

import { useState } from 'react';
import { Loader2, QrCode, CheckCircle2, XCircle, Clock, User, Phone } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CheckoutStep = 'details' | 'qr' | 'pending' | 'success' | 'failed' | 'expired';

export default function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { items, totalAmount, clearCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>('details');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState<string>('');
  const [polling, setPolling] = useState(false);

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Nama dan nomor HP wajib diisi');
      return;
    }
    setError('');
    setStep('qr');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          totalAmount,
          customerName,
          customerPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal membuat QRIS');
        setStep('failed');
        return;
      }

      setQrUrl(data.qrUrl);
      setTransactionId(data.transactionId);
      setStep('pending');
      startPolling(data.transactionId);
    } catch {
      setError('Terjadi kesalahan. Coba lagi.');
      setStep('failed');
    }
  };

  const startPolling = (txId: string) => {
    setPolling(true);
    let attempts = 0;
    const maxAttempts = 60;

    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setPolling(false);
        setStep('expired');
        return;
      }

      try {
        const res = await fetch('/api/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactionId: txId }),
        });
        const data = await res.json();

        if (data.status === 'success') {
          clearInterval(interval);
          setPolling(false);
          setStep('success');
          clearCart();
        } else if (data.status === 'expired' || data.status === 'failed') {
          clearInterval(interval);
          setPolling(false);
          setStep(data.status === 'expired' ? 'expired' : 'failed');
        }
      } catch {
        // keep polling on network error
      }
    }, 20000);
  };

  const handleReset = () => {
    setStep('details');
    setQrUrl('');
    setTransactionId('');
    setError('');
    setCustomerName('');
    setCustomerPhone('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-5 pb-3">
          <DialogTitle className="font-display text-xl font-bold text-neon">
            {step === 'details' && 'Checkout Pesanan'}
            {step === 'pending' && 'Scan QRIS untuk Bayar'}
            {step === 'success' && 'Pembayaran Berhasil!'}
            {step === 'failed' && 'Pembayaran Gagal'}
            {step === 'expired' && 'QRIS Kedaluwarsa'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] scrollbar-thin">
          <div className="px-5 pb-5">
            {step === 'details' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.emoji && `${item.emoji} `}
                        {item.name}
                        {item.type === 'food' && ` ×${item.qty}`}
                        {item.type === 'console' && item.durationHours && ` (${item.durationHours} jam)`}
                      </span>
                      <span className="font-medium">
                        {formatRupiah(item.price * (item.type === 'food' ? item.qty : 1))}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">{formatRupiah(totalAmount)}</span>
                </div>
                <Separator />
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5" /> Nama
                    </Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nama Anda"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> Nomor HP
                    </Label>
                    <Input
                      id="phone"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  onClick={handleCheckout}
                  className="w-full font-display font-semibold hover:glow-neon"
                  size="lg"
                >
                  Bayar dengan QRIS
                </Button>
              </div>
            )}

            {step === 'pending' && (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="relative p-4 bg-white rounded-xl">
                    <img
                      src={qrUrl}
                      alt="QRIS Payment"
                      className="w-56 h-56 object-contain"
                    />
                    <div className="absolute inset-0 rounded-xl ring-2 ring-primary/30 animate-pulse-glow" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  {polling && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  <span>Menunggu pembayaran...</span>
                </div>
                <div className="bg-secondary/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total Tagihan</p>
                  <p className="text-lg font-bold text-primary">{formatRupiah(totalAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ID: {transactionId.slice(0, 16)}...
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan QR menggunakan e-wallet atau mobile banking yang mendukung QRIS
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="space-y-4 text-center py-6">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto glow-green" />
                <h3 className="font-display text-lg font-bold">Pembayaran Diterima!</h3>
                <p className="text-sm text-muted-foreground">
                  Pesanan Anda telah tercatat. Silakan datang ke Line Up Gaming Space dan tunjukkan bukti pemesanan.
                </p>
                <Button onClick={handleReset} variant="outline" className="w-full">
                  Selesai
                </Button>
              </div>
            )}

            {step === 'failed' && (
              <div className="space-y-4 text-center py-6">
                <XCircle className="h-16 w-16 text-destructive mx-auto" />
                <h3 className="font-display text-lg font-bold">Pembayaran Gagal</h3>
                <p className="text-sm text-muted-foreground">{error || 'Terjadi kesalahan. Silakan coba lagi.'}</p>
                <Button onClick={handleReset} variant="outline" className="w-full">
                  Coba Lagi
                </Button>
              </div>
            )}

            {step === 'expired' && (
              <div className="space-y-4 text-center py-6">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto" />
                <h3 className="font-display text-lg font-bold">QRIS Kedaluwarsa</h3>
                <p className="text-sm text-muted-foreground">
                  Waktu pembayaran habis. Silakan buat pesanan baru.
                </p>
                <Button onClick={handleReset} variant="outline" className="w-full">
                  Pesan Lagi
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
