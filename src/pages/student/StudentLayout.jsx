
import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/Sidebar';
import { usePrint } from '../../contexts/PrintContext';
import { useIsMobile } from '../../hooks/use-mobile';
import { Menu, X } from 'lucide-react';

const StudentLayout = () => {
  const { currentUser } = useAuth();
  const { serverActive } = usePrint();
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Protect route - only for students
  if (!currentUser || currentUser.role !== 'student') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar />}

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
            <Sidebar />
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
              <span className="ml-2 font-bold text-xl text-primary">PrintHub</span>
            </div>
            <div className="text-sm font-medium truncate max-w-[150px]">
              {currentUser.name}
            </div>
          </header>
        )}

        {!serverActive && (
          <div className="bg-red-500 text-white text-center py-2 text-sm">
            Server is currently offline. Document uploads are disabled.
          </div>
        )}
        
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {!isMobile && (
            <header className="mb-8">
              <h1 className="text-2xl font-bold">Welcome, {currentUser.name}</h1>
            </header>
          )}
          
          <main className="max-w-7xl mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
