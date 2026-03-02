
import { Property, Bill, BillStatus, User, AuditLog, BillType, City, BillConfig } from '../types';
import { MOCK_PROPERTIES, MOCK_BILLS, MOCK_BILL_TYPES, MOCK_CITIES, MOCK_BILL_CONFIGS, MOCK_USERS } from './mockData';

let properties: Property[] = [...MOCK_PROPERTIES];
let bills: Bill[] = [...MOCK_BILLS];
let billTypes: BillType[] = [...MOCK_BILL_TYPES];
let cities: City[] = [...MOCK_CITIES];
let billConfigs: BillConfig[] = [...MOCK_BILL_CONFIGS];
let users: User[] = [...MOCK_USERS];
let auditLogs: AuditLog[] = [];

const getEditableDates = (): string[] => {
  const dates = [];
  const date = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
};

export const api = {
  getBillTypes: async () => [...billTypes],
  
  getCities: async () => [...cities],

  getProperties: async () => [...properties],

  getBills: async () => [...bills],

  getUsers: async () => [...users],

  getUserByEmail: async (email: string) => users.find(u => u.email === email),

  // Super Admin: Field Ops Management
  addAdmin: async (user: User, name: string, email: string) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    const newAdmin: User = {
      id: `u-${Date.now()}`,
      name,
      email,
      role: 'ADMIN',
      password: 'password123' // Default password for demo
    };
    users.push(newAdmin);
    return [...users];
  },

  deleteAdmin: async (user: User, adminId: string) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    users = users.filter(u => u.id !== adminId);
    // Unassign from properties
    properties = properties.map(p => p.assignedAdminId === adminId ? { ...p, assignedAdminId: undefined } : p);
    return { users: [...users], properties: [...properties] };
  },

  assignPropertyToAdmin: async (user: User, propertyId: string, adminId: string) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    properties = properties.map(p => p.id === propertyId ? { ...p, assignedAdminId: adminId } : p);
    return [...properties];
  },

  unassignProperty: async (user: User, propertyId: string) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    properties = properties.map(p => p.id === propertyId ? { ...p, assignedAdminId: undefined } : p);
    return [...properties];
  },

  // Super Admin: City Management
  addCity: async (user: User, name: string) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    const newCity = { id: `c-${Date.now()}`, name };
    cities.push(newCity);
    return [...cities];
  },

  deleteCity: async (user: User, cityId: string) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    cities = cities.filter(c => c.id !== cityId);
    return [...cities];
  },

  // Super Admin: Create/Update Bill Type in Dictionary
  upsertBillType: async (user: User, billType: Partial<BillType>) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    
    if (billType.id) {
      // Update
      const idx = billTypes.findIndex(bt => bt.id === billType.id);
      if (idx !== -1) {
        billTypes[idx] = { ...billTypes[idx], ...billType } as BillType;
      }
    } else {
      // Create
      const newType: BillType = {
        id: `bt-${Date.now()}`,
        name: billType.name || 'New Utility',
        icon: billType.icon || 'fa-file-invoice',
        requiresAmount: billType.requiresAmount ?? true,
        requiresAttachment: billType.requiresAttachment ?? false,
        gstPercentage: billType.gstPercentage,
      };
      billTypes.push(newType);
    }
    return [...billTypes];
  },

  // Super Admin: Delete Bill Type
  deleteBillType: async (user: User, billTypeId: string) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    billTypes = billTypes.filter(bt => bt.id !== billTypeId);
    // Remove from properties
    properties = properties.map(p => ({
      ...p,
      activeBillTypeIds: p.activeBillTypeIds.filter(id => id !== billTypeId)
    }));
    return [...billTypes];
  },

  // Super Admin: Update property bill config
  updatePropertyConfig: async (user: User, propertyId: string, billTypeIds: string[]) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    properties = properties.map(p => p.id === propertyId ? { ...p, activeBillTypeIds: billTypeIds } : p);
    return [...properties];
  },

  addProperty: async (user: User, name: string, address: string, cityId: string, activeBillTypeIds: string[], assignedAdminId?: string): Promise<Property> => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    const newProp: Property = {
      id: `p${Date.now()}`,
      name,
      address,
      cityId,
      activeBillTypeIds: activeBillTypeIds,
      assignedAdminId
    };
    properties = [...properties, newProp];
    return newProp;
  },

  // Admin: Submit a new bill entry
  submitBillEntry: async (user: User, entry: Partial<Bill>) => {
    if (user.role !== 'ADMIN') throw new Error('Unauthorized');
    const newBill: Bill = {
      id: `b${Date.now()}`,
      propertyId: entry.propertyId!,
      billTypeId: entry.billTypeId!,
      billingDate: entry.billingDate!,
      amount: entry.amount,
      attachmentName: entry.attachmentName,
      status: entry.status || BillStatus.UNPAID,
      updatedAt: new Date().toISOString()
    };
    bills = [...bills, newBill];

    // Log the creation as an audit entry
    const prop = properties.find(p => p.id === newBill.propertyId);
    const bt = billTypes.find(t => t.id === newBill.billTypeId);
    
    auditLogs = [{
      id: `log-${Date.now()}`,
      propertyId: newBill.propertyId,
      propertyName: prop?.name || 'Unknown',
      billType: bt?.name || 'Unknown',
      billingDate: newBill.billingDate,
      oldStatus: BillStatus.UNPAID, // Initial state
      newStatus: newBill.status,
      updatedBy: user.name,
      updatedById: user.id,
      timestamp: new Date().toISOString()
    }, ...auditLogs];

    return newBill;
  },

  updateBillStatus: async (user: User, billId: string, newStatus: BillStatus): Promise<Bill> => {
    if (user.role !== 'ADMIN') throw new Error('Unauthorized');
    const idx = bills.findIndex(b => b.id === billId);
    if (idx === -1) throw new Error('Bill not found');
    
    const bill = bills[idx];
    if (!getEditableDates().includes(bill.billingDate)) throw new Error('Date Locked');

    const oldStatus = bill.status;
    const updated = { ...bill, status: newStatus, updatedAt: new Date().toISOString() };
    
    const prop = properties.find(p => p.id === bill.propertyId);
    const bt = billTypes.find(t => t.id === bill.billTypeId);
    
    auditLogs = [{
      id: `log-${Date.now()}`,
      propertyId: bill.propertyId,
      propertyName: prop?.name || 'Unknown',
      billType: bt?.name || 'Unknown',
      billingDate: bill.billingDate,
      oldStatus,
      newStatus,
      updatedBy: user.name,
      updatedById: user.id,
      timestamp: new Date().toISOString()
    }, ...auditLogs];

    bills[idx] = updated;
    return updated;
  },

  getAuditLogs: async (user: User) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    return [...auditLogs];
  },

  getBillConfigs: async () => [...billConfigs],

  upsertBillConfig: async (user: User, config: Partial<BillConfig>) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    
    if (config.id) {
      const idx = billConfigs.findIndex(bc => bc.id === config.id);
      if (idx !== -1) {
        billConfigs[idx] = { ...billConfigs[idx], ...config } as BillConfig;
      }
    } else {
      const newConfig: BillConfig = {
        id: `bc-${Date.now()}`,
        billTypeId: config.billTypeId!,
        frequency: config.frequency!,
        deadlineDate: config.deadlineDate!,
        propertyId: config.propertyId,
        description: config.description
      };
      billConfigs.push(newConfig);
    }
    return [...billConfigs];
  },

  deleteBillConfig: async (user: User, configId: string) => {
    if (user.role !== 'SUPER_ADMIN') throw new Error('Unauthorized');
    billConfigs = billConfigs.filter(bc => bc.id !== configId);
    return [...billConfigs];
  }
};
