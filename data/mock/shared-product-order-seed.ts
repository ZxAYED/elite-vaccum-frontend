import type { PaymentStatus } from "@/types/domain";

export interface SharedProductOrderSeedItem {
  id: string;
  productId: string;
  quantity: number;
  unitPriceUsd: number;
}

export interface SharedProductOrderSeed {
  id: string;
  createdAt: string;
  paymentStatus: PaymentStatus;
  items: SharedProductOrderSeedItem[];
}

export const sharedProductOrderSeed: SharedProductOrderSeed[] = [
  {
    id: "SHOP-1001",
    createdAt: "2026-07-30T14:10:00.000Z",
    paymentStatus: "paid",
    items: [
      { id: "shop-item-1001", productId: "prd-hand-tool", quantity: 1, unitPriceUsd: 48 },
      { id: "shop-item-1002", productId: "prd-bag", quantity: 2, unitPriceUsd: 24 },
    ],
  },
  {
    id: "SHOP-1002",
    createdAt: "2026-08-05T10:30:00.000Z",
    paymentStatus: "pending",
    items: [
      { id: "shop-item-1003", productId: "prd-brush-head", quantity: 1, unitPriceUsd: 64 },
      { id: "shop-item-1004", productId: "prd-adapter", quantity: 1, unitPriceUsd: 18 },
      { id: "shop-item-1005", productId: "prd-roller", quantity: 1, unitPriceUsd: 85 },
    ],
  },
];
