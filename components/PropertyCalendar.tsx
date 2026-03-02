
import React, { useState, useMemo } from 'react';
import { BillConfig, Bill, BillType } from '../types';

interface PropertyCalendarProps {
  propertyId: string;
  billConfigs: BillConfig[];
  bills: Bill[];
  billTypes: BillType[];
}

const PropertyCalendar: React.FC<PropertyCalendarProps> = ({ propertyId, billConfigs, bills, billTypes }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const days = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add actual days
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }

    return days;
  }, [year, month]);

  const importantDates = useMemo(() => {
    const dates: Record<number, { label: string; icon: string; color: string; type: 'DEADLINE' | 'BILL'; status?: string }[]> = {};
    
    // 1. Handle Billing Deadlines (Configs)
    if (Array.isArray(billConfigs)) {
      billConfigs.forEach(config => {
        if (!config.propertyId || config.propertyId === propertyId) {
          const deadline = new Date(config.deadlineDate);
          const bt = Array.isArray(billTypes) ? billTypes.find(t => t.id === config.billTypeId) : undefined;
          
          // Logic for recurring or specific deadlines
          const isMonthly = config.frequency === 'MONTHLY';
          const isCurrentMonth = deadline.getFullYear() === year && deadline.getMonth() === month;
          
          if (isMonthly || isCurrentMonth) {
            const day = deadline.getDate();
            if (!dates[day]) dates[day] = [];
            
            // Avoid duplicates for the same utility on the same day
            if (!dates[day].find(d => d.label.includes(bt?.name || '') && d.type === 'DEADLINE')) {
              dates[day].push({
                type: 'DEADLINE',
                label: `${bt?.name || 'Utility'} Deadline`,
                icon: bt?.icon || 'fa-clock',
                color: 'text-amber-600 bg-amber-50 border-amber-100'
              });
            }
          }
        }
      });
    }

    // 2. Handle Actual Bill Records
    if (Array.isArray(bills)) {
      bills.filter(b => b.propertyId === propertyId).forEach(bill => {
        const bDate = new Date(bill.billingDate);
        if (bDate.getFullYear() === year && bDate.getMonth() === month) {
          const day = bDate.getDate();
          const bt = Array.isArray(billTypes) ? billTypes.find(t => t.id === bill.billTypeId) : undefined;
          
          if (!dates[day]) dates[day] = [];
          dates[day].push({
            type: 'BILL',
            label: `${bt?.name || 'Bill'} ${bill.status}`,
            status: bill.status,
            icon: bill.status === 'PAID' ? 'fa-check-circle' : 'fa-exclamation-circle',
            color: bill.status === 'PAID' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-rose-600 bg-rose-50 border-rose-100'
          });
        }
      });
    }
    
    return dates;
  }, [billConfigs, propertyId, year, month, billTypes, bills]);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden animate-fadeIn">
      <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-calendar-alt text-sm"></i>
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest">{monthNames[month]} {year}</h3>
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Utility Deadlines</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => changeMonth(-1)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-chevron-left text-[10px]"></i>
          </button>
          <button 
            onClick={() => changeMonth(1)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <i className="fas fa-chevron-right text-[10px]"></i>
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.isArray(calendarDays) && calendarDays.map((day, idx) => {
            const events = day ? (importantDates[day] || []) : [];
            const isToday = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
            
            return (
              <div 
                key={idx} 
                className={`min-h-[60px] sm:min-h-[80px] p-2 rounded-xl border transition-all relative ${
                  day ? 'bg-white border-slate-50' : 'bg-slate-50/30 border-transparent'
                } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                {day && (
                  <>
                    <span className={`text-[10px] font-black ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-1">
                      {Array.isArray(events) && events.map((event, eIdx) => (
                        <div 
                          key={eIdx}
                          className={`px-1.5 py-0.5 border rounded text-[7px] font-black uppercase truncate flex items-center gap-1 ${event.color}`}
                          title={event.label}
                        >
                          <i className={`fas ${event.icon} text-[6px]`}></i>
                          <span className="hidden sm:inline">{event.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Deadline</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Paid Bill</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Unpaid Bill</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full ring-2 ring-blue-500"></div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCalendar;
