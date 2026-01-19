// Filename: src/pages/SettingsPage.jsx
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { supabase } from '../api/supabaseClient';
import { User, Shield, LogOut } from 'lucide-react';

/**
 * User Configuration Page.
 * Currently handles Logout and basic profile visualization.
 */
export function SettingsPage({ session }) {
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    // App.jsx will automatically redirect to /auth
  };

  const userEmail = session?.user?.email || 'Unknown User';
  const userId = session?.user?.id || 'N/A';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Manage your account and application preferences.</p>
        </div>

        {/* Profile Section */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Account Profile</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email Address</label>
              <div className="text-gray-900 font-medium font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200 inline-block">
                {userEmail}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">User ID</label>
              <div className="text-xs text-gray-400 font-mono">
                {userId}
              </div>
            </div>
          </div>
        </section>

        {/* Security / Actions */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Security & Actions</h2>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 text-sm mb-4">
              Sign out of your active session on this device.
            </p>
            <Button 
              onClick={handleLogout} 
              variant="secondary"
              className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
              icon={LogOut}
            >
              Sign Out
            </Button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}