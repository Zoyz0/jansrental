'use client';

import { useState, useRef } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock, User, Phone, ArrowLeft, Receipt, ScanLine } from 'lucide-react';
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

type CheckoutStep = 'details' | 'pending' | 'success' | 'failed' | 'expired';

export default function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { items, totalAmount, clearCart, openCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>('details');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState<string>('');
  const [polling, setPolling] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Nama dan nomor HP wajib diisi');
      return;
    }
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, customerName, customerPhone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Gagal membuat QRIS');
        setStep('failed');
        return;
      }

      setQrUrl(data.qrUrl);
      setTransactionId(data.transactionId);
      setPaidAmount(data.totalAmount || totalAmount);
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

    intervalRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (intervalRef.current) clearInterval(intervalRef.current);
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
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPolling(false);
          setStep('success');
          clearCart();
        } else if (data.status === 'expired' || data.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPolling(false);
          setStep(data.status === 'expired' ? 'expired' : 'failed');
        }
      } catch {
        // keep polling on network error
      }
    }, 20000);
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStep('details');
    setQrUrl('');
    setTransactionId('');
    setError('');
    setCustomerName('');
    setCustomerPhone('');
    setPolling(false);
  };

  const handleBackToCart = () => {
    onOpenChange(false);
    handleReset();
    setTimeout(() => openCart(), 100);
  };

  const stepIndicator = (current: number) => {
    const steps = ['Detail', 'Bayar', 'Selesai'];
    return (
      <div className="flex items-center gap-2 mb-4">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                i <= current
                  ? 'bg-primary text-primary-foreground glow-neon'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-8 rounded-full transition-all ${i < current ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0 z-[100]">
        <DialogHeader className="p-5 pb-2">
          <DialogTitle className="font-display text-xl font-bold text-neon">
            {step === 'details' && 'Checkout Pesanan'}
            {step === 'pending' && 'Scan QRIS untuk Bayar'}
            {step === 'success' && 'Pembayaran Berhasil!'}
            {step === 'failed' && 'Pembayaran Gagal'}
            {step === 'expired' && 'QRIS Kedaluwarsa'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] scrollbar-thin">
          <div className="px-5 pb-5">
            {step === 'details' && (
              <div className="space-y-4">
                {stepIndicator(0)}
                {/* Order summary */}
                <div className="p-3 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
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
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Biaya Layanan</span>
                    <span className="text-sm font-medium text-neon-green">Rp 0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">{formatRupiah(totalAmount)}</span>
                  </div>
                </div>

                {/* Customer info */}
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
                  className="w-full font-display font-semibold hover:glow-neon glow-neon"
                  size="lg"
                >
                  Bayar dengan QRIS
                </Button>
                <button
                  onClick={handleBackToCart}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Kembali ke Keranjang
                </button>
              </div>
            )}

            {step === 'pending' && (
              <div className="space-y-4 text-center">
                {stepIndicator(1)}
                {/* QR container with scan line effect */}
                <div className="flex justify-center">
                  <div className="relative p-5 bg-white rounded-2xl overflow-hidden">
                    <img
                      src={qrUrl}
                      alt="QRIS Payment"
                      className="w-56 h-56 object-contain"
                    />
                    {/* Scan line animation */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-b from-primary/0 via-primary/60 to-primary/0 animate-scan-line" />
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-primary/30 animate-pulse-glow pointer-events-none" />
                  </div>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  {polling && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  <span>Menunggu pembayaran...</span>
                </div>
                <div className="bg-secondary/30 rounded-xl p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Total Tagihan (termasuk kode unik)</p>
                  <p className="text-lg font-bold text-primary">{formatRupiah(paidAmount)}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    ID: {transactionId.slice(0, 20)}...
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Scan QR menggunakan e-wallet atau mobile banking yang mendukung QRIS
                </p>
              </div>
            )}

            {step === 'success' && (
              <div className="space-y-4 text-center py-4">
                {stepIndicator(2)}
                <div className="relative inline-flex">
                  <CheckCircle2 className="h-20 w-20 text-primary mx-auto glow-green" />
                </div>
                <h3 className="font-display text-lg font-bold">Pembayaran Diterima!</h3>
                {/* Receipt */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 text-left space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    Bukti Pemesanan
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Nama</span>
                    <span className="font-medium">{customerName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">HP</span>
                    <span className="font-medium">{customerPhone}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Total Dibayar</span>
                    <span className="font-bold text-primary">{formatRupiah(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">ID Transaksi</span>
                    <span className="font-mono text-[10px]">{transactionId.slice(0, 24)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tunjukkan bukti ini saat datang ke Line Up Gaming Space.
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
