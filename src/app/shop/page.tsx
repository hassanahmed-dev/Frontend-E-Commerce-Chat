"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { FiFilter, FiSearch, FiSliders } from "react-icons/fi";
import { useAuth } from "@/lib/auth";
import { useCommerceStorage } from "@/lib/commerce";
import { getProducts } from "@/lib/api";
import { Product } from "@/types";

export default function ShopPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, addToWishlist } = useCommerceStorage(user?.id);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    void getProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  const categories = useMemo(() => ["all", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

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
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="mb-6 overflow-hidden rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50 via-blue-50 to-cyan-50 p-5">
          <div className="grid items-center gap-4 md:grid-cols-[1fr_260px]">
            <div>
              <p className="text-sm font-semibold text-indigo-700">Weekend Flash Sale</p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">Buy 2 Get 1 Free on selected fashion products</h2>
              <p className="mt-1 text-sm text-slate-600">Use coupon <span className="font-semibold text-indigo-700">STYLE30</span> at checkout.</p>
            </div>
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80"
              alt="Fashion shopping banner"
              className="h-36 w-full rounded-xl object-cover"
            />
          </div>
        </section>
        <section className="surface-card p-6">
          <h1 className="text-2xl font-semibold text-slate-900">Shop products</h1>
          <p className="mt-2 text-slate-600">Find your best picks with smart filters and fast checkout.</p>

          <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <FiSearch className="mr-2 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search by name or category..."
                className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 md:w-72"
              />
            </div>
            <button className="btn-secondary">
              <FiSliders className="h-4 w-4" /> Advanced filters
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button key={category} className="btn-secondary px-3 py-1.5 text-sm capitalize">
                <FiFilter className="h-3.5 w-3.5" />
                {category}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -4 }}
                className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <Link href={`/product/${product.id}`} className="block">
                  <img src={product.image} alt={product.name} className="h-44 w-full rounded-lg object-cover" />
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{product.category}</p>
                  <h2 className="mt-2 font-semibold text-slate-900">{product.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">Rating {product.rating}</p>
                </Link>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-semibold text-blue-700">${product.price}</p>
                  <button onClick={() => handleAddToCart(product)} className="btn-primary px-3 py-1.5 text-sm">
                    Add to cart
                  </button>
                </div>
                <button onClick={() => addToWishlist(product)} className="mt-2 btn-secondary w-full px-3 py-1.5 text-sm">
                  Add to wishlist
                </button>
              </motion.article>
            ))}
            {!products.length && <p className="text-sm text-slate-500">No products available.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}