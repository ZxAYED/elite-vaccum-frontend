export type UserRole = "customer" | "technician" | "admin";

export type CustomerStatus = "active" | "inactive" | "lead";
export type ProductCategoryStatus = "ACTIVE" | "INACTIVE";
export type ProductStatus = "active" | "draft" | "archived";
export type ProductAvailability = "in-stock" | "special-order";
export type ServiceStatus = "active" | "inactive";
export type ServiceCatalogStatus = "ACTIVE" | "INACTIVE";
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
export type QuoteStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "rejected"
  | "expired";
export type AppointmentStatus =
  | "requested"
  | "confirmed"
  | "rescheduled"
  | "in-progress"
  | "completed"
  | "cancelled";
export type TechnicianStatus = "available" | "on-job" | "offline";
export type AdminTechnicianStatus = "ACTIVE" | "INACTIVE";
export type TechnicianAvailability = "AVAILABLE" | "BUSY" | "OFF_DUTY";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "scheduled"
  | "in-progress"
  | "completed"
  | "cancelled";
export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "refunded"
  | "failed";
export type NotificationType = "service-update" | "payment" | "account" | "system";
export type OrderType = "PRODUCT" | "SERVICE";
export type CustomerPropertyType =
  | "primary-residence"
  | "vacation-home"
  | "townhouse"
  | "apartment"
  | "commercial"
  | "other";
export type CustomerFeatureType = "VacPan" | "Spot Vacuum" | "Wally Flex";
export type ProductOrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type ServiceOrderStatus =
  | "scheduled"
  | "rescheduled"
  | "technician-assigned"
  | "on-the-way"
  | "arrived"
  | "in-progress"
  | "report-submitted"
  | "completed"
  | "cancelled";
export type UnifiedOrderStatus = ProductOrderStatus | ServiceOrderStatus;

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
  cellphone?: string;
  company?: string;
  status: CustomerStatus;
  joinedAt: string;
  totalOrders: number;
  lifetimeValueUsd: number;
  addresses: Address[];
  primaryAddressId?: string;
  preferredContactMethod?: "phone" | "email" | "text";
  bestContactTime?: string;
  customerPreferences?: string;
  internalNotes?: CustomerInternalNote[];
  properties?: CustomerProperty[];
}

export interface CustomerVacuumUnit {
  id: string;
  unitNumber: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  location: string;
  notes?: string;
  status: "active" | "archived";
}

export interface CustomerInletFloor {
  id: string;
  label: string;
  hdh: number;
  chameleon: number;
  chameleonElite: number;
  standard: number;
  notes?: string;
}

export interface CustomerFeature {
  id: string;
  type: CustomerFeatureType;
  quantity: number;
  locations: string[];
  notes?: string;
}

export interface CustomerInternalNote {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  createdBy: string;
}

