"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { getProductsDetail, updateProduct, deleteProduct, type ProductDetailNode } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { FiEdit2, FiSearch, FiTrash2, FiX } from "react-icons/fi";

const CATEGORIES = ["electronics", "fashion", "home", "beauty", "other"];

export default function AdminProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState<ProductDetailNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Edit modal state
  const [editingProduct, setEditingProduct] = useState<ProductDetailNode | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductDetailNode>>({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete confirm state
  const [deletingProduct, setDeletingProduct] = useState<ProductDetailNode | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void getProductsDetail()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (product: ProductDetailNode) => {
    setEditingProduct(product);
    setEditForm({ ...product });
    setEditError(null);
  };

  const handleEditSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || !editingProduct) return;
    setSaving(true);
    setEditError(null);
    try {
      const updated = await updateProduct({
        authorization: `Bearer ${token}`,
        id: editingProduct.id,
        name: editForm.name,
        description: editForm.description,
        price: editForm.price !== undefined ? Number(editForm.price) : undefined,
        stock: editForm.stock !== undefined ? Number(editForm.stock) : undefined,
        category: editForm.category,
        imageUrl: editForm.imageUrl,
        rating: editForm.rating !== undefined ? Number(editForm.rating) : undefined
      });
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingProduct(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !deletingProduct) return;
    setDeleting(true);
    try {
      await deleteProduct(deletingProduct.id, `Bearer ${token}`);
      setProducts((prev) => prev.filter((p) => p.id !== deletingProduct.id));
      setDeletingProduct(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product.");
      setDeletingProduct(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  return (
    <AdminShell title="Products">
      {/* Edit modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute right-4 top-4 rounded p-1 text-slate-400 hover:text-slate-600"
            >
              <FiX className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">Edit Product</h2>
            <form onSubmit={(e) => void handleEditSave(e)} className="mt-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
                  <input
                    value={editForm.name ?? ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
                  <select
                    value={editForm.category ?? ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Price ($)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={editForm.price ?? ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={editForm.stock ?? ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Rating (0–5)</label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step="0.1"
                    value={editForm.rating ?? ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, rating: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Image URL</label>
                  <input
                    value={editForm.imageUrl ?? ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description ?? ""}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
              {editError && <p className="text-xs text-rose-600">{editError}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete Product</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete <strong>{deletingProduct.name}</strong>? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeletingProduct(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="surface-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">All Products</h2>
            <p className="mt-1 text-sm text-slate-600">
              {products.length} product{products.length !== 1 ? "s" : ""} in catalog.
            </p>
          </div>
          <Link href="/dashboard/bulk-upload" className="btn-secondary text-sm">
            Bulk Upload
          </Link>
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <div className="relative mt-4">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full max-w-sm rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading products...</p>}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <Link href={`/product/${product.id}`} className="block">
                <img
                  src={product.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"}
                  alt={product.name}
                  className="h-40 w-full rounded-lg object-cover"
                />
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">{product.category}</p>
                <h3 className="mt-1 font-semibold text-slate-900">{product.name}</h3>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-semibold text-blue-700">${product.price.toFixed(2)}</span>
                  <span className="text-xs text-slate-500">Stock: {product.stock} · ★ {product.rating.toFixed(1)}</span>
                </div>
              </Link>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => openEdit(product)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  <FiEdit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setDeletingProduct(product)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  <FiTrash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-slate-500">No products found.</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
