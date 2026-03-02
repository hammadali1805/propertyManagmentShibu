
import React, { useState, useMemo, useEffect } from 'react';
import { Property, Bill, BillStatus, BillType, BillConfig, User } from '../types';
import { api } from '../services/api';
import Chat from './Chat';
import PropertyCalendar from './PropertyCalendar';
import FileViewer from './FileViewer';

interface AdminViewProps {
  properties: Property[];
  bills: Bill[];
  onUpdateStatus: (billId: string, newStatus: BillStatus) => void;
  user: User;
}

const AdminView: React.FC<AdminViewProps> = ({ properties: allProps, bills: initialBills, onUpdateStatus, user }) => {
  const properties = useMemo(() => allProps.filter(p => p.assignedAdminId === user.id), [allProps, user.id]);
  const [billTypes, setBillTypes] = useState<BillType[]>([]);
  const [billConfigs, setBillConfigs] = useState<BillConfig[]>([]);
  const [bills, setBills] = useState<Bill[]>(initialBills);
  const [activePropertyId, setActivePropertyId] = useState<string>('');
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  useEffect(() => {
    if (properties.length > 0 && !activePropertyId) {
      setActivePropertyId(properties[0].id);
    }
  }, [properties, activePropertyId]);
  
  // Local state for editing individual utility entries
  const [editingData, setEditingData] = useState<Record<string, { amount?: number, attachmentName?: string }>>({});

  useEffect(() => {
    Promise.all([api.getBillTypes(), api.getBillConfigs()]).then(([bts, bcs]) => {
      setBillTypes(bts);
      setBillConfigs(bcs);
    });
  }, []);

  useEffect(() => {
    setBills(initialBills);
  }, [initialBills]);

  const dateOptions = useMemo(() => {
    const dates = [];
    const date = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const [selectedDate, setSelectedDate] = useState(dateOptions[0]);
  const isDateEditable = dateOptions.slice(0, 3).includes(selectedDate);

  const activeProperty = properties.find(p => p.id === activePropertyId);

  const handleSaveUtilityRecord = async (btId: string, status: BillStatus) => {
    const data = editingData[btId] || {};
    const bt = billTypes.find(t => t.id === btId);

    // Validation
    if (bt?.requiresAmount && data.amount === undefined) {
      alert(`Amount is required for ${bt.name}`);
      return;
    }
    if (bt?.requiresAttachment && !data.attachmentName) {
      alert(`File attachment is required for ${bt.name}`);
      return;
    }

    try {
      const entry = {
        propertyId: activePropertyId,
        billTypeId: btId,
        billingDate: selectedDate,
        amount: data.amount,
        attachmentName: data.attachmentName,
        status: status
      };

      // Check if bill exists to update or create new
      const existingBill = bills.find(b => b.propertyId === activePropertyId && b.billTypeId === btId && b.billingDate === selectedDate);
      
      if (existingBill) {
        // In a real app we'd have an api.updateBillDetails. For this demo, we submit fresh entry or update status
        await onUpdateStatus(existingBill.id, status);
      } else {
        await api.submitBillEntry(user, entry);
      }
      
      // Refresh local view
      const updatedBills = await api.getBills();
      setBills(updatedBills);
      alert(`${bt?.name} saved successfully!`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateLocalEdit = (btId: string, field: string, value: any) => {
    setEditingData(prev => ({
      ...prev,
      [btId]: { ...prev[btId], [field]: value }
    }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 animate-fadeIn pb-20">
      <div className="bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">Field Management</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Update utility records for properties</p>
        </div>
        <div className="w-full sm:w-auto">
          <select 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-6 py-3 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl font-black text-slate-700 outline-none text-[10px] sm:text-xs uppercase tracking-widest appearance-none shadow-sm"
          >
            {dateOptions.map(d => (
              <option key={d} value={d}>
                {new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Col: Asset Navigator */}
        <div className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 h-fit">
          <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Assigned Assets</h3>
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 custom-scrollbar pb-2 lg:pb-0">
            {properties.map(p => (
              <button 
                key={p.id}
                onClick={() => setActivePropertyId(p.id)}
                className={`flex-shrink-0 lg:flex-shrink-1 w-[180px] lg:w-full p-4 rounded-2xl text-left transition-all ${
                  activePropertyId === p.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 scale-[1.02]' : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                }`}
              >
                <div className="font-bold text-xs truncate">{p.name}</div>
                <div className={`text-[8px] uppercase font-black tracking-widest mt-1 ${activePropertyId === p.id ? 'text-blue-100' : 'text-slate-300'}`}>
                  {p.activeBillTypeIds.length} ACTIVE UTILITIES
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Col: Utility Records */}
        <div className="lg:col-span-3 space-y-6">
          {activeProperty && (
            <PropertyCalendar 
              propertyId={activeProperty.id} 
              billConfigs={billConfigs} 
              bills={bills} 
              billTypes={billTypes} 
            />
          )}
          
          <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utility Checklist</h3>
                <p className="text-slate-800 font-bold text-sm truncate">{activeProperty?.name}</p>
              </div>
              {!isDateEditable && <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-3 py-1 rounded-full uppercase">Review Only</span>}
            </div>

            <div className="divide-y divide-slate-50">
              {activeProperty?.activeBillTypeIds.map(btId => {
                const bt = billTypes.find(t => t.id === btId);
                const bill = bills.find(b => b.propertyId === activePropertyId && b.billTypeId === btId && b.billingDate === selectedDate);
                const currentEdit = editingData[btId] || {};
                
                // Find relevant config: specific property first, then global
                const config = billConfigs.find(c => c.billTypeId === btId && c.propertyId === activePropertyId) 
                            || billConfigs.find(c => c.billTypeId === btId && !c.propertyId);

                return (
                  <div key={btId} className="p-6 sm:p-8 space-y-6 group hover:bg-slate-50/30 transition-all">
                    {/* Header: Utility Identity */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-xl text-blue-600 border border-slate-100 shadow-sm">
                          <i className={`fas ${bt?.icon || 'fa-bolt'}`}></i>
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-lg leading-tight">{bt?.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                              {bill ? 'RECORD DETECTED' : 'PENDING ENTRY'}
                            </div>
                            {config && (
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded text-[8px] font-black text-blue-600 uppercase">
                                <i className="fas fa-clock"></i>
                                {config.frequency} • Deadline: {new Date(config.deadlineDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Status Toggle */}
                      <button 
                        disabled={!isDateEditable}
                        onClick={() => {
                          const currentStatus = bill?.status || BillStatus.UNPAID;
                          const nextStatus = currentStatus === BillStatus.PAID ? BillStatus.UNPAID : BillStatus.PAID;
                          handleSaveUtilityRecord(btId, nextStatus);
                        }}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          bill?.status === BillStatus.PAID ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                        } ${!isDateEditable && 'opacity-50 grayscale'}`}
                      >
                        {bill?.status || 'UNPAID'}
                      </button>
                    </div>

                    {/* Inputs: Based on SuperAdmin Config */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {bt?.requiresAmount && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase px-2">Billed Amount (₹)</label>
                          <input 
                            type="number" 
                            disabled={!isDateEditable}
                            value={currentEdit.amount ?? bill?.amount ?? ''}
                            onChange={(e) => updateLocalEdit(btId, 'amount', Number(e.target.value))}
                            placeholder="0.00"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                          />
                        </div>
                      )}

                      {bt?.requiresAttachment && (
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-400 uppercase px-2">Proof (PDF/JPG)</label>
                          <div className="relative group">
                            <input 
                              type="file" 
                              id={`file-${btId}`} 
                              className="hidden" 
                              disabled={!isDateEditable}
                              onChange={(e) => updateLocalEdit(btId, 'attachmentName', e.target.files?.[0]?.name)}
                            />
                            <label 
                              htmlFor={`file-${btId}`} 
                              className={`flex items-center gap-3 p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-white hover:border-blue-300 transition-all ${!isDateEditable && 'cursor-not-allowed opacity-50'}`}
                            >
                              <i className={`fas ${currentEdit.attachmentName || bill?.attachmentName ? 'fa-file-check text-emerald-500' : 'fa-cloud-upload text-slate-300'}`}></i>
                              <span className="text-[10px] font-black text-slate-500 uppercase truncate">
                                {currentEdit.attachmentName || bill?.attachmentName || 'Attach Document'}
                              </span>
                            </label>
                            {(currentEdit.attachmentName || bill?.attachmentName) && (
                              <button 
                                onClick={() => setViewingAttachment(currentEdit.attachmentName || bill?.attachmentName!)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 hover:bg-blue-50 transition-colors z-10"
                                title="View Proof"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Footer for this specific utility */}
                    {isDateEditable && (
                      <div className="flex justify-end pt-2">
                        <button 
                          onClick={() => handleSaveUtilityRecord(btId, bill?.status || BillStatus.UNPAID)}
                          className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <i className="fas fa-save"></i>
                          Save {bt?.name} Record
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {activeProperty?.activeBillTypeIds.length === 0 && (
                <div className="p-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl mx-auto flex items-center justify-center text-slate-200 mb-4">
                    <i className="fas fa-exclamation-triangle text-2xl"></i>
                  </div>
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No Active Utilities configured</p>
                  <p className="text-slate-300 text-[8px] uppercase mt-1">Contact Super Admin to enable features</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {activeProperty && (
        <Chat 
          user={user} 
          propertyId={activeProperty.id} 
          propertyName={activeProperty.name} 
        />
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

export default AdminView;
