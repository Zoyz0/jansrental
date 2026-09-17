'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { CartItem } from '@/lib/types';

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  setCartOpen: (open: boolean) => void;
  addConsole: (id: string, name: string, pricePerHour: number, durationHours: number) => void;
  addFood: (id: string, name: string, price: number, qty: number, emoji?: string) => void;
  updateFoodQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const setCartOpen = useCallback((open: boolean) => setIsOpen(open), []);

  const addConsole = useCallback(
    (id: string, name: string, pricePerHour: number, durationHours: number) => {
      setItems((prev) => [
        ...prev.filter((item) => item.type !== 'console'),
        {
          type: 'console' as const,
          id,
          name,
          price: pricePerHour * durationHours,
          qty: 1,
          durationHours,
        },
      ]);
      setIsOpen(true);
    },
    []
  );

  const addFood = useCallback(
    (id: string, name: string, price: number, qty: number, emoji?: string) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.type === 'food' && i.id === id);
        if (existing) {
          return prev.map((i) =>
            i.id === id && i.type === 'food' ? { ...i, qty: i.qty + qty } : i
          );
        }
        return [...prev, { type: 'food' as const, id, name, price, qty, emoji }];
      });
    },
    []
  );

  const updateFoodQty = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.id !== id);
      return prev.map((i) => (i.id === id && i.type === 'food' ? { ...i, qty } : i));
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + (i.type === 'food' ? i.qty : 1), 0),
    [items]
  );

  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + i.price * (i.type === 'food' ? i.qty : 1), 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    isOpen,
    openCart,
    closeCart,
    setCartOpen,
    addConsole,
    addFood,
    updateFoodQty,
    removeItem,
    clearCart,
    totalItems,
    totalAmount,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
