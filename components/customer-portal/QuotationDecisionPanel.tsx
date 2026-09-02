"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

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
  const [acceptQuotationMutation] = useAcceptQuotationMutation();
  const [rejectQuotationMutation] = useRejectQuotationMutation();

  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>(initialStatus);
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
    const quotation = rejectSharedQuotation(quotationId, reason, comments);
    setHistory(quotation?.rejectionHistory ?? history);
    setQuoteStatus(quotation?.status ?? "rejected");
    setRejectOpen(false);

    try {
      await rejectQuotationMutation({
        id: quotationId,
        reason: comments ? `${reason}: ${comments}` : reason,
      }).unwrap();
      toast.success("Quotation rejected", {
        description: "Your decision has been sent to our team.",
      });
    } catch {
      // Local fallback handled
    }
  }

  async function acceptQuotation() {
    const request = getSharedServiceRequestById(requestId);
    if (!request) return;
    const acceptedQuotation = acceptSharedQuotation(quotationId);
    if (!acceptedQuotation) return;
    const order = createOrSyncSharedServiceOrderFromRequest(request);
    if (!order) return;
    setQuoteStatus(acceptedQuotation.status);

    try {
      const res = await acceptQuotationMutation({
        id: quotationId,
      }).unwrap();
      toast.success(res.message || "Quotation accepted!", {
        description: "A service order has been generated for your appointment.",
      });
    } catch {
      // Local fallback handled
    }
  }

  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-4 sm:p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-teal-800">
        Quotation Decision Panel
      </p>
      <p className="mt-1 text-xs text-slate-600 leading-relaxed font-normal">
        Accepting locks your appointment schedule and generates an active dispatch work order.
      </p>

      {normStatus === "accepted" ? (
        <div className="mt-4 rounded-md border border-emerald-200 bg-white p-3.5 text-xs sm:text-sm text-slate-800 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <CheckCircle2 size={16} />
            Quotation Accepted
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Confirmed schedule: <span className="font-semibold text-slate-900">{currentScheduleLabel}</span>
          </p>
          {serviceOrderHref ? (
            <Link
              className="mt-2.5 inline-flex font-semibold text-teal-800 underline-offset-4 hover:underline text-xs"
              href={serviceOrderHref}
            >
              View Service Order &rarr;
            </Link>
          ) : null}
        </div>
      ) : null}

      {normStatus === "rejected" ? (
        <div className="mt-4 rounded-md border border-rose-200 bg-white p-3.5 text-xs sm:text-sm text-rose-800 shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <XCircle size={16} />
            Quotation Declined
          </div>
          {latestHistoryEntry ? (
            <p className="mt-1 text-xs text-slate-600">
              Reason: {latestHistoryEntry.reason}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <Button
          type="button"
          size="sm"
          disabled={!canDecide}
          onClick={acceptQuotation}
          className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
        >
          Accept Quotation
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canDecide}
          onClick={() => setRejectOpen(true)}
          className="rounded-md border-rose-300 text-rose-700 hover:bg-rose-50 font-medium"
        >
          Decline Quotation
        </Button>
      </div>

      {history.length ? (
        <div className="mt-4 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Quotation rejection history
          </p>
          {history.map((entry) => (
            <div
              key={entry.id}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
            >
              <span className="font-semibold text-slate-900">
                {entry.reason}
              </span>
              {entry.comments ? ` - ${entry.comments}` : null}
            </div>
          ))}
        </div>
      ) : null}

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle>Decline quotation</DialogTitle>
            <DialogDescription>
              Select a reason so our technical diagnostic team can prepare an updated estimate.
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
