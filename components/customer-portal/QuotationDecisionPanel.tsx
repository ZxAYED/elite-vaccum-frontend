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
import type { QuoteStatus, RejectionHistoryEntry } from "@/types/domain";

interface QuotationDecisionPanelProps {
  quotationId: string;
  requestId: string;
  initialStatus: QuoteStatus;
  currentScheduleLabel: string;
  initialRejectionHistory?: RejectionHistoryEntry[];
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
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>(initialStatus);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [history, setHistory] = useState(initialRejectionHistory);

  function rejectQuotation() {
    if (!reason) return;
    const quotation = rejectSharedQuotation(quotationId, reason, comments);
    setHistory(quotation?.rejectionHistory ?? history);
    setQuoteStatus(quotation?.status ?? "rejected");
    setRejectOpen(false);
  }

  function acceptQuotation() {
    const request = getSharedServiceRequestById(requestId);
    if (!request) return;
    const order = createOrSyncSharedServiceOrderFromRequest(request);
    if (!order) return;
    acceptSharedQuotation(quotationId, order.id);
    setQuoteStatus("accepted");
  }

  return (
    <div className="rounded-[1.25rem] bg-teal-50 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
        Quotation Decision
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Accepting keeps the current schedule connected to this request. Admin
        reschedules are displayed in the request timeline.
      </p>

      {quoteStatus === "accepted" ? (
        <div className="mt-5 rounded-[1rem] bg-white p-4 text-sm text-primary">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 size={18} />
            Quotation Accepted
          </div>
          <p className="mt-2 text-slate-600">
            Current schedule: {currentScheduleLabel}
          </p>
          {serviceOrderHref ? (
            <Link
              className="mt-3 inline-flex font-semibold text-primary underline-offset-4 hover:underline"
              href={serviceOrderHref}
            >
              View Service Order
            </Link>
          ) : null}
        </div>
      ) : null}

      {quoteStatus === "declined" ? (
        <div className="mt-5 rounded-[1rem] bg-white p-4 text-sm text-red-700">
          <div className="flex items-center gap-2 font-semibold">
            <XCircle size={18} />
            Quotation Rejected
          </div>
          {history.length ? (
            <p className="mt-2 text-slate-600">
              Latest reason: {history[history.length - 1]?.reason}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          disabled={quoteStatus === "accepted"}
          onClick={acceptQuotation}
        >
          Accept Quotation
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={quoteStatus === "declined"}
          onClick={() => setRejectOpen(true)}
        >
          Reject Quotation
        </Button>
      </div>

      {history.length ? (
        <div className="mt-5 space-y-2">
          <p className="text-sm font-semibold text-slate-900">
            Quotation rejection history
          </p>
          {history.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl bg-white px-4 py-3 text-sm text-slate-600"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject quotation</DialogTitle>
            <DialogDescription>
              Select a reason so the team understands what should happen next.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 space-y-4">
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a reason..." />
              </SelectTrigger>
              <SelectContent>
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
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={!reason} onClick={rejectQuotation}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
