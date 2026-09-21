'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking, DailyRentalBooking, Console, FoodItem, DailyRental } from '@/lib/types';
import { formatRupiah } from '@/lib/format';
import {
  Lock, LayoutDashboard, Calendar, Clock, CheckCircle2, Phone, User,
  Gamepad2, Package, Wallet, ScanLine, Store, UtensilsCrossed, Plus,
  Pencil, Save, X, ToggleLeft, ToggleRight, Trash2, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const ADMIN_PIN = 'admin123';
type View = 'login' | 'dashboard';

interface FoodFormData { name: string; price: string; stock: string; category: string; emoji: string; }
const emptyFoodForm: FoodFormData = { name: '', price: '', stock: '', category: 'food', emoji: '' };

interface ConsoleFormData { name: string; price: string; description: string; }
const emptyConsoleForm: ConsoleFormData = { name: '', price: '', description: '' };

export default function AdminPage() {
  const [view, setView] = useState<View>('login');
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rentalBookings, setRentalBookings] = useState<DailyRentalBooking[]>([]);
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [rentals, setRentals] = useState<DailyRental[]>([]);
  const [loading, setLoading] = useState(false);

  // Console edit
  const [editingConsoleId, setEditingConsoleId] = useState<string | null>(null);
  const [consoleEditValues, setConsoleEditValues] = useState<Record<string, string>>({});
  const [showAddConsole, setShowAddConsole] = useState(false);
  const [addConsoleForm, setAddConsoleForm] = useState<ConsoleFormData>(emptyConsoleForm);

  // Food edit
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [foodEditValues, setFoodEditValues] = useState<Partial<FoodFormData>>({});
  const [showAddFood, setShowAddFood] = useState(false);
  const [addFoodForm, setAddFoodForm] = useState<FoodFormData>(emptyFoodForm);

  // Rental units edit
  const [editingRentalId, setEditingRentalId] = useState<string | null>(null);
  const [rentalUnitsEdit, setRentalUnitsEdit] = useState<string>('');

  const [saving, setSaving] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === ADMIN_PIN) { setView('dashboard'); setLoginError(''); loadAll(); }
    else setLoginError('PIN salah. Coba lagi.');
  };

  const loadAll = async () => {
    setLoading(true);
    const [bookingRes, rentalRes, consoleRes, foodRes, rentalsRes] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('daily_rental_bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('consoles').select('*').order('price_per_hour'),
      supabase.from('food_items').select('*').order('category').order('name'),
      supabase.from('daily_rentals').select('*').order('category').order('name'),
    ]);
    if (bookingRes.data) setBookings(bookingRes.data as Booking[]);
    if (rentalRes.data) setRentalBookings(rentalRes.data as DailyRentalBooking[]);
    if (consoleRes.data) setConsoles(consoleRes.data as Console[]);
    if (foodRes.data) setFoods(foodRes.data as FoodItem[]);
    if (rentalsRes.data) setRentals(rentalsRes.data as DailyRental[]);
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
    const { error } = await supabase.from('daily_rental_bookings').update({ status: 'confirmed' }).eq('id', id);
    if (error) toast.error('Gagal mengkonfirmasi booking');
    else { toast.success('Booking dikonfirmasi'); loadAll(); }
  };

  const handleMarkCashPaid = async (id: string) => {
    const { error } = await supabase.from('bookings').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Gagal menandai pembayaran');
    else { toast.success('Pembayaran tunai dikonfirmasi'); loadAll(); }
  };

  // --- Console CRUD ---
  const startEditConsole = (c: Console) => {
    setEditingConsoleId(c.id);
    setConsoleEditValues({ name: c.name, price: String(c.price_per_hour), description: c.description || '' });
  };
  const cancelEditConsole = () => { setEditingConsoleId(null); setConsoleEditValues({}); };

  const saveConsole = async (id: string) => {
    const price = parseInt(consoleEditValues.price || '0', 10);
    if (!consoleEditValues.name?.trim()) { toast.error('Nama wajib diisi'); return; }
    if (!price || price <= 0) { toast.error('Harga tidak valid'); return; }
    setSaving(true);
    const { error } = await supabase.from('consoles').update({
      name: consoleEditValues.name.trim(),
      price_per_hour: price,
      description: consoleEditValues.description?.trim() || null,
    }).eq('id', id);
    setSaving(false);
    if (error) toast.error('Gagal menyimpan');
    else { toast.success('Konsol diperbarui'); cancelEditConsole(); loadAll(); }
  };

  const toggleConsoleActive = async (c: Console) => {
    const { error } = await supabase.from('consoles').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) toast.error('Gagal mengubah status');
    else { toast.success(c.is_active ? 'Konsol dinonaktifkan' : 'Konsol diaktifkan'); loadAll(); }
  };

  const deleteConsole = async (c: Console) => {
    if (!confirm(`Hapus konsol "${c.name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    const { error } = await supabase.from('consoles').delete().eq('id', c.id);
    if (error) toast.error('Gagal menghapus konsol');
    else { toast.success('Konsol dihapus'); loadAll(); }
  };

  const addConsole = async () => {
    const price = parseInt(addConsoleForm.price, 10);
    if (!addConsoleForm.name.trim()) { toast.error('Nama wajib diisi'); return; }
    if (!price || price <= 0) { toast.error('Harga tidak valid'); return; }
    setSaving(true);
    const { error } = await supabase.from('consoles').insert({
      name: addConsoleForm.name.trim(),
      price_per_hour: price,
      description: addConsoleForm.description.trim() || null,
      icon: 'Gamepad2',
      is_active: true,
    });
    setSaving(false);
    if (error) toast.error('Gagal menambah konsol');
    else { toast.success('Konsol ditambahkan'); setAddConsoleForm(emptyConsoleForm); setShowAddConsole(false); loadAll(); }
  };

  // --- Food CRUD ---
  const startEditFood = (f: FoodItem) => {
    setEditingFoodId(f.id);
    setFoodEditValues({ name: f.name, price: String(f.price), stock: String(f.stock), emoji: f.emoji || '' });
  };
  const cancelEditFood = () => { setEditingFoodId(null); setFoodEditValues({}); };

  const saveFood = async (id: string) => {
    const price = parseInt(foodEditValues.price || '0', 10);
    const stock = parseInt(foodEditValues.stock || '0', 10);
    if (!foodEditValues.name?.trim()) { toast.error('Nama wajib diisi'); return; }
    if (!price || price <= 0) { toast.error('Harga tidak valid'); return; }
    if (stock < 0) { toast.error('Stok tidak boleh negatif'); return; }
    setSaving(true);
    const { error } = await supabase.from('food_items').update({
      name: foodEditValues.name.trim(), price, stock, emoji: foodEditValues.emoji?.trim() || null,
    }).eq('id', id);
    setSaving(false);
    if (error) toast.error('Gagal menyimpan');
    else { toast.success('Item diperbarui'); cancelEditFood(); loadAll(); }
  };

  const toggleFoodActive = async (f: FoodItem) => {
    const { error } = await supabase.from('food_items').update({ is_active: !f.is_active }).eq('id', f.id);
    if (error) toast.error('Gagal mengubah status');
    else { toast.success(f.is_active ? 'Item dinonaktifkan' : 'Item diaktifkan'); loadAll(); }
  };

  const deleteFood = async (f: FoodItem) => {
    if (!confirm(`Hapus "${f.name}"?`)) return;
    const { error } = await supabase.from('food_items').delete().eq('id', f.id);
    if (error) toast.error('Gagal menghapus');
    else { toast.success('Item dihapus'); loadAll(); }
  };

  const addFood = async () => {
    const price = parseInt(addFoodForm.price, 10);
    const stock = parseInt(addFoodForm.stock, 10);
    if (!addFoodForm.name.trim()) { toast.error('Nama wajib diisi'); return; }
    if (!price || price <= 0) { toast.error('Harga tidak valid'); return; }
    if (isNaN(stock) || stock < 0) { toast.error('Stok tidak valid'); return; }
    setSaving(true);
    const { error } = await supabase.from('food_items').insert({
      name: addFoodForm.name.trim(), price, stock, category: addFoodForm.category,
      emoji: addFoodForm.emoji.trim() || null, is_active: true,
    });
    setSaving(false);
    if (error) toast.error('Gagal menambah item');
    else { toast.success('Item ditambahkan'); setAddFoodForm(emptyFoodForm); setShowAddFood(false); loadAll(); }
  };

  // --- Rental units editing ---
  const startEditRentalUnits = (r: DailyRental) => {
    setEditingRentalId(r.id);
    setRentalUnitsEdit(String(r.available_units));
  };
  const cancelEditRentalUnits = () => { setEditingRentalId(null); setRentalUnitsEdit(''); };

  const saveRentalUnits = async (id: string) => {
    const units = parseInt(rentalUnitsEdit || '0', 10);
    if (isNaN(units) || units < 0) { toast.error('Jumlah unit tidak valid'); return; }
    setSaving(true);
    const { error } = await supabase.from('daily_rentals').update({ available_units: units }).eq('id', id);
    setSaving(false);
    if (error) toast.error('Gagal menyimpan');
    else { toast.success('Jumlah unit diperbarui'); cancelEditRentalUnits(); loadAll(); }
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grid bg-radial-glow px-4">
        <div className="w-full max-w-sm space-y-6 p-8 rounded-2xl bg-card border border-border/50 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-2xl bg-primary/10"><Lock className="h-8 w-8 text-primary" /></div>
            <h1 className="font-display text-2xl font-bold text-neon">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Line Up Gaming Space</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pin">PIN Admin</Label>
              <Input id="pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Masukkan PIN" autoFocus />
            </div>
            {loginError && <p className="text-sm text-destructive">{loginError}</p>}
            <Button type="submit" className="w-full font-display font-semibold hover:glow-neon" size="lg">Masuk</Button>
          </form>
          <p className="text-xs text-muted-foreground text-center">PIN default: admin123</p>
        </div>
      </div>
    );
  }

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const paidBookings = bookings.filter((b) => b.status === 'paid');
  const pendingRentals = rentalBookings.filter((b) => b.status === 'pending');
  const confirmedRentals = rentalBookings.filter((b) => b.status === 'confirmed');
  const cashPending = bookings.filter((b) => b.status === 'pending' && b.payment_method === 'cash');
  const foodByCategory = (cat: string) => foods.filter((f) => f.category === cat);

  return (
    <div className="min-h-screen bg-grid">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-primary" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-neon">Admin Dashboard</h1>
          </div>
          <Button variant="outline" onClick={() => { setView('login'); setPin(''); }}>Keluar</Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { icon: Clock, label: 'Booking Pending', value: pendingBookings.length, color: 'text-yellow-400' },
            { icon: CheckCircle2, label: 'Booking Lunas', value: paidBookings.length, color: 'text-green-400' },
            { icon: Wallet, label: 'Tunai Pending', value: cashPending.length, color: 'text-yellow-400', highlight: true },
            { icon: Calendar, label: 'Sewa Pending', value: pendingRentals.length, color: 'text-yellow-400' },
            { icon: Package, label: 'Sewa Konfirm', value: confirmedRentals.length, color: 'text-green-400' },
          ].map((s) => (
            <div key={s.label} className={`p-4 rounded-xl bg-card border ${s.highlight ? 'border-yellow-500/20' : 'border-border/50'}`}>
              <div className="flex items-center gap-2 text-muted-foreground mb-2"><s.icon className="h-4 w-4" /><span className="text-xs">{s.label}</span></div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
        ) : (
          <Tabs defaultValue="instore" className="w-full">
            <TabsList className="flex w-full max-w-2xl mb-6 h-auto gap-1 p-1 flex-wrap">
              <TabsTrigger value="instore" className="font-display flex-1"><Gamepad2 className="h-4 w-4 mr-2" />Booking</TabsTrigger>
              <TabsTrigger value="daily" className="font-display flex-1"><Package className="h-4 w-4 mr-2" />Sewa Harian</TabsTrigger>
              <TabsTrigger value="catalog" className="font-display flex-1"><UtensilsCrossed className="h-4 w-4 mr-2" />Katalog</TabsTrigger>
            </TabsList>

            {/* In-store bookings */}
            <TabsContent value="instore">
              <ScrollArea className="max-h-[70vh] scrollbar-thin">
                <div className="space-y-3">
                  {bookings.length === 0 ? <p className="text-center py-12 text-muted-foreground">Belum ada booking</p> : bookings.map((b) => (
                    <div key={b.id} className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Gamepad2 className="h-4 w-4 text-primary" /><span className="font-semibold">{b.console_name}</span>
                            <span className="text-sm text-muted-foreground">({b.duration_hours} jam)</span>
                            {b.payment_method === 'cash' ? (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"><Wallet className="h-3 w-3" />Tunai</span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"><ScanLine className="h-3 w-3" />QRIS</span>
                            )}
                          </div>
                          {b.customer_name && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><User className="h-3.5 w-3.5" />{b.customer_name}{b.customer_phone && (<><Phone className="h-3.5 w-3.5 ml-2" />{b.customer_phone}</>)}</div>
                          )}
                          {b.food_items_json && b.food_items_json.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {b.food_items_json.map((f) => (
                                <span key={f.id} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{f.emoji && `${f.emoji} `}{f.name} ×{f.qty}</span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground">{format(parseISO(b.created_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-lg font-bold text-primary">{formatRupiah(b.total_amount)}</p>
                          <Badge className={statusBadge(b.status)} variant="outline">{b.status}</Badge>
                          {b.status === 'pending' && b.payment_method === 'cash' && (
                            <Button size="sm" onClick={() => handleMarkCashPaid(b.id)} className="w-full mt-1 hover:glow-neon"><Store className="h-3.5 w-3.5 mr-1" />Lunasi</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Daily rental bookings */}
            <TabsContent value="daily">
              <ScrollArea className="max-h-[70vh] scrollbar-thin">
                <div className="space-y-3">
                  {rentalBookings.length === 0 ? <p className="text-center py-12 text-muted-foreground">Belum ada booking sewa harian</p> : rentalBookings.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-card border border-border/50 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /><span className="font-semibold">{r.rental_name}</span></div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><User className="h-3.5 w-3.5" />{r.customer_name}{r.customer_phone && (<><Phone className="h-3.5 w-3.5 ml-2" />{r.customer_phone}</>)}</div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{format(parseISO(r.start_date), 'dd MMM', { locale: localeId })} — {format(parseISO(r.end_date), 'dd MMM yyyy', { locale: localeId })}<span className="ml-1">({r.total_days} hari)</span></div>
                          <p className="text-xs text-muted-foreground">Booking: {format(parseISO(r.created_at), 'dd MMM yyyy, HH:mm', { locale: localeId })}</p>
                        </div>
                        <div className="text-right space-y-2">
                          <p className="text-lg font-bold text-primary">{formatRupiah(r.total_amount)}</p>
                          <Badge className={statusBadge(r.status)} variant="outline">{r.status}</Badge>
                          {r.status === 'pending' && <Button size="sm" onClick={() => handleConfirmRental(r.id)} className="w-full mt-1 hover:glow-neon">Konfirmasi</Button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator className="my-6" />

              {/* Rental units management */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Package className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-bold">Jumlah Unit Tersedia</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rentals.map((r) => (
                    <div key={r.id} className="p-4 rounded-xl bg-card border border-border/50">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{r.emoji}</span>
                        <div>
                          <p className="font-semibold text-sm">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.category === 'console' ? 'Konsol' : 'Box'} · {formatRupiah(r.price_per_day)}/hari</p>
                        </div>
                      </div>
                      {editingRentalId === r.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input type="number" min={0} value={rentalUnitsEdit} onChange={(e) => setRentalUnitsEdit(e.target.value)} className="text-sm h-8" placeholder="Jumlah unit" autoFocus />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">unit</span>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveRentalUnits(r.id)} disabled={saving} className="flex-1 hover:glow-neon"><Save className="h-3.5 w-3.5 mr-1" />Simpan</Button>
                            <Button size="sm" variant="outline" onClick={cancelEditRentalUnits} className="flex-1"><X className="h-3.5 w-3.5 mr-1" />Batal</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-sm"><span className="font-bold text-primary">{r.available_units}</span> <span className="text-muted-foreground">unit tersedia</span></p>
                          <Button size="sm" variant="outline" onClick={() => startEditRentalUnits(r)}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Catalog management */}
            <TabsContent value="catalog">
              <ScrollArea className="max-h-[80vh] scrollbar-thin">
                <div className="space-y-8 pr-1">
                  {/* Console management */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="h-5 w-5 text-primary" />
                        <h2 className="font-display text-lg font-bold">Konsol</h2>
                      </div>
                      <Button size="sm" onClick={() => setShowAddConsole(!showAddConsole)} variant={showAddConsole ? 'outline' : 'default'} className="hover:glow-neon">
                        {showAddConsole ? <><X className="h-3.5 w-3.5 mr-1" />Batal</> : <><Plus className="h-3.5 w-3.5 mr-1" />Tambah Konsol</>}
                      </Button>
                    </div>

                    {/* Add console form */}
                    {showAddConsole && (
                      <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 mb-4 space-y-3 animate-float-up">
                        <p className="text-sm font-semibold text-primary">Tambah Konsol Baru</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs">Nama Konsol</Label>
                            <Input value={addConsoleForm.name} onChange={(e) => setAddConsoleForm((p) => ({ ...p, name: e.target.value }))} placeholder="Contoh: PS 5 Pro" />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Harga per Jam (Rp)</Label>
                            <Input type="number" min={0} value={addConsoleForm.price} onChange={(e) => setAddConsoleForm((p) => ({ ...p, price: e.target.value }))} placeholder="15000" />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <Label className="text-xs">Deskripsi</Label>
                            <Input value={addConsoleForm.description} onChange={(e) => setAddConsoleForm((p) => ({ ...p, description: e.target.value }))} placeholder="Deskripsi singkat konsol" />
                          </div>
                        </div>
                        <Button onClick={addConsole} disabled={saving} className="w-full hover:glow-neon"><Plus className="h-4 w-4 mr-2" />Tambah Konsol</Button>
                      </div>
                    )}

                    {/* Console list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {consoles.map((c) => (
                        <div key={c.id} className={`p-4 rounded-xl border transition-all ${c.is_active ? 'bg-card border-border/50' : 'bg-secondary/20 border-border/20 opacity-60'}`}>
                          <div className="flex items-center gap-2 mb-3">
                            {c.name === 'Tempat VIP' ? <Crown className="h-4 w-4 text-yellow-400" /> : <Gamepad2 className="h-4 w-4 text-primary" />}
                            <span className="font-semibold">{c.name}</span>
                            {!c.is_active && <span className="text-xs text-muted-foreground">(nonaktif)</span>}
                          </div>

                          {editingConsoleId === c.id ? (
                            <div className="space-y-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Nama</Label>
                                <Input value={consoleEditValues.name || ''} onChange={(e) => setConsoleEditValues((p) => ({ ...p, name: e.target.value }))} className="h-8 text-sm" autoFocus />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Harga per Jam (Rp)</Label>
                                <Input type="number" min={0} value={consoleEditValues.price || ''} onChange={(e) => setConsoleEditValues((p) => ({ ...p, price: e.target.value }))} className="h-8 text-sm" />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Deskripsi</Label>
                                <Input value={consoleEditValues.description || ''} onChange={(e) => setConsoleEditValues((p) => ({ ...p, description: e.target.value }))} className="h-8 text-sm" />
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => saveConsole(c.id)} disabled={saving} className="flex-1 hover:glow-neon"><Save className="h-3.5 w-3.5 mr-1" />Simpan</Button>
                                <Button size="sm" variant="outline" onClick={cancelEditConsole} className="flex-1"><X className="h-3.5 w-3.5 mr-1" />Batal</Button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2 min-h-[2.5rem]">{c.description || 'Tidak ada deskripsi'}</p>
                              <p className="text-xl font-bold text-primary mb-3">{formatRupiah(c.price_per_hour)}<span className="text-xs font-normal text-muted-foreground">/jam</span></p>
                              <div className="flex items-center gap-1">
                                <button onClick={() => startEditConsole(c)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Edit"><Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
                                <button onClick={() => toggleConsoleActive(c)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title={c.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                                  {c.is_active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                                </button>
                                <button onClick={() => deleteConsole(c)} className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors" title="Hapus"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Food & drinks */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2"><UtensilsCrossed className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-bold">Makanan & Minuman</h2></div>
                      <Button size="sm" onClick={() => setShowAddFood(!showAddFood)} variant={showAddFood ? 'outline' : 'default'} className="hover:glow-neon">
                        {showAddFood ? <><X className="h-3.5 w-3.5 mr-1" />Batal</> : <><Plus className="h-3.5 w-3.5 mr-1" />Tambah Item</>}
                      </Button>
                    </div>

                    {showAddFood && (
                      <div className="p-4 rounded-xl bg-secondary/30 border border-primary/20 mb-4 space-y-3 animate-float-up">
                        <p className="text-sm font-semibold text-primary">Tambah Item Baru</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 space-y-1.5"><Label className="text-xs">Nama Item</Label><Input value={addFoodForm.name} onChange={(e) => setAddFoodForm((p) => ({ ...p, name: e.target.value }))} placeholder="Contoh: Mie Goreng" /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Harga (Rp)</Label><Input type="number" min={0} value={addFoodForm.price} onChange={(e) => setAddFoodForm((p) => ({ ...p, price: e.target.value }))} placeholder="15000" /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Stok Awal</Label><Input type="number" min={0} value={addFoodForm.stock} onChange={(e) => setAddFoodForm((p) => ({ ...p, stock: e.target.value }))} placeholder="10" /></div>
                          <div className="space-y-1.5"><Label className="text-xs">Kategori</Label><select value={addFoodForm.category} onChange={(e) => setAddFoodForm((p) => ({ ...p, category: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="food">Makanan</option><option value="drink">Minuman</option></select></div>
                          <div className="space-y-1.5"><Label className="text-xs">Emoji</Label><Input value={addFoodForm.emoji} onChange={(e) => setAddFoodForm((p) => ({ ...p, emoji: e.target.value }))} placeholder="🍜" maxLength={4} /></div>
                        </div>
                        <Button onClick={addFood} disabled={saving} className="w-full hover:glow-neon"><Plus className="h-4 w-4 mr-2" />Tambah Item</Button>
                      </div>
                    )}

                    {(['food', 'drink'] as const).map((cat) => {
                      const catFoods = foodByCategory(cat);
                      if (catFoods.length === 0) return null;
                      return (
                        <div key={cat} className="mb-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">{cat === 'food' ? '🍔 Makanan' : '🥤 Minuman'}</p>
                          <div className="space-y-2">
                            {catFoods.map((f) => (
                              <div key={f.id} className={`p-3 rounded-xl border transition-all ${f.is_active ? 'bg-card border-border/50' : 'bg-secondary/20 border-border/20 opacity-60'}`}>
                                {editingFoodId === f.id ? (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="col-span-2 space-y-1"><Label className="text-xs">Nama</Label><Input value={foodEditValues.name || ''} onChange={(e) => setFoodEditValues((p) => ({ ...p, name: e.target.value }))} className="h-8 text-sm" autoFocus /></div>
                                      <div className="space-y-1"><Label className="text-xs">Harga (Rp)</Label><Input type="number" min={0} value={foodEditValues.price || ''} onChange={(e) => setFoodEditValues((p) => ({ ...p, price: e.target.value }))} className="h-8 text-sm" /></div>
                                      <div className="space-y-1"><Label className="text-xs">Stok</Label><Input type="number" min={0} value={foodEditValues.stock || ''} onChange={(e) => setFoodEditValues((p) => ({ ...p, stock: e.target.value }))} className="h-8 text-sm" /></div>
                                      <div className="space-y-1"><Label className="text-xs">Emoji</Label><Input value={foodEditValues.emoji || ''} onChange={(e) => setFoodEditValues((p) => ({ ...p, emoji: e.target.value }))} className="h-8 text-sm" maxLength={4} /></div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => saveFood(f.id)} disabled={saving} className="flex-1 hover:glow-neon"><Save className="h-3.5 w-3.5 mr-1" />Simpan</Button>
                                      <Button size="sm" variant="outline" onClick={cancelEditFood} className="flex-1"><X className="h-3.5 w-3.5 mr-1" />Batal</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <span className="text-xl shrink-0">{f.emoji || '•'}</span>
                                      <div className="min-w-0">
                                        <p className="font-medium text-sm truncate">{f.name}</p>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="text-primary font-semibold">{formatRupiah(f.price)}</span><span>Stok: <span className={f.stock === 0 ? 'text-destructive font-semibold' : ''}>{f.stock}</span></span></div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button onClick={() => toggleFoodActive(f)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title={f.is_active ? 'Nonaktifkan' : 'Aktifkan'}>{f.is_active ? <ToggleRight className="h-5 w-5 text-primary" /> : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}</button>
                                      <button onClick={() => startEditFood(f)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors" title="Edit"><Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" /></button>
                                      <button onClick={() => deleteFood(f)} className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors" title="Hapus"><Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" /></button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
