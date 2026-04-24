"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiHeart, FiMenu, FiSearch, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import { RiStore2Line } from "react-icons/ri";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

const links = [
  { href: "/shop", label: "Shop", icon: RiStore2Line },
  { href: "/wishlist", label: "Wishlist", icon: FiHeart },
  { href: "/cart", label: "Cart", icon: FiShoppingBag },
  { href: "/account", label: "Account", icon: FiUser }
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <nav className="flex w-full items-center justify-between gap-3 px-10 py-4">
        <Link href="/" className="text-3xl font-bold leading-none tracking-tight text-slate-900">
          Style Verse
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    pathname === href ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              </motion.div>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
            <FiSearch className="mr-2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search for products..."
              className="w-56 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>
          {!isAuthenticated ? (
            <>
              <Link href="/signup" className="hidden rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 md:inline-flex">
                SignUp
              </Link>
              <Link href="/login" className="hidden rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 md:inline-flex">
                Login
              </Link>
            </>
          ) : (
            <button onClick={handleLogout} className="hidden rounded-full border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 md:inline-flex">
              Logout
            </button>
          )}
          {user?.role === "admin" && (
            <Link href="/dashboard" className="hidden btn-secondary px-3 py-2 text-sm md:inline-flex">
              Admin
            </Link>
          )}
          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
          >
            {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="flex w-full flex-col gap-2 px-6 py-4">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <FiSearch className="mr-2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search for products..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    pathname === href ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {!isAuthenticated ? (
                <>
                  <Link href="/signup" onClick={() => setMobileOpen(false)} className="btn-secondary justify-center text-sm">
                    SignUp
                  </Link>
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-primary justify-center text-sm">
                    Login
                  </Link>
                </>
              ) : (
                <button onClick={handleLogout} className="btn-secondary col-span-2 justify-center text-sm">
                  Logout
                </button>
              )}
            </div>

            {user?.role === "admin" && (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="btn-secondary">
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}