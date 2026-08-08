import Link from "next/link";
import { CheckCircle2, Package, UserRound } from "lucide-react";

import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Order placed - Elite Central Vacuum",
  description: "Order confirmation for the Elite Central Vacuum storefront.",
};

export default function CheckoutSuccessPage() {
  return (
    <main className="bg-[#F8FAFA] pb-20 pt-16">
      <div className="max-w-4xl mx-auto px-4">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-8 text-center shadow-sm md:p-12">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 size={32} />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
            Order confirmed
          </p>
          <h1 className="mt-3 text-4xl font-bold text-gray-900">
            Your storefront order is ready for dashboard follow-up
          </h1>
          <p className="mt-4 text-sm leading-7 text-gray-600">
            The checkout prototype is complete. In the finished connected flow, this purchase would appear automatically in the authenticated customer order history.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/user/orders">
                <Package size={18} />
                Open my orders
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/login">
                <UserRound size={18} />
                Sign in to dashboard
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
