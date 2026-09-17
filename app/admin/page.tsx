'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking, DailyRentalBooking } from '@/lib/types';
import { formatRupiah } from '@/lib/format';
import { Lock, LayoutDashboard, Calendar, ShoppingBag, Clock, CheckCircle2, XCircle, Phone, User, Gamepad2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const ADMIN_PIN = 'admin123';

type View = 'login' | 'dashboard';

export default function AdminPage() {
  const [view, setView] = useState<View>('login');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rentalBookings, setRentalBookings] = useState<DailyRentalBooking[]>([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      setView('dashboard');
      setError('');
      loadData();
    } else {
      setError('PIN salah. Coba lagi.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    const [bookingRes, rentalRes] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('daily_rental_bookings').select('*').order('created_at', { ascending: false }),
    ]);
    if (bookingRes.data) setBookings(bookingRes.data as Booking[]);
    if (rentalRes.data) setRentalBookings(rentalRes.data as DailyRentalBooking[]);
    setLoading(false);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      paid: 'bg-green-500/20 text-green-400 border-green-500/30',
      confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
      expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  const handleConfirmRental = async (id: string) => {
    const { error } = await supabase
      .from('daily_rental_bookings')
      .update({ status: 'confirmed' })
      .eq('id', id);
    if (error) {
      toast.error('Gagal mengkonfirmasi booking');
    } else {
      toast.success('Booking dikonfirmasi');
      loadData();
    }
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grid bg-radial-glow px-4">
        <div className="w-full max-w-sm space-y-6 p-8 rounded-2xl bg-card border border-border/50 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-neon">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Line Up Gaming Space</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pin">PIN Admin</Label>
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Masukkan PIN"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full font-display font-semibold hover:glow-neon" size="lg">
              Masuk
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center">
            PIN default: admin123 (ganti di kode sebelum production)
          </p>
        </div>
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const paidBookings = bookings.filter((b) => b.status === 'paid');
  const pendingRentals = rentalBookings.filter((b) => b.status === 'pending');
  const confirmedRentals = rentalBookings.filter((b) => b.status === 'confirmed');

  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-neon">Admin Dashboard</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => { setView('login'); setPin(''); }}
          >
            Keluar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="h-4 w-4" />
              <span className="text-xs">Booking Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{pendingBookings.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-xs">Booking Lunas</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{paidBookings.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Sewa Pending</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{pendingRentals.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border/50">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Package className="h-4 w-4" />
              <span className="text-xs">Sewa Konfirm</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{confirmedRentals.length}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
        ) : (
          <Tabs defaultValue="instore" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="instore" className="font-display">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Booking di Tempat
              </TabsTrigger>
              <TabsTrigger value="daily" className="font-display">
                <Package className="h-4 w-4 mr-2" />
                Sewa Harian
              </TabsTrigger>
            </TabsList>

            {/* In-store bookings */}
            <TabsContent value="instore">
              <ScrollArea className="max-h-[70vh] scrollbar-thin">
                <div className="space-y-3">
                  {bookings.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">Belum ada booking</p>
                  ) : (
                    bookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-4 rounded-xl bg-card border border-border/50 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Gamepad2 className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{b.console_name}</span>
                              <span className="text-sm text-muted-foreground">({b.duration_hours} jam)</span>
                            </div>
                            {b.customer_name && (
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <User className="h-3.5 w-3.5" />
                                {b.customer_name}
                                {b.customer_phone && (
                                  <>
                                    <Phone className="h-3.5 w-3.5 ml-2" />
                                    {b.customer_phone}
                                  </>
                                )}
                              </div>
                            )}
                            {b.food_items_json && b.food_items_json.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {b.food_items_json.map((f) => (
                                  <span key={f.id} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                    {f.emoji && `${f.emoji} `}{f.name} ×{f.qty}
                                  </span>
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(parseISO(b.created_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                            </p>
                          </div>
                          <div className="text-right space-y-2">
                            <p className="text-lg font-bold text-primary">{formatRupiah(b.total_amount)}</p>
                            <Badge className={statusBadge(b.status)} variant="outline">
                              {b.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Daily rental bookings */}
            <TabsContent value="daily">
              <ScrollArea className="max-h-[70vh] scrollbar-thin">
                <div className="space-y-3">
                  {rentalBookings.length === 0 ? (
                    <p className="text-center py-12 text-muted-foreground">Belum ada booking sewa harian</p>
                  ) : (
                    rentalBookings.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-xl bg-card border border-border/50 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-primary" />
                              <span className="font-semibold">{r.rental_name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <User className="h-3.5 w-3.5" />
                              {r.customer_name}
                              {r.customer_phone && (
                                <>
                                  <Phone className="h-3.5 w-3.5 ml-2" />
                                  {r.customer_phone}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(parseISO(r.start_date), 'dd MMM', { locale: localeId })} — {format(parseISO(r.end_date), 'dd MMM yyyy', { locale: localeId })}
                              <span className="ml-1">({r.total_days} hari)</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Booking: {format(parseISO(r.created_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                            </p>
                          </div>
                          <div className="text-right space-y-2">
                            <p className="text-lg font-bold text-primary">{formatRupiah(r.total_amount)}</p>
                            <Badge className={statusBadge(r.status)} variant="outline">
                              {r.status}
                            </Badge>
                            {r.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleConfirmRental(r.id)}
                                className="w-full mt-1 hover:glow-neon"
                              >
                                Konfirmasi
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
