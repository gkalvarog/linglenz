// Filename: src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './api/supabaseClient';
import { SessionProvider } from './context/SessionContext';

// Pages
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClassPage } from './pages/ClassPage';
import { PendingReviewPage } from './pages/PendingReviewPage';
import { SettingsPage } from './pages/SettingsPage';
import { HomeworkPage } from './pages/HomeworkPage';

// Components
import { Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Session Check
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
      } catch (error) {
        console.error("Auth Initialization Error:", error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initializeAuth();

    // 2. Real-time Subscription to Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setIsAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  // --- Loading State ---
  // Blocks the entire UI until we know who the user is.
  if (isAuthLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-50 text-indigo-900">
        <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-600" />
        <p className="text-sm font-medium tracking-wide animate-pulse">Initializing Ling Lenz...</p>
      </div>
    );
  }

  return (
    <SessionProvider>
      <Router>
        <Routes>
          {!session ? (
            // --- Unauthenticated Routes ---
            <>
              <Route path="/auth" element={<AuthPage />} />
              {/* Catch-all: Redirect to Auth */}
              <Route path="*" element={<Navigate to="/auth" replace />} />
            </>
          ) : (
            // --- Authenticated Routes ---
            <>
              <Route path="/" element={<DashboardPage session={session} />} />
              {/* Domain: Classroom */}
              <Route path="/class/session/:sessionId" element={<ClassPage />} />
              {/* Domain: Review & Utils */}
              <Route path="/pending" element={<PendingReviewPage session={session} />} />
              <Route path="/homework" element={<HomeworkPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              {/* Catch-all: Redirect to Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </Router>
    </SessionProvider>
  );
}