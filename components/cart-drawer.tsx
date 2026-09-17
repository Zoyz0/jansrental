'use client';

import { X, Trash2, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { formatRupiah } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CartDrawerProps {
  onCheckout: () => void;
}

export default function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, isOpen, closeCart, removeItem, updateFoodQty, totalAmount, clearCart } = useCart();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={closeCart}
        />
      )}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-full max-w-sm bg-card border-l border-border/50 shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Keranjang
            </h3>
            <button onClick={closeCart} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <ScrollArea className="flex-1 p-4 scrollbar-thin">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                <ShoppingBag className="h-12 w-12 opacity-30" />
                <p className="text-sm">Keranjang masih kosong</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30"
                  >
                    {item.emoji && <span className="text-2xl">{item.emoji}</span>}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {item.type === 'console' && item.durationHours && (
                        <p className="text-xs text-muted-foreground">
                          {item.durationHours} jam × {formatRupiah(item.price / item.durationHours)}
                        </p>
                      )}
                      <p className="text-sm text-primary font-semibold mt-1">
                        {formatRupiah(item.price * (item.type === 'food' ? item.qty : 1))}
                      </p>

                      {item.type === 'food' ? (
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateFoodQty(item.id, item.qty - 1)}
                            className="p-1 rounded-md bg-secondary hover:bg-primary/20 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.qty}</span>
                          <button
                            onClick={() => updateFoodQty(item.id, item.qty + 1)}
                            className="p-1 rounded-md bg-secondary hover:bg-primary/20 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto p-1 rounded-md hover:bg-destructive/20 text-destructive transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="mt-1 text-xs text-destructive hover:underline"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {items.length > 0 && (
            <div className="p-4 border-t border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold text-primary">{formatRupiah(totalAmount)}</span>
              </div>
              <Separator />
              <Button
                onClick={onCheckout}
                className="w-full font-display font-semibold tracking-wide hover:glow-neon"
                size="lg"
              >
                Checkout
              </Button>
              <button
                onClick={clearCart}
                className="w-full text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
              >
                Kosongkan Keranjang
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
