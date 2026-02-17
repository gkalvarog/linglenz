// Filename: src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import { supabase } from '../api/supabaseClient';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AddStudentModal } from '../features/students/AddStudentModal';
import { StudentListItem } from '../features/students/StudentListItem';
import { Plus, LogOut, Loader2 } from 'lucide-react';

export function DashboardPage({ session }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [students, setStudents] = useState([]);
  const [homeworkMap, setHomeworkMap] = useState({}); // Student has homework to do
  const [reviewMap, setReviewMap] = useState({});     // Teacher has review to do (NEW)
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null); 

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Students
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (studentError) throw studentError;

      // 2. Fetch Active Session
      const { data: activeData } = await supabase
        .from('class_sessions')
        .select('id, students(name)')
        .eq('user_id', session.user.id)
        .eq('status', 'in_progress')
        .maybeSingle();

      // 3. Fetch Homework Status (Student's Turn)
      const { data: hwData } = await supabase
        .from('homework_sets')
        .select('student_id')
        .eq('user_id', session.user.id)
        .eq('status', 'pending');

      // 4. Fetch Review Status (Teacher's Turn) <--- NEW
      const { data: reviewData } = await supabase
        .from('class_sessions')
        .select('student_id')
        .eq('user_id', session.user.id)
        .eq('status', 'pending_review');

      // Create lookup maps
      const hwMap = {};
      if (hwData) hwData.forEach(item => hwMap[item.student_id] = true);

      const revMap = {};
      if (reviewData) reviewData.forEach(item => revMap[item.student_id] = true);

      setStudents(studentData || []);
      setActiveSession(activeData);
      setHomeworkMap(hwMap);
      setReviewMap(revMap);

    } catch (error) {
      console.error('Dash Error:', error.message);
      setError("Could not load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }, [session.user.id]);

  useEffect(() => { 
      fetchData(); 
  }, [fetchData, location.key]); 

  // Actions
  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm("Delete this student? History will be lost.")) return;
    setStudents(prev => prev.filter(s => s.id !== studentId)); 
    try {
      await supabase.from('students').delete().eq('id', studentId);
    } catch (error) {
      fetchData();
    }
  };

  const handleStartClass = async (studentId) => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      if (activeSession) {
        const name = activeSession.students?.name || 'Unknown';
        if (window.confirm(`Class in Progress with ${name}!\n\nClick OK to RESUME it.\nClick CANCEL to abort.`)) {
          navigate(`/class/session/${activeSession.id}`);
          return;
        } else {
          setIsStarting(false); 
          return;
        }
      }
      const { data: newSession, error } = await supabase
        .from('class_sessions')
        .insert({
          student_id: studentId,
          user_id: session.user.id,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select().single();

      if (error) throw error;
      navigate(`/class/session/${newSession.id}`);

    } catch (error) {
      alert("Start failed: " + error.message);
      setIsStarting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Students</h1>
          <p className="mt-1 text-gray-500 text-sm">Select a student to begin a session.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={() => setIsAddModalOpen(true)} className="p-3 bg-indigo-700 text-white rounded-full shadow hover:bg-indigo-800"><Plus className="w-6 h-6" /></button>
          <button onClick={() => supabase.auth.signOut()} className="p-3 bg-white text-gray-500 border rounded-full shadow hover:text-red-600"><LogOut className="w-6 h-6" /></button>
        </div>
      </div>
      
      <div className="space-y-4">
        {isLoading && <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-300" />}
        
        {!isLoading && !error && students.length > 0 && (
          <div className="grid gap-4 grid-cols-1">
            {students.map((student) => (
              <StudentListItem 
                key={student.id} 
                student={student} 
                onStartClass={handleStartClass} 
                onDelete={handleDeleteStudent}
                homeworkStatus={homeworkMap[student.id] ? 'pending' : null} 
                reviewStatus={reviewMap[student.id] ? 'pending' : null} // <--- PASSING THE NEW PROP
              />
            ))}
          </div>
        )}

        {!isLoading && !error && students.length === 0 && (
             <div className="text-center py-10 text-gray-400">No students found. Click + to add one.</div>
        )}
      </div>

      <AddStudentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} session={session} onStudentAdded={fetchData} />
      {isStarting && <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-700" /></div>}
    </DashboardLayout>
  );
}