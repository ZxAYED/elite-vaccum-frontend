import type {
  Order,
  OrderItem,
  ServiceRequestAttachment,
} from "@/types/domain";

export const mockOrderItems: OrderItem[] = [
  {
    id: "item-1001",
    orderId: "ORD-1284",
    description: "Motor Repair Labor",
    quantity: 1,
    unitPriceUsd: 140,
  },
  {
    id: "item-1002",
    orderId: "ORD-1283",
    description: "Annual Maintenance Visit",
    quantity: 1,
    unitPriceUsd: 149,
  },
  {
    id: "item-1003",
    orderId: "ORD-1282",
    description: "Central Vacuum Installation Deposit",
    quantity: 1,
    unitPriceUsd: 420,
  },
  {
    id: "item-1004",
    orderId: "ORD-1281",
    description: "Inlet Diagnostics",
    quantity: 1,
    unitPriceUsd: 129,
  },
  {
    id: "item-1005",
    orderId: "ORD-1280",
    description: "Accessory Fit Service",
    quantity: 1,
    unitPriceUsd: 95,
  },
  {
    id: "item-1006",
    orderId: "ORD-1279",
    description: "Replacement Accessory Kit",
    quantity: 1,
    unitPriceUsd: 72,
  },
];

export const mockOrders: Order[] = [
  {
    id: "ORD-1284",
    customerId: "cust-1001",
    serviceRequestId: "REQ-1001",
    technicianId: "tech-001",
    status: "scheduled",
    scheduledAt: "2026-08-10T10:00:00.000Z",
    totalUsd: 140,
    summary: "Motor Repair",
    lineItems: mockOrderItems.filter((item) => item.orderId === "ORD-1284"),
  },
  {
    id: "ORD-1283",
    customerId: "cust-1002",
    serviceRequestId: "REQ-1002",
    technicianId: "tech-002",
    status: "scheduled",
    scheduledAt: "2026-08-14T11:00:00.000Z",
    totalUsd: 149,
    summary: "Annual Maintenance Visit",
    lineItems: mockOrderItems.filter((item) => item.orderId === "ORD-1283"),
  },
  {
    id: "ORD-1282",
    customerId: "cust-1003",
    serviceRequestId: "REQ-1003",
    technicianId: "tech-003",
    status: "confirmed",
    scheduledAt: "2026-08-22T09:00:00.000Z",
    totalUsd: 420,
    summary: "Central Vacuum Installation",
    lineItems: mockOrderItems.filter((item) => item.orderId === "ORD-1282"),
  },
  {
    id: "ORD-1281",
    customerId: "cust-1004",
    serviceRequestId: "REQ-1004",
    technicianId: "tech-003",
    status: "confirmed",
    scheduledAt: "2026-08-18T14:00:00.000Z",
    totalUsd: 129,
    summary: "Inlet Diagnostics",
    lineItems: mockOrderItems.filter((item) => item.orderId === "ORD-1281"),
  },
  {
    id: "ORD-1280",
    customerId: "cust-1005",
    serviceRequestId: "REQ-1005",
    technicianId: "tech-004",
    status: "pending",
    scheduledAt: "2026-08-26T16:30:00.000Z",
    totalUsd: 95,
    summary: "Accessory Fit Service",
    lineItems: mockOrderItems.filter((item) => item.orderId === "ORD-1280"),
  },
  {
    id: "ORD-1279",
    customerId: "cust-1001",
    technicianId: "tech-001",
    status: "completed",
    scheduledAt: "2026-07-12T09:30:00.000Z",
    totalUsd: 72,
    summary: "Replacement Accessory Kit",
    lineItems: mockOrderItems.filter((item) => item.orderId === "ORD-1279"),
  },
];

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

export const mockOrderDetailsById: Record<string, MockOrderDetails> = {
  "ORD-1284": {
    serviceAddress: "123 Heritage Lane, Greenwich, CT 06830",
    manufacturerName: "VacuMaid",
    modelNumber: "SR-46",
    serialNumber: "VM-4631-AC",
    systemType: "Existing central vacuum system",
    inletCount: 3,
    attachments: [
      {
        id: "att-order-1",
        fileName: "power-unit-panel.jpg",
        fileType: "image/jpeg",
        sizeBytes: 242000,
        uploadedAt: "2026-08-06T13:20:00.000Z",
        kind: "photo",
      },
      {
        id: "att-order-2",
        fileName: "garage-unit.jpg",
        fileType: "image/jpeg",
        sizeBytes: 210000,
        uploadedAt: "2026-08-06T13:22:00.000Z",
        kind: "photo",
      },
    ],
    additionalNotes:
      "Customer reports the unit overheats after longer cleaning sessions. Priority is restoring full suction before the weekend.",
  },
};
