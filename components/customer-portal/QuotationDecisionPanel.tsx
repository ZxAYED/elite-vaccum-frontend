"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { createOrSyncSharedServiceOrderFromRequest } from "@/data/mock/admin-schedule-state";
import {
  acceptSharedQuotation,
  getSharedServiceRequestById,
  rejectSharedQuotation,
} from "@/data/mock/shared-business-store";
import { useSharedBusinessStoreVersion } from "@/hooks/useSharedBusinessStoreVersion";
import {
  useAcceptQuotationMutation,
  useRejectQuotationMutation,
} from "@/redux/api/quotationsApi";
import { toast } from "sonner";
import type { QuoteStatus, QuotationRejectionEntry } from "@/types/domain";

interface QuotationDecisionPanelProps {
  quotationId: string;
  requestId: string;
  initialStatus: QuoteStatus;
  currentScheduleLabel: string;
  initialRejectionHistory?: QuotationRejectionEntry[];
  serviceOrderHref?: string;
}

const rejectionReasons = [
  "Price",
  "No longer need service",
  "Need clarification",
  "Other",
];

export function QuotationDecisionPanel({
  quotationId,
  requestId,
  initialStatus,
  currentScheduleLabel,
  initialRejectionHistory = [],
  serviceOrderHref,
}: QuotationDecisionPanelProps) {
  useSharedBusinessStoreVersion();
  const [acceptQuotationMutation, { isLoading: isAccepting }] =
    useAcceptQuotationMutation();
  const [rejectQuotationMutation, { isLoading: isRejecting }] =
    useRejectQuotationMutation();

  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>(initialStatus);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [history, setHistory] = useState(initialRejectionHistory);
  const latestHistoryEntry = history[0];
  const normStatus = (quoteStatus || "").toLowerCase().replace(/_/g, "-");
  const canDecide =
    normStatus === "sent" ||
    normStatus === "viewed" ||
    normStatus === "quoted" ||
    normStatus === "under-review" ||
    normStatus === "draft";

  async function rejectQuotation() {
    if (!reason) return;
    const toastId = toast.loading("Declining quotation, please wait...");
    try {
      const res = await rejectQuotationMutation({
        id: quotationId,
        reason: comments ? `${reason}: ${comments}` : reason,
      }).unwrap();
      try {
        const quotation = rejectSharedQuotation(quotationId, reason, comments);
        if (quotation) {
          setHistory(quotation.rejectionHistory ?? history);
          setQuoteStatus(quotation.status);
        } else {
          setQuoteStatus("rejected");
        }
      } catch (localErr) {
        console.warn("Local mock reject sync skipped:", localErr);
        setQuoteStatus("rejected");
      }
      setRejectOpen(false);
      toast.success(
        (res as unknown as { message?: string })?.message || "Quotation rejected.",
        { id: toastId, description: "Your decision has been sent to our team." },
      );
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg = errObj?.data?.message || errObj?.message || "Failed to reject quotation.";
      toast.error(msg, { id: toastId, duration: 8000 });
    }
  }

  async function acceptQuotation() {
    const toastId = toast.loading("Processing acceptance, please wait...");
    try {
      const res = await acceptQuotationMutation({
        id: quotationId,
      }).unwrap();

      // Flexible extraction across response formats
      const resAny = (res && typeof res === "object") ? (res as unknown as Record<string, unknown>) : {};
      const dataAny = (resAny.data && typeof resAny.data === "object") ? (resAny.data as Record<string, unknown>) : {};

      const checkoutUrl =
        res?.checkoutUrl ||
        resAny.checkoutUrl ||
        resAny.checkout_url ||
        resAny.checkoutURL ||
        resAny.url ||
        resAny.sessionUrl ||
        resAny.session_url ||
        resAny.stripeUrl ||
        resAny.stripe_url ||
        dataAny.checkoutUrl ||
        dataAny.checkout_url ||
        dataAny.checkoutURL ||
        dataAny.url ||
        dataAny.sessionUrl ||
        dataAny.stripeUrl;

      // If backend initiated Stripe checkout, redirect customer immediately
      if (checkoutUrl && typeof checkoutUrl === "string") {
        setIsRedirecting(true);
        toast.loading("Redirecting to secure payment checkout...", { id: toastId });
        window.location.href = checkoutUrl;
        return;
      }

      try {
        const acceptedQuotation = acceptSharedQuotation(quotationId);
        const request = getSharedServiceRequestById(requestId);
        if (request) {
          createOrSyncSharedServiceOrderFromRequest(request);
        }
        setQuoteStatus(acceptedQuotation?.status ?? "accepted");
      } catch (localSyncErr) {
        console.warn("Local mock store sync skipped on accept:", localSyncErr);
        setQuoteStatus("accepted");
      }

      toast.success(res.message || "Quotation accepted!", {
        id: toastId,
        description: "A service order has been generated for your appointment.",
      });
    } catch (err: unknown) {
      const errObj = err as { data?: { message?: string }; message?: string };
      const msg = errObj?.data?.message || errObj?.message || "Failed to accept quotation.";
      toast.error(msg, { id: toastId, duration: 8000 });
    }
  }

  if (normStatus === "awaiting-payment" || normStatus === "awaiting_payment") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Clock size={18} />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-amber-950">
              Awaiting Payment Confirmation
            </h4>
            <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-600">
              Your quotation is locked while payment is processing. Once checkout completes, dispatch will be confirmed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (normStatus === "accepted") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-emerald-950">
                Quotation Accepted
              </h4>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-600">
                Confirmed schedule: <span className="font-semibold text-primary">{currentScheduleLabel}</span>
              </p>
            </div>
          </div>
          {serviceOrderHref ? (
            <Button asChild size="sm" className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs sm:text-sm shrink-0">
              <Link href={serviceOrderHref}>
                View Service Order &rarr;
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  if (normStatus === "rejected") {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
            <XCircle size={18} />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold text-rose-950">
              Quotation Declined
            </h4>
            {latestHistoryEntry ? (
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-600">
                Reason: <span className="font-semibold text-primary">{latestHistoryEntry.reason}</span>
                {latestHistoryEntry.comments ? ` — ${latestHistoryEntry.comments}` : ""}
              </p>
            ) : (
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-slate-600">
                This quotation was declined. Contact our team if you would like a revised estimate.
              </p>
            )}
          </div>
        </div>

        {history.length > 1 ? (
          <div className="pt-2 border-t border-rose-100 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Previous Rejection History
            </p>
            {history.slice(1).map((entry) => (
              <div
                key={entry.id}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600"
              >
                <span className="font-semibold text-primary">{entry.reason}</span>
                {entry.comments ? ` - ${entry.comments}` : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  if (!canDecide) {
    return null;
  }

  return (
    <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-primary">
            Quotation Approval
          </h3>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-600 font-medium">
            Review the breakdown above to confirm your service dispatch slot.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isAccepting || isRedirecting || isRejecting}
            onClick={() => setRejectOpen(true)}
            className="rounded-lg border-rose-200 text-rose-700 hover:bg-rose-50 font-medium text-xs sm:text-sm h-9 px-3.5"
          >
            Decline
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isAccepting || isRedirecting || isRejecting}
            onClick={acceptQuotation}
            className="rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs sm:text-sm h-9 px-4 shadow-xs"
          >
            {isAccepting || isRedirecting ? (
              <>
                <Loader2 className="mr-1.5 size-4 animate-spin" />
                {isRedirecting ? "Redirecting to Checkout..." : "Processing..."}
              </>
            ) : (
              "Accept & Confirm"
            )}
          </Button>
        </div>
      </div>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-primary">Decline Quotation</DialogTitle>
            <DialogDescription>
              Select a reason so our technical team can prepare an updated estimate or assist you.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 space-y-3">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="rounded-md">
                <SelectValue placeholder="Choose a reason..." />
              </SelectTrigger>
              <SelectContent className="rounded-md">
                {rejectionReasons.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={comments}
              onChange={(event) => setComments(event.target.value)}
              placeholder="Optional comments..."
              className="rounded-md"
            />
          </div>
          <DialogFooter className="mt-4 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-md"
              disabled={!reason}
              onClick={rejectQuotation}
            >
              Confirm Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
