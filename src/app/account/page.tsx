"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { FiCalendar, FiExternalLink, FiMapPin, FiPackage, FiUser } from "react-icons/fi";
import { useAuth } from "@/lib/auth";
import { getOrders, type OrderNode } from "@/lib/api";
import { useCommerceStorage } from "@/lib/commerce";

type Address = {
  id: string;
  label: string;
  line: string;
};

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isReady, updateProfile } = useAuth();
  const { cartItems, wishlistItems } = useCommerceStorage(user?.id);
  const [orders, setOrders] = useState<OrderNode[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressLabel, setAddressLabel] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [editingAddressLabel, setEditingAddressLabel] = useState("");
  const [editingAddressLine, setEditingAddressLine] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);

  const addressStorageKey = useMemo(
    () => (user?.id ? `shopnest_addresses:${user.id}` : ""),
    [user?.id]
  );

  useEffect(() => {
    if (!isReady || isAuthenticated) return;
    router.push("/login?redirect=/account");
  }, [isAuthenticated, isReady, router]);

  useEffect(() => {
    if (!addressStorageKey) {
      setAddresses([]);
      return;
    }
    try {
      const raw = window.localStorage.getItem(addressStorageKey);
      if (!raw) {
        setAddresses([]);
        return;
      }
      const parsed = JSON.parse(raw) as Address[];
      setAddresses(Array.isArray(parsed) ? parsed : []);
    } catch {
      setAddresses([]);
    }
  }, [addressStorageKey]);

  useEffect(() => {
    if (!addressStorageKey) return;
    window.localStorage.setItem(addressStorageKey, JSON.stringify(addresses));
  }, [addresses, addressStorageKey]);

  useEffect(() => {
    if (!user) return;
    setProfileName(user.name);
    setProfileEmail(user.email);
  }, [user]);

  useEffect(() => {
    if (!user?.id) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    setOrderError(null);
    void getOrders()
      .then((allOrders) => {
        const userOrders = allOrders
          .filter((order) => order.user?.id === user.id)
          .sort((a, b) => b.id.localeCompare(a.id));
        setOrders(userOrders);
      })
      .catch((error) => {
        setOrderError(error instanceof Error ? error.message : "Failed to load orders.");
      })
      .finally(() => setLoadingOrders(false));
  }, [user?.id]);

  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);

  const handleAddAddress = (event: FormEvent) => {
    event.preventDefault();
    const label = addressLabel.trim();
    const line = addressLine.trim();
    if (!label || !line) return;
    setAddresses((prev) => [{ id: crypto.randomUUID(), label, line }, ...prev]);
    setAddressLabel("");
    setAddressLine("");
  };

  const handleProfileSave = (event: FormEvent) => {
    event.preventDefault();
    const nextName = profileName.trim();
    const nextEmail = profileEmail.trim();
    if (!nextName || !nextEmail) {
      setProfileError("Name and email are required.");
      return;
    }
    if (!nextEmail.includes("@")) {
      setProfileError("Please enter a valid email.");
      return;
    }
    updateProfile({ name: nextName, email: nextEmail });
    setProfileError(null);
    setIsEditingProfile(false);
  };

  const startAddressEdit = (address: Address) => {
    setEditingAddressId(address.id);
    setEditingAddressLabel(address.label);
    setEditingAddressLine(address.line);
  };

  const handleAddressEditSave = (event: FormEvent) => {
    event.preventDefault();
    const label = editingAddressLabel.trim();
    const line = editingAddressLine.trim();
    if (!editingAddressId || !label || !line) return;
    setAddresses((prev) =>
      prev.map((address) => (address.id === editingAddressId ? { ...address, label, line } : address))
    );
    setEditingAddressId(null);
    setEditingAddressLabel("");
    setEditingAddressLine("");
  };

  if (!isReady) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto w-full max-w-6xl px-6 py-10">
          <section className="surface-card p-6">
            <p className="text-sm text-slate-500">Loading account...</p>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="surface-card p-6">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <FiUser className="h-5 w-5 text-emerald-600" /> My account
          </h1>
          <p className="mt-2 text-slate-600">Manage your profile, orders, and delivery addresses.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="font-semibold text-slate-900">Profile</h2>
              {!isEditingProfile ? (
                <>
                  <p className="mt-2 text-sm text-slate-600">{user?.name || "Guest user"}</p>
                  <p className="text-sm text-slate-500">{user?.email || "-"}</p>
                </>
              ) : (
                <form onSubmit={handleProfileSave} className="mt-2 space-y-2">
                  <input
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                  <input
                    value={profileEmail}
                    onChange={(event) => setProfileEmail(event.target.value)}
                    placeholder="Email address"
                    className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                  />
                  {profileError && <p className="text-xs text-rose-600">{profileError}</p>}
                  <div className="flex gap-2">
                    <button type="submit" className="btn-secondary text-xs">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileName(user?.name ?? "");
                        setProfileEmail(user?.email ?? "");
                        setProfileError(null);
                        setIsEditingProfile(false);
                      }}
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
              <p className="mt-4 text-xs text-slate-500">Role: {user?.role || "-"}</p>
              <p className="mt-2 text-xs text-slate-500">Items in cart: {cartItems.length}</p>
              <p className="mt-1 text-xs text-slate-500">Items in wishlist: {wishlistItems.length}</p>
              {!isEditingProfile && (
                <button
                  onClick={() => {
                    setProfileName(user?.name ?? "");
                    setProfileEmail(user?.email ?? "");
                    setProfileError(null);
                    setIsEditingProfile(true);
                  }}
                  className="btn-secondary mt-3 w-full text-sm"
                >
                  Edit profile
                </button>
              )}
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="inline-flex items-center gap-2 font-semibold text-slate-900">
                <FiPackage className="h-4 w-4 text-blue-600" />
                Recent orders
              </h2>
              {loadingOrders && <p className="mt-2 text-sm text-slate-600">Loading orders...</p>}
              {!loadingOrders && orderError && <p className="mt-2 text-sm text-rose-600">{orderError}</p>}
              {!loadingOrders &&
                !orderError &&
                recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2 py-1.5 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-sm text-slate-700">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-slate-500 capitalize">{order.status} · ${Number(order.total).toFixed(2)}</p>
                    </div>
                    <FiExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </Link>
                ))}
              {!loadingOrders && !orderError && !recentOrders.length && (
                <p className="mt-2 text-sm text-slate-600">No orders placed yet.</p>
              )}
              <p className="mt-4 text-xs text-slate-500">Total orders: {orders.length}</p>
              <Link href="/booking" className="mt-3 flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                <FiCalendar className="h-3 w-3" /> Book a service appointment
              </Link>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="inline-flex items-center gap-2 font-semibold text-slate-900">
                <FiMapPin className="h-4 w-4 text-rose-500" />
                Address book
              </h2>
              <form onSubmit={handleAddAddress} className="mt-3 space-y-2">
                <input
                  value={addressLabel}
                  onChange={(event) => setAddressLabel(event.target.value)}
                  placeholder="Label (Home/Office)"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                />
                <input
                  value={addressLine}
                  onChange={(event) => setAddressLine(event.target.value)}
                  placeholder="Address line"
                  className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
                />
                <button type="submit" className="btn-secondary w-full text-sm">
                  Add address
                </button>
              </form>
              <div className="mt-3 space-y-2">
                {addresses.map((address) => (
                  <div key={address.id} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                    {editingAddressId === address.id ? (
                      <form onSubmit={handleAddressEditSave} className="space-y-2">
                        <input
                          value={editingAddressLabel}
                          onChange={(event) => setEditingAddressLabel(event.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                        />
                        <input
                          value={editingAddressLine}
                          onChange={(event) => setEditingAddressLine(event.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-blue-500"
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700">
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingAddressId(null);
                              setEditingAddressLabel("");
                              setEditingAddressLine("");
                            }}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{address.label}</p>
                        <p className="text-sm text-slate-600">{address.line}</p>
                        <div className="mt-1 flex gap-3">
                          <button onClick={() => startAddressEdit(address)} className="text-xs text-blue-700">
                            Edit
                          </button>
                          <button
                            onClick={() => setAddresses((prev) => prev.filter((item) => item.id !== address.id))}
                            className="text-xs text-rose-600"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {!addresses.length && <p className="text-sm text-slate-600">No saved addresses yet.</p>}
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}