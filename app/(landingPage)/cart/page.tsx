import Link from "next/link";
import { ArrowRight, ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { getCartProducts } from "@/data/mock/customer-portal";
import { formatCurrencyUsd } from "@/lib/formatters";

export const metadata = {
  title: "Cart - Elite Central Vacuum",
  description: "Review selected accessories and prepare for checkout.",
};

export default function CartPage() {
  const items = getCartProducts();
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.product.priceUsd,
    0,
  );

  return (
    <main className="bg-[#F8FAFA] pb-20 pt-10">
      <div className="max-w-360 mx-auto px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
              Checkout
            </p>
            <h1 className="mt-3 text-4xl font-bold text-primary">Cart</h1>
            <p className="mt-2 text-sm text-gray-600">
              Public shopping lives here. Completed orders appear later in the customer dashboard.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/store">Continue shopping</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-5 md:flex-row md:items-center md:justify-between"
                  key={item.productId}
                >
                  <div className="flex items-start gap-4">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-[#E8EDEE] to-[#D6E6E6]" />
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{item.product.name}</h2>
                      <p className="mt-1 text-sm text-gray-600">{item.product.summary}</p>
                      <p className="mt-3 text-sm text-gray-500">Quantity {item.quantity}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-900">
                      {formatCurrencyUsd(item.quantity * item.product.priceUsd)}
                    </span>
                    <button
                      className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                      type="button"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ShoppingCart className="text-teal-700" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Summary</h2>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>{formatCurrencyUsd(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shipping</span>
                <span>{formatCurrencyUsd(18)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatCurrencyUsd(subtotal + 18)}</span>
              </div>
            </div>
            <Button asChild className="mt-6 w-full">
              <Link href="/checkout">
                Proceed to checkout
                <ArrowRight size={16} />
              </Link>
            </Button>
          </aside>
        </div>
      </div>
    </main>
  );
}
