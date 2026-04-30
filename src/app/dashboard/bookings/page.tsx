"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getBookings, updateBookingStatus, type BookingNode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FiCalendar, FiCheck, FiClock, FiFilter, FiSearch, FiX } from "react-icons/fi";

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled", "completed"] as const;
type BookingStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  cancelled: "bg-rose-100 text-rose-700",
  completed: "bg-emerald-100 text-emerald-700"
};

const STATUS_ICONS: Record<BookingStatus, React.ElementType> = {
  pending: FiClock,
  confirmed: FiCheck,
  cancelled: FiX,
  completed: FiCalendar
};

export default function AdminBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<BookingNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getBookings(`Bearer ${token}`);
      setBookings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const handleStatusChange = async (booking: BookingNode, newStatus: string) => {
    if (!token || updatingId) return;
    setUpdatingId(booking.id);
    try {
      const updated = await updateBookingStatus({
        authorization: `Bearer ${token}`,
        id: booking.id,
        status: newStatus
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleNoteSave = async (booking: BookingNode) => {
    if (!token) return;
    setUpdatingId(booking.id);
    try {
      const updated = await updateBookingStatus({
        authorization: `Bearer ${token}`,
        id: booking.id,
        status: booking.status,
        adminNote: noteText
      });
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      setNoteEditId(null);
      setNoteText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save note.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = bookings.filter((b) => {
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.user.email.toLowerCase().includes(q) ||
      b.user.name.toLowerCase().includes(q) ||
      b.serviceType.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const stats = STATUS_OPTIONS.map((s) => ({
    label: s,
    count: bookings.filter((b) => b.status === s).length
  }));

  return (
    <AdminShell title="Bookings">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map(({ label, count }) => {
            const Icon = STATUS_ICONS[label as BookingStatus];
            return (
              <button
                key={label}
                onClick={() => setFilterStatus(filterStatus === label ? "all" : label)}
                className={`surface-card flex items-center gap-3 p-4 text-left transition hover:shadow-md ${
                  filterStatus === label ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <span className={`rounded-lg p-2 ${STATUS_STYLES[label as BookingStatus]}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xl font-bold text-slate-900">{count}</p>
                  <p className="text-xs capitalize text-slate-500">{label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <section className="surface-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or service..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="h-4 w-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All statuses</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
            <button onClick={() => void load()} className="btn-secondary text-sm">
              Refresh
            </button>
          </div>
        </section>

        {/* Table */}
        <section className="surface-card overflow-hidden p-0">
          {loading && (
            <p className="p-6 text-sm text-slate-500">Loading bookings...</p>
          )}
          {!loading && error && (
            <p className="p-6 text-sm text-rose-600">{error}</p>
          )}
          {!loading && !error && filtered.length === 0 && (
            <p className="p-6 text-sm text-slate-500">No bookings found.</p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {["Customer", "Service", "Scheduled", "Status", "Notes", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{booking.user.name}</p>
                        <p className="text-xs text-slate-500">{booking.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{booking.serviceType}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {new Date(booking.scheduledAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[booking.status as BookingStatus] ?? "bg-slate-100 text-slate-600"}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="max-w-[160px] px-4 py-3">
                        {noteEditId === booking.id ? (
                          <div className="flex gap-1">
                            <input
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              className="w-full rounded border border-slate-300 px-2 py-1 text-xs outline-none focus:border-blue-500"
                            />
                            <button
                              onClick={() => void handleNoteSave(booking)}
                              disabled={!!updatingId}
                              className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setNoteEditId(null); setNoteText(""); }}
                              className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setNoteEditId(booking.id); setNoteText(booking.adminNote ?? ""); }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {booking.adminNote ? booking.adminNote : "Add note"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={booking.status}
                          disabled={updatingId === booking.id}
                          onChange={(e) => void handleStatusChange(booking, e.target.value)}
                          className="rounded border border-slate-300 py-1 pl-2 pr-6 text-xs outline-none focus:border-blue-500 disabled:opacity-50"
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
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
