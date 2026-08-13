import type {
  AdminQuotation,
  CustomerReview,
  Customer,
  CustomerFeature,
  CustomerInletFloor,
  CustomerInternalNote,
  CustomerProperty,
  CustomerVacuumUnit,
  FlexibleQuotationLineItem,
  Product,
  ProductCategory,
  ProductStatus,
  PublicServiceGroup,
  QuoteStatus,
  RejectionHistoryEntry,
  ReviewModerationHistoryEntry,
  ReviewStatus,
  Service,
  ServiceOffering,
  ServiceRequest,
  ServiceRequestAttachment,
  ServiceRequestStatus,
  ServiceScheduleWindow,
} from "@/types/domain";

import { mockCustomers } from "@/data/mock/customers";
import { calculateQuotationTotals, mockAdminQuotations } from "@/data/mock/quotations";
import { mockProductCategories, mockProducts } from "@/data/mock/products";
import { publicServiceOfferings } from "@/data/mock/public-services";
import { mockCustomerReviews } from "@/data/mock/reviews";
import { mockServiceRequests } from "@/data/mock/service-requests";
import { mockServices } from "@/data/mock/services";
import { sharedProductOrderSeed } from "@/data/mock/shared-product-order-seed";

type SharedState = {
  customers: Customer[];
  categories: ProductCategory[];
  products: Product[];
  publicServices: ServiceOffering[];
  services: Service[];
  serviceRequests: ServiceRequest[];
  quotations: AdminQuotation[];
  reviews: CustomerReview[];
};

type ServiceRequestInput = {
  serviceSlug: string;
  customerId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  requestedDate: string;
  requestedTime: string;
  problemDescription: string;
  problemLocation: string;
  otherProblemLocation?: string;
  manufacturer?: string;
  modelNumber?: string;
  serialNumber?: string;
  unitLocation?: string;
  additionalNotes?: string;
  media: ServiceRequestAttachment[];
};

type QuotationMutationInput = {
  id?: string;
  requestId: string;
  serviceId: string;
  customerId: string;
  lineItems: FlexibleQuotationLineItem[];
  taxUsd: number;
  discountUsd: number;
  notes?: string;
  terms?: string;
  expiresAt?: string;
  status: QuoteStatus;
  revisionReason?: string;
};

const STORAGE_KEY = "elite-shared-business-store-v1";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function scheduleLabel(date: string, time: string) {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return `${date} at ${time}`;
  return `${parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })} at ${time}`;
}

function toScheduleWindow(date: string, time: string): ServiceScheduleWindow {
  return {
    date,
    time,
    label: scheduleLabel(date, time),
  };
}

function normalizeServiceRequestStatus(status: QuoteStatus): ServiceRequestStatus {
  if (status === "accepted") return "accepted";
  if (status === "rejected") return "quoted";
  if (status === "draft") return "accepted";
  if (status === "sent" || status === "viewed" || status === "expired") return "quoted";
  return "accepted";
}

function isCustomerVisibleQuotationStatus(status: QuoteStatus) {
  return status !== "draft";
}

function isCustomerActionableQuotationStatus(status: QuoteStatus) {
  return status === "sent" || status === "viewed";
}

function createInitialState(): SharedState {
  return {
    customers: clone(mockCustomers),
    categories: clone(mockProductCategories),
    products: clone(mockProducts),
    publicServices: clone(publicServiceOfferings),
    services: clone(mockServices),
    serviceRequests: clone(mockServiceRequests),
    quotations: clone(mockAdminQuotations),
    reviews: clone(mockCustomerReviews),
  };
}

