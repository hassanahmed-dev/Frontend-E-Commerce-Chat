"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { createBooking, getMyBookings, cancelBooking, type BookingNode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FiCalendar, FiCheck, FiClock, FiX } from "react-icons/fi";

const SERVICE_TYPES = [
  "Product Consultation",
  "Personal Shopping",
  "Style Advisory",
  "Gift Wrapping",
  "Custom Order",
  "Technical Support",
  "Return & Exchange",
  "Other"
];

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  cancelled: "bg-rose-100 text-rose-700",
  completed: "bg-emerald-100 text-emerald-700"
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  pending: FiClock,
  confirmed: FiCheck,
  cancelled: FiX,
  completed: FiCalendar
};

export default function BookingPage() {
  const router = useRouter();
  const { user, token, isReady, isAuthenticated } = useAuth();

  const [bookings, setBookings] = useState<BookingNode[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Form state
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [userNote, setUserNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successBooking, setSuccessBooking] = useState<BookingNode | null>(null);

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || isAuthenticated) return;
    router.push("/login?redirect=/booking");
  }, [isAuthenticated, isReady, router]);

  const loadBookings = useCallback(async () => {
    if (!token) return;
    setLoadingBookings(true);
    try {
      const data = await getMyBookings(`Bearer ${token}`);
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [token]);

  useEffect(() => { void loadBookings(); }, [loadBookings]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !scheduledAt) {
      setFormError("Please select a date and time.");
      return;
    }

    const selected = new Date(scheduledAt);
    if (selected <= new Date()) {
      setFormError("Please select a future date and time.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setSuccessBooking(null);
    try {
      const booking = await createBooking({
        authorization: `Bearer ${token}`,
        serviceType,
        scheduledAt: selected.toISOString(),
        userNote: userNote.trim() || undefined
      });
      setSuccessBooking(booking);
      setScheduledAt("");
      setUserNote("");
      setBookings((prev) => [booking, ...prev]);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!token || cancellingId) return;
    setCancellingId(bookingId);
    try {
      const updated = await cancelBooking(bookingId, `Bearer ${token}`);
      setBookings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    } catch {
      // silent
    } finally {
      setCancellingId(null);
    }
  };

  const minDateTime = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  if (!isReady) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto w-full max-w-4xl px-6 py-10">
          <p className="text-sm text-slate-500">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-6">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <FiCalendar className="h-5 w-5 text-blue-600" />
            Book a Service
          </h1>
          <p className="mt-1 text-slate-600">
            Schedule a consultation, style advisory, or any service appointment with our team.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Booking form */}
          <section className="surface-card p-6">
            <h2 className="font-semibold text-slate-900">New Booking</h2>

            {successBooking && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                <FiCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Booking confirmed!</p>
                  <p className="text-xs">
                    ID: #{successBooking.id.slice(0, 8)} · Status: {successBooking.status}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  {SERVICE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Preferred Date & Time</label>
                <input
                  type="datetime-local"
                  min={minDateTime}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Note (optional)</label>
                <textarea
                  rows={3}
                  value={userNote}
                  onChange={(e) => setUserNote(e.target.value)}
                  placeholder="Describe what you need help with..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              {formError && <p className="text-sm text-rose-600">{formError}</p>}

              <button
                type="submit"
                disabled={submitting || !isAuthenticated}
                className="btn-primary w-full disabled:opacity-50"
              >
                {submitting ? "Booking..." : "Book Appointment"}
              </button>

              {!isAuthenticated && (
                <p className="text-center text-xs text-slate-500">
                  You must be logged in to book.
                </p>
              )}
            </form>
          </section>

          {/* My bookings */}
          <section className="surface-card p-6">
            <h2 className="font-semibold text-slate-900">My Bookings</h2>

            {loadingBookings && <p className="mt-3 text-sm text-slate-500">Loading your bookings...</p>}

            {!loadingBookings && bookings.length === 0 && (
              <p className="mt-3 text-sm text-slate-500">No bookings yet. Create your first appointment!</p>
            )}

            <div className="mt-3 space-y-3">
              {bookings.map((booking) => {
                const Icon = STATUS_ICONS[booking.status] ?? FiCalendar;
                const style = STATUS_STYLES[booking.status] ?? "bg-slate-100 text-slate-600";
                const canCancel = booking.status === "pending" || booking.status === "confirmed";

                return (
                  <div
                    key={booking.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`shrink-0 rounded-lg p-1.5 ${style}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{booking.serviceType}</p>
                          <p className="text-xs text-slate-500">
                            {new Date(booking.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${style}`}>
                        {booking.status}
                      </span>
                    </div>

                    {booking.userNote && (
                      <p className="mt-2 text-xs text-slate-600">Your note: {booking.userNote}</p>
                    )}
                    {booking.adminNote && (
                      <p className="mt-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                        Admin: {booking.adminNote}
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-slate-400">#{booking.id.slice(0, 8)}</p>
                      {canCancel && (
                        <button
                          onClick={() => void handleCancel(booking.id)}
                          disabled={cancellingId === booking.id}
                          className="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          {cancellingId === booking.id ? "Cancelling..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
