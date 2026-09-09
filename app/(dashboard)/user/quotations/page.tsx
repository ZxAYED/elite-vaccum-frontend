"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarClock, FileText, ShieldCheck, Wallet } from "lucide-react";

import { PageHeader } from "@/components/customer-portal/PageHeader";
import {
  PortalCard,
  PortalCardAction,
  PortalCardFooter,
  PortalCardTitle,
  PortalCardTop,
  PortalDetailAction,
  PortalFact,
  PortalList,
  PortalLoading,
  PortalRef,
} from "@/components/customer-portal/PortalUI";
import { StatusBadge } from "@/components/customer-portal/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGetMyQuotationsQuery } from "@/redux/api/quotationsApi";
import { formatCurrencyUsd, formatLongDate } from "@/lib/formatters";

/** Quotation statuses that still need a decision from the customer. */
const AWAITING_DECISION = ["sent", "viewed", "under-review", "quoted"];

export default function UserQuotationsPage() {
  // Phase 9.7 GET /quotations/me
  const { data: apiQuotes, isLoading, isError, refetch } =
    useGetMyQuotationsQuery();

  const quotations = useMemo(
    () =>
      (apiQuotes ?? []).map((quote) => ({
        id: quote.id,
        reference: quote.businessId || quote.serviceRequestId || quote.id,
        requestId: quote.serviceRequestId || quote.id,
        status: quote.status,
        totalUsd: quote.totalUsd,
        expiresAt: quote.expiresAt || "",
        issuedAt: quote.issuedAt || "",
        title:
          (quote as unknown as { serviceName?: string }).serviceName ||
          "Central Vacuum Service",
        notes: quote.notes || "",
      })),
    [apiQuotes],
  );

  return (
    <div className="space-y-6 pb-12 sm:space-y-7">
      <PageHeader
        actions={
          <Button
            asChild
            className="rounded-md bg-teal-600 font-medium text-white shadow-xs hover:bg-teal-500"
          >
            <Link href="/services">
              <FileText className="mr-1.5" size={15} />
              Start New Request
            </Link>
          </Button>
        }
        description="Review itemised pricing prepared by our technicians. Each quotation stays linked to its original service request."
        eyebrow="Quotations"
        title="Service Quotations"
      />

      {isLoading ? (
        <PortalLoading label="Loading quotations..." />
      ) : isError ? (
        <EmptyState
          action={{ label: "Try Again", onClick: () => void refetch() }}
          className="py-12"
          description="We couldn't load your quotations just now. Please try again in a moment."
          icon={FileText}
          title="Quotations unavailable"
          tone="card"
        />
      ) : quotations.length === 0 ? (
        <EmptyState
          action={{ label: "Request a Service", href: "/services" }}
          className="py-12"
          description="Once our team reviews your service request, itemised quotations appear here for your approval."
          icon={FileText}
          title="No quotations yet"
          tone="card"
        />
      ) : (
        <PortalList>
          {quotations.map((quote) => {
            const statusSlug = String(quote.status ?? "")
              .toLowerCase()
              .replace(/_/g, "-");
            const needsDecision = AWAITING_DECISION.includes(statusSlug);

            return (
              <PortalCard key={quote.id}>
                <PortalCardTop
                  badges={
                    <>
                      <StatusBadge status={quote.status} />
                      <PortalRef>{quote.reference}</PortalRef>
                      {needsDecision ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100/80 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                          <ShieldCheck className="text-amber-700" size={12} />
                          Awaiting your decision
                        </span>
                      ) : null}
                    </>
                  }
                  meta={
                    quote.issuedAt ? (
                      <>
                        Issued:{" "}
                        <span className="font-medium text-slate-700">
                          {formatLongDate(quote.issuedAt)}
                        </span>
                      </>
                    ) : null
                  }
                />

                <PortalCardTitle
                  href={`/user/quotations/${quote.requestId}`}
                  subtitle={quote.notes || undefined}
                >
                  {quote.title}
                </PortalCardTitle>

                <PortalCardFooter
                  actions={
                    <>
                      <PortalDetailAction
                        href={`/user/services/${quote.requestId}`}
                        label="View Request"
                      />
                      <PortalCardAction
                        href={`/user/quotations/${quote.requestId}`}
                        icon={FileText}
                        label="Review Quotation"
                        tone={needsDecision ? "accent" : "brand"}
                      />
                    </>
                  }
                  facts={
                    <>
                      <PortalFact
                        emphasis
                        icon={Wallet}
                        label="Quote Total"
                        tone="warning"
                        value={formatCurrencyUsd(quote.totalUsd)}
                      />
                      <PortalFact
                        icon={CalendarClock}
                        label="Price Guaranteed Through"
                        placeholder="No expiry set"
                        value={
                          quote.expiresAt
                            ? formatLongDate(quote.expiresAt)
                            : undefined
                        }
                      />
                    </>
                  }
                />
              </PortalCard>
            );
          })}
        </PortalList>
      )}
    </div>
  );
}
