'use client';

import { useState } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import CartDrawer from '@/components/cart-drawer';
import CheckoutDialog from '@/components/checkout-dialog';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-16">{children}</main>
      <Footer />
      <CartDrawer onCheckout={() => setCheckoutOpen(true)} />
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
}
