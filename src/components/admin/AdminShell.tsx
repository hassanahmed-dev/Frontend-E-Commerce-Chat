"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiBarChart2, FiBox, FiLogOut, FiUploadCloud } from "react-icons/fi";
import { useAuth } from "@/lib/auth";

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: FiBarChart2 },
  { href: "/products", label: "Products", icon: FiBox },
  { href: "/bulk-upload", label: "Bulk Upload", icon: FiUploadCloud }
];

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
        <section className="surface-card p-6">
          <h1 className="text-2xl font-semibold text-slate-900">Admin Access</h1>
          <p className="mt-2 text-slate-600">Please login with an admin account.</p>
          <Link href="/login?redirect=/dashboard" className="btn-primary mt-4">
            Login as admin
          </Link>
        </section>
      </main>
    );
  }

  if (user.role !== "admin") {
    return (
      <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-10">
        <section className="surface-card p-6">
          <h1 className="text-2xl font-semibold text-slate-900">Access Denied</h1>
          <p className="mt-2 text-slate-600">Only admin users can view this section.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 bg-white p-4">
        <Link href="/dashboard" className="px-2 py-3 text-xl font-bold text-slate-900">
          Admin<span className="text-blue-600">Panel</span>
        </Link>

        <nav className="mt-4 space-y-1">
          {adminLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                pathname === href
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <button onClick={handleLogout} className="btn-secondary mt-auto w-full justify-start">
          <FiLogOut className="h-4 w-4" />
          Logout
        </button>
      </aside>

      <div className="ml-64 min-h-screen">
        <section className="min-h-screen">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
            <p className="text-sm text-slate-500">Welcome back</p>
            <div className="mt-1 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{user.name}</span>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </section>
      </div>
    </div>
  );
}

