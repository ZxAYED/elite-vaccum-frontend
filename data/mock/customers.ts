import type {
  Customer,
  CustomerFeatureType,
  CustomerPropertyType,
} from "@/types/domain";

export function propertyType(type: CustomerPropertyType) {
  return type;
}

export function featureType(type: CustomerFeatureType) {
  return type;
}

export const mockCustomers: Customer[] = [];
