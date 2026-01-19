// Filename: src/context/SessionContext.jsx
import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { supabase } from '../api/supabaseClient';

const SessionContext = createContext({
  activeSession: null,
  setActiveSession: () => console.warn("SessionProvider not initialized")
});

export function SessionProvider({ children }) {
  const [activeSession, setActiveSession] = useState(null);
  const [isReady, setIsReady] = useState(false); // Linter: We will now USE this variable

  useEffect(() => {
    let isMounted = true;

    const hydrateSessionState = async () => {
      try {
        // 1. Get the authenticated user
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (!authSession?.user) {
          if (isMounted) setIsReady(true);
          return;
        }

        // 2. Check for ANY 'in_progress' class for this user
        const { data, error } = await supabase
          .from('class_sessions')
          .select('id, students(name)') // Simplified query syntax
          .eq('user_id', authSession.user.id)
          .eq('status', 'in_progress')
          .maybeSingle();

        if (error) {
          console.error("SessionContext Hydration Error:", error.message);
        }

        if (isMounted && data) {
          setActiveSession({ 
            id: data.id, 
            name: data.students?.name || 'Unknown Student' 
          });
        }
      } catch (err) {
        console.error("Critical Session Context Failure:", err);
      } finally {
        if (isMounted) setIsReady(true);
      }
    };

    hydrateSessionState();

    return () => { isMounted = false; };
  }, []);

  const contextValue = useMemo(() => ({
    activeSession,
    setActiveSession
  }), [activeSession]);

  // FIX: This uses the 'isReady' variable. 
  // It prevents the app from loading until we have checked for active sessions.
  if (!isReady) {
    return null; // Or return <div className="h-screen bg-gray-50" /> for a blank slate
  }

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}