// Filename: src/components/ui/ActiveSessionBanner.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { PlayCircle } from 'lucide-react';

export function ActiveSessionBanner() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSession, setActiveSession] = useState(null);

  // Check for active session on every page load
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('class_sessions')
        .select('id, students(name)')
        .eq('user_id', user.id)
        .eq('status', 'in_progress')
        .maybeSingle();

      setActiveSession(data);
    };

    checkSession();
  }, [location.pathname]); // Re-check when changing pages

  // Don't show banner if we are ALREADY inside the class
  if (!activeSession) return null;
  if (location.pathname.includes(`/class/session/${activeSession.id}`)) return null;

  return (
    <div 
      onClick={() => navigate(`/class/session/${activeSession.id}`)}
      className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-indigo-700 transition-colors shadow-md z-50 relative"
    >
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-white/20 rounded-full animate-pulse">
           <PlayCircle className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-0 md:gap-2">
            <span className="font-bold text-sm uppercase tracking-wider">Class in Progress</span>
            <span className="hidden md:inline text-indigo-300">•</span>
            <span className="text-indigo-100 text-sm">Resume session with {activeSession.students?.name}</span>
        </div>
      </div>
      <div className="bg-white text-indigo-700 px-3 py-1.5 rounded-lg font-bold text-xs uppercase tracking-wide">
        Resume &rarr;
      </div>
    </div>
  );
}