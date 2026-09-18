'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Gamepad2, ShoppingCart, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const { totalItems, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (totalItems > 0) {
      setCartBounce(true);
      const t = setTimeout(() => setCartBounce(false), 300);
      return () => clearTimeout(t);
    }
  }, [totalItems]);

  const navLinks = [
    { href: '/', label: 'Beranda' },
    { href: '/booking', label: 'Booking di Tempat' },
    { href: '/sewa-harian', label: 'Sewa Harian' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
        scrolled
          ? 'glass border-b border-primary/20 shadow-lg shadow-black/50'
          : 'bg-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 blur-lg bg-primary/40 group-hover:bg-primary/60 transition-colors" />
              <div className="relative p-1.5 rounded-xl bg-primary/10 border border-primary/30">
                <Gamepad2 className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold tracking-wide text-neon">
                Line Up
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">
                Gaming Space
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl glass-card border border-border/30">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  pathname === link.href
                    ? 'text-primary-foreground bg-primary/90 glow-neon'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={openCart}
              className="relative p-2.5 rounded-xl glass-card border border-border/30 hover:border-primary/40 transition-all duration-200 hover:glow-neon group"
              aria-label="Keranjang"
            >
              <ShoppingCart className="h-5 w-5 text-foreground group-hover:text-primary transition-colors" />
              {totalItems > 0 && (
                <span
                  className={cn(
                    'absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold px-1 border-2 border-background',
                    cartBounce && 'animate-count-bounce'
                  )}
                >
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2.5 rounded-xl glass-card border border-border/30 hover:border-primary/40 transition-all"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-1 animate-float-up">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-4 py-3 rounded-xl text-sm font-medium transition-all glass-card border border-border/20',
                  pathname === link.href
                    ? 'text-primary bg-primary/10 border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
