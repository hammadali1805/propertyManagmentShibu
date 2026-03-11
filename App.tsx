
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import SuperAdminView from './components/SuperAdminView';
import AdminView from './components/AdminView';
import { User, Property, Bill, BillStatus, UserRole, AuditLog } from './types';
import { authService } from './services/authService';
import { api } from './services/api';
import { MOCK_USERS } from './services/mockData';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [props, b, u] = await Promise.all([api.getProperties(), api.getBills(), api.getUsers()]);
        setProperties(props);
        setBills(b);
        setUsers(u);
      } catch (err) {
        console.error("Initialization failed", err);
      }
    };
    fetchData();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    try {
      const authenticatedUser = await authService.login(email, password);
      setUser(authenticatedUser as User);
      if (authenticatedUser.role === 'SUPER_ADMIN') {
        const logs = await api.getAuditLogs(authenticatedUser as User);
        setAuditLogs(logs);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during login');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleAddProperty = async (name: string, address: string, cityId: string, activeBillTypeIds: string[], rentAmount: number, assignedAdminId?: string) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const newProp = await api.addProperty(user, name, address, cityId, activeBillTypeIds, rentAmount, assignedAdminId);
      setProperties(prev => [...prev, newProp]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBillStatus = async (billId: string, updates: Partial<Bill>) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const updatedBill = await api.updateBillEntry(user, billId, updates);
      setBills(prev => prev.map(b => b.id === billId ? updatedBill : b));
      if (user.role === 'SUPER_ADMIN') {
        const logs = await api.getAuditLogs(user);
        setAuditLogs(logs);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (role: UserRole) => {
    const demoUser = users.find(u => u.role === role);
    if (demoUser) {
      setEmail(demoUser.email);
      setPassword(demoUser.password || 'password123');
    }
  };

  const handleAddAdmin = async (name: string, email: string, password: string) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const updatedUsers = await api.addAdmin(user, name, email, password);
      setUsers(updatedUsers);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const { users: updatedUsers, properties: updatedProps } = await api.deleteAdmin(user, adminId);
      setUsers(updatedUsers);
      setProperties(updatedProps);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignProperty = async (propertyId: string, adminId: string) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const updatedProps = await api.assignPropertyToAdmin(user, propertyId, adminId);
      setProperties(updatedProps);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnassignProperty = async (propertyId: string) => {
    if (!user) return;
    try {
      setIsLoading(true);
      const updatedProps = await api.unassignProperty(user, propertyId);
      setProperties(updatedProps);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/30 rounded-full blur-[100px]"></div>
        
        <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 relative z-10 transition-all hover:shadow-blue-900/5">
          <div className="flex flex-col items-center mb-10 text-center">
            {/* Brand Logo with Image Placeholder for Login Page */}
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-white rounded-[2rem] shadow-2xl shadow-slate-200 flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden border border-slate-50">
                <img 
                  src="assets/logo.png" 
                  alt="Veer Realty" 
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    // Fallback if image doesn't exist yet
                    (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/2563eb/ffffff?text=Veer+Realty';
                  }}
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-2xl shadow-lg">
                <div className="bg-slate-900 w-8 h-8 rounded-xl flex items-center justify-center">
                  <i className="fas fa-building text-white text-xs"></i>
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Veer<span className="text-blue-600"> Realty</span></h1>
            <p className="text-slate-400 mt-2 font-black uppercase tracking-[0.3em] text-[9px]">Intelligent Property OS</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Business Email" 
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" 
                required 
              />
            </div>
            <div className="relative">
              <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-sm"></i>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Secure Password" 
                className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all" 
                required 
              />
            </div>
            
            {error && <div className="text-[10px] font-black text-rose-600 uppercase text-center animate-shake bg-rose-50 py-2 rounded-lg">{error}</div>}
            
            <button 
              type="submit" 
              disabled={isLoggingIn} 
              className="group relative w-full bg-slate-900 text-white font-black py-4 rounded-2xl uppercase tracking-widest text-xs overflow-hidden active:scale-[0.98] transition-all hover:bg-black"
            >
              <span className="relative z-10">{isLoggingIn ? 'Authenticating...' : 'Enter Dashboard'}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-20"></div>
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-50">
            <p className="text-center text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Access Demo</p>
            <div className="flex justify-center gap-3">
              <button 
                onClick={() => fillDemoCredentials('SUPER_ADMIN')} 
                className="flex-1 py-3 px-4 rounded-xl border border-slate-100 text-[9px] font-black text-blue-600 uppercase hover:bg-blue-50 transition-colors"
              >
                Director
              </button>
              <button 
                onClick={() => fillDemoCredentials('ADMIN')} 
                className="flex-1 py-3 px-4 rounded-xl border border-slate-100 text-[9px] font-black text-slate-500 uppercase hover:bg-slate-50 transition-colors"
              >
                Field Ops
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[2px] z-[1000] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {user.role === 'SUPER_ADMIN' ? (
        <SuperAdminView 
          properties={properties} 
          bills={bills} 
          onAddProperty={handleAddProperty} 
          auditLogs={auditLogs} 
          user={user} 
          users={users}
          onAddAdmin={handleAddAdmin}
          onDeleteAdmin={handleDeleteAdmin}
          onAssignProperty={handleAssignProperty}
          onUnassignProperty={handleUnassignProperty}
        />
      ) : (
        <AdminView properties={properties} bills={bills} onUpdateStatus={updateBillStatus} user={user} />
      )}
    </Layout>
  );
};

export default App;
