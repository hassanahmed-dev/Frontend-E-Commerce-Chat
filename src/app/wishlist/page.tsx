"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { FiHeart, FiShoppingBag } from "react-icons/fi";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useCommerceStorage } from "@/lib/commerce";

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { wishlistItems, moveWishlistToCart, removeFromWishlist } = useCommerceStorage(user?.id);

  const handleMoveToCart = (productId: string) => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/wishlist");
      return;
    }
    const product = wishlistItems.find((item) => item.id === productId);
    if (!product) return;
    moveWishlistToCart(product);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="surface-card p-6">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <FiHeart className="h-5 w-5 text-rose-500" /> Wishlist
          </h1>
          <p className="mt-2 text-slate-600">Your saved favorites are ready when you are.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistItems.map((item) => (
              <motion.article
                key={item.id}
                whileHover={{ y: -4 }}
                className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <Link href={`/product/${item.id}`} className="block">
                  <img src={item.image} alt={item.name} className="h-40 w-full rounded-lg object-cover" />
                  <p className="text-xs uppercase tracking-wide text-slate-500">{item.category}</p>
                  <h2 className="mt-2 font-semibold text-slate-900">{item.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">Rating {item.rating}</p>
                </Link>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-semibold text-blue-700">${item.price}</p>
                  <button onClick={() => handleMoveToCart(item.id)} className="btn-primary px-3 py-1.5 text-sm">
                    <FiShoppingBag className="h-4 w-4" />
                    Move to cart
                  </button>
                </div>
                <button onClick={() => removeFromWishlist(item.id)} className="mt-2 w-full text-xs text-rose-600 hover:text-rose-700">
                  Remove
                </button>
              </motion.article>
            ))}
            {!user?.id && <p className="text-sm text-slate-500">Login to view wishlist.</p>}
            {user?.id && !wishlistItems.length && <p className="text-sm text-slate-500">No wishlist items yet.</p>}
          </div>
        </section>
      </main>
    </div>
  );
}