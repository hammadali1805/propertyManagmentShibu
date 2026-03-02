
import React, { useState, useMemo, useEffect } from 'react';
import { Property, Bill, BillStatus, AuditLog, BillType, City, BillConfig, BillingFrequency, User } from '../types';
import { api } from '../services/api';
import Chat from './Chat';
import PropertyCalendar from './PropertyCalendar';
import FileViewer from './FileViewer';

interface SuperAdminViewProps {
  properties: Property[];
  bills: Bill[];
  onAddProperty: (name: string, address: string, cityId: string, activeBillTypeIds: string[], assignedAdminId?: string) => void;
  auditLogs: AuditLog[];
  user: User;
  users: User[];
  onAddAdmin: (name: string, email: string) => void;
  onDeleteAdmin: (adminId: string) => void;
  onAssignProperty: (propertyId: string, adminId: string) => void;
  onUnassignProperty: (propertyId: string) => void;
}

const SuperAdminView: React.FC<SuperAdminViewProps> = ({ 
  properties: initialProps, 
  bills: initialBills, 
  onAddProperty, 
  auditLogs, 
  user,
  users,
  onAddAdmin,
  onDeleteAdmin,
  onAssignProperty,
  onUnassignProperty
}) => {
  const [activeTab, setActiveTab] = useState<'PORTFOLIO' | 'CITIES' | 'AUDIT' | 'UTILITIES' | 'BILLING' | 'FIELD_OPS'>('PORTFOLIO');
  const [billTypes, setBillTypes] = useState<BillType[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [billConfigs, setBillConfigs] = useState<BillConfig[]>([]);
  const [properties, setProperties] = useState<Property[]>(initialProps);
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [showAddProp, setShowAddProp] = useState(false);
  const [configPropId, setConfigPropId] = useState<string | null>(null);
  const [viewingPropId, setViewingPropId] = useState<string | null>(null);
  const [chatPropId, setChatPropId] = useState<string | null>(null);
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);
  
  const [editingBillType, setEditingBillType] = useState<Partial<BillType> | null>(null);
  const [showBillTypeModal, setShowBillTypeModal] = useState(false);
  const [editingBillConfig, setEditingBillConfig] = useState<Partial<BillConfig> | null>(null);
  const [showBillConfigModal, setShowBillConfigModal] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [selectedBillTypeIds, setSelectedBillTypeIds] = useState<string[]>([]);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [assigningAdminId, setAssigningAdminId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getBillTypes(), api.getCities(), api.getBillConfigs()]).then(([bts, cts, bcs]) => {
      setBillTypes(bts);
      setCities(cts);
      setBillConfigs(bcs);
    });
  }, []);

  useEffect(() => {
    setProperties(initialProps);
  }, [initialProps]);

  useEffect(() => {
    setBills(initialBills);
  }, [initialBills]);

  const handleToggleBillForProp = async (propId: string, billTypeId: string) => {
    const prop = properties.find(p => p.id === propId);
    if (!prop) return;
    const current = prop.activeBillTypeIds;
    const updated = current.includes(billTypeId) 
      ? current.filter(id => id !== billTypeId) 
      : [...current, billTypeId];
    
    const updatedProps = await api.updatePropertyConfig(user, propId, updated);
    setProperties(updatedProps);
  };

  const handleSaveBillType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBillType) {
      const updatedTypes = await api.upsertBillType(user, editingBillType);
      setBillTypes(updatedTypes);
      setShowBillTypeModal(false);
      setEditingBillType(null);
    }
  };

  const handleDeleteBillType = async (id: string) => {
    if (confirm('Delete utility type? This action cannot be undone.')) {
      const updatedTypes = await api.deleteBillType(user, id);
      setBillTypes(updatedTypes);
      const updatedProps = await api.getProperties();
      setProperties(updatedProps);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    const updatedCities = await api.addCity(user, newCityName);
    setCities(updatedCities);
    setNewCityName('');
  };

  const handleDeleteCity = async (id: string) => {
    if (confirm('Delete this city?')) {
      const updatedCities = await api.deleteCity(user, id);
      setCities(updatedCities);
    }
  };

  const handleSaveBillConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBillConfig) {
      const updatedConfigs = await api.upsertBillConfig(user, editingBillConfig);
      setBillConfigs(updatedConfigs);
      setShowBillConfigModal(false);
      setEditingBillConfig(null);
    }
  };

  const handleDeleteBillConfig = async (id: string) => {
    if (confirm('Delete this billing configuration?')) {
      const updatedConfigs = await api.deleteBillConfig(user, id);
      setBillConfigs(updatedConfigs);
    }
  };

  const handleAddPropSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const name = d.get('name') as string;
    const address = d.get('address') as string;
    const cityId = d.get('cityId') as string;
    if (!name || !address || !cityId) {
      alert('Please fill all required fields');
      return;
    }
    onAddProperty(name, address, cityId, selectedBillTypeIds, d.get('assignedAdminId') as string || undefined);
    setShowAddProp(false);
    setSelectedBillTypeIds([]);
  };

  const toggleBillSelection = (id: string) => {
    setSelectedBillTypeIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddAdminSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    const name = d.get('name') as string;
    const email = d.get('email') as string;
    if (!name || !email) return;
    onAddAdmin(name, email);
    setShowAddAdminModal(false);
  };

  const groupedProperties = useMemo(() => {
    const groups: Record<string, Property[]> = {};
    properties.forEach(p => {
      if (!groups[p.cityId]) groups[p.cityId] = [];
      groups[p.cityId].push(p);
    });
    return groups;
  }, [properties]);

  const historyMatrix = useMemo(() => {
    if (!viewingPropId) return null;
    const prop = properties.find(p => p.id === viewingPropId);
    if (!prop) return null;

    const activeBTs = billTypes.filter(bt => prop.activeBillTypeIds.includes(bt.id));
    const propBills = bills.filter(b => b.propertyId === viewingPropId);
    const uniqueDates: string[] = Array.from(new Set(propBills.map(b => b.billingDate)));
    uniqueDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return {
      property: prop,
      headers: activeBTs,
      rows: uniqueDates.map(billingDate => ({
        billingDate,
        cells: activeBTs.map(bt => {
          const bill = propBills.find(b => b.billingDate === billingDate && b.billTypeId === bt.id);
          return bill || null;
        })
      }))
    };
  }, [viewingPropId, properties, bills, billTypes]);

  // RENDER DEDICATED HISTORY PAGE
  if (viewingPropId && historyMatrix) {
    const city = cities.find(c => c.id === historyMatrix.property.cityId);
    
    return (
      <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-20">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 sm:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setViewingPropId(null)}
              className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight truncate">{historyMatrix.property.name}</h1>
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{historyMatrix.property.address} • {city?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 py-2 bg-slate-50 rounded-full">
              {historyMatrix.headers.length} Utility Types Tracked
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col h-full">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="p-6 text-left sticky left-0 z-20 bg-slate-50 min-w-[160px]">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Billing Date</span>
                      </th>
                      {historyMatrix.headers.map(bt => (
                        <th key={bt.id} className="p-6 text-center min-w-[140px]">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-blue-600">
                              <i className={`fas ${bt.icon}`}></i>
                            </div>
                            <span className="text-[10px] font-black text-slate-700 uppercase">{bt.name}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {historyMatrix.rows.map((row) => (
                      <tr key={row.billingDate} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 sticky left-0 z-10 bg-white font-bold text-slate-800 text-sm border-r border-slate-50">
                          {new Date(row.billingDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        {row.cells.map((bill, bIdx) => (
                          <td key={bIdx} className="p-6 text-center">
                            <div className="flex flex-col items-center gap-2">
                              {bill ? (
                                <>
                                  <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    bill.status === BillStatus.PAID 
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                    : 'bg-rose-50 text-rose-600 border border-rose-100'
                                  }`}>
                                    {bill.status}
                                  </div>
                                  {bill.amount !== undefined && (
                                    <div className="text-xs font-bold text-slate-600">₹{bill.amount.toLocaleString()}</div>
                                  )}
                                  {bill.attachmentName && (
                                    <button 
                                      onClick={() => setViewingAttachment(bill.attachmentName!)}
                                      className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded text-[8px] font-black text-blue-600 uppercase transition-colors"
                                    >
                                      <i className="fas fa-paperclip"></i> View Proof
                                    </button>
                                  )}
                                </>
                              ) : (
                                <div className="text-slate-200"><i className="fas fa-minus"></i></div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                    {historyMatrix.rows.length === 0 && (
                      <tr>
                        <td colSpan={historyMatrix.headers.length + 1} className="py-32 text-center">
                          <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
                              <i className="fas fa-folder-open text-2xl"></i>
                            </div>
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No billing history found for this asset</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <PropertyCalendar 
              propertyId={historyMatrix.property.id} 
              billConfigs={billConfigs} 
              bills={bills} 
              billTypes={billTypes} 
            />
          </div>
        </div>
        <Chat 
          user={user} 
          propertyId={historyMatrix.property.id} 
          propertyName={historyMatrix.property.name} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn pb-20">
      <div className="flex overflow-x-auto pb-1 sm:pb-0 gap-2 p-1 bg-slate-200/50 rounded-xl sm:rounded-2xl w-full sm:w-fit no-scrollbar">
        {['PORTFOLIO', 'FIELD_OPS', 'CITIES', 'AUDIT', 'UTILITIES', 'BILLING'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-shrink-0 px-5 sm:px-6 py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'PORTFOLIO' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assets</p>
              <p className="text-xl sm:text-3xl font-black text-slate-800">{properties.length}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-sm">
              <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilities</p>
              <p className="text-xl sm:text-3xl font-black text-blue-600">{billTypes.length}</p>
            </div>
            <button 
              onClick={() => { setSelectedBillTypeIds([]); setShowAddProp(true); }}
              className="col-span-2 sm:col-span-1 bg-slate-900 text-white rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 font-black uppercase text-[10px] sm:text-xs tracking-widest hover:bg-black active:scale-[0.98] transition-all"
            >
              + Add Property
            </button>
          </div>

          <div className="space-y-8">
            {cities.map(city => {
              const cityProps = groupedProperties[city.id] || [];
              if (cityProps.length === 0) return null;

              return (
                <div key={city.id} className="space-y-4">
                  <div className="flex items-center gap-3 px-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{city.name}</h3>
                    <div className="h-[1px] flex-1 bg-slate-200"></div>
                    <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{cityProps.length} Assets</span>
                  </div>

                  <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                    <div className="hidden sm:block">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                            <th className="px-8 py-5">Property</th>
                            <th className="px-8 py-5">Assigned To</th>
                            <th className="px-8 py-5">Active Utilities</th>
                            <th className="px-8 py-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {cityProps.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-all group">
                              <td className="px-8 py-6 cursor-pointer" onClick={() => setViewingPropId(p.id)}>
                                <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-2 truncate max-w-xs">
                                  {p.name} <i className="fas fa-history text-[8px] opacity-20"></i>
                                </div>
                                <div className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-xs">{p.address}</div>
                              </td>
                              <td className="px-8 py-6">
                                {p.assignedAdminId ? (
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-black">
                                      {users.find(u => u.id === p.assignedAdminId)?.name.charAt(0)}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">{users.find(u => u.id === p.assignedAdminId)?.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-300 italic">Unassigned</span>
                                )}
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-wrap gap-2">
                                  {p.activeBillTypeIds.slice(0, 3).map(btId => {
                                    const bt = billTypes.find(t => t.id === btId);
                                    return <span key={btId} className="px-2 py-1 bg-blue-50 text-blue-600 text-[8px] font-black rounded-lg uppercase">{bt?.name}</span>;
                                  })}
                                  {p.activeBillTypeIds.length > 3 && <span className="text-[8px] font-black text-slate-300">+{p.activeBillTypeIds.length - 3} more</span>}
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => setChatPropId(p.id)} className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-colors">
                                    <i className="fas fa-comments text-[10px]"></i>
                                  </button>
                                  <button onClick={() => setConfigPropId(p.id)} className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">Config</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="sm:hidden divide-y divide-slate-50">
                      {cityProps.map(p => (
                        <div key={p.id} className="p-5 space-y-3">
                          <div className="flex justify-between items-start">
                            <div onClick={() => setViewingPropId(p.id)} className="flex-1">
                              <div className="font-black text-slate-800 text-sm flex items-center gap-2">
                                {p.name} <i className="fas fa-history text-[10px] text-blue-500"></i>
                              </div>
                              <div className="text-[9px] text-slate-400 font-bold uppercase truncate mt-0.5">{p.address}</div>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] text-blue-600 font-black">
                                  {p.assignedAdminId ? users.find(u => u.id === p.assignedAdminId)?.name.charAt(0) : '?'}
                                </div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                  {p.assignedAdminId ? users.find(u => u.id === p.assignedAdminId)?.name : 'Unassigned'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => setChatPropId(p.id)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                <i className="fas fa-comments"></i>
                              </button>
                              <button onClick={() => setConfigPropId(p.id)} className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                <i className="fas fa-cog"></i>
                              </button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {p.activeBillTypeIds.map(btId => {
                              const bt = billTypes.find(t => t.id === btId);
                              return <span key={btId} className="px-2 py-1 bg-blue-50 text-blue-600 text-[8px] font-black rounded-lg uppercase">{bt?.name}</span>;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {Object.keys(groupedProperties).length === 0 && (
              <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-100 shadow-xl">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] mx-auto flex items-center justify-center text-slate-200 mb-6">
                  <i className="fas fa-city text-3xl"></i>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Portfolio Empty</h3>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No assets linked to cities yet</p>
                <button 
                  onClick={() => setShowAddProp(true)}
                  className="mt-8 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
                >
                  Create First Property
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'FIELD_OPS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800">Field Operations</h2>
            <button onClick={() => setShowAddAdminModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all">Add Field Ops</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.filter(u => u.role === 'ADMIN').map(admin => (
              <div key={admin.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <i className="fas fa-user-shield text-xl"></i>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800">{admin.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{admin.email}</p>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned Assets</h4>
                  {properties.filter(p => p.assignedAdminId === admin.id).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{p.name}</span>
                      <button onClick={() => onUnassignProperty(p.id)} className="text-rose-500 hover:text-rose-700"><i className="fas fa-times-circle"></i></button>
                    </div>
                  ))}
                  {properties.filter(p => p.assignedAdminId === admin.id).length === 0 && (
                    <p className="text-[10px] italic text-slate-300">No properties assigned</p>
                  )}
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex gap-2">
                  <button onClick={() => setAssigningAdminId(admin.id)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all">Assign Asset</button>
                  <button onClick={() => onDeleteAdmin(admin.id)} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"><i className="fas fa-trash-alt"></i></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'CITIES' && (
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl p-6 sm:p-10 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">City Management</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Manage operational regions</p>
            </div>
            <form onSubmit={handleAddCity} className="w-full sm:w-auto flex gap-2">
              <input 
                value={newCityName}
                onChange={e => setNewCityName(e.target.value)}
                placeholder="New City Name"
                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-4 focus:ring-blue-100 text-xs w-full sm:w-64"
              />
              <button 
                type="submit"
                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl"
              >
                Add
              </button>
            </form>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {cities.map(city => (
              <div key={city.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                <span className="font-black text-slate-800 uppercase tracking-widest text-[10px]">{city.name}</span>
                <button 
                  onClick={() => handleDeleteCity(city.id)}
                  className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-600 shadow-sm transition-all sm:opacity-0 group-hover:opacity-100"
                >
                  <i className="fas fa-trash text-[10px]"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-6 sm:p-10 border-b border-slate-50">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">System Activity Logs</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Real-time audit trail of all utility updates</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50">
                  <th className="px-8 py-5">Timestamp</th>
                  <th className="px-8 py-5">Actor</th>
                  <th className="px-8 py-5">Target Asset</th>
                  <th className="px-8 py-5">Activity</th>
                  <th className="px-8 py-5 text-center">Status Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div className="text-[10px] font-bold text-slate-500">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                        <div className="text-[9px] text-slate-300">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 text-[10px] font-black uppercase">
                            {log.updatedBy.charAt(0)}
                          </div>
                          <span className="text-xs font-bold text-slate-700">{log.updatedBy}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-xs font-bold text-slate-800">{log.propertyName}</div>
                        <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest">
                          {new Date(log.billingDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Updated </span>
                        <span className="text-xs font-bold text-blue-600">{log.billType}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <span className={`px-2 py-1 rounded text-[8px] font-black uppercase border ${log.oldStatus === BillStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                            {log.oldStatus}
                          </span>
                          <i className="fas fa-arrow-right text-[10px] text-slate-300"></i>
                          <span className={`px-2 py-1 rounded text-[8px] font-black uppercase border ${log.newStatus === BillStatus.PAID ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-rose-500 text-white border-rose-600'}`}>
                            {log.newStatus}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
                          <i className="fas fa-clipboard-list text-2xl"></i>
                        </div>
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No activities recorded yet</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'UTILITIES' && (
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl p-6 sm:p-10 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">Global Dictionary</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Master utility registry</p>
            </div>
            <button 
              onClick={() => { 
                setEditingBillType({ name: '', icon: 'fa-file-invoice', requiresAmount: true, requiresAttachment: false, gstPercentage: undefined }); 
                setShowBillTypeModal(true); 
              }}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3.5 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
            >
              <i className="fas fa-plus"></i> New Type
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {billTypes.map(bt => (
              <div key={bt.id} className="p-5 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 space-y-4 relative group">
                <div className="absolute top-4 right-4 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-all">
                   <button onClick={() => { setEditingBillType(bt); setShowBillTypeModal(true); }} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-colors"><i className="fas fa-pen text-[10px]"></i></button>
                   <button onClick={() => handleDeleteBillType(bt.id)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm transition-colors"><i className="fas fa-trash text-[10px]"></i></button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm text-lg"><i className={`fas ${bt.icon}`}></i></div>
                  <div className="min-w-0">
                    <span className="font-black text-slate-800 text-base sm:text-lg block truncate">{bt.name}</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {bt.requiresAmount && <span className="text-[7px] font-black bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded uppercase">Amount</span>}
                      {bt.requiresAttachment && <span className="text-[7px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded uppercase">File</span>}
                      {bt.gstPercentage !== undefined && <span className="text-[7px] font-black bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase">GST {bt.gstPercentage}%</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'BILLING' && (
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl p-6 sm:p-10 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800">Billing Frequencies</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Set deadlines and recurrence</p>
            </div>
            <button 
              onClick={() => { 
                setEditingBillConfig({ billTypeId: '', frequency: BillingFrequency.MONTHLY, deadlineDate: new Date().toISOString().split('T')[0] }); 
                setShowBillConfigModal(true); 
              }}
              className="w-full sm:w-auto bg-blue-600 text-white px-6 py-3.5 rounded-xl sm:rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
            >
              <i className="fas fa-calendar-plus"></i> New Config
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {billConfigs.map(config => {
              const bt = billTypes.find(t => t.id === config.billTypeId);
              const prop = properties.find(p => p.id === config.propertyId);
              return (
                <div key={config.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4 relative group">
                  <div className="absolute top-4 right-4 flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditingBillConfig(config); setShowBillConfigModal(true); }} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 shadow-sm transition-colors"><i className="fas fa-pen text-[10px]"></i></button>
                    <button onClick={() => handleDeleteBillConfig(config.id)} className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 shadow-sm transition-colors"><i className="fas fa-trash text-[10px]"></i></button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 border border-slate-100 shadow-sm text-xl">
                      <i className={`fas ${bt?.icon || 'fa-calendar'}`}></i>
                    </div>
                    <div>
                      <span className="font-black text-slate-800 text-lg block">{bt?.name || 'Unknown Utility'}</span>
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{config.frequency}</span>
                    </div>
                  </div>
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400 uppercase tracking-widest">Deadline</span>
                      <span className="text-slate-700">{new Date(config.deadlineDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-400 uppercase tracking-widest">Scope</span>
                      <span className="text-slate-700">{prop ? prop.name : 'All Properties'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {billConfigs.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No billing configurations set</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bill Config Modal */}
      {showBillConfigModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-md p-8 sm:p-10 animate-slideUp sm:animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">{editingBillConfig?.id ? 'Edit Billing Config' : 'New Billing Config'}</h2>
              <button onClick={() => setShowBillConfigModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-lg"></i></button>
            </div>
            <form onSubmit={handleSaveBillConfig} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase px-2">Utility Type</label>
                <select 
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                  value={editingBillConfig?.billTypeId || ''}
                  onChange={e => setEditingBillConfig({ ...editingBillConfig!, billTypeId: e.target.value })}
                >
                  <option value="">Select Utility</option>
                  {billTypes.map(bt => <option key={bt.id} value={bt.id}>{bt.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase px-2">Frequency</label>
                <select 
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                  value={editingBillConfig?.frequency || ''}
                  onChange={e => setEditingBillConfig({ ...editingBillConfig!, frequency: e.target.value as BillingFrequency })}
                >
                  {Object.values(BillingFrequency).map(freq => <option key={freq} value={freq}>{freq}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase px-2">Deadline Date (from Calendar)</label>
                <input 
                  type="date"
                  required
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
                  value={editingBillConfig?.deadlineDate || ''}
                  onChange={e => setEditingBillConfig({ ...editingBillConfig!, deadlineDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase px-2">Asset Scope (Optional)</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                  value={editingBillConfig?.propertyId || ''}
                  onChange={e => setEditingBillConfig({ ...editingBillConfig!, propertyId: e.target.value || undefined })}
                >
                  <option value="">All Properties</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowBillConfigModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                <button type="submit" className="flex-2 py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 transition-colors">
                  {editingBillConfig?.id ? 'Update Config' : 'Save Config'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showBillTypeModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-md p-8 sm:p-10 animate-slideUp sm:animate-scaleUp">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-800">{editingBillType?.id ? 'Edit Utility Type' : 'New Utility Type'}</h2>
              <button onClick={() => setShowBillTypeModal(false)} className="text-slate-400 hover:text-slate-600"><i className="fas fa-times text-lg"></i></button>
            </div>
            <form onSubmit={handleSaveBillType} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase px-2">Identity</label>
                <input 
                  required autoFocus
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" 
                  value={editingBillType?.name || ''} 
                  onChange={e => setEditingBillType({ ...editingBillType!, name: e.target.value })} 
                  placeholder="e.g., Gas, Water, Cleaning" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase px-2">Icon Class (FontAwesome)</label>
                <input 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" 
                  value={editingBillType?.icon || ''} 
                  onChange={e => setEditingBillType({ ...editingBillType!, icon: e.target.value })} 
                  placeholder="e.g., fa-droplet" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase px-2">GST Percentage (Optional)</label>
                <input 
                  type="number"
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all" 
                  value={editingBillType?.gstPercentage ?? ''} 
                  onChange={e => setEditingBillType({ ...editingBillType!, gstPercentage: e.target.value ? Number(e.target.value) : undefined })} 
                  placeholder="e.g., 18" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingBillType({ ...editingBillType!, requiresAmount: !editingBillType?.requiresAmount })}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${editingBillType?.requiresAmount ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                  <i className="fas fa-indian-rupee-sign text-lg mb-1"></i>
                  <span className="text-[8px] font-black uppercase">Require Amount</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingBillType({ ...editingBillType!, requiresAttachment: !editingBillType?.requiresAttachment })}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${editingBillType?.requiresAttachment ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                >
                  <i className="fas fa-file-pdf text-lg mb-1"></i>
                  <span className="text-[8px] font-black uppercase">Require Proof</span>
                </button>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowBillTypeModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                <button type="submit" className="flex-2 py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-blue-700 transition-colors">
                  {editingBillType?.id ? 'Update Record' : 'Create Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {showAddProp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl w-full max-w-lg p-6 sm:p-10 animate-slideUp sm:animate-scaleUp flex flex-col max-h-[95vh]">
            <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">Setup New Asset</h2>
            <form onSubmit={handleAddPropSubmit} className="space-y-6 flex flex-col overflow-hidden">
              <div className="space-y-4">
                <input name="name" required placeholder="Asset Name" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
                <input name="address" required placeholder="Physical Address" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
                <select name="cityId" required className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none">
                  <option value="">Select City</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select name="assignedAdminId" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10 appearance-none">
                  <option value="">Assign Field Ops (Optional)</option>
                  {users.filter(u => u.role === 'ADMIN').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                <label className="text-[9px] font-black text-slate-400 uppercase px-2 mb-1 block">Active Utilities</label>
                {billTypes.map(bt => (
                  <button key={bt.id} type="button" onClick={() => toggleBillSelection(bt.id)} className={`w-full flex items-center justify-between p-4 rounded-xl sm:rounded-2xl border-2 transition-all ${selectedBillTypeIds.includes(bt.id) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                    <div className="flex items-center gap-3"><i className={`fas ${bt.icon}`}></i><span className="font-bold text-sm">{bt.name}</span></div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedBillTypeIds.includes(bt.id) ? 'border-blue-500' : 'border-slate-300'}`}>{selectedBillTypeIds.includes(bt.id) && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full"></div>}</div>
                  </button>
                ))}
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddProp(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Discard</button>
                <button type="submit" className="flex-2 py-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Complete Setup</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Property Config Modal */}
      {configPropId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl w-full max-w-md p-10 animate-scaleUp">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Configuration</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">{properties.find(p => p.id === configPropId)?.name}</p>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {billTypes.map(bt => {
                const isActive = properties.find(p => p.id === configPropId)?.activeBillTypeIds.includes(bt.id);
                return (
                  <button 
                    key={bt.id}
                    onClick={() => handleToggleBillForProp(configPropId, bt.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isActive ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                  >
                    <div className="flex items-center gap-3"><i className={`fas ${bt.icon}`}></i><span className="font-bold">{bt.name}</span></div>
                    <i className={`fas ${isActive ? 'fa-check-circle' : 'fa-circle-notch opacity-20'}`}></i>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setConfigPropId(null)} className="w-full mt-8 py-4 bg-slate-900 text-white rounded-xl sm:rounded-2xl font-black uppercase text-[10px] tracking-widest">Apply Changes</button>
          </div>
        </div>
      )}

      {chatPropId && (
        <Chat 
          user={user} 
          propertyId={chatPropId} 
          propertyName={properties.find(p => p.id === chatPropId)?.name || ''} 
        />
      )}

      {showAddAdminModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-scaleUp">
            <h2 className="text-2xl font-black text-slate-800 mb-6">New Field Ops</h2>
            <form onSubmit={handleAddAdminSubmit} className="space-y-4">
              <input name="name" required placeholder="Full Name" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
              <input name="email" type="email" required placeholder="Business Email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none focus:ring-4 focus:ring-blue-500/10" />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddAdminModal(false)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                <button type="submit" className="flex-2 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assigningAdminId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 animate-scaleUp">
            <h2 className="text-2xl font-black text-slate-800 mb-1">Assign Asset</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Select an unassigned property</p>
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {properties.filter(p => !p.assignedAdminId).map(p => (
                <button 
                  key={p.id}
                  onClick={() => {
                    onAssignProperty(p.id, assigningAdminId);
                    setAssigningAdminId(null);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-slate-50 border-2 border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                >
                  <div>
                    <div className="font-bold text-slate-800">{p.name}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-black">{p.address}</div>
                  </div>
                  <i className="fas fa-plus-circle text-blue-600"></i>
                </button>
              ))}
              {properties.filter(p => !p.assignedAdminId).length === 0 && (
                <p className="text-center py-8 text-slate-400 text-sm italic">All properties are currently assigned</p>
              )}
            </div>
            <button onClick={() => setAssigningAdminId(null)} className="w-full mt-8 py-4 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest">Close</button>
          </div>
        </div>
      )}

      {viewingAttachment && (
        <FileViewer 
          fileName={viewingAttachment} 
          onClose={() => setViewingAttachment(null)} 
        />
      )}
    </div>
  );
};

export default SuperAdminView;
