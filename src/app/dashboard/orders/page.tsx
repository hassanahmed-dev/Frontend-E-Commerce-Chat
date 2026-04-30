"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getOrders, updateOrderStatus, getOrderDetail, type OrderNode, type OrderDetailNode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FiChevronDown, FiChevronUp, FiPackage, FiSearch } from "react-icons/fi";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-rose-100 text-rose-700"
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status as OrderStatus] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${style}`}>
      {status}
    </span>
  );
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<OrderNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<OrderDetailNode | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleExpand = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedId(orderId);
    setExpandedDetail(null);
    setLoadingDetail(true);
    try {
      const detail = await getOrderDetail(orderId);
      setExpandedDetail(detail);
    } catch {
      setExpandedDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleStatusChange = async (order: OrderNode, newStatus: string) => {
    if (!token || updatingId) return;
    setUpdatingId(order.id);
    try {
      const updated = await updateOrderStatus({ authorization: `Bearer ${token}`, id: order.id, status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o)));
      if (expandedDetail?.id === order.id) {
        setExpandedDetail((prev) => prev ? { ...prev, status: updated.status } : prev);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      o.id.toLowerCase().includes(q) ||
      (o.user?.email ?? "").toLowerCase().includes(q) ||
      (o.user?.name ?? "").toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const statusCounts = ORDER_STATUSES.map((s) => ({ label: s, count: orders.filter((o) => o.status === s).length }));

  return (
    <AdminShell title="Orders">
      <div className="space-y-6">
        {/* Stats row */}
        <div className="flex flex-wrap gap-3">
          {statusCounts.map(({ label, count }) => (
            <button
              key={label}
              onClick={() => setFilterStatus(filterStatus === label ? "all" : label)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                filterStatus === label
                  ? "border-blue-500 bg-blue-50 font-semibold text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <StatusBadge status={label} />
              <span className="font-bold">{count}</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <section className="surface-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by order ID, name or email..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <button onClick={() => void load()} className="btn-secondary text-sm">
              Refresh
            </button>
          </div>
        </section>

        {/* Table */}
        <section className="surface-card overflow-hidden p-0">
          {loading && <p className="p-6 text-sm text-slate-500">Loading orders...</p>}
          {!loading && error && <p className="p-6 text-sm text-rose-600">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="p-6 text-sm text-slate-500">No orders found.</p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {["Order ID", "Customer", "Total", "Status", "Update Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((order) => (
                    <>
                      <tr key={order.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs text-slate-700">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{order.user?.name ?? "—"}</p>
                          <p className="text-xs text-slate-500">{order.user?.email ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3 font-semibold text-blue-700">${Number(order.total).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={order.status}
                            disabled={updatingId === order.id}
                            onChange={(e) => void handleStatusChange(order, e.target.value)}
                            className="rounded border border-slate-300 py-1 pl-2 pr-6 text-xs outline-none focus:border-blue-500 disabled:opacity-50"
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => void toggleExpand(order.id)}
                            className="flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                          >
                            {expandedId === order.id ? <FiChevronUp className="h-3 w-3" /> : <FiChevronDown className="h-3 w-3" />}
                            Items
                          </button>
                        </td>
                      </tr>
                      {expandedId === order.id && (
                        <tr key={`${order.id}-detail`}>
                          <td colSpan={6} className="bg-slate-50 px-6 py-4">
                            {loadingDetail && <p className="text-xs text-slate-500">Loading items...</p>}
                            {!loadingDetail && !expandedDetail && <p className="text-xs text-slate-500">No item details.</p>}
                            {!loadingDetail && expandedDetail && (
                              <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  Order items
                                </p>
                                {expandedDetail.items.map((item) => (
                                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                                    {item.product.imageUrl && (
                                      <img src={item.product.imageUrl} alt={item.product.name} className="h-10 w-10 rounded object-cover" />
                                    )}
                                    {!item.product.imageUrl && (
                                      <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100">
                                        <FiPackage className="h-5 w-5 text-slate-400" />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-slate-800">{item.product.name}</p>
                                      <p className="text-xs text-slate-500">
                                        Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                                      </p>
                                    </div>
                                    <p className="font-semibold text-blue-700">
                                      ${(item.quantity * Number(item.unitPrice)).toFixed(2)}
                                    </p>
                                  </div>
                                ))}
                                <p className="text-right text-xs font-semibold text-slate-700">
                                  Total: ${Number(expandedDetail.total).toFixed(2)}
                                </p>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
