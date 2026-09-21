'use client';

import { useState, useEffect } from 'react';
import ClientLayout from '@/components/client-layout';
import { getBookingHistory, clearBookingHistory, type BookingHistoryEntry } from '@/lib/booking-history';
import { formatRupiah } from '@/lib/format';
import { History, Trash2, CheckCircle2, XCircle, Clock, Wallet, ScanLine, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';

export default function HistoryPage() {
  const [history, setHistory] = useState<BookingHistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHistory(getBookingHistory());
    setLoaded(true);
  }, []);

  const handleClear = () => {
    if (!confirm('Hapus semua riwayat booking? Tindakan ini tidak bisa dibatalkan.')) return;
    clearBookingHistory();
    setHistory([]);
    toast.success('Riwayat dihapus');
  };

  const statusConfig = (status: string) => {
    switch (status) {
      case 'paid':
        return { icon: CheckCircle2, label: 'Berhasil', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' };
      case 'failed':
        return { icon: XCircle, label: 'Gagal', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
      case 'expired':
        return { icon: Clock, label: 'Kedaluwarsa', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30' };
      case 'pending_cash':
        return { icon: Store, label: 'Menunggu Kasir', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' };
      default:
        return { icon: Clock, label: status, color: 'text-muted-foreground', bg: 'bg-secondary/30 border-border/30' };
    }
  };

  return (
    <ClientLayout>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <History className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold">
                <span className="text-neon">Riwayat Booking</span>
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Riwayat pesanan tersimpan di perangkat Anda</p>
            </div>
          </div>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash2 className="h-4 w-4 mr-1" />Hapus
            </Button>
          )}
        </div>

        {!loaded ? (
          <div className="text-center py-12 text-muted-foreground">Memuat...</div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <div className="p-4 rounded-2xl bg-secondary/20 border border-border/20">
              <History className="h-10 w-10 opacity-30" />
            </div>
            <p className="text-sm">Belum ada riwayat booking</p>
            <p className="text-xs text-muted-foreground/60">Riwayat akan muncul setelah Anda menyelesaikan pembayaran</p>
          </div>
        ) : (
          <ScrollArea className="max-h-[75vh] scrollbar-thin">
            <div className="space-y-3 pr-1">
              {history.map((h, i) => {
                const sc = statusConfig(h.status);
                return (
                  <div key={h.id + i} className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{h.consoleName}</span>
                          {h.durationHours > 0 && (
                            <span className="text-sm text-muted-foreground">({h.durationHours} jam)</span>
                          )}
                          {h.paymentMethod === 'cash' ? (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                              <Wallet className="h-3 w-3" />Tunai
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              <ScanLine className="h-3 w-3" />QRIS
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(h.date), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                        </p>
                        {h.foodItems.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {h.foodItems.map((f, fi) => (
                              <span key={fi} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                {f.emoji && `${f.emoji} `}{f.name} ×{f.qty}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-lg font-bold text-primary">{formatRupiah(h.totalAmount)}</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${sc.bg} ${sc.color}`}>
                          <sc.icon className="h-3 w-3" />
                          {sc.label}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </ClientLayout>
  );
}
