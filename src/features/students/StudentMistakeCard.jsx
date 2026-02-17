// Filename: src/features/students/StudentMistakeCard.jsx
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react'; 
import clsx from 'clsx';

export function StudentMistakeCard({ data, onRetry }) {
  
  // 1. THINKING STATE (Fixed Colors)
  if (data.status === 'thinking') {
    return (
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 animate-pulse flex items-start gap-3">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin mt-0.5" />
        <div>
          <p className="text-sm text-gray-400 font-medium italic">"{data.original}"</p>
          <p className="text-xs text-gray-500 mt-1 font-semibold uppercase tracking-wider">Analyzing...</p>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE (With Retry)
  if (data.status === 'error') {
    return (
      <div className="p-4 rounded-xl border border-red-100 bg-red-50 flex items-start gap-3 group">
        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-gray-600 line-through decoration-red-300">"{data.original}"</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-red-500 font-bold">Analysis Failed.</span>
            <button 
                onClick={() => onRetry && onRetry(data.id, data.original)}
                className="flex items-center gap-1 text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors shadow-sm cursor-pointer"
            >
                <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. DONE STATE
  const isCorrect = data.is_correct; 

  return (
    <div className={clsx(
      "p-4 rounded-xl border transition-all duration-300",
      isCorrect ? "bg-green-50 border-green-100" : "bg-white border-gray-200 hover:border-indigo-200"
    )}>
      <div className="flex items-start gap-3 mb-2">
        {isCorrect ? (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
        ) : (
          <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-xs font-bold text-red-600">X</span>
          </div>
        )}
        <p className={clsx(
          "text-sm font-medium",
          isCorrect ? "text-green-900" : "text-red-600 line-through decoration-red-300/50"
        )}>{data.original}</p>
      </div>

      {!isCorrect && (
        <div className="pl-8 space-y-2">
          <div className="text-sm font-bold text-green-700 bg-green-50/50 p-2 rounded-lg inline-block">
            {data.correction}
          </div>
          {data.explanation && (
            <p className="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2">{data.explanation}</p>
          )}
        </div>
      )}
      
       {/* Categories */}
       {data.categories && data.categories.length > 0 && (
          <div className="pl-8 mt-2 flex flex-wrap gap-1">
            {data.categories.map((cat, i) => (
              <span key={i} className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] text-gray-500">
                {cat}
              </span>
            ))}
          </div>
       )}
    </div>
  );
}