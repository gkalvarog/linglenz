// Filename: src/features/students/AddStudentModal.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabaseClient';
import { X, Loader2, UserPlus } from 'lucide-react';

/**
 * Modal dialog for creating new student entities.
 * Handles focus trapping and body scroll locking for UX.
 */
export function AddStudentModal({ isOpen, onClose, session, onStudentAdded }) {
  // --- State ---
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('Spanish');
  const [loading, setLoading] = useState(false);
  
  // --- Refs ---
  const nameInputRef = useRef(null);

  // --- Side Effects ---
  // 1. Focus Management & Scroll Locking
  useEffect(() => {
    if (isOpen) {
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      // Focus input after animation frame
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('students')
        .insert({
          name: name.trim(),
          language,
          user_id: session.user.id
        });

      if (error) throw error;

      // Success Path
      setName('');
      onStudentAdded(); // Notify parent to refresh list
      onClose();
      
    } catch (err) {
      console.error("Create Student Error:", err);
      alert("Failed to create student. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Constants ---
  const LANGUAGES = ['Spanish', 'Portuguese', 'French', 'German', 'Italian', 'Japanese', 'Chinese', 'Russian', 'Arabic'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            Add New Student
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Student Name</label>
            <input 
              ref={nameInputRef}
              type="text" 
              required
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              placeholder="e.g. Alejandro Garcia"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Target Language</label>
            <div className="relative">
              <select 
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none appearance-none bg-white transition-all"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
              >
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {/* Custom Arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button 
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {loading ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}