function reconcilePublicServices(services: ServiceOffering[]) {
  const bySlug = new Map(services.map((service) => [service.slug, service]));

  for (const canonicalService of publicServiceOfferings) {
    const existing = bySlug.get(canonicalService.slug);
    if (!existing) {
      bySlug.set(canonicalService.slug, clone(canonicalService));
      continue;
    }

    bySlug.set(canonicalService.slug, {
      ...clone(canonicalService),
      ...existing,
      slug: canonicalService.slug,
      serviceId: canonicalService.serviceId,
      group: canonicalService.group,
      title: canonicalService.title,
      summary: canonicalService.summary,
      description: canonicalService.description,
      iconKey: canonicalService.iconKey,
      sortOrder: canonicalService.sortOrder,
    });
  }

  return Array.from(bySlug.values()).sort(
    (left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0),
  );
}

let state = createInitialState();
let hydrated = false;
const listeners = new Set<() => void>();

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function persist() {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrate() {
  if (hydrated || !canUseStorage()) return;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      state = {
        ...state,
        ...JSON.parse(raw),
      } as SharedState;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }
  state = {
    ...state,
    publicServices: reconcilePublicServices(state.publicServices),
  };
  hydrated = true;
}

function emit() {
  persist();
  listeners.forEach((listener) => listener());
}

function findServiceRecordBySlug(slug: string) {
  const offering = state.publicServices.find((item) => item.slug === slug);
  const service = offering
    ? state.services.find((item) => item.id === offering.serviceId)
    : state.services.find((item) => item.slug === slug);
  return { offering, service };
}

function quoteIdFromRequestId(requestId: string) {
  return `QUO-${requestId.replace("REQ-", "")}`;
}

export function subscribeSharedBusinessStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSharedCategories() {
  hydrate();
  return state.categories;
}

export function getSharedCustomers() {
  hydrate();
  return state.customers;
}

export function getSharedCustomerById(customerId: string) {
  return getSharedCustomers().find((customer) => customer.id === customerId);
}

export function getSharedCustomerPrimaryAddress(customerId: string) {
  const customer = getSharedCustomerById(customerId);
  if (!customer) return undefined;
  return (
    customer.addresses.find((address) => address.id === customer.primaryAddressId) ??
    customer.addresses[0]
  );
}

export function getSharedProducts() {
  hydrate();
  return state.products;
}

export function getSharedPublicServices() {
  hydrate();
  return state.publicServices;
}

export function getSharedActivePublicServices() {
  return getSharedPublicServices()
    .filter((item) => item.status === "ACTIVE")
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0));
}

export function getSharedPublicServiceBySlug(slug: string) {
  return getSharedActivePublicServices().find((item) => item.slug === slug);
}

export function getSharedServiceCatalogBySlug(slug: string) {
  hydrate();
  return state.publicServices.find((item) => item.slug === slug);
}

export function getSharedServices() {
  hydrate();
  return state.services;
}

export function getSharedServiceRequests() {
  hydrate();
  return state.serviceRequests;
}

export function getSharedServiceRequestById(requestId: string) {
  return getSharedServiceRequests().find((item) => item.id === requestId);
}

export function getSharedQuotations() {
  hydrate();
  return state.quotations;
}

export function getSharedReviews() {
  hydrate();
  return state.reviews;
}

export function getSharedReviewById(reviewId: string) {
  return getSharedReviews().find((review) => review.id === reviewId);
}

export function getSharedQuotationById(quotationId: string) {
  return getSharedQuotations().find((item) => item.id === quotationId);
}

export function getSharedQuotationForRequest(requestId: string) {
  return getSharedQuotations().find((item) => item.serviceRequestId === requestId);
}

