// Filename: src/pages/PendingReviewPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Trash2, Calendar, Clock, User, AlertCircle, Loader2 } from 'lucide-react';

export function PendingReviewPage({ session }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Data Fetching ---
  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      const { data, error: dbError } = await supabase
        .from('class_sessions')
        .select(`
          id, 
          created_at, 
          started_at, 
          finished_at, 
          students ( name )
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'pending_review')
        .order('finished_at', { ascending: false }); // Newest first

      if (dbError) throw dbError;
      setSessions(data || []);
      
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Could not load pending reviews.");
    } finally {
      setLoading(false);
    }
  }, [session.user.id]);

  // --- Real-Time Subscription ---
  useEffect(() => {
    fetchSessions();

    const channel = supabase
      .channel('pending_reviews_changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'class_sessions',
          filter: `user_id=eq.${session.user.id}` // Server-side filtering
        },
        () => {
          // Refresh list on any change
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSessions, session.user.id]);

  // --- Handlers ---
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this session record?')) return;

    // Optimistic Update: Remove from UI immediately
    setSessions(prev => prev.filter(s => s.id !== id));

    const { error: deleteError } = await supabase
      .from('class_sessions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      alert("Failed to delete. The item might reappear on refresh.");
      fetchSessions(); // Revert/Refresh if failed
    }
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    const mins = Math.round((new Date(end) - new Date(start)) / 60000);
    return `${mins} min`;
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Review</h1>
          <p className="text-gray-500 text-sm mt-1">Class sessions waiting for homework generation.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 min-h-[300px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p>Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-gray-900 font-medium text-lg">All caught up!</h3>
            <p className="text-gray-500 max-w-xs mx-auto mt-1">You have no class sessions pending review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <div 
                key={s.id} 
                className="border border-gray-100 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-indigo-100 hover:shadow-md transition-all duration-200 bg-gray-50/50"
              >
                <div className="space-y-1 w-full md:w-auto">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500"/> 
                    {s.students?.name || 'Unknown Student'}
                  </h3>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4"/> 
                      {new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4"/> 
                      {formatDuration(s.started_at, s.finished_at)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <Link 
                    to={`/homework/session/${s.id}`} 
                    className="flex-1 md:flex-none text-center bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-800 transition-colors shadow-sm text-sm"
                  >
                    Review & Generate
                  </Link>
                  <button 
                    onClick={() => handleDelete(s.id)} 
                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    title="Delete Record"
                  >
                    <Trash2 className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}