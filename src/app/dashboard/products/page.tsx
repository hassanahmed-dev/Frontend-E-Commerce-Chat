"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getProducts } from "@/lib/api";
import { Product } from "@/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    void getProducts().then(setProducts).catch(() => setProducts([]));
  }, []);

  return (
    <AdminShell title="Products">
      <section className="surface-card p-6">
        <h2 className="text-lg font-semibold text-slate-900">All Products</h2>
        <p className="mt-1 text-sm text-slate-600">Manage and review the full products catalog.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">
              <Link href={`/product/${product.id}`} className="block">
                <img src={product.image} alt={product.name} className="h-40 w-full rounded-lg object-cover" />
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{product.category}</p>
                <h3 className="mt-1 font-semibold text-slate-900">{product.name}</h3>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-semibold text-blue-700">${product.price}</span>
                  <span className="text-sm text-slate-500">Rating {product.rating}</span>
                </div>
              </Link>
            </article>
          ))}
          {!products.length && <p className="text-sm text-slate-500">No products found.</p>}
        </div>
      </section>
    </AdminShell>
  );
}

