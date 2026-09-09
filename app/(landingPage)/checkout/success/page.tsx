import Link from "next/link";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";

import { CheckoutPaymentStatus } from "@/components/store/CheckoutPaymentStatus";
import { CheckoutSuccessCartReset } from "@/components/store/CheckoutSuccessCartReset";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Order Placed - Elite Central Vacuum",
  description: "Your order has been placed and is being processed.",
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
    order_id?: string;
    method?: string;
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { session_id, order_id, method } = await searchParams;
  const isCashOnDelivery = method?.toUpperCase() === "COD";
  // Stripe's redirect proves nothing — the charge is confirmed by webhook, so
  // an online order has to be polled before we claim anything about payment.
  const needsPaymentConfirmation = Boolean(order_id) && !isCashOnDelivery;

  return (
    <main className="min-h-[70vh] bg-[#F8FAFA] pb-20 pt-16">
      {needsPaymentConfirmation ? null : <CheckoutSuccessCartReset />}
      <div className="mx-auto max-w-2xl px-4">
        <section className="rounded-[2rem] border border-emerald-200/80 bg-white p-8 text-center shadow-md md:p-12">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 shadow-xs">
            <CheckCircle2 size={42} />
          </div>

          <span className="mt-6 inline-flex rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">
            Order Placed
          </span>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Thank you for your order!
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            We&apos;ve received your order and are preparing your central vacuum products
            for shipment.
            {isCashOnDelivery
              ? " Payment is collected in cash when your order is delivered."
              : " You can follow its payment and fulfilment status from your dashboard."}
          </p>

          {needsPaymentConfirmation && order_id ? (
            <CheckoutPaymentStatus orderId={order_id} />
          ) : null}

          {order_id && (
            <div className="mt-6 inline-block rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-700 font-mono">
              <span className="text-slate-500 font-sans font-medium">Order ID: </span>
              <strong className="text-slate-900">{order_id}</strong>
            </div>
          )}

          {session_id && (
            <p className="mt-2 text-[11px] text-slate-400 font-mono truncate max-w-md mx-auto">
              Ref: {session_id}
            </p>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="pill">
              <Link href={order_id ? `/user/orders/${order_id}` : "/user/orders"}>
                <Package size={18} />
                View Order in Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="pill">
              <Link href="/store">
                <ShoppingBag size={18} />
                Continue Shopping
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
