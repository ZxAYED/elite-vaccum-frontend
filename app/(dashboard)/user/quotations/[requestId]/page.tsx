import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, FileText, MapPin } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import { QuotationDecisionPanel } from "@/components/customer-portal/QuotationDecisionPanel";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { getDashboardServiceOrderByRequestId } from "@/data/mock/customer-dashboard";
import {
  getCustomerQuotationByRequestId,
  getServiceById,
} from "@/data/mock/customer-portal";
import {
  formatCurrencyUsd,
  formatLongDate,
  formatMonthDay,
} from "@/lib/formatters";

interface QuotationDetailPageProps {
  params: Promise<{ requestId: string }>;
}

export default async function QuotationDetailPage({
  params,
}: QuotationDetailPageProps) {
  const { requestId } = await params;
  const record = getCustomerQuotationByRequestId(requestId);

  if (!record) {
    notFound();
  }

  const { request, quote } = record;
  const service = getServiceById(request.serviceId);
  const currentSchedule =
    request.currentSchedule?.label ??
    request.requestedSchedule?.label ??
    `${formatMonthDay(request.preferredDate)} at ${request.preferredTime}`;
  const requestedSchedule =
    request.requestedSchedule?.label ??
    `${formatMonthDay(request.preferredDate)} at ${request.preferredTime}`;
  const serviceOrder = getDashboardServiceOrderByRequestId(request.id);

  return (
    <div className="min-h-screen">
      <PageHeader
        eyebrow={`Quotation ${quote.id}`}
        title={service?.name ?? request.title}
        description="This quotation was created after admin review and remains connected to the original request schedule."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/user/services">Back to requests</Link>
            </Button>
            <Button asChild>
              <Link href={`/user/services/${request.id}`}>Open request</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={quote.status} />
              <StatusBadge status={request.status} />
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">Request ID</p>
                <p className="mt-2 font-semibold text-gray-900">{request.id}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-500">Requested schedule</p>
                <p className="mt-2 font-semibold text-gray-900">
                  {requestedSchedule}
                </p>
              </div>
              <div className="rounded-2xl bg-teal-50 p-4">
                <p className="text-sm font-medium text-teal-700">Current schedule</p>
                <p className="mt-2 font-semibold text-gray-900">
                  {currentSchedule}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <MapPin size={16} />
                  Service location
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  {request.serviceAddress.line1}
                  <br />
                  {request.serviceAddress.city}, {request.serviceAddress.state}{" "}
                  {request.serviceAddress.postalCode}
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                  <CalendarDays size={16} />
                  Schedule note
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-700">
                  Admin may reschedule after request review. The current schedule
                  is the active schedule for the service team.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="text-teal-700" size={22} />
              <h2 className="text-xl font-semibold text-gray-900">
                Quotation line items
              </h2>
            </div>
            <div className="mt-6 space-y-3">
              {quote.lineItems.map((lineItem) => (
                <div
                  key={lineItem.id}
                  className="flex items-start justify-between gap-4 rounded-2xl bg-gray-50 px-4 py-4"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {lineItem.label}
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      {lineItem.description}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrencyUsd(lineItem.amountUsd)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-gray-200 pt-5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrencyUsd(quote.subtotalUsd)}</span>
              </div>
              <div className="mt-3 flex justify-between text-lg font-semibold text-gray-900">
                <span>Total</span>
                <span className="text-primary">
                  {formatCurrencyUsd(quote.totalUsd)}
                </span>
              </div>
            </div>
            {quote.notes ? (
              <div className="mt-5 rounded-2xl border border-dashed border-gray-200 px-4 py-4 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">Estimator note:</span>{" "}
                {quote.notes}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
              Quote total
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-primary">
              {formatCurrencyUsd(quote.totalUsd)}
            </p>
            {quote.expiresAt ? (
              <p className="mt-2 text-sm text-gray-600">
                Expires {formatLongDate(quote.expiresAt)}
              </p>
            ) : null}
          </section>

          <QuotationDecisionPanel
            initialStatus={quote.status}
            currentScheduleLabel={currentSchedule}
            initialRejectionHistory={quote.rejectionHistory}
            serviceOrderHref={
              serviceOrder ? `/user/orders/${serviceOrder.id}` : undefined
            }
          />
        </aside>
      </div>
    </div>
  );
}
