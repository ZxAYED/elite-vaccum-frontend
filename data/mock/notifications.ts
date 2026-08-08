import type { Notification } from "@/types/domain";

export const mockNotifications: Notification[] = [
  {
    id: "notif-1001",
    userId: "user-customer-001",
    type: "service-update",
    title: "Quote Ready For Review",
    message:
      "Your motor repair quote is ready. Review pricing and choose a preferred appointment window.",
    createdAt: "2026-08-07T08:10:00.000Z",
    isRead: false,
    ctaLabel: "Review Quote",
  },
  {
    id: "notif-1002",
    userId: "user-customer-001",
    type: "service-update",
    title: "Technician Assigned",
    message:
      "Naomi Carter is confirmed for your August 14, 2026 maintenance visit.",
    createdAt: "2026-08-06T17:22:00.000Z",
    isRead: false,
    ctaLabel: "View Schedule",
  },
  {
    id: "notif-1003",
    userId: "user-customer-001",
    type: "payment",
    title: "Payment History Updated",
    message: "Invoice PAY-8820 for $72.00 was recorded on July 12, 2026.",
    createdAt: "2026-07-12T13:05:00.000Z",
    isRead: true,
    ctaLabel: "View Receipt",
  },
  {
    id: "notif-1004",
    userId: "user-customer-001",
    type: "system",
    title: "Maintenance Reminder",
    message:
      "Your next preventive maintenance window opens in September 2026. You can book directly from the dashboard.",
    createdAt: "2026-07-28T09:00:00.000Z",
    isRead: true,
    ctaLabel: "Plan Visit",
  },
];
