"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string; // unique item id in cart
  productId: string;
  productSlug: string;
  productName: string;
  divisionSlug: string;
  widthMm: number;
  heightMm: number;
  materialId?: string;
  materialName?: string;
  options: Record<string, string>;
  quantity: number;
  unitPriceMinor: number;
  subtotalMinor: number;
  taxIncludedMinor: number;
  totalMinor: number;
  designId?: string;
  artworkUrl?: string;
  notes?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  totalMinor: number;
  taxIncludedMinor: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "digivio_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore JSON parse errors
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // storage quota exceeded or disabled
      }
    }
  }, [items, isLoaded]);

  const addItem = (item: Omit<CartItem, "id">) => {
    const newItem: CartItem = {
      ...item,
      id: "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    };
    setItems((prev) => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          const ratio = qty / i.quantity;
          const subtotalMinor = Math.round(i.unitPriceMinor * qty);
          const taxIncludedMinor = Math.round((subtotalMinor * 0.18) / 1.18);
          return {
            ...i,
            quantity: qty,
            subtotalMinor,
            taxIncludedMinor,
            totalMinor: subtotalMinor,
          };
        }
        return i;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalMinor = items.reduce((acc, curr) => acc + curr.totalMinor, 0);
  const taxIncludedMinor = items.reduce((acc, curr) => acc + curr.taxIncludedMinor, 0);
  // Count unique items in cart (shows 0 when empty, which hides the badge)
  const itemCount = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalMinor,
        taxIncludedMinor,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
