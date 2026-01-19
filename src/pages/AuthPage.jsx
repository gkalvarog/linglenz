// Filename: src/pages/AuthPage.jsx
import { useState } from 'react';
import { supabase } from '../api/supabaseClient';
import { Aperture, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

export function AuthPage() {
  // --- State Machine ---
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // --- Form Data ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- Handlers ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        if (error) throw error;
        
        setSuccessMessage("Account created! You can now sign in.");
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ 
          email, 
          password 
        });
        if (error) throw error;
        // Navigation is handled by the App's session listener automatically
      }
    } catch (err) {
      // Clean up Supabase error messages for humans
      let msg = err.message;
      if (msg.includes("Invalid login")) msg = "Incorrect email or password.";
      setFormError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-t-4 border-indigo-700 transition-all duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-black p-3.5 rounded-full border-2 border-indigo-600 shadow-lg mb-4">
            <Aperture className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Ling Lenz</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'signup' ? "Create your instructor account" : "Log in to your workspace"}
          </p>
        </div>
        
        {/* Error / Success Feedback */}
        {formError && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-start space-x-3 text-sm text-red-800 animate-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{formError}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-100 flex items-start space-x-3 text-sm text-green-800 animate-in slide-in-from-top-2">
            <div className="w-5 h-5 shrink-0 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">✓</div>
            <span>{successMessage}</span>
          </div>
        )}
        
        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              autoComplete="email"
              required
              disabled={isLoading}
              className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@linglenz.com"
            />
          </div>
          
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="password">Password</label>
            <div className="relative">
              <input 
                id="password"
                type={showPassword ? "text" : "password"} 
                autoComplete={mode === 'login' ? "current-password" : "new-password"}
                required
                disabled={isLoading}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none pr-10 transition-all disabled:opacity-50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-indigo-700 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center shadow-sm"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (mode === 'signup' ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-xs font-medium uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Social Login */}
        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center space-x-3 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.46 1.4 1.77 2.42 3.32 2.42z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Google</span>
        </button>

        {/* Mode Toggle */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            {mode === 'signup' ? "Already have an account?" : "Don't have an account?"}
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setFormError(null);
                setSuccessMessage(null);
              }}
              className="ml-1.5 text-indigo-700 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 rounded"
            >
              {mode === 'signup' ? "Log In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}