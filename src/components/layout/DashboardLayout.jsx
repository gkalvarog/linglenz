// Filename: src/components/layout/DashboardLayout.jsx
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { useState } from 'react';
import clsx from 'clsx';

// Icons
import { Users, Clock, Home, Settings, Aperture, Menu, X, ChevronRight } from 'lucide-react';

/**
 * Internal NavLink Component for consistent Sidebar styling.
 * FIX: We explicitly assign the icon to a variable to satisfy strict linters.
 */
function NavLink({ to, icon, children, onClick }) {
  const location = useLocation();
  // Check if current path starts with the link (handling sub-routes)
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  // Explicitly assign to a PascalCase variable for JSX rendering
  const IconComponent = icon;

  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={clsx(
        'group flex items-center justify-between py-3 px-4 mx-2 rounded-lg transition-all duration-200',
        isActive 
          ? 'bg-gray-800 text-white font-medium shadow-md border-l-4 border-indigo-500' // Active: Brand Green Border
          : 'text-gray-400 hover:bg-gray-800 hover:text-white' // Inactive: Subtle Hover
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
  const location = useLocation();
  const currentPath = location.pathname;
  const { activeSession } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Logic: Show Banner if session is active AND we are not currently in that session
  const showBanner = activeSession && !currentPath.startsWith(`/class/session/${activeSession.id}`);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* --- GLOBAL ALERT BANNER --- */}
      {showBanner && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-indigo-700 text-white px-4 py-2 text-center font-medium shadow-lg flex justify-between items-center transition-transform duration-300">
          <div className="flex items-center space-x-2 animate-pulse">
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
            <span className="text-sm font-semibold tracking-wide truncate">
              Live Session: {activeSession.name}
            </span>
          </div>
          <Link 
            to={`/class/session/${activeSession.id}`} 
            className="bg-white text-indigo-800 px-4 py-1 rounded-full text-xs font-bold hover:bg-gray-100 hover:scale-105 transition-all shadow-sm flex items-center gap-1"
          >
            Resume <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

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
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          // Push sidebar down if banner is visible
          showBanner ? 'md:mt-[40px] h-[calc(100vh-40px)]' : 'h-screen'
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

        {/* User Profile Footer (Placeholder for now) */}
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
      <div className={clsx(
        "flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300",
        showBanner ? 'mt-[40px] h-[calc(100vh-40px)]' : 'h-screen'
      )}>
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