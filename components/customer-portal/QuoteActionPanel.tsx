"use client";

import { QuotationDecisionPanel } from "@/components/customer-portal/QuotationDecisionPanel";
import type { SuggestedSlot } from "@/data/mock/customer-portal";
import type { QuoteStatus, RejectionHistoryEntry } from "@/types/domain";

interface QuoteActionPanelProps {
  initialStatus: QuoteStatus;
  title: string;
  slots: SuggestedSlot[];
  currentScheduleLabel?: string;
  rejectionHistory?: RejectionHistoryEntry[];
}

export function QuoteActionPanel({
  initialStatus,
  currentScheduleLabel = "Current request schedule",
  rejectionHistory,
}: QuoteActionPanelProps) {
  return (
    <QuotationDecisionPanel
      initialStatus={initialStatus}
      currentScheduleLabel={currentScheduleLabel}
      initialRejectionHistory={rejectionHistory}
    />
  );
}
