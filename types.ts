
export type UserRole = 'SUPER_ADMIN' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
}

export enum BillStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID'
}

export enum BillingFrequency {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY'
}

export interface BillConfig {
  id: string;
  billTypeId: string;
  propertyId?: string; // Optional: if null, applies to all properties for this bill type
  frequency: BillingFrequency;
  deadlineDate: string; // ISO date string or specific day
  description?: string;
}

export interface BillType {
  id: string;
  name: string; // e.g., "Water", "Electricity", "Fire Safety"
  icon: string;
  requiresAmount: boolean;
  requiresAttachment: boolean;
  gstPercentage?: number;
}

export interface City {
  id: string;
  name: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  cityId: string;
  activeBillTypeIds: string[]; // List of bill types enabled for this property
  assignedAdminId?: string; // ID of the Field Ops (Admin) assigned to this property
  rentAmount: number; // Monthly rent for the property
}

export interface Bill {
  id: string;
  propertyId: string;
  billTypeId: string;
  billingDate: string;
  amount?: number;
  attachmentName?: string;
  status: BillStatus;
  remarks?: string; // Field Ops remarks
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  propertyId: string;
  propertyName: string;
  billType: string;
  billingDate: string;
  oldStatus: BillStatus;
  newStatus: BillStatus;
  updatedBy: string;
  updatedById: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  propertyId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
}
