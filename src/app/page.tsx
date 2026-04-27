"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiArrowRight, FiShield, FiStar, FiTruck } from "react-icons/fi";
import { MdFavoriteBorder } from "react-icons/md";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/auth";
import { useCommerceStorage } from "@/lib/commerce";
import { getProducts } from "@/lib/api";
import { Product } from "@/types";

const stats = [
  { icon: FiTruck, value: "24h", label: "Fast dispatch" },
  { icon: FiShield, value: "99.9%", label: "Secure checkout" },
  { icon: MdFavoriteBorder, value: "1M+", label: "Wishlists saved" }
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCommerceStorage(user?.id);

  useEffect(() => {
    void getProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  const featured = useMemo(() => [...products].sort((a, b) => b.rating - a.rating).slice(0, 3), [products]);

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/shop");
      return;
    }
    addToCart(product, 1);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-10">
        <section className="surface-card grid gap-8 overflow-hidden p-8 md:grid-cols-2 md:p-10">
          <div>
            <span className="badge-soft">Summer Collection Live</span>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-3xl font-bold tracking-tight text-slate-900 md:text-5xl"
            >
              Discover premium products for modern living.
            </motion.h1>
            <p className="mt-4 max-w-2xl text-slate-600">
              Build your perfect cart with curated electronics, fashion, home, and beauty picks. Fast shipping, secure checkout, and seamless returns.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary">
                Start shopping
                <FiArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/wishlist" className="btn-secondary">
                View wishlist
              </Link>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50 to-indigo-50 p-6"
          >
            <p className="text-sm font-semibold text-blue-700">Top Picks</p>
            <div className="mt-4 space-y-3">
              {featured.slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-center justify-between rounded-xl bg-white p-3">
                  <div>
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-sm text-slate-500 capitalize">{product.category}</p>
                  </div>
                  <p className="font-semibold text-blue-700">${product.price}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="surface-card relative overflow-hidden p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-200/60 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-indigo-200/60 blur-3xl" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Mega Multi-Color Banner</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 md:text-3xl">Up to 50% OFF on top categories this weekend</h2>
              <p className="mt-2 max-w-xl text-slate-600">Electronics, fashion, home and beauty essentials - limited-time deals with free delivery and instant returns.</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/shop" className="btn-primary">Grab deals</Link>
                <Link href="/cart" className="btn-secondary">Go to cart</Link>
              </div>
            </div>
            <motion.img
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              src="https://images.unsplash.com/photo-1607082350899-7e105aa886ae?auto=format&fit=crop&w=1200&q=80"
              alt="Colorful shopping bags and sale items"
              className="h-56 w-full rounded-2xl object-cover shadow-sm md:h-64"
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map(({ icon: Icon, value, label }) => (
            <motion.article
              key={label}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="surface-card p-5"
            >
              <span className="icon-badge">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 text-2xl font-semibold text-slate-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </motion.article>
          ))}
        </section>

        <section className="surface-card p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Featured products</h2>
            <Link href="/shop" className="text-sm font-medium text-blue-700 hover:text-blue-800">
              Browse all
            </Link>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            {products.map((product) => (
              <motion.article
                key={product.id}
                whileHover={{ y: -4 }}
                className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <Link href={`/product/${product.id}`} className="block">
                  <img src={product.image} alt={product.name} className="h-36 w-full rounded-lg object-cover" />
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.category}</p>
                  <h3 className="mt-2 font-medium text-slate-900">{product.name}</h3>
                  <p className="mt-2 inline-flex items-center gap-1 text-sm text-amber-500">
                    <FiStar className="h-4 w-4" />
                    {product.rating}
                  </p>
                </Link>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-semibold text-blue-700">${product.price}</p>
                  <button onClick={() => handleAddToCart(product)} className="btn-secondary px-3 py-1.5 text-sm">
                    Add
                  </button>
                </div>
              </motion.article>
            ))}
            {!products.length && <p className="text-sm text-slate-500">No products found.</p>}
          </div>
        </section>

        {/* <section className="surface-card flex flex-col items-start justify-between gap-4 p-6 md:flex-row md:items-center">
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-semibold text-slate-900"
          >
            Join 20,000+ shoppers who trust ShopNest.
          </motion.h1>
          <Link href="/account" className="btn-primary">
            Create account
          </Link>
        </section> */}
      </main>
    </div>
  );
}