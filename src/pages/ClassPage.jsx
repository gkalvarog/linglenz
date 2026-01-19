// Filename: src/pages/ClassPage.jsx
import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../api/supabaseClient';
import { checkStudentSentence } from '../api/geminiClient';
import { useSession } from '../context/SessionContext';
import { useAudioRecorder } from '../features/students/useAudioRecorder';
import { getLanguageFlag } from '../utils/flags';

// UI Components
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { MistakeAnalyzerForm } from '../features/students/MistakeAnalyzerForm';
import { CorrectionDisplay } from '../features/students/CorrectionDisplay';
import { WherebyVideo } from '../features/students/WherebyVideo';
import { Button } from '../components/ui/Button';

// Icons & Utils
import { Mic, Square, Copy, Check, LogOut, Maximize2, Minimize2, Video, VideoOff } from 'lucide-react';
import clsx from 'clsx';

export function ClassPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { setActiveSession } = useSession();

  // --- Global State & Refs ---
  const [session, setSession] = useState(null);
  const [student, setStudent] = useState(null);
  const [roomUrl, setRoomUrl] = useState(null);
  
  // --- UI State Flags ---
  const [isLoading, setIsLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  
  // --- View Mode State ---
  const [showVideo, setShowVideo] = useState(true);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // --- Data State ---
  const [sessionLog, setSessionLog] = useState([]);

  // --- Data Persistance Helper ---
  const handleAddMistake = async (aiResult, source) => {
    if (!session?.user?.id) {
      console.error("Critical: Attempted to save mistake without authenticated user.");
      return;
    }

    try {
      const newMistake = {
        session_id: sessionId,
        user_id: session.user.id,
        mistake_text: aiResult.original_sentence,
        corrected_sentence: aiResult.corrected_sentence,
        explanation: aiResult.explanation,
        category: aiResult.categories, // Array[Text]
        source: source // 'AI_Audio' | 'AI_ManualCheck'
      };
      
      const { error } = await supabase.from('mistakes').insert(newMistake);
      if (error) throw error;
      
    } catch (err) {
      console.error("Database Write Error (Mistakes):", err.message);
      // In a production app, we would push this to a toast notification
    }
  };

  // --- AI & Audio Handlers ---
  const onMistakeDetected = useCallback((aiResult) => {
    // Add to local visual log immediately for UX responsiveness
    setSessionLog(prevLog => [aiResult, ...prevLog]);
    // Persist to DB in background
    handleAddMistake(aiResult, 'AI_Audio');
  }, [session, sessionId]); // Dependencies ensure we access fresh state

  // Initialize the custom hook with the callback
  const { isListening, isProcessing, startListening, stopListening } = useAudioRecorder(
    session,
    student?.language,
    onMistakeDetected
  );

  const toggleMicrophone = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // --- Manual Text Check Handler ---
  const handleCheckSentence = async (sentence) => {
    if (!sentence || !student?.language) return;

    setIsChecking(true);
    try {
      // 1. Call AI Service
      const aiResult = await checkStudentSentence(sentence, student.language);
      
      // 2. Hydrate result with original text for display
      const resultWithOriginal = { 
        ...aiResult, 
        original_sentence: sentence 
      };

      // 3. Update UI
      setSessionLog(prev => [resultWithOriginal, ...prev]);

      // 4. Save if it was actually a mistake (or if we want to log everything)
      if (aiResult && !aiResult.is_correct) {
        await handleAddMistake(resultWithOriginal, 'AI_ManualCheck');
      }
    } catch (error) {
      console.error("Manual Check Error:", error);
      alert("Failed to check sentence. Please try again.");
    } finally {
      setIsChecking(false);
    }
  };

  // --- Lifecycle: Session Initialization ---
  const fetchSessionData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Get User Auth
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        navigate('/'); // Security redirect
        return;
      }
      setSession(authSession);

      // 2. Get Class/Student Data
      const { data: classData, error } = await supabase
        .from('class_sessions')
        .select(`
          id, 
          student_id, 
          students ( 
            name, 
            language 
          )
        `)
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      // 3. Update Local & Context State
      setStudent(classData.students);
      setActiveSession({ 
        id: sessionId, 
        name: classData.students.name 
      });

    } catch (error) {
      console.error("Initialization Error:", error);
      alert("Could not load class session. It may have been deleted.");
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, navigate, setActiveSession]);

  useEffect(() => {
    fetchSessionData();
    // Cleanup: Remove active session from global context when leaving page
    return () => setActiveSession(null);
  }, [fetchSessionData, setActiveSession]);


  // --- Action: Finish Class ---
  const handleFinishClass = async () => {
    // Double confirmation is standard for destructive/irreversible actions
    if (!window.confirm("Are you sure you want to finish this class? This will archive the session.")) {
      return;
    }

    setIsFinishing(true);
    
    // Ensure we release hardware resources before navigating
    if (isListening) {
      stopListening();
    }
    
    try {
      const { error } = await supabase
        .from('class_sessions')
        .update({ 
          status: 'pending_review', 
          finished_at: new Date().toISOString() 
        })
        .eq('id', sessionId);
        
      if (error) throw error;
      
      navigate('/pending');
    } catch (error) {
      console.error("Teardown Error:", error);
      alert("Failed to finish class. Please check your connection.");
      setIsFinishing(false);
    }
  };

  // --- Utility: Invite Link ---
  const copyInviteLink = () => {
    if (!roomUrl) return;
    try {
      // Privacy: Strip PII from URL before sharing
      const url = new URL(roomUrl);
      const cleanUrl = `${url.origin}${url.pathname}`; 
      navigator.clipboard.writeText(cleanUrl);
      
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    } catch (e) {
      console.error("Clipboard Error:", e);
    }
  };

  // --- Render ---
  if (isLoading || !session || !student) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-700"></div>
          <span className="ml-3 text-gray-600 font-medium">Loading Classroom Environment...</span>
        </div>
      </DashboardLayout>
    );
  }

  const teacherName = session?.user?.user_metadata?.first_name || 'Teacher';

  return (
    <DashboardLayout>
      {/* HEADER TOOLBAR */}
      <div className="bg-white p-3 rounded-xl shadow-sm mb-4 flex flex-wrap gap-3 items-center justify-between border border-gray-100 sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-2xl border border-indigo-100 shadow-sm">
            {getLanguageFlag(student.language)}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{student.name}</h1>
            <p className="text-xs text-indigo-600 font-medium uppercase tracking-wide">Live Session</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={copyInviteLink} 
            className={clsx(
              "p-2.5 rounded-full border transition-all duration-200",
              inviteCopied ? 'bg-green-100 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-indigo-200'
            )}
            title="Copy Student Invite Link"
          >
            {inviteCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-1"></div>

          <button 
            onClick={() => setShowVideo(!showVideo)} 
            className="p-2.5 rounded-full border bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-colors"
            title={showVideo ? "Hide Video" : "Show Video"}
          >
            {showVideo ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {showVideo && (
            <button 
              onClick={() => setIsFocusMode(!isFocusMode)} 
              className="p-2.5 rounded-full border bg-white border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 hidden md:flex transition-colors"
              title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
            >
              {isFocusMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          )}

          <button 
            onClick={toggleMicrophone} 
            className={clsx(
              "relative p-2.5 rounded-full border transition-all duration-300",
              isListening 
                ? 'bg-red-600 border-red-700 text-white shadow-md animate-pulse' 
                : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
            title={isListening ? "Stop AI Listening" : "Start AI Listening"}
          >
            {isProcessing && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-spin absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
            )}
            {isListening ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          
          <Button 
            onClick={handleFinishClass} 
            disabled={isFinishing} 
            variant="danger"
            className="px-4 shadow-sm"
          >
            <LogOut className="w-5 h-5 mr-2" />
            <span className="hidden sm:inline">Finish</span>
          </Button>
        </div>
      </div>

      {/* MAIN GRID LAYOUT */}
      <div className={clsx(
        "grid gap-4 w-full transition-all duration-500 ease-in-out",
        "h-auto md:h-[calc(100vh-140px)]", // Fixed height on desktop for scrolling logs
        isFocusMode ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-3"
      )}>
        {/* VIDEO CONTAINER */}
        <div className={clsx(
          "bg-black rounded-2xl overflow-hidden shadow-lg relative transition-all duration-500",
          showVideo 
            ? (isFocusMode ? "col-span-1 h-[400px] md:h-full" : "lg:col-span-2 h-[300px] md:h-full") 
            : "hidden"
        )}>
           <WherebyVideo 
             sessionId={sessionId} 
             teacherName={teacherName} 
             onRoomUrlChange={setRoomUrl} 
           />
        </div>

        {/* INTERACTION PANEL (Tools & Logs) */}
        <div className={clsx(
          "flex flex-col gap-4 overflow-hidden transition-all duration-500",
          "col-span-1 h-[600px] md:h-full",
          !showVideo ? "lg:col-span-3" : "lg:col-span-1",
          (showVideo && isFocusMode) && "hidden"
        )}>
          {/* Manual Input */}
          <MistakeAnalyzerForm onCheck={handleCheckSentence} loading={isChecking} />
          
          {/* Live Log Stream */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">Session Log</h3>
              <span className="text-xs text-gray-400 font-mono">{sessionLog.length} Events</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 p-4 scroll-smooth">
              {sessionLog.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                  <Mic className="w-8 h-8 mb-2" />
                  <p className="text-sm">Listening for mistakes...</p>
                </div>
              )}
              
              {sessionLog.map((result, index) => (
                <div 
                  key={index} 
                  className={clsx(
                    "p-3 rounded-lg text-sm border transition-all duration-300 hover:shadow-md",
                    result.is_correct 
                      ? 'bg-green-50/50 border-green-100' 
                      : 'bg-red-50/50 border-red-100'
                  )}
                >
                  <div className="flex items-start space-x-3 mb-2">
                    <span className="text-xl mt-0.5 select-none" role="img" aria-label="Status">
                      {result.is_correct ? '✅' : '❌'}
                    </span>
                    <div className="flex-1 min-w-0">
                      {result.is_correct ? (
                        <p className="font-semibold text-gray-800 text-base">{result.original_sentence}</p>
                      ) : (
                        <CorrectionDisplay 
                          original={result.original_sentence} 
                          corrected={result.corrected_sentence} 
                        />
                      )}
                    </div>
                  </div>
                  
                  {result.explanation && (
                    <div className="pl-8 mt-1 border-l-2 border-gray-200 ml-1">
                       <p className="text-gray-600 text-xs italic leading-relaxed">
                         {result.explanation}
                       </p>
                    </div>
                  )}
                  
                  {/* Category Tags */}
                  {result.categories && result.categories.length > 0 && (
                    <div className="mt-2 pl-8 flex flex-wrap gap-1">
                      {result.categories.map((cat, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-500 font-medium">
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}