// Filename: src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';

// Layout & Features
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { AddStudentModal } from '../features/students/AddStudentModal';
import { StudentListItem } from '../features/students/StudentListItem';

// Icons
import { Plus, LogOut, Loader2, Users } from 'lucide-react';

export function DashboardPage({ session }) {
  const navigate = useNavigate();

  // --- State ---
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false); // Prevents double-clicks
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // --- Data Fetching ---
  const getStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
      
    } catch (error) {
      console.error('Error fetching students:', error.message);
      // Optional: set error state to show UI alert
    } finally {
      setIsLoading(false);
    }
  }, [session.user.id]);

  // Initial Load
  useEffect(() => {
    getStudents();
  }, [getStudents]);


  // --- Logic: Start or Resume Class ---
  const handleStartClass = async (studentId) => {
    if (isStarting) return; // Lock
    setIsStarting(true);

    try {
      // 1. Integrity Check: Is there already a class in progress?
      const { data: existingSession, error: checkError } = await supabase
        .from('class_sessions')
        .select('id, students(name)')
        .eq('user_id', session.user.id)
        .eq('status', 'in_progress')
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingSession) {
        const studentName = existingSession.students?.name || 'Unknown Student';
        const confirmResume = window.confirm(
          `You already have a class in progress with ${studentName}.\n\nClick OK to RESUME it.\nClick Cancel to ABANDON it and start a NEW class.`
        );

        if (confirmResume) {
          navigate(`/class/session/${existingSession.id}`);
          return; // Exit, do not create new
        } else {
          // Ideally, we should update the old session to 'abandoned' here for data cleanliness
          await supabase
            .from('class_sessions')
            .update({ status: 'abandoned', finished_at: new Date().toISOString() })
            .eq('id', existingSession.id);
        }
      }

      // 2. Create New Session
      const { data: newSession, error: createError } = await supabase
        .from('class_sessions')
        .insert({
          student_id: studentId,
          user_id: session.user.id,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) throw createError;

      // 3. Navigate
      navigate(`/class/session/${newSession.id}`);

    } catch (error) {
      console.error("Start Class Error:", error.message);
      alert("Failed to start class: " + error.message);
      setIsStarting(false); // Unlock only on error
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Router will handle redirect based on session state
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Students</h1>
          <p className="mt-1 text-gray-500 text-sm">Select a student to begin a Ling Lenz session.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="flex items-center justify-center p-3 bg-indigo-700 text-white rounded-full shadow-lg hover:bg-indigo-800 hover:scale-105 transition-all duration-200"
            title="Add New Student"
          >
            <Plus className="w-6 h-6" />
          </button>
          
          <button 
            onClick={handleLogout} 
            className="flex items-center justify-center p-3 bg-white text-gray-500 border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 hover:text-red-600 transition-colors"
            title="Secure Logout"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
             <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-300" />
             <p>Loading student roster...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-300 text-center">
            <div className="mx-auto bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No students yet</h3>
            <p className="text-gray-500 mb-6">Get started by adding your first student.</p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Add a student now &rarr;
            </button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1">
            {students.map((student) => (
              <StudentListItem 
                key={student.id} 
                student={student}
                onStartClass={handleStartClass}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddStudentModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        session={session}
        onStudentAdded={getStudents}
      />
      
      {/* Overlay for start locking */}
      {isStarting && (
        <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center cursor-wait">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-700" />
        </div>
      )}
    </DashboardLayout>
  );
}