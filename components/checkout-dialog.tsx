'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Loader2, CheckCircle2, XCircle, Clock, User, Phone, ArrowLeft,
  Receipt, ScanLine, Wallet, Store, Download, History,
} from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { formatRupiah } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { addBookingHistory, type BookingHistoryEntry } from '@/lib/booking-history';
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
import { toast } from 'sonner';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CheckoutStep =
  | 'details'
  | 'qris_loading'
  | 'pending'
  | 'cash_waiting'
  | 'cash_receipt'
  | 'success'
  | 'failed'
  | 'expired';
type PaymentMethod = 'qris' | 'cash';

export default function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { items, totalAmount, clearCart, openCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [error, setError] = useState<string>('');
  const [polling, setPolling] = useState(false);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [downloading, setDownloading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const saveHistory = useCallback((opts: {
    status: BookingHistoryEntry['status'];
    txId?: string;
    bId?: string;
  }) => {
    addBookingHistory({
      id: opts.txId || opts.bId || crypto.randomUUID(),
      date: new Date().toISOString(),
      consoleName: items.find((i) => i.type === 'console')?.name || 'N/A',
      durationHours: items.find((i) => i.type === 'console')?.durationHours || 0,
      foodItems: items
        .filter((i) => i.type === 'food')
        .map((i) => ({ name: i.name, qty: i.qty, emoji: i.emoji })),
      totalAmount: totalAmount,
      paymentMethod: paymentMethod,
      status: opts.status,
      customerName,
      customerPhone,
      transactionId: opts.txId,
      bookingId: opts.bId,
    });
  }, [items, totalAmount, paymentMethod, customerName, customerPhone]);

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Nama dan nomor HP wajib diisi');
      return;
    }
    setError('');

    if (paymentMethod === 'cash') {
      try {
        const res = await fetch('/api/checkout-cash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items, customerName, customerPhone }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Gagal membuat pesanan');
          setStep('failed');
          return;
        }
        setPaidAmount(data.totalAmount || totalAmount);
        setBookingId(data.bookingId);
        setStep('cash_waiting');
        clearCart();
        startCashPolling(data.bookingId);
      } catch {
        setError('Terjadi kesalahan. Coba lagi.');
        setStep('failed');
      }
      return;
    }

    // QRIS: show loading screen first
    setStep('qris_loading');
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
        saveHistory({ status: 'expired', txId });
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
          saveHistory({ status: 'paid', txId });
          clearCart();
        } else if (data.status === 'expired' || data.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPolling(false);
          const failStep = data.status === 'expired' ? 'expired' : 'failed';
          setStep(failStep);
          saveHistory({ status: data.status === 'expired' ? 'expired' : 'failed', txId });
        }
      } catch {
        // keep polling on network error
      }
    }, 20000);
  };

  const startCashPolling = (bId: string) => {
    setPolling(true);

    intervalRef.current = setInterval(async () => {
      try {
        const { data, error: sbError } = await supabase
          .from('bookings')
          .select('status')
          .eq('id', bId)
          .maybeSingle();

        if (sbError) return;

        if (data && data.status === 'paid') {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPolling(false);
          setStep('cash_receipt');
          saveHistory({ status: 'paid', bId });
        }
      } catch {
        // keep polling
      }
    }, 5000);
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import('html-to-image');
      const dataUrl = await toPng(receiptRef.current, {
        quality: 0.95,
        backgroundColor: '#0a0a0a',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `struk-lineup-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Struk berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh struk');
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setStep('details');
    setQrUrl('');
    setTransactionId('');
    setBookingId('');
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

  const renderReceipt = (
    title: string,
    idLabel: string,
    idValue: string,
    methodLabel: string,
  ) => (
    <div
      ref={receiptRef}
      className="p-4 rounded-xl bg-secondary/30 border border-primary/20 text-left space-y-2"
    >
      <div className="flex items-center gap-2 text-sm font-semibold mb-2">
        <Receipt className="h-4 w-4 text-primary" />
        {title}
      </div>
      <div className="text-center py-1">
        <p className="font-display text-sm font-bold text-neon">Line Up Gaming Space</p>
        <p className="text-[10px] text-muted-foreground">Bogor Barat</p>
      </div>
      <Separator />
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Nama</span>
        <span className="font-medium">{customerName}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">HP</span>
        <span className="font-medium">{customerPhone}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Metode</span>
        <span className="font-medium">{methodLabel}</span>
      </div>
      <Separator />
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {item.emoji && `${item.emoji} `}
                {item.name}
                {item.type === 'food' && ` ×${item.qty}`}
                {item.type === 'console' && item.durationHours && ` (${item.durationHours}j)`}
              </span>
              <span className="font-medium">
                {formatRupiah(item.price * (item.type === 'food' ? item.qty : 1))}
              </span>
            </div>
          ))}
          <Separator />
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span className="font-semibold">Total Dibayar</span>
        <span className="font-bold text-primary">{formatRupiah(paidAmount)}</span>
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{idLabel}</span>
        <span className="font-mono text-[10px]">{idValue.slice(0, 24)}</span>
      </div>
      <Separator />
      <p className="text-center text-[10px] text-muted-foreground">
        {format(new Date(), 'dd MMM yyyy, HH:mm')} — Terima kasih!
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden p-0 z-[100]">
        <DialogHeader className="p-5 pb-2">
          <DialogTitle className="font-display text-xl font-bold text-neon">
            {step === 'details' && 'Checkout Pesanan'}
            {step === 'qris_loading' && 'Menyiapkan QRIS...'}
            {step === 'pending' && 'Scan QRIS untuk Bayar'}
            {step === 'cash_waiting' && 'Menunggu Konfirmasi Kasir'}
            {step === 'cash_receipt' && 'Pembayaran Berhasil'}
            {step === 'success' && 'Pembayaran Berhasil'}
            {step === 'failed' && 'Pembayaran Gagal'}
            {step === 'expired' && 'QRIS Kedaluwarsa'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] scrollbar-thin">
          <div className="px-5 pb-5">
            {step === 'details' && (
              <div className="space-y-4">
                {stepIndicator(0)}
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

                <div className="space-y-2">
                  <Label>Metode Pembayaran</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod('qris')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        paymentMethod === 'qris'
                          ? 'border-primary bg-primary/10 glow-neon'
                          : 'border-border/30 bg-secondary/20 hover:border-primary/30'
                      }`}
                    >
                      <ScanLine className="h-6 w-6 text-primary" />
                      <span className="text-sm font-medium">QRIS</span>
                      <span className="text-[10px] text-muted-foreground">Bayar online</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-primary bg-primary/10 glow-neon'
                          : 'border-border/30 bg-secondary/20 hover:border-primary/30'
                      }`}
                    >
                      <Wallet className="h-6 w-6 text-primary" />
                      <span className="text-sm font-medium">Tunai</span>
                      <span className="text-[10px] text-muted-foreground">Bayar di tempat</span>
                    </button>
                  </div>
                </div>

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
                  {paymentMethod === 'qris' ? 'Bayar dengan QRIS' : 'Pesan & Bayar di Tempat'}
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

            {/* QRIS Loading screen */}
            {step === 'qris_loading' && (
              <div className="space-y-6 text-center py-8">
                <div className="relative inline-flex">
                  <div className="p-6 rounded-full bg-primary/10 border-2 border-primary/30 animate-pulse-glow">
                    <ScanLine className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-bold">Menyiapkan QRIS</h3>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Sedang membuat kode pembayaran...</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/60 max-w-xs mx-auto">
                  Mohon tunggu sebentar, QRIS akan muncul otomatis dalam beberapa detik.
                </p>
              </div>
            )}

            {step === 'pending' && (
              <div className="space-y-4 text-center">
                {stepIndicator(1)}
                <div className="flex justify-center">
                  <div className="relative p-5 bg-white rounded-2xl overflow-hidden">
                    <img
                      src={qrUrl}
                      alt="QRIS Payment"
                      className="w-56 h-56 object-contain"
                    />
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

            {step === 'cash_waiting' && (
              <div className="space-y-5 text-center py-6">
                {stepIndicator(1)}
                <div className="relative inline-flex">
                  <div className="p-5 rounded-full bg-yellow-500/10 border-2 border-yellow-500/30 animate-pulse-glow">
                    <Store className="h-16 w-16 text-yellow-400" />
                  </div>
                </div>
                <h3 className="font-display text-lg font-bold">Menunggu Konfirmasi Kasir</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Pesanan Anda sudah tercatat. Silakan bayar di kasir.
                  Halaman ini akan otomatis menampilkan struk setelah kasir mengonfirmasi pembayaran.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-yellow-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menunggu konfirmasi...</span>
                </div>
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/30 text-left space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold mb-2">
                    <Receipt className="h-4 w-4 text-primary" />
                    Detail Pesanan
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Nama</span>
                    <span className="font-medium">{customerName}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">HP</span>
                    <span className="font-medium">{customerPhone}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Metode</span>
                    <span className="font-medium">Tunai (Bayar di Tempat)</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Total Bayar</span>
                    <span className="font-bold text-primary">{formatRupiah(paidAmount)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/60">
                  Jangan tutup halaman ini sebelum struk muncul.
                </p>
              </div>
            )}

            {/* Cash receipt */}
            {step === 'cash_receipt' && (
              <div className="space-y-4 text-center py-4">
                {stepIndicator(2)}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="font-display font-semibold text-green-400">Pembayaran Berhasil</span>
                </div>
                {renderReceipt('Struk Pembayaran', 'ID Pesanan', bookingId, 'Tunai (Bayar di Tempat)')}
                <p className="text-sm text-muted-foreground">
                  Pembayaran Anda telah dikonfirmasi oleh kasir. Simpan struk ini sebagai bukti.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadReceipt}
                    disabled={downloading}
                    className="flex-1 hover:glow-neon"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                    Simpan Struk
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    Selesai
                  </Button>
                </div>
              </div>
            )}

            {/* QRIS success */}
            {step === 'success' && (
              <div className="space-y-4 text-center py-4">
                {stepIndicator(2)}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                  <span className="font-display font-semibold text-green-400">Pembayaran Berhasil</span>
                </div>
                {renderReceipt('Bukti Pemesanan', 'ID Transaksi', transactionId, 'QRIS')}
                <p className="text-sm text-muted-foreground">
                  Tunjukkan bukti ini saat datang ke Line Up Gaming Space.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadReceipt}
                    disabled={downloading}
                    className="flex-1 hover:glow-neon"
                  >
                    {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                    Simpan Struk
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    Selesai
                  </Button>
                </div>
              </div>
            )}

            {step === 'failed' && (
              <div className="space-y-4 text-center py-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30">
                  <XCircle className="h-5 w-5 text-red-400" />
                  <span className="font-display font-semibold text-red-400">Pembayaran Gagal</span>
                </div>
                <p className="text-sm text-muted-foreground">{error || 'Terjadi kesalahan. Silakan coba lagi.'}</p>
                <Button onClick={handleReset} variant="outline" className="w-full">
                  Coba Lagi
                </Button>
              </div>
            )}

            {step === 'expired' && (
              <div className="space-y-4 text-center py-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-500/10 border border-gray-500/30">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="font-display font-semibold text-gray-400">QRIS Kedaluwarsa</span>
                </div>
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
