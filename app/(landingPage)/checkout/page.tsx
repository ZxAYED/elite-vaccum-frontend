import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { CheckoutExperience } from "@/components/store/CheckoutExperience";

export const metadata = {
  title: "Checkout - Elite Central Vacuum",
  description: "Review delivery and payment details before placing an order.",
};

export default function CheckoutPage() {
  return (
    <main className="bg-[#f7fbfa] pb-20 pt-8 sm:pt-10">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* CheckoutExperience reads the `cancelled` search param, so it needs a
            Suspense boundary to stay prerenderable. */}
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
              <Loader2 className="size-6 animate-spin" />
              <span className="sr-only">Loading checkout</span>
            </div>
          }
        >
          <CheckoutExperience />
        </Suspense>
      </div>
    </main>
  );
}
