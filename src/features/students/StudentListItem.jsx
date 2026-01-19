// Filename: src/features/students/StudentListItem.jsx
import { Link } from 'react-router-dom';
import { Play, User, Globe } from 'lucide-react';

/**
 * Renders a single student row in the dashboard list.
 * * @param {Object} props
 * @param {Object} props.student - The student entity from Supabase.
 * @param {Function} props.onStartClass - Callback to initiate a session.
 */
export function StudentListItem({ student, onStartClass }) {
  // Defensive coding: Ensure we don't crash if student data is partial
  const studentName = student?.name || 'Unknown Student';
  const studentLang = student?.language || 'English';
  
  return (
    <div 
      className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex items-center justify-between"
      role="article"
      aria-label={`Student card for ${studentName}`}
    >
      {/* Left: Identity & Metadata */}
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-bold text-lg">
          {studentName.charAt(0).toUpperCase()}
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-indigo-900 transition-colors">
            {studentName}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <Globe className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-sm text-gray-500 font-medium">{studentLang}</p>
          </div>
        </div>
      </div>
      
      {/* Right: Actions Toolbar */}
      <div className="flex items-center space-x-3">
        {/* Secondary Action: View Profile */}
        <Link 
          to={`/student/${student.id}`}
          className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
          title="View Student Profile"
          aria-label="View Profile"
        >
          <User className="w-5 h-5" />
        </Link>
        
        {/* Primary Action: Start Class */}
        <button 
          onClick={() => onStartClass(student.id)} 
          className="group/btn flex items-center space-x-2 pl-4 pr-3 py-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 border border-green-100 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 active:scale-95"
          title="Start Live Class"
          aria-label="Start Class"
        >
          <span className="text-sm font-bold tracking-wide">Start</span>
          <div className="bg-green-200 rounded-full p-1 group-hover/btn:bg-green-300 transition-colors">
             <Play className="w-3.5 h-3.5 fill-current text-green-800" />
          </div>
        </button>
      </div>
    </div>
  );
}