import type {
  Order,
  OrderItem,
  ServiceRequestAttachment,
} from "@/types/domain";

export const mockOrderItems: OrderItem[] = [];

export const mockOrders: Order[] = [];

export interface MockOrderDetails {
  serviceAddress: string;
  manufacturerName: string;
  modelNumber: string;
  serialNumber: string;
  systemType: string;
  inletCount: number;
  attachments: ServiceRequestAttachment[];
  additionalNotes: string;
}

export const mockOrderDetailsById: Record<string, MockOrderDetails> = {};
