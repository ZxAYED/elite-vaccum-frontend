import Link from "next/link";
import { notFound } from "next/navigation";
import { CreditCard, MapPin, Package, Star, Truck } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  getProductById,
  getStoreOrderById,
  mockCustomerReviews,
} from "@/data/mock/customer-portal";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = getStoreOrderById(orderId);

  if (!order) {
    notFound();
  }

  const relatedReview = mockCustomerReviews.find(
    (review) => review.kind === "product" && review.relatedLabel === order.id,
  );

  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/user/orders">Back to orders</Link>
            </Button>
            <Button asChild>
              <Link href="/user/payments">View payment history</Link>
            </Button>
          </>
        }
        description={`Tracking ${order.trackingNumber} · placed on ${formatLongDate(order.placedAt)}.`}
        eyebrow={`Store Order ${order.id}`}
        title="Order details"
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={order.status} />
              <StatusBadge status={order.paymentStatus} />
            </div>

            <div className="mt-6 space-y-4">
              {order.items.map((item) => {
                const product = getProductById(item.productId);

                return (
                  <div
                    className="flex flex-col gap-4 rounded-2xl border border-gray-200 p-5 md:flex-row md:items-center md:justify-between"
                    key={item.id}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {product?.name ?? "Product item"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">{product?.description}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <span>Qty {item.quantity}</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrencyUsd(item.quantity * item.unitPriceUsd)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MapPin className="text-teal-700" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Delivery address</h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-gray-700">
              {order.deliveryAddress.line1}
              <br />
              {order.deliveryAddress.city}, {order.deliveryAddress.state}{" "}
              {order.deliveryAddress.postalCode}
            </p>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Truck className="text-teal-700" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Shipment summary</h2>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-700">
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                Tracking number: {order.trackingNumber}
              </div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">{order.etaLabel}</div>
              <div className="rounded-2xl bg-gray-50 px-4 py-3">
                Order total: {formatCurrencyUsd(order.totalUsd)}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CreditCard className="text-teal-700" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Payment and review</h2>
            </div>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                Payment status: <span className="font-semibold">{order.paymentStatus}</span>
              </div>
              <Button asChild className="w-full" variant="outline">
                <Link href="/user/payments">Open billing history</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/user/reviews">
                  <Star size={16} />
                  {relatedReview?.status === "submitted"
                    ? "View submitted review"
                    : "Leave product review"}
                </Link>
              </Button>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Package className="text-teal-700" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Next actions</h2>
            </div>
            <div className="mt-5 space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href="/store">Shop compatible accessories</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/contact">Contact support</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
