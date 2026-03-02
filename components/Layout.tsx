
import React from 'react';
import { User } from '../types';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Brand Logo with Image Placeholder */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="bg-white w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 overflow-hidden border border-slate-100">
                  <img 
                    src="assets/logo.png" 
                    alt="Veer Realty" 
                    className="w-full h-full object-contain p-1"
                    onError={(e) => {
                      // Fallback if image doesn't exist yet
                      (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/2563eb/ffffff?text=VR';
                    }}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full">
                  <div className="bg-slate-800 w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    <i className="fas fa-building text-[7px] text-white"></i>
                  </div>
                </div>
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-lg sm:text-xl font-black tracking-tighter text-slate-900">Veer<span className="text-blue-600"> Realty</span></span>
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-400">Management</span>
              </div>
            </div>
            
            {user && (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="text-right hidden xs:block">
                  <p className="text-[10px] sm:text-sm font-semibold text-slate-700 truncate max-w-[80px] sm:max-w-none">{user.name}</p>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider font-black">{user.role.replace('_', ' ')}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="flex items-center gap-1 sm:gap-2 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>

      <footer className="bg-white border-t py-6 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-[10px] sm:text-sm text-slate-500 font-medium">© 2025 Veer Realty Systems. Professional property management.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
