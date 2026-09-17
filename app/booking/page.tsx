'use client';

import { useEffect, useState } from 'react';
import ClientLayout from '@/components/client-layout';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/contexts/cart-context';
import { formatRupiah } from '@/lib/format';
import type { Console, FoodItem } from '@/lib/types';
import { Gamepad2, UtensilsCrossed, Plus, Minus, Clock, Check } from 'lucide-react';
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

export default function BookingPage() {
  const [consoles, setConsoles] = useState<Console[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsole, setSelectedConsole] = useState<Console | null>(null);
  const [duration, setDuration] = useState(1);
  const [durationDialog, setDurationDialog] = useState(false);
  const [foodQty, setFoodQty] = useState<Record<string, number>>({});
  const { addConsole, addFood, updateFoodQty, items } = useCart();

  useEffect(() => {
    async function fetchData() {
      const [consoleRes, foodRes] = await Promise.all([
        supabase.from('consoles').select('*').eq('is_active', true).order('price_per_hour'),
        supabase.from('food_items').select('*').eq('is_active', true).order('category'),
      ]);
      if (consoleRes.data) setConsoles(consoleRes.data);
      if (foodRes.data) setFoods(foodRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  const handleSelectConsole = (c: Console) => {
    setSelectedConsole(c);
    setDuration(1);
    setDurationDialog(true);
  };

  const handleConfirmConsole = () => {
    if (!selectedConsole) return;
    addConsole(selectedConsole.id, selectedConsole.name, selectedConsole.price_per_hour, duration);
    toast.success(`${selectedConsole.name} ditambahkan ke keranjang`);
    setDurationDialog(false);
    setSelectedConsole(null);
  };

  const handleAddFood = (food: FoodItem) => {
    const currentQty = foodQty[food.id] || 0;
    if (currentQty >= food.stock) {
      toast.error('Melebihi stok yang tersedia');
      return;
    }
    const newQty = currentQty + 1;
    setFoodQty((prev) => ({ ...prev, [food.id]: newQty }));

    const existingItem = items.find((i) => i.id === food.id);
    if (existingItem) {
      updateFoodQty(food.id, newQty);
    } else {
      addFood(food.id, food.name, food.price, newQty, food.emoji || undefined);
    }
  };

  const handleRemoveFood = (food: FoodItem) => {
    const currentQty = foodQty[food.id] || 0;
    if (currentQty <= 0) return;
    const newQty = currentQty - 1;
    setFoodQty((prev) => ({ ...prev, [food.id]: newQty }));
    updateFoodQty(food.id, newQty);
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

  return (
    <ClientLayout>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Console Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Gamepad2 className="h-7 w-7 text-primary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              <span className="text-neon">Pilih Konsol</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {consoles.map((c) => (
              <div
                key={c.id}
                className="group relative p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 hover:scale-[1.02] hover:glow-neon"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Gamepad2 className="h-6 w-6 text-primary" />
                  </div>
                  {c.name === 'Tempat VIP' && (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium">
                      VIP
                    </span>
                  )}
                </div>
                <h3 className="font-display text-lg font-semibold mb-1">{c.name}</h3>
                <p className="text-xs text-muted-foreground mb-3 min-h-[2.5rem]">{c.description}</p>
                <p className="text-xl font-bold text-primary mb-3">
                  {formatRupiah(c.price_per_hour)}
                  <span className="text-sm font-normal text-muted-foreground">/jam</span>
                </p>
                <Button
                  onClick={() => handleSelectConsole(c)}
                  className="w-full font-display font-semibold hover:glow-neon"
                >
                  Pilih
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* Food Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <UtensilsCrossed className="h-7 w-7 text-primary" />
            <h2 className="font-display text-2xl sm:text-3xl font-bold">
              <span className="text-neon">Makanan & Minuman</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {foods.map((f) => {
              const qty = foodQty[f.id] || 0;
              const outOfStock = f.stock <= 0;
              const maxReached = qty >= f.stock;
              return (
                <div
                  key={f.id}
                  className="group p-5 rounded-2xl bg-card border border-border/50 hover:border-primary/40 transition-all duration-300"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{f.emoji}</span>
                    <div className="flex-1">
                      <h3 className="font-display text-base font-semibold">{f.name}</h3>
                      <p className="text-lg font-bold text-primary">{formatRupiah(f.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${outOfStock ? 'text-destructive' : 'text-muted-foreground'}`}>
                      Stok: {f.stock}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveFood(f)}
                        disabled={qty <= 0}
                        className="p-1.5 rounded-lg bg-secondary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold">{qty}</span>
                      <button
                        onClick={() => handleAddFood(f)}
                        disabled={outOfStock || maxReached}
                        className="p-1.5 rounded-lg bg-secondary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Duration Dialog */}
      <Dialog open={durationDialog} onOpenChange={setDurationDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-neon">
              Pilih Durasi
            </DialogTitle>
          </DialogHeader>
          {selectedConsole && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-secondary/30 rounded-xl">
                <p className="text-sm text-muted-foreground">{selectedConsole.name}</p>
                <p className="text-lg font-bold text-primary">
                  {formatRupiah(selectedConsole.price_per_hour)}/jam
                </p>
              </div>
              <div className="space-y-2">
                <Label>Durasi (jam)</Label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDuration(Math.max(1, duration - 1))}
                    className="p-2.5 rounded-lg bg-secondary hover:bg-primary/20 transition-colors"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <Input
                    type="number"
                    min={1}
                    max={16}
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, Math.min(16, parseInt(e.target.value) || 1)))}
                    className="text-center text-lg font-bold"
                  />
                  <button
                    onClick={() => setDuration(Math.min(16, duration + 1))}
                    className="p-2.5 rounded-lg bg-secondary hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 rounded-xl">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-primary">
                  {formatRupiah(selectedConsole.price_per_hour * duration)}
                </span>
              </div>
              <Button onClick={handleConfirmConsole} className="w-full font-display font-semibold hover:glow-neon" size="lg">
                <Check className="h-5 w-5 mr-2" /> Tambah ke Keranjang
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ClientLayout>
  );
}
