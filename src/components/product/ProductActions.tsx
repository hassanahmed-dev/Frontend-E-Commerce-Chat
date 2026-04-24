"use client";

import { useRouter } from "next/navigation";
import { FiHeart, FiShoppingCart } from "react-icons/fi";
import { useAuth } from "@/lib/auth";
import { useCommerceStorage } from "@/lib/commerce";
import type { Product } from "@/types";

export function ProductActions({ product }: { product: Product }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, addToWishlist } = useCommerceStorage(user?.id);

  const requireLogin = () => {
    if (isAuthenticated) return false;
    router.push(`/login?redirect=/product/${product.id}`);
    return true;
  };

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        onClick={() => {
          if (requireLogin()) return;
          addToCart(product, 1);
        }}
        className="btn-primary"
      >
        <FiShoppingCart className="h-4 w-4" />
        Add to cart
      </button>
      <button
        onClick={() => {
          if (requireLogin()) return;
          addToWishlist(product);
        }}
        className="btn-secondary"
      >
        <FiHeart className="h-4 w-4" />
        Add to wishlist
      </button>
    </div>
  );
}

