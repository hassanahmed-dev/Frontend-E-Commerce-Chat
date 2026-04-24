"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/auth";
import { useCommerceStorage } from "@/lib/commerce";
import { createOrder } from "@/lib/api";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { cartItems, clearCart } = useCommerceStorage(user?.id);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: ""
  });

  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cartItems]);
  const shipping = cartItems.length ? 12 : 0;
  const total = subtotal + shipping;

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !user?.id) {
      router.push("/login?redirect=/checkout");
      return;
    }
    if (!cartItems.length) {
      setError("Your cart is empty.");
      return;
    }
    if (!form.fullName || !form.address || !form.city || !form.postalCode || !form.phone) {
      setError("Please complete all shipping details.");
      return;
    }

    try {
      setError(null);
      setPlacingOrder(true);
      const order = await createOrder({
        userId: user.id,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      });
      clearCart();
      setPlacedOrderId(order.id);
    } catch (placeOrderError) {
      setError(placeOrderError instanceof Error ? placeOrderError.message : "Failed to place order.");
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1fr_320px]">
        <section className="surface-card p-6">
          <h1 className="text-2xl font-semibold text-slate-900">Checkout</h1>
          <p className="mt-2 text-slate-600">Confirm your delivery details and place your order.</p>

          {placedOrderId ? (
            <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-semibold text-emerald-700">Order placed successfully.</p>
              <p className="mt-1 text-sm text-emerald-800">Order ID: {placedOrderId}</p>
              <button onClick={() => router.push("/shop")} className="btn-primary mt-4">
                Continue shopping
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <input
                value={form.fullName}
                onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                placeholder="Full name"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                value={form.phone}
                onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Phone number"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                value={form.address}
                onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                placeholder="Street address"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 sm:col-span-2"
              />
              <input
                value={form.city}
                onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                placeholder="City"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                value={form.postalCode}
                onChange={(event) => setForm((prev) => ({ ...prev, postalCode: event.target.value }))}
                placeholder="Postal code"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          )}

          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        </section>

        <aside className="surface-card h-fit p-6">
          <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            {cartItems.map((item) => (
              <p key={item.product.id} className="flex items-center justify-between">
                <span>{item.product.name} x {item.quantity}</span>
                <span>${item.product.price * item.quantity}</span>
              </p>
            ))}
            <p className="flex items-center justify-between border-t border-slate-200 pt-2">
              <span>Subtotal</span>
              <span className="font-medium text-slate-900">${subtotal}</span>
            </p>
            <p className="flex items-center justify-between">
              <span>Shipping</span>
              <span className="font-medium text-slate-900">${shipping}</span>
            </p>
            <p className="flex items-center justify-between text-base">
              <span>Total</span>
              <span className="font-semibold text-blue-700">${total}</span>
            </p>
          </div>

          {!placedOrderId && (
            <button onClick={handlePlaceOrder} disabled={placingOrder} className="btn-primary mt-5 w-full justify-center disabled:opacity-60">
              {placingOrder ? "Placing order..." : "Place order"}
            </button>
          )}
        </aside>
      </main>
    </div>
  );
}

