'use client';

import { useEffect, useState } from 'react';
import ClientLayout from '@/components/client-layout';
import { supabase } from '@/lib/supabase';
import { formatRupiah } from '@/lib/format';
import type { DailyRental, DailyRentalBooking } from '@/lib/types';
import { Calendar, Package, Gamepad2, ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const WHATSAPP_NUMBER = '6281234567890'; // Replace with actual number

export default function SewaHarianPage() {
  const [rentals, setRentals] = useState<DailyRental[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRental, setSelectedRental] = useState<DailyRental | null>(null);
  const [dateDialog, setDateDialog] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [existingBookings, setExistingBookings] = useState<DailyRentalBooking[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [rentalRes, bookingRes] = await Promise.all([
        supabase.from('daily_rentals').select('*').eq('is_active', true).order('category'),
        supabase.from('daily_rental_bookings').select('*').in('status', ['pending', 'confirmed']),
      ]);
      if (rentalRes.data) setRentals(rentalRes.data);
      if (bookingRes.data) setExistingBookings(bookingRes.data as DailyRentalBooking[]);
      setLoading(false);
    }
    fetchData();
  }, []);

  const getBookedUnitsForDateRange = (rentalId: string, start: string, end: string): number => {
    const startD = parseISO(start);
    const endD = parseISO(end);
    return existingBookings
      .filter((b) => b.rental_id === rentalId)
      .filter((b) => {
        const bStart = parseISO(b.start_date);
        const bEnd = parseISO(b.end_date);
        return startD <= bEnd && endD >= bStart;
      })
      .length;
  };

  const isAvailable = (rental: DailyRental): boolean => {
    if (!startDate || !endDate) return rental.available_units > 0;
    const booked = getBookedUnitsForDateRange(rental.id, startDate, endDate);
    return rental.available_units - booked > 0;
  };

  const handleOpenDatePicker = (rental: DailyRental) => {
    setSelectedRental(rental);
    setStartDate('');
    setEndDate('');
    setCustomerName('');
    setCustomerPhone('');
    setDateDialog(true);
  };

  const totalDays = startDate && endDate
    ? Math.max(1, differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1)
    : 0;

  const totalAmount = selectedRental && totalDays > 0
    ? selectedRental.price_per_day * totalDays
    : 0;

  const handleSendWhatsApp = async () => {
    if (!selectedRental || !startDate || !endDate || !customerName.trim()) {
      toast.error('Lengkapi nama dan tanggal terlebih dahulu');
      return;
    }

    const booked = getBookedUnitsForDateRange(selectedRental.id, startDate, endDate);
    if (selectedRental.available_units - booked <= 0) {
      toast.error('Unit tidak tersedia untuk tanggal tersebut');
      return;
    }

    // Save booking to database
    const { error } = await supabase.from('daily_rental_bookings').insert({
      rental_id: selectedRental.id,
      rental_name: selectedRental.name,
      customer_name: customerName,
      customer_phone: customerPhone,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      total_amount: totalAmount,
      status: 'pending',
    });

    if (error) {
      toast.error('Gagal menyimpan data booking');
      return;
    }

    const phoneLine = customerPhone ? `HP: ${customerPhone}\n` : '';
    const message =
      `Halo Line Up Gaming Space! 👋\n\nSaya ingin sewa:\n\n` +
      `📦 ${selectedRental.name}\n` +
      `📅 Ambil: ${format(parseISO(startDate), 'dd MMM yyyy', { locale: localeId })}\n` +
      `📅 Kembali: ${format(parseISO(endDate), 'dd MMM yyyy', { locale: localeId })}\n` +
      `⏱️ Durasi: ${totalDays} hari\n` +
      `💰 Estimasi: ${formatRupiah(totalAmount)}\n\n` +
      `Nama: ${customerName}\n` +
      phoneLine +
      `\nMohon konfirmasi ketersediaan ya. Terima kasih!`;

    const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    toast.success('Booking tercatat! Mengarahkan ke WhatsApp...');
    setDateDialog(false);
  };

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Memuat...</div>
        </div>
      </ClientLayout>
    );
  }

  const consoleRentals = rentals.filter((r) => r.category === 'console');
  const boxRentals = rentals.filter((r) => r.category === 'box');

  const renderRentalCard = (rental: DailyRental) => {
    const available = isAvailable(rental);
    return (
      <div
        key={rental.id}
        className="group p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] hover:glow-neon"
      >
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl">{rental.emoji}</span>
          <div className="flex-1">
            <h3 className="font-display text-lg font-semibold">{rental.name}</h3>
            <p className="text-xs text-muted-foreground min-h-[2.5rem]">{rental.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xl font-bold text-primary">
            {formatRupiah(rental.price_per_day)}
            <span className="text-sm font-normal text-muted-foreground">/hari</span>
          </p>
          <span className={`text-xs font-medium ${available ? 'text-neon-green' : 'text-destructive'}`}>
            {available ? `${rental.available_units} unit tersedia` : 'Tidak tersedia'}
          </span>
        </div>
        <Button
          onClick={() => handleOpenDatePicker(rental)}
          disabled={!available}
          className="w-full font-display font-semibold hover:glow-neon"
        >
          <Calendar className="h-4 w-4 mr-2" />
          Pilih & Atur Tanggal
        </Button>
      </div>
    );
  };

  return (
    <ClientLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Console Rentals */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Gamepad2 className="h-7 w-7 text-primary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              <span className="text-neon">Sewa Konsol Biasa</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Hanya unit konsol, dibawa pulang, tanpa ruang tambahan
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {consoleRentals.map(renderRentalCard)}
          </div>
        </section>

        {/* Box Rentals */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Package className="h-7 w-7 text-primary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              <span className="text-neon">Sewa Line Up Box</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Paket lengkap (konsol + layar + tempat), bisa dipakai di tempat atau dibawa pulang
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {boxRentals.map(renderRentalCard)}
          </div>
        </section>
      </div>

      {/* Date Picker Dialog */}
      <Dialog open={dateDialog} onOpenChange={setDateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-neon">
              Pilih Tanggal Sewa
            </DialogTitle>
          </DialogHeader>
          {selectedRental && (
            <div className="space-y-4">
              <div className="p-3 bg-secondary/30 rounded-xl">
                <p className="font-semibold">{selectedRental.name}</p>
                <p className="text-sm text-primary">{formatRupiah(selectedRental.price_per_day)}/hari</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start">Tanggal Ambil</Label>
                  <Input
                    id="start"
                    type="date"
                    value={startDate}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="end">Tanggal Kembali</Label>
                  <Input
                    id="end"
                    type="date"
                    value={endDate}
                    min={startDate || format(new Date(), 'yyyy-MM-dd')}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cust-name">Nama</Label>
                <Input
                  id="cust-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nama Anda"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone">Nomor HP (opsional)</Label>
                <Input
                  id="cust-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              {totalDays > 0 && (
                <div className="p-3 bg-primary/10 rounded-xl space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Durasi</span>
                    <span className="font-semibold">{totalDays} hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estimasi Harga</span>
                    <span className="text-lg font-bold text-primary">{formatRupiah(totalAmount)}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSendWhatsApp}
                className="w-full font-display font-semibold hover:glow-neon"
                size="lg"
                disabled={!startDate || !endDate || !customerName.trim()}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Kirim via WhatsApp
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Booking tercatat otomatis, konfirmasi via WhatsApp
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ClientLayout>
  );
}
