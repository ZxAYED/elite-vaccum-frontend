import Link from "next/link";
import { ArrowRight, Package, ShoppingBag, Truck } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  getProductById,
  mockCustomerProductOrders,
} from "@/data/mock/customer-portal";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

export default function UserOrdersPage() {
  return (
    <div className="min-h-screen">
      <PageHeader
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/cart">View cart</Link>
            </Button>
            <Button asChild>
              <Link href="/store">
                <ShoppingBag size={18} />
                Continue shopping
              </Link>
            </Button>
          </>
        }
        description="Product orders are handled separately from service jobs so tracking, delivery, and reviews are easier to manage."
        eyebrow="Commerce"
        title="My Orders"
      />

      <div className="space-y-5">
        {mockCustomerProductOrders.map((order) => {
          const leadProduct = getProductById(order.items[0]?.productId);

          return (
            <div
              className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
              key={order.id}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-gray-900">{order.id}</h2>
                    <StatusBadge status={order.status} />
                    <StatusBadge status={order.paymentStatus} />
                  </div>

                  <p className="text-sm text-gray-600">
                    Placed on {formatLongDate(order.placedAt)} · {order.items.length} item
                    {order.items.length === 1 ? "" : "s"}
                  </p>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Package size={16} />
                        Lead item
                      </div>
                      <p className="mt-2 font-semibold text-gray-900">
                        {leadProduct?.name ?? "Order item"}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <Truck size={16} />
                        Delivery
                      </div>
                      <p className="mt-2 font-semibold text-gray-900">{order.etaLabel}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                        <ShoppingBag size={16} />
                        Total
                      </div>
                      <p className="mt-2 font-semibold text-gray-900">
                        {formatCurrencyUsd(order.totalUsd)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-sm rounded-2xl border border-teal-100 bg-teal-50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
                    Tracking
                  </p>
                  <p className="mt-3 text-lg font-semibold text-gray-900">
                    {order.trackingNumber}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{order.etaLabel}</p>
                  <Button asChild className="mt-5 w-full">
                    <Link href={`/user/orders/${order.id}`}>
                      View order details
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
