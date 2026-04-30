"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { getOrderDetail, type OrderDetailNode } from "@/lib/api";
import { FiArrowLeft, FiCheck, FiClock, FiPackage, FiTruck } from "react-icons/fi";

const ORDER_TIMELINE: Array<{ status: string; label: string; icon: React.ElementType }> = [
  { status: "pending", label: "Order Placed", icon: FiClock },
  { status: "processing", label: "Processing", icon: FiPackage },
  { status: "shipped", label: "Shipped", icon: FiTruck },
  { status: "delivered", label: "Delivered", icon: FiCheck }
];

const STATUS_ORDER = ["pending", "processing", "shipped", "delivered"];

function getStepIndex(status: string): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700"
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetailNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;
    setLoading(true);
    void getOrderDetail(params.id)
      .then((data) => {
        if (!data) {
          setError("Order not found.");
        } else {
          setOrder(data);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load order."))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto w-full max-w-3xl px-6 py-10">
          <p className="text-sm text-slate-500">Loading order details...</p>
        </main>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto w-full max-w-3xl px-6 py-10">
          <section className="surface-card p-6">
            <p className="text-rose-600">{error ?? "Order not found."}</p>
            <Link href="/account" className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <FiArrowLeft className="h-4 w-4" /> Back to account
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-3xl px-6 py-10 space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <FiArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Order #{order.id.slice(0, 8)}
            </h1>
            <p className="text-sm text-slate-500">Placed by {order.user?.name ?? "—"}</p>
          </div>
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"}`}>
            {order.status}
          </span>
        </div>

        {/* Timeline */}
        {!isCancelled && (
          <section className="surface-card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Order Progress
            </h2>
            <div className="flex items-center gap-0">
              {ORDER_TIMELINE.map((step, idx) => {
                const isDone = currentStep >= idx;
                const isCurrent = currentStep === idx;
                const Icon = step.icon;
                return (
                  <div key={step.status} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                        isDone
                          ? "bg-blue-600 text-white"
                          : "bg-slate-200 text-slate-400"
                      } ${isCurrent ? "ring-2 ring-blue-300 ring-offset-2" : ""}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className={`text-center text-xs ${isDone ? "font-semibold text-blue-700" : "text-slate-400"}`}>
                        {step.label}
                      </p>
                    </div>
                    {idx < ORDER_TIMELINE.length - 1 && (
                      <div className={`mx-1 mb-4 h-0.5 flex-1 ${currentStep > idx ? "bg-blue-600" : "bg-slate-200"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Items */}
        <section className="surface-card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Order Items
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                {item.product.imageUrl ? (
                  <img src={item.product.imageUrl} alt={item.product.name} className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-200">
                    <FiPackage className="h-6 w-6 text-slate-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{item.product.name}</p>
                  <p className="text-sm text-slate-500">
                    {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                  </p>
                </div>
                <p className="font-bold text-blue-700">
                  ${(item.quantity * Number(item.unitPrice)).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Summary */}
        <section className="surface-card p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Order Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="text-emerald-600">Free</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            <p>Customer: {order.user?.name} ({order.user?.email})</p>
            <p className="mt-1">Order ID: {order.id}</p>
          </div>
        </section>

        <Link href="/account" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <FiArrowLeft className="h-4 w-4" /> Back to account
        </Link>
      </main>
    </div>
  );
}
