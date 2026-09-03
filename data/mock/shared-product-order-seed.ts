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

export const sharedProductOrderSeed: SharedProductOrderSeed[] = [];