export interface CustomerProperty {
  id: string;
  label: string;
  address: Address;
  propertyType: CustomerPropertyType;
  floors: number;
  hasBasement?: boolean;
  hasSubBasement?: boolean;
  accessInformation?: string;
  internalNotes?: string;
  status: "active" | "archived";
  vacuumUnits: CustomerVacuumUnit[];
  inletFloors: CustomerInletFloor[];
  additionalFeatures: CustomerFeature[];
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: ServiceCatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  categoryId: string;
  slug: string;
  name: string;
  sku?: string;
  model?: string;
  eyebrow?: string;
  summary: string;
  description: string;
  priceUsd: number;
  status: ProductStatus;
  availability?: ProductAvailability;
  taxable?: boolean;
  shippingLabel?: string;
  images?: string[];
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
  description?: string;
  iconKey: PublicServiceIconKey;
  image?: string;
  status: ProductCategoryStatus;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
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

export interface ScheduleRescheduleEntry {
  id: string;
  previousSchedule: ServiceScheduleWindow;
  nextSchedule: ServiceScheduleWindow;
  reason: string;
  note?: string;
  changedAt: string;
  actorLabel: string;
}

export interface ScheduleCancellationEntry {
  id: string;
  reason: string;
  note?: string;
  cancelledAt: string;
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

export interface FlexibleQuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceUsd: number;
  note?: string;
}

export interface QuotationRevisionEntry {
  id: string;
  version: number;
  status: QuoteStatus;
  subtotalUsd: number;
  discountUsd: number;
  taxUsd: number;
  totalUsd: number;
  createdAt: string;
  reason?: string;
}

export interface QuotationRejectionEntry {
  id: string;
  reason: string;
  comments?: string;
  rejectedAt: string;
  actorLabel: string;
}

export interface AdminQuotation extends Quote {
  customerId: string;
  serviceId: string;
  version: number;
  lineItems: FlexibleQuotationLineItem[];
  taxUsd: number;
  discountUsd: number;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  serviceOrderId?: string;
  revisionHistory: QuotationRevisionEntry[];
  rejectionHistory?: QuotationRejectionEntry[];
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

export interface AdminTechnician {
  id: string;
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  status: AdminTechnicianStatus;
  availability: TechnicianAvailability;
  rating: number;
  completedJobs: number;
  verified: boolean;
  specializations: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
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

export interface OrderTimelineStep {
  key: string;
  label: string;
  detail: string;
  complete: boolean;
  active?: boolean;
  dateLabel?: string;
}

export interface ProductOrderLineItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  summary: string;
  quantity: number;
  unitPriceUsd: number;
  imageSrc: string;
}

export interface ProductShipment {
  address: Address;
  carrier: string;
  trackingNumber?: string;
  shippingStatus: ProductOrderStatus;
  estimatedDelivery?: string;
  timeline: OrderTimelineStep[];
}

export interface UnifiedOrderTotal {
  subtotalUsd: number;
  shippingUsd?: number;
  taxUsd: number;
  discountUsd?: number;
  totalUsd: number;
}

export interface UnifiedOrderBase {
  id: string;
  type: OrderType;
  customerId: string;
  status: UnifiedOrderStatus;
  total: UnifiedOrderTotal;
  createdAt: string;
  invoiceId?: string;
  paymentId?: string;
  paymentStatus?: PaymentStatus;
  cancellation?: {
    cancelledAt: string;
    reason: string;
    note?: string;
  };
}

export interface AdminProductOrder extends UnifiedOrderBase {
  type: "PRODUCT";
  status: ProductOrderStatus;
  items: ProductOrderLineItem[];
  shippingAddress: Address;
  tracking?: {
    carrier: string;
    trackingNumber?: string;
    shippingStatus: ProductOrderStatus;
    estimatedDelivery?: string;
  };
  shippingTimeline: OrderTimelineStep[];
}

export interface AdminServiceOrder extends UnifiedOrderBase {
  type: "SERVICE";
  status: ServiceOrderStatus;
  serviceRequestId: string;
  quotationId: string;
  serviceId: string;
  serviceName: string;
  problemSummary: string;
  requestedSchedule: ServiceScheduleWindow;
  currentSchedule: ServiceScheduleWindow;
  technicianId?: string;
  serviceLocation: Address;
  problemLocation?: string;
  equipment?: ServiceRequestEquipment;
  attachments: ServiceRequestAttachment[];
  customerNotes?: string;
  technicianInstruction?: string;
  scheduleId?: string;
  scheduleAdminNote?: string;
  rescheduleHistory?: ScheduleRescheduleEntry[];
  scheduleCancellation?: ScheduleCancellationEntry;
  acceptedQuoteSnapshot: {
    quotationTotalUsd: number;
    lineItems: FlexibleQuotationLineItem[];
    acceptedAt?: string;
  };
  timeline: OrderTimelineStep[];
}

export interface AdminScheduleRecord {
  id: string;
  serviceOrderId: string;
  serviceRequestId: string;
  customerId: string;
  serviceId: string;
  serviceName: string;
  customerName: string;
  address: Address;
  requestedSchedule: ServiceScheduleWindow;
  currentSchedule: ServiceScheduleWindow;
  startAt: string;
  endAt: string;
  timeWindowLabel: string;
  technicianId?: string;
  status: ServiceOrderStatus;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
  deletionEligible?: boolean;
  rescheduleHistory: ScheduleRescheduleEntry[];
  cancellation?: ScheduleCancellationEntry;
}

export type AdminUnifiedOrder = AdminProductOrder | AdminServiceOrder;
