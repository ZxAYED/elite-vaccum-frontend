import Link from "next/link";
import { CreditCard, MapPin, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { getCartProducts } from "@/data/mock/customer-portal";
import { mockCurrentCustomer } from "@/data/mock/user";
import { formatCurrencyUsd } from "@/lib/formatters";

export const metadata = {
  title: "Checkout - Elite Central Vacuum",
  description: "Review delivery and payment details before placing an order.",
};

export default function CheckoutPage() {
  const items = getCartProducts();
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.product.priceUsd,
    0,
  );

  return (
    <main className="bg-[#F8FAFA] pb-20 pt-10">
      <div className="max-w-360 mx-auto px-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">
            Checkout
          </p>
          <h1 className="mt-3 text-4xl font-bold text-primary">Confirm your order</h1>
          <p className="mt-2 text-sm text-gray-600">
            This frontend flow prepares order placement and hands off future persistence to the backend integration layer.
          </p>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <MapPin className="text-teal-700" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">Delivery address</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-700">
                {mockCurrentCustomer.displayName}
                <br />
                {mockCurrentCustomer.addresses[0].line1}
                <br />
                {mockCurrentCustomer.addresses[0].city}, {mockCurrentCustomer.addresses[0].state}{" "}
                {mockCurrentCustomer.addresses[0].postalCode}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <CreditCard className="text-teal-700" size={20} />
                <h2 className="text-xl font-semibold text-gray-900">Payment summary</h2>
              </div>
              <div className="mt-5 space-y-4">
                {items.map((item) => (
                  <div className="flex items-center justify-between text-sm text-gray-700" key={item.productId}>
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>{formatCurrencyUsd(item.quantity * item.product.priceUsd)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatCurrencyUsd(subtotal + 18)}</span>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800">
              <ShieldCheck size={16} />
              Secure preview checkout
            </div>
            <p className="mt-5 text-sm leading-7 text-gray-600">
              Product checkout remains public, but completed purchases are surfaced back into the customer dashboard as authenticated order history.
            </p>
            <Button asChild className="mt-8 w-full">
              <Link href="/checkout/success">Place order</Link>
            </Button>
            <Button asChild className="mt-3 w-full" variant="outline">
              <Link href="/cart">Return to cart</Link>
            </Button>
          </aside>
        </div>
      </div>
    </main>
  );
}
