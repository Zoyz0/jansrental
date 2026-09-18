'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import CheckoutDialog from '@/components/checkout-dialog';
import { useCart } from '@/contexts/cart-context';
import { formatRupiah } from '@/lib/format';
import { ShoppingBag } from 'lucide-react';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { closeCart, openCart, totalItems, totalAmount, isOpen } = useCart();

  const handleCheckout = () => {
    closeCart();
    setCheckoutOpen(true);
  };

  // Close floating bar when cart is open or checkout is open
  const showFloatingBar = totalItems > 0 && !checkoutOpen && !isOpen;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">{children}</main>
      <Footer />
      <CartDrawer onCheckout={handleCheckout} />
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />

      {/* Mobile floating cart bar */}
      {showFloatingBar && (
        <button
          onClick={openCart}
          className="fixed bottom-4 left-4 right-4 z-40 md:hidden flex items-center justify-between px-5 py-3.5 rounded-2xl bg-primary text-primary-foreground font-display font-semibold shadow-2xl glow-neon animate-float-up"
        >
          <span className="flex items-center gap-2">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary-foreground/20 text-sm">
              {totalItems}
            </span>
            <ShoppingBag className="h-4 w-4" />
            Lihat Keranjang
          </span>
          <span className="text-sm">{formatRupiah(totalAmount)}</span>
        </button>
      )}
    </>
  );
}
