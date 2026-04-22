import React, { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePrint } from '../../contexts/PrintContext';
import XeroxSidebar from '../../components/XeroxSidebar';
import { useIsMobile } from '../../hooks/use-mobile';
import { Menu, X } from 'lucide-react';

const XeroxLayout = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Protect route - only for xerox staff
  if (!currentUser || currentUser.role !== 'xerox') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && <XeroxSidebar />}

      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <XeroxSidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
              >
                <Menu className="h-6 w-6" />
              </button>
              <span className="ml-2 font-bold text-xl text-primary">Xerox Panel</span>
            </div>
            <div className="text-sm font-medium">
              {currentUser.name}
            </div>
          </header>
        )}

        <div className="flex-1 overflow-auto p-4 md:p-6">
          <main className="max-w-7xl mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default XeroxLayout;
