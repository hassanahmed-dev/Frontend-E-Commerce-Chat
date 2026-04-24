"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Product } from "@/types";

export interface StoredCartItem {
  product: Product;
  quantity: number;
}

const CART_KEY_PREFIX = "shopnest_cart";
const WISHLIST_KEY_PREFIX = "shopnest_wishlist";
const STORAGE_EVENT = "shopnest-commerce-updated";

function getScopedKey(prefix: string, userId: string) {
  return `${prefix}:${userId}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function useCommerceStorage(userId?: string) {
  const [version, setVersion] = useState(0);
  const canUseStorage = Boolean(userId);
  const cartKey = userId ? getScopedKey(CART_KEY_PREFIX, userId) : "";
  const wishlistKey = userId ? getScopedKey(WISHLIST_KEY_PREFIX, userId) : "";

  useEffect(() => {
    const refresh = () => setVersion((v) => v + 1);
    window.addEventListener("storage", refresh);
    window.addEventListener(STORAGE_EVENT, refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(STORAGE_EVENT, refresh);
    };
  }, []);

  const cartItems = useMemo(() => {
    if (!canUseStorage) return [] as StoredCartItem[];
    return readJson<StoredCartItem[]>(cartKey, []);
  }, [canUseStorage, cartKey, version]);

  const wishlistItems = useMemo(() => {
    if (!canUseStorage) return [] as Product[];
    return readJson<Product[]>(wishlistKey, []);
  }, [canUseStorage, wishlistKey, version]);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      if (!canUseStorage) return;
      const items = readJson<StoredCartItem[]>(cartKey, []);
      const existing = items.find((item) => item.product.id === product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        items.push({ product, quantity });
      }
      writeJson(cartKey, items);
    },
    [canUseStorage, cartKey]
  );

  const updateCartQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (!canUseStorage) return;
      const items = readJson<StoredCartItem[]>(cartKey, [])
        .map((item) => (item.product.id === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0);
      writeJson(cartKey, items);
    },
    [canUseStorage, cartKey]
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      if (!canUseStorage) return;
      const items = readJson<StoredCartItem[]>(cartKey, []).filter((item) => item.product.id !== productId);
      writeJson(cartKey, items);
    },
    [canUseStorage, cartKey]
  );

  const clearCart = useCallback(() => {
    if (!canUseStorage) return;
    writeJson(cartKey, []);
  }, [canUseStorage, cartKey]);

  const addToWishlist = useCallback(
    (product: Product) => {
      if (!canUseStorage) return;
      const items = readJson<Product[]>(wishlistKey, []);
      if (items.some((item) => item.id === product.id)) return;
      items.unshift(product);
      writeJson(wishlistKey, items);
    },
    [canUseStorage, wishlistKey]
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      if (!canUseStorage) return;
      const items = readJson<Product[]>(wishlistKey, []).filter((item) => item.id !== productId);
      writeJson(wishlistKey, items);
    },
    [canUseStorage, wishlistKey]
  );

  const moveWishlistToCart = useCallback(
    (product: Product) => {
      if (!canUseStorage) return;
      addToCart(product, 1);
      removeFromWishlist(product.id);
    },
    [canUseStorage, addToCart, removeFromWishlist]
  );

  return {
    cartItems,
    wishlistItems,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    addToWishlist,
    removeFromWishlist,
    moveWishlistToCart
  };
}

