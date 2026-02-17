// Filename: src/features/students/MistakeAnalyzerForm.jsx
import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export function MistakeAnalyzerForm({ onCheck, loading }) {
  const [input, setInput] = useState('');
  // 1. Create a reference to the input box
  const inputRef = useRef(null);

  // 2. Focus automatically when the page loads
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    onCheck(input);
    setInput('');
    
    // 3. FORCE the cursor back into the box after sending
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const hasContent = input.trim().length > 0;

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 shrink-0 transition-shadow duration-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          AI Analysis
        </label>
        {loading && <span className="text-xs text-indigo-600 animate-pulse font-medium">Processing...</span>}
      </div>
      
      <div className="relative group">
        <input
          ref={inputRef} // Connect the reference here
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a student's mistake here..."
          className={clsx(
            "w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400",
            "focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all duration-200",
            loading && "opacity-50 cursor-not-allowed"
          )}
          disabled={loading}
          autoComplete="off"
        />
        
        <button
          type="submit"
          disabled={loading || !hasContent}
          className={clsx(
            "absolute right-2 top-2 p-2 rounded-lg transition-all duration-200",
            hasContent && !loading
              ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:scale-105"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 fill-current" />}
        </button>
      </div>
    </form>
  );
}