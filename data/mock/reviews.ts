import type { CustomerReview } from "@/types/domain";

import { mockCurrentCustomer } from "@/data/mock/user";

export const mockCustomerReviews: CustomerReview[] = [
  {
    id: "review-service-1007",
    type: "SERVICE",
    customerId: mockCurrentCustomer.id,
    customerName: mockCurrentCustomer.displayName,
    status: "PUBLISHED",
    title: "Accessory fit service review",
    relatedOrderId: "SO-1007",
    relatedEntityId: "REQ-1007",
    relatedName: "Accessory Fit Service",
    rating: 5,
    submittedAt: "2026-07-13T09:00:00.000Z",
    publishedAt: "2026-07-13T10:30:00.000Z",
    preview:
      "Quick diagnosis, clean install, and everything now seals better than the original setup.",
    body:
      "Quick diagnosis, clean install, and everything now seals better than the original setup.",
    moderationHistory: [
      {
        id: "review-history-1007-created",
        action: "created",
        actorLabel: "Customer",
        createdAt: "2026-07-13T09:00:00.000Z",
      },
      {
        id: "review-history-1007-published",
        action: "published",
        actorLabel: "Admin",
        createdAt: "2026-07-13T10:30:00.000Z",
        note: "Published after moderation review.",
      },
    ],
  },
  {
    id: "review-product-1001",
    type: "PRODUCT",
    customerId: mockCurrentCustomer.id,
    customerName: mockCurrentCustomer.displayName,
    status: "PENDING",
    title: "Deluxe Hand Tool review",
    relatedOrderId: "ORD-90422",
    relatedEntityId: "prd-hand-tool",
    relatedName: "Deluxe Hand Tool",
    rating: 4,
    submittedAt: "2026-08-08T14:22:00.000Z",
    preview: "Compact, useful, and easy to store after each cleanup.",
    body:
      "Compact, useful, and easy to store after each cleanup. I would like slightly more flexibility in the handle, but overall it works well.",
    moderationHistory: [
      {
        id: "review-history-1001-created",
        action: "created",
        actorLabel: "Customer",
        createdAt: "2026-08-08T14:22:00.000Z",
      },
    ],
  },
];
