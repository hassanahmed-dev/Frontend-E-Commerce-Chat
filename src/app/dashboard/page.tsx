"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getOrders, getProducts, getUsersCount, OrderNode } from "@/lib/api";

export default function DashboardPage() {
  const [orders, setOrders] = useState<OrderNode[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [productsCount, setProductsCount] = useState(0);

  useEffect(() => {
    void getOrders().then(setOrders).catch(() => setOrders([]));
    void getUsersCount().then(setUsersCount).catch(() => setUsersCount(0));
    void getProducts().then((items) => setProductsCount(items.length)).catch(() => setProductsCount(0));
  }, []);

  const latestOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const totalSales = useMemo(() => orders.reduce((sum, item) => sum + Number(item.total), 0), [orders]);

  return (
    <AdminShell title="Dashboard">
      <section className="grid gap-4 md:grid-cols-3">
        <article className="surface-card p-5">
          <p className="text-sm text-slate-500">Total Sales</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">${totalSales.toFixed(2)}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-sm text-slate-500">Orders</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{orders.length}</p>
        </article>
        <article className="surface-card p-5">
          <p className="text-sm text-slate-500">Users / Products</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {usersCount} / {productsCount}
          </p>
        </article>
      </section>

      <section className="surface-card mt-6 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Top 5 Latest Orders</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="pb-2">Order</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-200">
                  <td className="py-3 font-medium text-slate-900">{order.id}</td>
                  <td className="py-3 text-slate-700">{order.user?.name ?? order.user?.email ?? "Unknown"}</td>
                  <td className="py-3 text-slate-700">${Number(order.total).toFixed(2)}</td>
                  <td className="py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700">{order.status}</span>
                  </td>
                  <td className="py-3 text-slate-600">--</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

