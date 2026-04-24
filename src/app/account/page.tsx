import { Header } from "@/components/layout/Header";
import { FiMapPin, FiPackage, FiUser } from "react-icons/fi";

export default function AccountPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="surface-card p-6">
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-slate-900">
            <FiUser className="h-5 w-5 text-emerald-600" /> My account
          </h1>
          <p className="mt-2 text-slate-600">Manage your profile, orders, and delivery addresses.</p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="font-semibold text-slate-900">Profile</h2>
              <p className="mt-2 text-sm text-slate-600">Rohan Sharma</p>
              <p className="text-sm text-slate-500">rohan@email.com</p>
              <button className="btn-secondary mt-4 w-full text-sm">Edit profile</button>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="inline-flex items-center gap-2 font-semibold text-slate-900">
                <FiPackage className="h-4 w-4 text-blue-600" />
                Recent orders
              </h2>
              <p className="mt-2 text-sm text-slate-600">#ORD-2042 - Delivered</p>
              <p className="text-sm text-slate-600">#ORD-2091 - In transit</p>
              <button className="btn-secondary mt-4 w-full text-sm">View all orders</button>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h2 className="inline-flex items-center gap-2 font-semibold text-slate-900">
                <FiMapPin className="h-4 w-4 text-rose-500" />
                Address book
              </h2>
              <p className="mt-2 text-sm text-slate-600">Home: Jaipur, Rajasthan</p>
              <p className="text-sm text-slate-600">Office: Gurugram, Haryana</p>
              <button className="btn-secondary mt-4 w-full text-sm">Manage addresses</button>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}