function appendReviewHistory(
  review: CustomerReview,
  entry: Omit<ReviewModerationHistoryEntry, "id" | "createdAt">,
): CustomerReview {
  return {
    ...review,
    moderationHistory: [
      ...review.moderationHistory,
      {
        ...entry,
        id: `${review.id}-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function updateSharedReviewStatus(
  reviewId: string,
  status: ReviewStatus,
  options?: {
    actorLabel?: string;
    reason?: string;
    note?: string;
  },
) {
  hydrate();
  const actorLabel = options?.actorLabel ?? "Admin";
  state = {
    ...state,
    reviews: state.reviews.map((review) => {
      if (review.id !== reviewId) return review;

      const action =
        status === "PUBLISHED" ? "published" : status === "HIDDEN" ? "hidden" : "created";
      const next = appendReviewHistory(
        {
          ...review,
          status,
          publishedAt: status === "PUBLISHED" ? new Date().toISOString() : review.publishedAt,
          hiddenAt: status === "HIDDEN" ? new Date().toISOString() : undefined,
        },
        {
          action,
          actorLabel,
          reason: options?.reason,
          note: options?.note,
        },
      );

      return next;
    }),
  };
  emit();
  return getSharedReviewById(reviewId);
}

export function deleteSharedReview(
  reviewId: string,
  options?: {
    actorLabel?: string;
    reason?: string;
    note?: string;
  },
) {
  hydrate();
  const review = getSharedReviewById(reviewId);
  if (!review) return false;

  const actorLabel = options?.actorLabel ?? "Admin";
  state = {
    ...state,
    reviews: state.reviews.map((item) =>
      item.id === reviewId
        ? appendReviewHistory(
            {
              ...item,
              status: "HIDDEN",
              hiddenAt: new Date().toISOString(),
            },
            {
              action: "deleted",
              actorLabel,
              reason: options?.reason,
              note: options?.note,
            },
          )
        : item,
    ),
  };
  emit();
  return getSharedReviewById(reviewId);
}

export function createSharedServiceRequest(input: ServiceRequestInput) {
  hydrate();
  const { offering, service } = findServiceRecordBySlug(input.serviceSlug);
  if (!offering || !service) {
    throw new Error(`Unknown service slug: ${input.serviceSlug}`);
  }

  const customer = getSharedCustomerById(input.customerId);
  const requestedSchedule = toScheduleWindow(input.requestedDate, input.requestedTime);
  const nextId = `REQ-${Math.floor(Date.now() / 10)
    .toString()
    .slice(-4)}`;
  const submittedAt = new Date().toISOString();
  const title = offering.title;
  const serviceAddress = {
    id: customer?.addresses[0]?.id ?? `addr-${Date.now().toString(36)}`,
    label: customer?.addresses[0]?.label ?? "Requested Service Address",
    line1: input.address,
    city: input.city,
    state: input.state,
    postalCode: input.zipCode,
    country: customer?.addresses[0]?.country ?? "United States",
  };

  const request: ServiceRequest = {
    id: nextId,
    customerId: input.customerId,
    serviceId: service.id,
    title,
    description: input.problemDescription,
    status: "submitted",
    urgency: "normal",
    preferredDate: input.requestedDate,
    preferredTime: input.requestedTime,
    propertyLabel: serviceAddress.label,
    serviceAddress,
    estimatedAmountUsd: service.basePriceUsd,
    attachments: input.media,
    submittedAt,
    requestedSchedule,
    currentSchedule: requestedSchedule,
    equipment: {
      manufacturer: input.manufacturer,
      modelNumber: input.modelNumber,
      serialNumber: input.serialNumber,
      unitLocation: input.unitLocation,
    },
    problemLocation:
      input.problemLocation === "Other"
        ? input.otherProblemLocation || "Other"
        : input.problemLocation,
    additionalNotes: input.additionalNotes,
  };

  state = {
    ...state,
    serviceRequests: [request, ...state.serviceRequests],
  };
  emit();
  return request;
}

export function updateSharedCustomer(
  customerId: string,
  values: Partial<Customer>,
) {
  hydrate();
  state = {
    ...state,
    customers: state.customers.map((customer) =>
      customer.id === customerId
        ? {
            ...customer,
            ...values,
            displayName:
              values.displayName ??
              `${values.firstName ?? customer.firstName} ${values.lastName ?? customer.lastName}`,
          }
        : customer,
    ),
  };
  emit();
  return getSharedCustomerById(customerId);
}

export function toggleSharedCustomerStatus(customerId: string) {
  const customer = getSharedCustomerById(customerId);
  if (!customer) return null;
  const nextStatus = customer.status === "active" ? "inactive" : "active";
  return updateSharedCustomer(customerId, { status: nextStatus });
}

function updateCustomerProperties(
  customerId: string,
  updater: (properties: CustomerProperty[]) => CustomerProperty[],
) {
  const customer = getSharedCustomerById(customerId);
  if (!customer) return null;
  return updateSharedCustomer(customerId, {
    properties: updater(customer.properties ?? []),
  });
}

export function createSharedCustomerProperty(
  customerId: string,
  property: CustomerProperty,
) {
  return updateCustomerProperties(customerId, (properties) => [
    ...properties,
    property,
  ]);
}

export function updateSharedCustomerProperty(
  customerId: string,
  propertyId: string,
  values: Partial<CustomerProperty>,
) {
  return updateCustomerProperties(customerId, (properties) =>
    properties.map((property) =>
      property.id === propertyId ? { ...property, ...values } : property,
    ),
  );
}

export function archiveSharedCustomerProperty(
  customerId: string,
  propertyId: string,
) {
  return updateSharedCustomerProperty(customerId, propertyId, {
    status: "archived",
  });
}

function updatePropertyUnits(
  customerId: string,
  propertyId: string,
  updater: (units: CustomerVacuumUnit[]) => CustomerVacuumUnit[],
) {
  return updateCustomerProperties(customerId, (properties) =>
    properties.map((property) =>
      property.id === propertyId
        ? { ...property, vacuumUnits: updater(property.vacuumUnits) }
        : property,
    ),
  );
}

export function createSharedCustomerUnit(
  customerId: string,
  propertyId: string,
  unit: CustomerVacuumUnit,
) {
  return updatePropertyUnits(customerId, propertyId, (units) => [...units, unit]);
}

export function updateSharedCustomerUnit(
  customerId: string,
  propertyId: string,
  unitId: string,
  values: Partial<CustomerVacuumUnit>,
) {
  return updatePropertyUnits(customerId, propertyId, (units) =>
    units.map((unit) => (unit.id === unitId ? { ...unit, ...values } : unit)),
  );
}

export function archiveSharedCustomerUnit(
  customerId: string,
  propertyId: string,
  unitId: string,
) {
  return updateSharedCustomerUnit(customerId, propertyId, unitId, {
    status: "archived",
  });
}

function updatePropertyFloors(
  customerId: string,
  propertyId: string,
  updater: (floors: CustomerInletFloor[]) => CustomerInletFloor[],
) {
  return updateCustomerProperties(customerId, (properties) =>
    properties.map((property) =>
      property.id === propertyId
        ? { ...property, inletFloors: updater(property.inletFloors) }
        : property,
    ),
  );
}

export function upsertSharedCustomerInletFloor(
  customerId: string,
  propertyId: string,
  floor: CustomerInletFloor,
) {
  return updatePropertyFloors(customerId, propertyId, (floors) => {
    const exists = floors.some((item) => item.id === floor.id);
    return exists
      ? floors.map((item) => (item.id === floor.id ? floor : item))
      : [...floors, floor];
  });
}

function updatePropertyFeatures(
  customerId: string,
  propertyId: string,
  updater: (features: CustomerFeature[]) => CustomerFeature[],
) {
  return updateCustomerProperties(customerId, (properties) =>
    properties.map((property) =>
      property.id === propertyId
        ? { ...property, additionalFeatures: updater(property.additionalFeatures) }
        : property,
    ),
  );
}

export function upsertSharedCustomerFeature(
  customerId: string,
  propertyId: string,
  feature: CustomerFeature,
) {
  return updatePropertyFeatures(customerId, propertyId, (features) => {
    const exists = features.some((item) => item.id === feature.id);
    return exists
      ? features.map((item) => (item.id === feature.id ? feature : item))
      : [...features, feature];
  });
}

export function deleteSharedCustomerFeature(
  customerId: string,
  propertyId: string,
  featureId: string,
) {
  return updatePropertyFeatures(customerId, propertyId, (features) =>
    features.filter((feature) => feature.id !== featureId),
  );
}

export function createSharedCustomerInternalNote(
  customerId: string,
  note: CustomerInternalNote,
) {
  const customer = getSharedCustomerById(customerId);
  if (!customer) return null;
  return updateSharedCustomer(customerId, {
    internalNotes: [note, ...(customer.internalNotes ?? [])],
  });
}

export function getSharedCustomerPropertyById(
  customerId: string,
  propertyId: string,
) {
  return getSharedCustomerById(customerId)?.properties?.find(
    (property) => property.id === propertyId,
  );
}

export function acceptSharedServiceRequest(requestId: string) {
  hydrate();
  state = {
    ...state,
    serviceRequests: state.serviceRequests.map((request) =>
      request.id === requestId
        ? { ...request, status: "accepted" }
        : request,
    ),
  };
  emit();
  return getSharedServiceRequestById(requestId);
}

export function rejectSharedServiceRequest(
  requestId: string,
  reason: string,
  comments?: string,
) {
  hydrate();
  const historyEntry: RejectionHistoryEntry = {
    id: `req-reject-${Date.now().toString(36)}`,
    reason,
    comments,
    rejectedAt: new Date().toISOString(),
    actorLabel: "Admin",
  };

  state = {
    ...state,
    serviceRequests: state.serviceRequests.map((request) =>
      request.id === requestId
        ? {
            ...request,
            status: "rejected",
            rejectionHistory: [historyEntry, ...(request.rejectionHistory ?? [])],
          }
        : request,
    ),
  };
  emit();
  return getSharedServiceRequestById(requestId);
}

export function upsertSharedQuotation(input: QuotationMutationInput) {
  hydrate();
  const request = getSharedServiceRequestById(input.requestId);
  if (!request) throw new Error(`Unknown service request ${input.requestId}`);

  const now = new Date().toISOString();
  const existing =
    (input.id ? getSharedQuotationById(input.id) : undefined) ??
    getSharedQuotationForRequest(input.requestId);
  const totals = calculateQuotationTotals(
    input.lineItems,
    input.taxUsd,
    input.discountUsd,
  );

  const nextQuotation: AdminQuotation = existing
    ? {
        ...existing,
        ...totals,
        serviceId: input.serviceId,
        customerId: input.customerId,
        lineItems: clone(input.lineItems),
        taxUsd: input.taxUsd,
        discountUsd: input.discountUsd,
        notes: input.notes,
        terms: input.terms,
        expiresAt: input.expiresAt ?? "",
        status: input.status,
        updatedAt: now,
        sentAt: input.status === "sent" ? now : existing.sentAt,
        issuedAt: input.status === "sent" ? now : existing.issuedAt,
        viewedAt: input.status === "viewed" ? now : existing.viewedAt,
        version:
          input.revisionReason && existing.status !== "draft"
            ? existing.version + 1
            : existing.version,
        revisionHistory:
          input.revisionReason && existing.status !== "draft"
            ? [
                ...existing.revisionHistory,
                {
                  id: `rev-${existing.id}-${existing.version}`,
                  version: existing.version,
                  status: existing.status,
                  subtotalUsd: existing.subtotalUsd,
                  discountUsd: existing.discountUsd,
                  taxUsd: existing.taxUsd,
                  totalUsd: existing.totalUsd,
                  createdAt: now,
                  reason: input.revisionReason,
                },
              ]
            : existing.revisionHistory,
      }
    : {
        id: input.id ?? quoteIdFromRequestId(input.requestId),
        serviceRequestId: input.requestId,
        customerId: input.customerId,
        serviceId: input.serviceId,
        status: input.status,
        version: 1,
        lineItems: clone(input.lineItems),
        ...totals,
        issuedAt: input.status === "sent" ? now : now,
        expiresAt: input.expiresAt ?? "",
        createdAt: now,
        updatedAt: now,
        sentAt: input.status === "sent" ? now : undefined,
        notes: input.notes,
        terms: input.terms,
        revisionHistory: [],
      };

  const quotations = existing
    ? state.quotations.map((quotation) =>
        quotation.id === existing.id ? nextQuotation : quotation,
      )
    : [nextQuotation, ...state.quotations];

  state = { ...state, quotations };
  state = {
    ...state,
    serviceRequests: state.serviceRequests.map((item) =>
      item.id === request.id
        ? { ...item, status: normalizeServiceRequestStatus(nextQuotation.status) }
        : item,
    ),
  };
  emit();
  return nextQuotation;
}

export function rejectSharedQuotation(
  quotationId: string,
  reason: string,
  comments?: string,
) {
  hydrate();
  const quotation = getSharedQuotationById(quotationId);
  if (!quotation || !isCustomerActionableQuotationStatus(quotation.status)) {
    return quotation;
  }
  const rejectedAt = new Date().toISOString();
  state = {
    ...state,
    quotations: state.quotations.map((quotation) =>
      quotation.id === quotationId
        ? {
            ...quotation,
            status: "rejected",
            rejectedAt,
            rejectionHistory: [
              {
                id: `quote-reject-${Date.now().toString(36)}`,
                reason,
                comments,
                rejectedAt,
                actorLabel: "Customer",
              },
              ...(quotation.rejectionHistory ?? []),
            ],
            updatedAt: rejectedAt,
          }
        : quotation,
    ),
  };
  emit();
  return getSharedQuotationById(quotationId);
}

export function acceptSharedQuotation(quotationId: string) {
  hydrate();
  const quotation = getSharedQuotationById(quotationId);
  if (!quotation || !isCustomerActionableQuotationStatus(quotation.status)) {
    return quotation;
  }
  const acceptedAt = new Date().toISOString();
  const serviceOrderId =
    quotation.serviceOrderId ??
    `SO-${quotation.serviceRequestId.replace("REQ-", "")}`;
  state = {
    ...state,
    quotations: state.quotations.map((quotation) =>
      quotation.id === quotationId
        ? {
            ...quotation,
            status: "accepted",
            acceptedAt,
            serviceOrderId,
            updatedAt: acceptedAt,
          }
        : quotation,
    ),
    serviceRequests: state.serviceRequests.map((request) =>
      request.id === quotation?.serviceRequestId
        ? { ...request, status: "accepted" }
        : request,
    ),
  };
  emit();
  return getSharedQuotationById(quotationId);
}

export function deleteSharedQuotation(quotationId: string) {
  hydrate();
  const quotation = getSharedQuotationById(quotationId);
  if (!quotation || quotation.status === "accepted" || quotation.serviceOrderId) {
    return false;
  }
  state = {
    ...state,
    quotations: state.quotations.filter((quotation) => quotation.id !== quotationId),
  };
  emit();
  return true;
}

export function createSharedServiceCatalog(values: {
  title: string;
  slug: string;
  summary: string;
  description?: string;
  group: PublicServiceGroup;
  iconKey: ServiceOffering["iconKey"];
  status: ServiceOffering["status"];
  sortOrder: number;
}) {
  hydrate();
  const today = new Date().toISOString().slice(0, 10);
  const serviceId = `svc-${values.slug}`;
  const service: Service = {
    id: serviceId,
    slug: values.slug,
    name: values.title,
    category: values.group,
    description: values.description || values.summary,
    basePriceUsd: 149,
    status: values.status === "ACTIVE" ? "active" : "inactive",
    commonIssues: [],
  };
  const offering: ServiceOffering = {
    ...values,
    serviceId,
    createdAt: today,
    updatedAt: today,
  };

  state = {
    ...state,
    services: [service, ...state.services],
    publicServices: [offering, ...state.publicServices],
  };
  emit();
  return offering;
}

export function updateSharedServiceCatalog(
  editingSlug: string,
  values: {
    title: string;
    slug: string;
    summary: string;
    description?: string;
    group: PublicServiceGroup;
    iconKey: ServiceOffering["iconKey"];
    status: ServiceOffering["status"];
    sortOrder: number;
  },
) {
  hydrate();
  const today = new Date().toISOString().slice(0, 10);
  const existing = state.publicServices.find((item) => item.slug === editingSlug);
  if (!existing) return null;

  state = {
    ...state,
    publicServices: state.publicServices.map((service) =>
      service.slug === editingSlug
        ? { ...service, ...values, updatedAt: today }
        : service,
    ),
    services: state.services.map((service) =>
      service.id === existing.serviceId
        ? {
            ...service,
            slug: values.slug,
            name: values.title,
            category: values.group,
            description: values.description || values.summary,
            status: values.status === "ACTIVE" ? "active" : "inactive",
          }
        : service,
    ),
  };
  emit();
  return getSharedServiceCatalogBySlug(values.slug);
}

export function deleteSharedServiceCatalog(slug: string) {
  hydrate();
  const existing = state.publicServices.find((item) => item.slug === slug);
  if (!existing) return false;
  state = {
    ...state,
    publicServices: state.publicServices.filter((item) => item.slug !== slug),
    services: state.services.filter((item) => item.id !== existing.serviceId),
  };
  emit();
  return true;
}

export function toggleSharedServiceCatalogStatus(slug: string) {
  hydrate();
  const today = new Date().toISOString().slice(0, 10);
  const existing = state.publicServices.find((item) => item.slug === slug);
  if (!existing) return null;
  const nextStatus = existing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  state = {
    ...state,
    publicServices: state.publicServices.map((item) =>
      item.slug === slug ? { ...item, status: nextStatus, updatedAt: today } : item,
    ),
    services: state.services.map((item) =>
      item.id === existing.serviceId
        ? { ...item, status: nextStatus === "ACTIVE" ? "active" : "inactive" }
        : item,
    ),
  };
  emit();
  return getSharedServiceCatalogBySlug(slug);
}

export function createSharedCategory(values: {
  name: string;
  slug: string;
  description?: string;
  status: ProductCategory["status"];
}) {
  hydrate();
  const today = new Date().toISOString().slice(0, 10);
  const category: ProductCategory = {
    id: `cat-${Date.now().toString(36).slice(-6)}`,
    name: values.name,
    slug: values.slug,
    description: values.description ?? "",
    status: values.status,
    createdAt: today,
    updatedAt: today,
  };
  state = { ...state, categories: [category, ...state.categories] };
  emit();
  return category;
}

export function updateSharedCategory(
  categoryId: string,
  values: {
    name: string;
    slug: string;
    description?: string;
    status: ProductCategory["status"];
  },
) {
  hydrate();
  const today = new Date().toISOString().slice(0, 10);
  state = {
    ...state,
    categories: state.categories.map((category) =>
      category.id === categoryId
        ? { ...category, ...values, description: values.description ?? "", updatedAt: today }
        : category,
    ),
  };
  emit();
}

export function deleteSharedCategory(categoryId: string) {
  hydrate();
  state = {
    ...state,
    categories: state.categories.filter((category) => category.id !== categoryId),
  };
  emit();
}

export function toggleSharedCategoryStatus(categoryId: string) {
  hydrate();
  const today = new Date().toISOString().slice(0, 10);
  state = {
    ...state,
    categories: state.categories.map((category) =>
      category.id === categoryId
        ? {
            ...category,
            status: category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            updatedAt: today,
          }
        : category,
    ),
  };
  emit();
}

type ProductMutationValues = {
  name: string;
  slug: string;
  categoryId: string;
  summary: string;
  description: string;
  priceUsd: number;
  sku?: string;
  model?: string;
  imageAlt?: string;
  taxable?: boolean;
  shippingLabel?: string;
  status: ProductStatus;
  availability?: Product["availability"];
  images?: string[];
};

export function createSharedProduct(values: ProductMutationValues) {
  hydrate();
  const product: Product = {
    id: `prd-${Date.now().toString(36).slice(-6)}`,
    categoryId: values.categoryId,
    slug: values.slug,
    name: values.name,
    summary: values.summary,
    description: values.description,
    priceUsd: values.priceUsd,
    status: values.status,
    availability: values.availability ?? "in-stock",
    imageAlt: values.imageAlt ?? `${values.name} product image`,
    addedAt: new Date().toISOString().slice(0, 10),
    eyebrow: "",
    sku: values.sku,
    model: values.model,
    taxable: values.taxable,
    shippingLabel: values.shippingLabel,
    images: values.images,
  };
  state = { ...state, products: [product, ...state.products] };
  emit();
  return product;
}

export function updateSharedProduct(productId: string, values: ProductMutationValues) {
  hydrate();
  state = {
    ...state,
    products: state.products.map((product) =>
      product.id === productId
        ? {
            ...product,
            ...values,
            imageAlt: values.imageAlt ?? product.imageAlt,
          }
        : product,
    ),
  };
  emit();
}

export function deleteSharedProduct(productId: string) {
  hydrate();
  const isReferencedByReview =
    state.reviews.some(
      (review) => review.type === "PRODUCT" && review.relatedEntityId === productId,
    );
  const isReferencedByHistoricalOrder = sharedProductOrderSeed.some((order) =>
    order.items.some((item) => item.productId === productId),
  );
  if (isReferencedByReview || isReferencedByHistoricalOrder) {
    return false;
  }
  state = {
    ...state,
    products: state.products.filter((product) => product.id !== productId),
  };
  emit();
  return true;
}

export function toggleSharedProductStatus(productId: string) {
  hydrate();
  state = {
    ...state,
    products: state.products.map((product) =>
      product.id === productId
        ? {
            ...product,
            status: product.status === "active" ? "archived" : "active",
          }
        : product,
    ),
  };
  emit();
}

export function createSharedReview(input: {
  type: "PRODUCT" | "SERVICE";
  customerId: string;
  customerName: string;
  relatedOrderId: string;
  relatedEntityId: string;
  relatedName: string;
  title: string;
  body: string;
  rating: 1 | 2 | 3 | 4 | 5;
}) {
  hydrate();
  const submittedAt = new Date().toISOString();
  const review: CustomerReview = {
    id: `review-${Date.now().toString(36)}`,
    type: input.type,
    customerId: input.customerId,
    customerName: input.customerName,
    status: "PENDING",
    relatedOrderId: input.relatedOrderId,
    relatedEntityId: input.relatedEntityId,
    relatedName: input.relatedName,
    title: input.title,
    body: input.body,
    rating: input.rating,
    submittedAt,
    preview: input.body.slice(0, 120),
    moderationHistory: [
      {
        id: `review-history-${Date.now().toString(36)}`,
        action: "created",
        actorLabel: "Customer",
        createdAt: submittedAt,
      },
    ],
  };

  state = {
    ...state,
    reviews: [review, ...state.reviews],
  };
  emit();
  return review;
}

export function hasSharedReviewForOrder(orderId: string) {
  hydrate();
  return state.reviews.some((review) => review.relatedOrderId === orderId);
}

export function getCustomerVisibleQuotations() {
  hydrate();
  return state.quotations.filter((quotation) =>
    isCustomerVisibleQuotationStatus(quotation.status),
  );
}
