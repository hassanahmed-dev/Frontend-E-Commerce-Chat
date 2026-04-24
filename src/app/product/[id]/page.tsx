import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft, FiStar } from "react-icons/fi";
import { Header } from "@/components/layout/Header";
import { ProductActions } from "@/components/product/ProductActions";
import { getProductById } from "@/lib/api";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const description = `${product.name} is crafted for daily use with premium quality materials and reliable performance for modern lifestyle needs.`;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
          <FiArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>

        <section className="surface-card mt-4 grid gap-8 p-6 md:grid-cols-2">
          <img src={product.image} alt={product.name} className="h-80 w-full rounded-2xl object-cover md:h-[420px]" />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{product.category}</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">{product.name}</h1>
            <p className="mt-3 inline-flex items-center gap-1 text-sm text-amber-500">
              <FiStar className="h-4 w-4" />
              {product.rating} rating
            </p>
            <p className="mt-4 text-3xl font-semibold text-blue-700">${product.price}</p>
            <p className="mt-4 text-slate-600">{description}</p>

            <ProductActions product={product} />
          </div>
        </section>
      </main>
    </div>
  );
}

