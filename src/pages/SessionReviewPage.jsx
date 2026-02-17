// Filename: src/pages/SessionReviewPage.jsx
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../api/supabaseClient';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ArrowLeft, Sparkles, Trash2, Globe, Copy, CheckSquare, Square } from 'lucide-react'; 

export function SessionReviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [mistakes, setMistakes] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set()); // <--- NEW: Selection State
  const [generating, setGenerating] = useState(false);
  const [homeworkLink, setHomeworkLink] = useState(null);

  useEffect(() => { if (sessionId) fetchSpecificSession(); }, [sessionId]);

  const fetchSpecificSession = async () => {
    try {
      const { data: sessionData, error } = await supabase
        .from('class_sessions')
        .select('*, students(*)')
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      setSession(sessionData);

      const { data: mistakeData } = await supabase
        .from('mistakes')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      
      setMistakes(mistakeData || []);
      // Default: Select ALL mistakes
      setSelectedIds(new Set(mistakeData?.map(m => m.id)));

    } catch (err) {
      console.error(err);
      navigate('/pending');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Permanently delete this mistake?")) return;
    setMistakes(prev => prev.filter(m => m.id !== id));
    setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
    });
    await supabase.from('mistakes').delete().eq('id', id);
  };

  const toggleSelect = (id) => {
      setSelectedIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
      });
  };

  const toggleSelectAll = () => {
      if (selectedIds.size === mistakes.length) {
          setSelectedIds(new Set()); // Deselect all
      } else {
          setSelectedIds(new Set(mistakes.map(m => m.id))); // Select all
      }
  };

  const handleGenerateHomework = async () => {
    if (selectedIds.size === 0) {
        alert("Please select at least one mistake to include.");
        return;
    }
    setGenerating(true);
    
    try {
        // 1. Create the Homework Container (The "Set")
        const { data: hwSet, error: insertError } = await supabase
            .from('homework_sets')
            .insert({
                session_id: sessionId,
                user_id: session.user_id,
                student_id: session.student_id,
                status: 'pending',
                topics: ['Review', 'Corrections'] 
            })
            .select()
            .single();

        if (insertError) throw insertError;

        // 2. Create the Actual Exercises (The Questions) <--- THIS WAS MISSING
        const exercisesToInsert = mistakes
            .filter(m => selectedIds.has(m.id))
            .map(m => ({
                homework_set_id: hwSet.id,
                question: `Fix the error in this sentence: "${m.mistake_text}"`,
                prompt: "Rewrite the sentence correctly.",
                answer: m.corrected_sentence
            }));

        const { error: exercisesError } = await supabase
            .from('exercises')
            .insert(exercisesToInsert);

        if (exercisesError) throw exercisesError;

        // 3. Update Session Status
        // CRITICAL: We mark the session as 'completed' so the "Needs Review" badge disappears.
        // We mark homework_status as 'pending' so the "Homework Pending" badge appears.
        const { error: updateError } = await supabase.from('class_sessions')
            .update({ 
                status: 'completed',       // Teacher is done -> Badge OFF
                homework_status: 'pending' // Student is busy -> Badge ON
            })
            .eq('id', sessionId);
            
        if (updateError) throw updateError;

        // 4. Show the Link
        const link = `${window.location.origin}/hw/${sessionId}`;
        setHomeworkLink(link);

    } catch (err) {
        console.error("DB Save failed:", err);
        alert(`Failed to save homework: ${err.message}`); 
    } finally {
        setGenerating(false);
    }
  };

  const handleFinish = () => {
      navigate('/'); // Return to Dashboard
  };

  if (loading) return <DashboardLayout>Loading...</DashboardLayout>;

  return (
    <DashboardLayout>
       <div className="mb-6 flex items-center gap-4">
          <button onClick={() => navigate('/pending')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft className="w-6 h-6 text-gray-600" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review: {session?.students?.name}</h1>
            <p className="text-gray-500 text-sm">Select mistakes to include in the homework.</p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LIST */}
          <div className="lg:col-span-2 space-y-4">
             {mistakes.length === 0 && <div className="p-12 text-center border-2 border-dashed bg-gray-50 text-gray-400">No mistakes logged.</div>}
             
             {mistakes.length > 0 && (
                 <div className="flex justify-end mb-2">
                     <button onClick={toggleSelectAll} className="text-sm text-indigo-600 font-bold hover:underline">
                         {selectedIds.size === mistakes.length ? "Deselect All" : "Select All"}
                     </button>
                 </div>
             )}

             {mistakes.map(m => {
                 const isSelected = selectedIds.has(m.id);
                 return (
                     <div key={m.id} className={`p-4 rounded-xl border flex gap-4 transition-all ${isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 opacity-70'}`}>
                        {/* CHECKBOX */}
                        <button onClick={() => toggleSelect(m.id)} className="pt-1">
                            {isSelected ? <CheckSquare className="w-6 h-6 text-indigo-600" /> : <Square className="w-6 h-6 text-gray-300" />}
                        </button>

                        <div className="flex-1">
                            <p className="text-red-500 line-through decoration-red-300 decoration-2">{m.mistake_text}</p>
                            <p className="text-green-700 font-bold mt-1">{m.corrected_sentence}</p>
                        </div>
                        <button onClick={() => handleDelete(m.id)}><Trash2 className="w-5 h-5 text-gray-300 hover:text-red-500" /></button>
                     </div>
                 );
             })}
          </div>

          {/* SIDEBAR */}
          <div className="lg:col-span-1">
             <div className="bg-slate-900 text-white p-6 rounded-2xl sticky top-6 shadow-xl">
                <Sparkles className="w-8 h-8 text-yellow-400 mb-4" />
                <h2 className="text-xl font-bold mb-2">Digital Homework</h2>
                <p className="text-slate-400 text-sm mb-6">
                    {selectedIds.size} exercises selected for {session?.students?.name}.
                </p>

                {!homeworkLink ? (
                    <button 
                        onClick={handleGenerateHomework} 
                        disabled={generating || selectedIds.size === 0} 
                        className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {generating ? "Building..." : "Generate Web Link"}
                    </button>
                ) : (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                            <p className="text-xs text-slate-400 uppercase font-bold mb-1">Send this to student:</p>
                            <div className="flex items-center gap-2 bg-black/20 p-2 rounded border border-white/5">
                                <Globe className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-mono text-sm truncate flex-1 select-all">{homeworkLink}</span>
                                <button onClick={() => { navigator.clipboard.writeText(homeworkLink); alert("Link copied!"); }} className="p-1 hover:bg-white/20 rounded text-slate-300 hover:text-white">
                                    <Copy className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>
                        <button onClick={handleFinish} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-50">Done (Archive Session)</button>
                    </div>
                )}
             </div>
          </div>
       </div>
    </DashboardLayout>
  );
}