// Filename: src/pages/ClassPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabaseClient';
import { checkStudentSentence } from '../api/geminiClient';
import { useSession } from '../context/SessionContext';
import { useAudioRecorder } from '../features/students/useAudioRecorder';
import { getLanguageFlag } from '../utils/flags';

// UI Components
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { MistakeAnalyzerForm } from '../features/students/MistakeAnalyzerForm';
import { StudentMistakeCard } from '../features/students/StudentMistakeCard'; 
import { WherebyVideo } from '../features/students/WherebyVideo';
import { Button } from '../components/ui/Button';

// Icons & Utils
import { Mic, Square, Copy, Check, LogOut, Maximize2, Minimize2, Video, VideoOff } from 'lucide-react';
import clsx from 'clsx';

export function ClassPage() {
   const { sessionId } = useParams();
   const navigate = useNavigate();
   const { setActiveSession } = useSession();

   // --- Global State ---
   const [session, setSession] = useState(null);
   const [student, setStudent] = useState(null);
   const [roomUrl, setRoomUrl] = useState(null);
   
   // --- UI State ---
   const [isLoading, setIsLoading] = useState(true);
   const [isFinishing, setIsFinishing] = useState(false);
   const [inviteCopied, setInviteCopied] = useState(false);
   
   // --- View Mode State ---
   const [showVideo, setShowVideo] = useState(true);
   const [isFocusMode, setIsFocusMode] = useState(false);
   
   // --- Data State (The Feed) ---
   const [sessionLog, setSessionLog] = useState([]);

   // --- 1. Load Session & History ---
   const fetchSessionData = useCallback(async () => {
      setIsLoading(true);
      try {
         const { data: { session: authSession } } = await supabase.auth.getSession();
         if (!authSession) { navigate('/'); return; }
         setSession(authSession);

         const { data: classData, error } = await supabase
            .from('class_sessions')
            .select(`id, student_id, user_id, students (name, language)`)
            .eq('id', sessionId)
            .single();

         if (error) throw error;
         setStudent(classData.students);
         setActiveSession({ id: sessionId, name: classData.students.name });

         const { data: history, error: historyError } = await supabase
            .from('mistakes')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false });

         if (!historyError && history) {
            const formattedHistory = history.map(item => ({
               id: item.id,
               original: item.mistake_text,
               correction: item.corrected_sentence,
               explanation: item.explanation,
               categories: item.category,
               is_correct: item.is_correct,
               status: 'done'
            }));
            setSessionLog(formattedHistory);
         }

      } catch (error) {
         console.error("Initialization Error:", error);
         navigate('/');
      } finally {
         setIsLoading(false);
      }
   }, [sessionId, navigate, setActiveSession]);

   useEffect(() => {
      fetchSessionData();
      return () => setActiveSession(null);
   }, [fetchSessionData, setActiveSession]);


   // --- 2. Intelligent Processing (AUTO-RETRY ADDED) ---
   
   const processAndSave = async (text, tempId, source, retryCount = 0) => {
      try {
           // A. Call AI
           const result = await checkStudentSentence(text, student.language);
           
           // B. Save to Database
           const { data: savedRecord, error } = await supabase.from('mistakes').insert({
               session_id: sessionId,
               user_id: session.user.id,
               mistake_text: text,
               corrected_sentence: result.corrected_sentence,
               explanation: result.explanation,
               category: result.categories,
               is_correct: result.is_correct,
               source: source
           }).select().single();

           if (error) throw error;

           // C. Update UI with Success
           setSessionLog(prev => prev.map(item => 
               item.id === tempId ? {
                   ...item,
                   id: savedRecord.id, // Swap Temp ID for Real ID
                   correction: result.corrected_sentence,
                   explanation: result.explanation,
                   categories: result.categories,
                   is_correct: result.is_correct,
                   status: 'done'
               } : item
           ));

      } catch (err) {
           console.error(`Processing Error (Attempt ${retryCount + 1}):`, err);

           // --- AUTO-RETRY LOGIC ---
           if (retryCount < 1) { // Retry once automatically
               console.log("Auto-retrying in 2 seconds...");
               
               // Keep status as 'thinking' so spinner stays
               setTimeout(() => {
                   processAndSave(text, tempId, source, retryCount + 1);
               }, 2000); // 2 second delay
               return;
           }

           // D. Mark as Error in UI (After retries failed)
           setSessionLog(prev => prev.map(item => 
               item.id === tempId ? { ...item, status: 'error' } : item
           ));
      }
   };

   // Handler: Manual Input
   const handleCheckSentence = (sentence) => {
      if (!sentence || !student?.language) return;

      // A. Optimistic Update
      const tempId = Date.now();
      const newEntry = {
            id: tempId,
            original: sentence,
            status: 'thinking'
      };
      
      setSessionLog(prev => [newEntry, ...prev]);

      // B. Trigger Process
      processAndSave(sentence, tempId, 'AI_ManualCheck');
   };

   // Handler: Audio Input
   const onAudioMistakeDetected = useCallback((aiResult) => {
         const saveAudioMistake = async () => {
               const { error } = await supabase.from('mistakes').insert({
                    session_id: sessionId,
                    user_id: session.user.id,
                    mistake_text: aiResult.original_sentence,
                    corrected_sentence: aiResult.corrected_sentence,
                    explanation: aiResult.explanation,
                    category: aiResult.categories,
                    is_correct: aiResult.is_correct,
                    source: 'AI_Audio'
               });
         };
         
         const visualEntry = {
               id: Date.now(),
               original: aiResult.original_sentence,
               correction: aiResult.corrected_sentence,
               explanation: aiResult.explanation,
               categories: aiResult.categories,
               is_correct: aiResult.is_correct,
               status: 'done'
         };
         setSessionLog(prev => [visualEntry, ...prev]);
         saveAudioMistake();

   }, [session, sessionId]);

   // --- 3. Audio Hook ---
   const { isListening, isProcessing, startListening, stopListening } = useAudioRecorder(
      session,
      student?.language,
      onAudioMistakeDetected
   );

   const toggleMicrophone = () => isListening ? stopListening() : startListening();


   // --- 4. Render Helpers ---
   const handleFinishClass = async () => {
      if (!window.confirm("Finish this class?")) return;
      setIsFinishing(true);
      if (isListening) stopListening();
      
      await supabase.from('class_sessions')
         .update({ status: 'pending_review', finished_at: new Date().toISOString() })
         .eq('id', sessionId);
         
      navigate('/pending');
   };

   const copyInviteLink = () => {
      if (!roomUrl) return;
      const url = new URL(roomUrl);
      navigator.clipboard.writeText(`${url.origin}${url.pathname}`);
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
   };

   // --- Render ---
   if (isLoading || !session || !student) {
      return (
         <DashboardLayout>
            <div className="flex h-full items-center justify-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
            </div>
         </DashboardLayout>
      );
   }
   
   const handleRetry = (id, text) => {
      // Manual Retry (resets count to 0)
      setSessionLog(prev => prev.map(item => 
            item.id === id ? { ...item, status: 'thinking' } : item
      ));
      processAndSave(text, id, 'AI_Retry', 0);
   };

   return (
      <DashboardLayout>
         {/* HEADER */}
         <div className="bg-white p-3 rounded-xl shadow-sm mb-4 flex flex-wrap gap-3 items-center justify-between border border-gray-100 sticky top-0 z-20">
            <div className="flex items-center space-x-3">
               <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-2xl border border-indigo-100">
                  {getLanguageFlag(student.language)}
               </div>
               <div>
                  <h1 className="text-lg font-bold text-gray-900 leading-tight">{student.name}</h1>
                  <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Live Session</p>
               </div>
            </div>

            <div className="flex items-center space-x-2">
               <button onClick={copyInviteLink} className={clsx("p-2.5 rounded-full border transition-all", inviteCopied ? 'bg-green-100 text-green-700' : 'bg-white hover:bg-gray-50')}>
                  {inviteCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
               </button>
               
               <button onClick={() => setShowVideo(!showVideo)} className="p-2.5 rounded-full border bg-white hover:bg-gray-50">
                  {showVideo ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
               </button>

               {showVideo && (
                  <button onClick={() => setIsFocusMode(!isFocusMode)} className="p-2.5 rounded-full border bg-white hover:bg-gray-50 hidden md:flex">
                     {isFocusMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </button>
               )}

               <button onClick={toggleMicrophone} className={clsx("relative p-2.5 rounded-full border transition-all", isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-white hover:bg-gray-50')}>
                    {isProcessing && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-spin absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>}
                    {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
               </button>
               
               <div className="h-8 w-px bg-gray-200 mx-1"></div>
               
               <Button onClick={handleFinishClass} disabled={isFinishing} variant="danger" className="px-4">
                  <LogOut className="w-5 h-5 mr-2" /> <span className="hidden sm:inline">Finish</span>
               </Button>
            </div>
         </div>

         {/* GRID */}
         <div className={clsx("grid gap-4 w-full transition-all", isFocusMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3", "h-auto md:h-[calc(100vh-140px)]")}>
            {/* VIDEO */}
            <div className={clsx("bg-black rounded-2xl overflow-hidden shadow-lg relative", showVideo ? (isFocusMode ? "col-span-1 h-[400px] md:h-full" : "lg:col-span-2 h-[300px] md:h-full") : "hidden")}>
                 <WherebyVideo sessionId={sessionId} teacherName={session?.user?.user_metadata?.first_name || 'Teacher'} onRoomUrlChange={setRoomUrl} />
            </div>

            {/* FEED */}
            <div className={clsx("flex flex-col gap-4 overflow-hidden", "col-span-1 h-[600px] md:h-full", !showVideo ? "lg:col-span-3" : "lg:col-span-1", (showVideo && isFocusMode) && "hidden")}>
                 <MistakeAnalyzerForm onCheck={handleCheckSentence} loading={false} />
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                       <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Session Log</h3>
                       <span className="text-xs text-gray-400 font-mono">{sessionLog.length} Events</span>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 p-4 custom-scrollbar">
                       {sessionLog.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                             <Mic className="w-8 h-8 mb-2" />
                             <p className="text-sm">Listening for mistakes...</p>
                          </div>
                       )}
                       {sessionLog.map((item) => (
                          <StudentMistakeCard key={item.id} data={item} onRetry={handleRetry} />
                       ))}
                    </div>
                 </div>
            </div>
         </div>
      </DashboardLayout>
   );
}