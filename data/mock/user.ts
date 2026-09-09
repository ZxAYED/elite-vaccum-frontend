import { Monitor, ShieldCheck, Smartphone } from "lucide-react";

import type { Customer, User } from "@/types/domain";

export interface SavedProperty {
  id: string;
  name: string;
  address: string;
  type: "PRIMARY" | "VACATION";
  status: "ACTIVE";
  avgResponse: string;
}

export interface AuthorizedDevice {
  name: string;
  location: string;
  lastActiveLabel: string;
  isCurrent: boolean;
  icon: typeof Monitor;
}

export const mockCurrentUser: User = {
  id: "user-customer-001",
  role: "customer",
  firstName: "Avery",
  lastName: "Stone",
  email: "avery.stone@example.com",
  phone: "+1 (203) 555-0148",
  createdAt: "2025-03-15T10:00:00.000Z",
  customerId: "cust-1001",
};

const fallbackCustomer: Customer = {
  id: "cust-1001",
  displayName: "Customer Account",
  firstName: "Customer",
  lastName: "Account",
  email: "customer@example.com",
  phone: "+1 (203) 555-0148",
  status: "active",
  joinedAt: "2025-03-15T10:00:00.000Z",
  totalOrders: 0,
  lifetimeValueUsd: 0,
  addresses: [],
};

export const mockCurrentCustomer: Customer = fallbackCustomer;

export const mockSavedProperties: SavedProperty[] = [
  {
    id: "prop-1001",
    name: "Summer Home",
    address: "45 Beach Way, Southampton, NY 11968",
    type: "VACATION",
    status: "ACTIVE",
    avgResponse: "under 1 hour",
  },
  {
    id: "prop-1002",
    name: "Primary Residence",
    address: "123 Heritage Lane, Greenwich, CT 06830",
    type: "PRIMARY",
    status: "ACTIVE",
    avgResponse: "under 1 hour",
  },
];

export const mockAuthorizedDevices: AuthorizedDevice[] = [
  {
    name: "MacBook Pro",
    location: "Greenwich, CT",
    lastActiveLabel: "Current session",
    isCurrent: true,
    icon: Monitor,
  },
  {
    name: "iPhone 15 Pro",
    location: "New York, NY",
    lastActiveLabel: "Active 2h ago",
    isCurrent: false,
    icon: Smartphone,
  },
];

export const mockAccountBadges = {
  verified: ShieldCheck,
};
