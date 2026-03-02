
import React, { useState } from 'react';
import { Property, Bill, BillStatus } from '../types';
import FileViewer from './FileViewer';

interface PropertyDetailsProps {
  property: Property;
  bills: Bill[];
  onClose: () => void;
  onUpdateStatus?: (billId: string, newStatus: BillStatus) => void;
  isAdmin: boolean;
  editableMonths?: string[];
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ 
  property, 
  bills, 
  onClose, 
  onUpdateStatus, 
  isAdmin,
  editableMonths = []
}) => {
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col animate-scaleUp">
        <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 mb-1">{property.name}</h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{property.address}</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 transition-colors flex items-center justify-center text-slate-400">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monthly Audit Log</h3>
            <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">3-Month Edit Window</span>
          </div>
          <div className="space-y-3">
            {[...bills].sort((a, b) => new Date(b.billingDate).getTime() - new Date(a.billingDate).getTime()).map(bill => {
              const isLocked = editableMonths.length > 0 && !editableMonths.includes(bill.billingDate);
              
              return (
                <div key={bill.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 border border-slate-100">
                      <i className={`fas ${bill.status === BillStatus.PAID ? 'fa-check-circle text-emerald-500' : 'fa-clock text-rose-500'}`}></i>
                    </div>
                    <div>
                      <div className="font-bold text-slate-700 text-sm">
                        {new Date(bill.billingDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${
                          bill.status === BillStatus.PAID ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {bill.status}
                        </span>
                        {bill.amount !== undefined && (
                          <span className="text-[10px] font-bold text-slate-500">₹{bill.amount.toLocaleString()}</span>
                        )}
                        {isLocked && <i className="fas fa-lock text-[8px] text-slate-300"></i>}
                      </div>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <div className="flex items-center gap-2">
                      {bill.attachmentName && (
                        <button 
                          onClick={() => setViewingAttachment(bill.attachmentName!)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 border border-slate-100 hover:bg-blue-50 transition-colors"
                          title="View Proof"
                        >
                          <i className="fas fa-eye text-[10px]"></i>
                        </button>
                      )}
                      <button 
                        disabled={isLocked}
                        onClick={() => !isLocked && onUpdateStatus?.(bill.id, bill.status === BillStatus.PAID ? BillStatus.UNPAID : BillStatus.PAID)}
                        className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                          isLocked 
                          ? 'text-slate-300 cursor-not-allowed' 
                          : 'text-blue-600 bg-blue-50 hover:bg-blue-100 active:scale-95'
                        }`}
                      >
                        {isLocked ? 'Locked' : 'Modify'}
                      </button>
                    </div>
                  )}
                  {!isAdmin && bill.attachmentName && (
                    <button 
                      onClick={() => setViewingAttachment(bill.attachmentName!)}
                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-600 border border-slate-100 hover:bg-blue-50 transition-colors"
                      title="View Proof"
                    >
                      <i className="fas fa-eye text-[10px]"></i>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {viewingAttachment && (
        <FileViewer 
          fileName={viewingAttachment} 
          onClose={() => setViewingAttachment(null)} 
        />
      )}
    </div>
  );
};

export default PropertyDetails;
