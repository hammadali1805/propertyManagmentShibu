
import { Property, Bill, BillStatus, User, BillType, City, BillConfig, BillingFrequency } from '../types';

export const MOCK_BILL_CONFIGS: BillConfig[] = [
  { id: 'bc1', billTypeId: 'bt1', frequency: BillingFrequency.MONTHLY, deadlineDate: '2026-03-15' },
  { id: 'bc2', billTypeId: 'bt3', frequency: BillingFrequency.YEARLY, deadlineDate: '2026-04-30' },
  { id: 'bc3', billTypeId: 'bt2', frequency: BillingFrequency.QUARTERLY, deadlineDate: '2026-05-15' },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'super@veerrealty.com', name: 'Executive Director', role: 'SUPER_ADMIN', password: 'password123' },
  { id: 'u2', email: 'admin@veerrealty.com', name: 'Field Operator', role: 'ADMIN', password: 'password123' },
];

export const MOCK_BILL_TYPES: BillType[] = [
  { id: 'bt-rent', name: 'Monthly Rent', icon: 'fa-house-chimney-user', requiresAmount: true, requiresAttachment: false },
  { id: 'bt1', name: 'Electricity', icon: 'fa-bolt', requiresAmount: true, requiresAttachment: false },
  { id: 'bt2', name: 'Water', icon: 'fa-droplet', requiresAmount: true, requiresAttachment: false },
  { id: 'bt3', name: 'Fire Safety', icon: 'fa-fire-extinguisher', requiresAmount: false, requiresAttachment: true },
];

export const MOCK_CITIES: City[] = [
  { id: 'c1', name: 'Mumbai' },
  { id: 'c2', name: 'Pune' },
  { id: 'c3', name: 'Bangalore' },
];

export const MOCK_PROPERTIES: Property[] = [
  { id: 'p1', name: 'Grand Oak Residency', address: '101 Luxury Blvd', cityId: 'c1', activeBillTypeIds: ['bt-rent', 'bt1', 'bt2'], assignedAdminId: 'u2', rentAmount: 25000 },
  { id: 'p2', name: 'Riverdale Suites', address: '42 Waterfront Way', cityId: 'c2', activeBillTypeIds: ['bt-rent', 'bt1', 'bt3'], assignedAdminId: 'u2', rentAmount: 18000 },
];

export const MOCK_BILLS: Bill[] = [
  { id: 'b1', propertyId: 'p1', billTypeId: 'bt1', billingDate: '2025-03-15', amount: 150, status: BillStatus.UNPAID, updatedAt: new Date().toISOString() },
  { id: 'b2', propertyId: 'p1', billTypeId: 'bt2', billingDate: '2025-03-15', amount: 45, status: BillStatus.PAID, updatedAt: new Date().toISOString() },
  { id: 'b3', propertyId: 'p2', billTypeId: 'bt1', billingDate: '2025-03-15', amount: 90, status: BillStatus.PAID, updatedAt: new Date().toISOString() },
  { id: 'b4', propertyId: 'p2', billTypeId: 'bt3', billingDate: '2025-03-15', attachmentName: 'fire_cert_march.pdf', status: BillStatus.UNPAID, updatedAt: new Date().toISOString() },
];
