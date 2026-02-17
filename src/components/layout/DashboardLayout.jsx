// Filename: src/components/layout/DashboardLayout.jsx
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import clsx from 'clsx';

// Icons
import { Users, Clock, Home, Settings, Aperture, Menu, X, ChevronRight } from 'lucide-react';

// COMPONENTS
import { ActiveSessionBanner } from '../ui/ActiveSessionBanner'; // Import the new banner

/**
 * Internal NavLink Component for consistent Sidebar styling.
 */
function NavLink({ to, icon, children, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  const IconComponent = icon;

  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={clsx(
        'group flex items-center justify-between py-3 px-4 mx-2 rounded-lg transition-all duration-200',
        isActive 
          ? 'bg-gray-800 text-white font-medium shadow-md border-l-4 border-indigo-500'
          : 'text-gray-400 hover:bg-gray-800 hover:text-white'
      )}
    >
      <div className="flex items-center space-x-3">
        <IconComponent className={clsx("w-5 h-5 flex-shrink-0", isActive ? "text-indigo-400" : "text-gray-500 group-hover:text-gray-300")} />
        <span>{children}</span>
      </div>
      {isActive && <ChevronRight className="w-4 h-4 text-gray-600" />}
    </Link>
  );
}

export function DashboardLayout({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* --- MOBILE MENU OVERLAY --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* --- SIDEBAR NAVIGATION --- */}
      <aside 
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 bg-black text-white flex flex-col transition-transform duration-300 ease-out md:relative md:translate-x-0 shadow-2xl border-r border-gray-800',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-800 bg-black/50 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-900 to-black p-1.5 rounded-lg border border-indigo-500/30">
              <Aperture className="w-6 h-6 text-indigo-500" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Ling Lenz</span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="md:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-grow py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="px-6 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Workspace
          </div>
          <NavLink to="/" icon={Users} onClick={() => setIsMobileMenuOpen(false)}>
            Students
          </NavLink>
          <NavLink to="/pending" icon={Clock} onClick={() => setIsMobileMenuOpen(false)}>
            Pending Review
          </NavLink>
          
          <div className="px-6 mt-8 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Resources
          </div>
          <NavLink to="/homework" icon={Home} onClick={() => setIsMobileMenuOpen(false)}>
            Homework
          </NavLink>
          <NavLink to="/settings" icon={Settings} onClick={() => setIsMobileMenuOpen(false)}>
            Settings
          </NavLink>
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-200">
              T
            </div>
            <div>
              <p className="text-sm font-medium text-white">Teacher Mode</p>
              <p className="text-xs text-gray-500">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300">
        
        {/* GLOBAL BANNER: Placed here so it pushes content down */}
        <ActiveSessionBanner />

        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm z-20 sticky top-0">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600 hover:text-gray-900">
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-bold text-gray-800 flex items-center gap-2">
             <Aperture className="w-5 h-5 text-indigo-700" />
             Ling Lenz
          </span>
          <div className="w-6" /> {/* Spacer for centering */}
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8 relative scroll-smooth">
          <div className="max-w-7xl mx-auto min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}