"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAllUsers, toggleUserActive, type UserNode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FiSearch, FiShield, FiUser } from "react-icons/fi";

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers(`Bearer ${token}`);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { void load(); }, [load]);

  const handleToggle = async (user: UserNode) => {
    if (!token || togglingId) return;
    setTogglingId(user.id);
    try {
      const updated = await toggleUserActive(user.id, `Bearer ${token}`);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle user.");
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const q = search.toLowerCase();
    const matchSearch =
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const totalAdmins = users.filter((u) => u.role === "admin").length;
  const totalUsers = users.filter((u) => u.role === "user").length;
  const activeCount = users.filter((u) => u.isActive).length;

  return (
    <AdminShell title="Users">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Users", value: users.length, color: "text-blue-700" },
            { label: "Admins", value: totalAdmins, color: "text-amber-700" },
            { label: "Regular Users", value: totalUsers, color: "text-slate-700" },
            { label: "Active", value: activeCount, color: "text-emerald-700" }
          ].map(({ label, value, color }) => (
            <div key={label} className="surface-card p-4">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <section className="surface-card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={() => void load()} className="btn-secondary text-sm">
              Refresh
            </button>
          </div>
        </section>

        {/* Table */}
        <section className="surface-card overflow-hidden p-0">
          {loading && <p className="p-6 text-sm text-slate-500">Loading users...</p>}
          {!loading && error && <p className="p-6 text-sm text-rose-600">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="p-6 text-sm text-slate-500">No users found.</p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {["User", "Role", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                            {user.role === "admin"
                              ? <FiShield className="h-4 w-4" />
                              : <FiUser className="h-4 w-4" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                          user.role === "admin"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}>
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => void handleToggle(user)}
                          disabled={togglingId === user.id}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
                            user.isActive
                              ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          }`}
                        >
                          {togglingId === user.id
                            ? "Saving..."
                            : user.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>
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
