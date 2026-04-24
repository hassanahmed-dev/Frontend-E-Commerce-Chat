"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { FiMinus, FiPlus, FiShoppingCart, FiTag, FiTrash2 } from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useCommerceStorage } from "@/lib/commerce";

export default function CartPage() {
  const { user } = useAuth();
  const { cartItems, updateCartQuantity, removeFromCart } = useCommerceStorage(user?.id);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0),
    [cartItems]
  );
  const shipping = cartItems.length ? 12 : 0;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1fr_320px]">
        <section className="surface-card p-6">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <FiShoppingCart className="h-5 w-5 text-blue-700" /> Cart
          </h1>
          <p className="mt-2 text-slate-600">Review your items before checkout.</p>

          <div className="mt-6 space-y-3">
            {cartItems.map((item) => (
              <motion.article
                key={item.product.id}
                whileHover={{ y: -2 }}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div>
                  <p className="font-medium text-slate-900">{item.product.name}</p>
                  <p className="text-sm capitalize text-slate-500">
                    {item.product.category} x {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="rounded border border-slate-300 p-1">
                    <FiMinus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="rounded border border-slate-300 p-1">
                    <FiPlus className="h-3.5 w-3.5" />
                  </button>
                  <p className="ml-3 font-semibold text-blue-700">${Number(item.product.price) * item.quantity}</p>
                  <button onClick={() => removeFromCart(item.product.id)} className="rounded border border-rose-200 p-1 text-rose-600">
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.article>
            ))}
            {!user?.id && <p className="text-sm text-slate-500">Login to view cart items.</p>}
            {user?.id && !cartItems.length && <p className="text-sm text-slate-500">No cart items yet.</p>}
          </div>
        </section>

        <aside className="surface-card h-fit p-6">
          <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">${subtotal}</span>
            </p>
            <p className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="font-medium text-slate-900">${shipping}</span>
            </p>
            <p className="flex items-center justify-between border-t border-slate-200 pt-2 text-base">
              <span>Total</span>
              <span className="font-semibold text-blue-700">${total}</span>
            </p>
          </div>
          <Link href="/checkout" className={`btn-primary mt-5 w-full justify-center ${!cartItems.length ? "pointer-events-none opacity-50" : ""}`}>
            Proceed to checkout
          </Link>
          <button className="btn-secondary mt-2 w-full">
            <FiTag className="h-4 w-4" />
            Apply coupon
          </button>
        </aside>
      </main>
    </div>
  );
}