// Filename: src/pages/PendingReviewPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom'; // Added useSearchParams
import { supabase } from '../api/supabaseClient';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Trash2, Calendar, Clock, User, AlertCircle, Loader2, X } from 'lucide-react';

export function PendingReviewPage({ session }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // FIX: Read the student ID from the URL
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStudentId = searchParams.get('studentId');

  const fetchSessions = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      let query = supabase
        .from('class_sessions')
        .select(`
          id, created_at, started_at, finished_at, 
          students ( id, name )
        `)
        .eq('user_id', session.user.id)
        .eq('status', 'pending_review')
        .order('finished_at', { ascending: false });

      // FIX: Apply filter if it exists
      if (filterStudentId) {
          query = query.eq('student_id', filterStudentId);
      }

      const { data, error: dbError } = await query;

      if (dbError) throw dbError;
      setSessions(data || []);
      
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Could not load pending reviews.");
    } finally {
      setLoading(false);
    }
  }, [session.user.id, filterStudentId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure? This cannot be undone.')) return;
    setSessions(prev => prev.filter(s => s.id !== id));
    await supabase.from('class_sessions').delete().eq('id', id);
  };

  const clearFilter = () => {
      setSearchParams({}); // Remove ?studentId=...
  };

  const formatTimeRange = (start, end) => {
    if (!start || !end) return 'N/A';
    const t1 = new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const t2 = new Date(end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${t1} — ${t2}`;
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
              {filterStudentId && sessions.length > 0 ? `Reviews for ${sessions[0].students?.name}` : "Pending Reviews"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">Select a session to correct mistakes and generate homework.</p>
        </div>
        {filterStudentId && (
            <button onClick={clearFilter} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                <X className="w-4 h-4" /> Show All
            </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5" /> {error}
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
            <p className="text-gray-500 max-w-xs mx-auto mt-1">
                {filterStudentId ? "No pending reviews for this student." : "You have no classes waiting for review."}
            </p>
            {filterStudentId && (
                <button onClick={clearFilter} className="mt-4 text-indigo-600 font-bold hover:underline">View All Students</button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => (
              <div key={s.id} className="border border-gray-100 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-indigo-100 hover:shadow-md transition-all duration-200 bg-gray-50/50">
                <div className="space-y-1 w-full md:w-auto">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-indigo-500"/> 
                    {s.students?.name || 'Unknown Student'}
                  </h3>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4"/> 
                      {new Date(s.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 font-mono bg-gray-200 px-2 py-0.5 rounded text-xs text-gray-700">
                      <Clock className="w-3 h-3"/> 
                      {formatTimeRange(s.started_at, s.finished_at)}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <Link 
                    to={`/pending/${s.id}`} 
                    className="flex-1 md:flex-none text-center bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-indigo-800 transition-colors shadow-sm text-sm"
                  >
                    Review & Generate
                  </Link>
                  <button 
                    onClick={() => handleDelete(s.id)} 
                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
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