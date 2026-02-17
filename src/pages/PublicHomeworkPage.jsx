// Filename: src/pages/PublicHomeworkPage.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { Loader2, CheckCircle, AlertCircle, Sparkles, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

export function PublicHomeworkPage() {
  const { sessionId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null); // { session, homework, exercises }
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchHomework();
  }, [sessionId]);

  const fetchHomework = async () => {
    try {
      // 1. Get Session & Student Info
      const { data: sessionData, error: sessionError } = await supabase
        .from('class_sessions')
        .select('*, students(name, language)')
        .eq('id', sessionId)
        .single();
      
      if (sessionError) throw new Error("Class session not found.");

      // 2. Get Homework Set
      const { data: hwData, error: hwError } = await supabase
        .from('homework_sets')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (hwError) throw new Error("No homework assigned for this session.");

      // 3. Get Exercises
      const { data: exercises, error: exError } = await supabase
        .from('exercises')
        .select('*')
        .eq('homework_set_id', hwData.id)
        .order('id', { ascending: true });

      if (exError) throw exError;

      setData({ session: sessionData, homework: hwData, exercises: exercises || [] });
      
      // If already completed, show success state immediately
      if (hwData.status === 'completed') {
          setSubmitted(true);
      }

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (exId, value) => {
    setAnswers(prev => ({ ...prev, [exId]: value }));
  };

  const handleSubmit = async () => {
    if (!window.confirm("Submit homework? You cannot edit it afterwards.")) return;
    setSubmitting(true);

    try {
      // 1. Update Database
      const { error } = await supabase
        .from('homework_sets')
        .update({ 
            status: 'completed', 
            score: 'Completed' 
        })
        .eq('id', data.homework.id);

      if (error) throw error;

      // 2. Trigger Celebration
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      setSubmitted(true);

    } catch (err) {
      alert("Error submitting: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600"/></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600 gap-2"><AlertCircle /> {error}</div>;
  
  // SUCCESS STATE (After Submission)
  if (submitted) return (
      <div className="min-h-screen bg-indigo-900 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full animate-in zoom-in">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Great Job, {data.session.students.name}!</h1>
              <p className="text-gray-500 mb-8">Your homework has been sent to your teacher.</p>
              <p className="text-sm text-indigo-400 font-medium">You can close this tab now.</p>
          </div>
      </div>
  );

  // FORM STATE
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 text-indigo-700 rounded-xl mb-4">
                <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Homework for {data.session.students.name}</h1>
            <p className="text-gray-500">Please complete the exercises below.</p>
        </div>

        {/* Exercises Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-1 bg-indigo-600 h-2"></div>
            <div className="p-8 space-y-8">
                {data.exercises.length === 0 && (
                    <div className="text-center text-gray-400 py-10">No exercises found for this session.</div>
                )}

                {data.exercises.map((ex, index) => (
                    <div key={ex.id} className="space-y-3">
                        <div className="flex gap-4">
                            <span className="flex-none w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                            </span>
                            <div className="space-y-3 flex-1">
                                <h3 className="font-medium text-gray-900 text-lg">{ex.question}</h3>
                                <textarea 
                                    className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-h-[100px] text-gray-700 resize-none bg-gray-50 focus:bg-white"
                                    placeholder="Type your answer here..."
                                    value={answers[ex.id] || ''}
                                    onChange={(e) => handleInput(ex.id, e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button 
                    onClick={handleSubmit} 
                    disabled={submitting || Object.keys(answers).length < data.exercises.length || data.exercises.length === 0}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-500/30 active:scale-95"
                >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    Submit Homework
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}