export type UserRole = "customer" | "technician" | "admin";

export type CustomerStatus = "active" | "inactive" | "lead";
export type ProductStatus = "active" | "draft" | "archived";
export type ProductAvailability = "in-stock" | "special-order";
export type ServiceStatus = "active" | "inactive";
export type ServiceUrgency = "normal" | "priority" | "urgent";
export type ServiceRequestStatus =
  | "draft"
  | "submitted"
  | "under-review"
  | "accepted"
  | "quoted"
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled"
  | "rejected";
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";
export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "rescheduled"
  | "in-progress"
  | "completed"
  | "cancelled";
export type TechnicianStatus = "available" | "on-job" | "offline";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded" | "failed";
export type NotificationType = "service-update" | "payment" | "account" | "system";

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
  customerId?: string;
  technicianId?: string;
}

export interface Customer {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  joinedAt: string;
  totalOrders: number;
  lifetimeValueUsd: number;
  addresses: Address[];
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  eyebrow?: string;
  summary: string;
  description: string;
  priceUsd: number;
  status: ProductStatus;
  availability?: ProductAvailability;
  popularityRank?: number;
  addedAt?: string;
  imageAlt: string;
  highlights?: string[];
  specifications?: Array<{
    label: string;
    value: string;
  }>;
  shippingNotes?: string[];
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  basePriceUsd: number;
  status: ServiceStatus;
  commonIssues: string[];
}

export type PublicServiceGroup = "Service & Maintenance" | "Installation";

export type PublicServiceIconKey =
  | "home-plus"
  | "wrench"
  | "activity"
  | "shield"
  | "sparkles"
  | "sliders"
  | "upload"
  | "compass";

export interface ServiceOffering {
  slug: string;
  serviceId: string;
  group: PublicServiceGroup;
  title: string;
  summary: string;
  iconKey: PublicServiceIconKey;
}

export interface QuotationLineItem {
  label: string;
  amountUsd: number;
}

export interface ServiceQuotation {
  slug: string;
  serviceType: string;
  identifiedProblem: string;
  imageIds: string[];
  lineItems: QuotationLineItem[];
  taxRate: number;
  technicianNotes: string;
  validityLabel: string;
}

export interface ServiceRequestAttachment {
  id: string;
  fileName: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
  kind: "photo" | "video" | "document";
}

export interface ServiceScheduleWindow {
  date: string;
  time: string;
  label?: string;
}

export interface ServiceRequestEquipment {
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  unitLocation?: string;
}

export interface RejectionHistoryEntry {
  id: string;
  reason: string;
  comments?: string;
  rejectedAt: string;
  actorLabel: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  serviceId: string;
  title: string;
  description: string;
  status: ServiceRequestStatus;
  urgency: ServiceUrgency;
  preferredDate: string;
  preferredTime: string;
  propertyLabel: string;
  serviceAddress: Address;
  estimatedAmountUsd?: number;
  assignedTechnicianId?: string;
  attachments: ServiceRequestAttachment[];
  submittedAt: string;
  requestedSchedule?: ServiceScheduleWindow;
  currentSchedule?: ServiceScheduleWindow;
  equipment?: ServiceRequestEquipment;
  problemLocation?: string;
  additionalNotes?: string;
  rejectionHistory?: RejectionHistoryEntry[];
}

export interface Quote {
  id: string;
  serviceRequestId: string;
  status: QuoteStatus;
  subtotalUsd: number;
  totalUsd: number;
  issuedAt: string;
  expiresAt: string;
  notes?: string;
}

export interface Appointment {
  id: string;
  serviceRequestId: string;
  status: AppointmentStatus;
  startAt: string;
  endAt: string;
  address: Address;
  technicianId?: string;
}

export interface Technician {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  status: TechnicianStatus;
  rating: number;
  completedJobs: number;
  verified: boolean;
  specializations: string[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  productId?: string;
}

export interface Order {
  id: string;
  customerId: string;
  serviceRequestId?: string;
  appointmentId?: string;
  technicianId?: string;
  status: OrderStatus;
  scheduledAt: string;
  totalUsd: number;
  summary: string;
  lineItems: OrderItem[];
}

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  amountUsd: number;
  status: PaymentStatus;
  methodLabel: string;
  processedAt: string;
  technicianPayoutUsd?: number;
  platformFeeUsd?: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  ctaLabel?: string;
}
