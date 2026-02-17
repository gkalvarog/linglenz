// Filename: src/features/students/StudentListItem.jsx
import { Link } from 'react-router-dom';
import { Play, User, Globe, Trash2, Clock, FileText } from 'lucide-react'; 

export function StudentListItem({ student, onStartClass, onDelete, homeworkStatus, reviewStatus }) {
  const studentName = student?.name || 'Unknown Student';
  const studentLang = student?.language || 'English';
  
  return (
    <div className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all duration-200 flex items-center justify-between">
      {/* Left: Identity & Metadata */}
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-bold text-lg">
          {studentName.charAt(0).toUpperCase()}
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-indigo-900 transition-colors">
            {studentName}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <div className="flex items-center space-x-1 mr-2">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-sm text-gray-500 font-medium capitalize">{studentLang}</p>
            </div>

            {/* --- BADGE 1: TEACHER NEEDS TO REVIEW --- */}
            {/* FIX: Link now filters by student ID */}
            {reviewStatus === 'pending' && (
                 <Link to={`/pending?studentId=${student.id}`} className="flex items-center gap-1 bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-200 hover:bg-rose-200 transition-colors">
                    <FileText className="w-3 h-3" /> Needs Review
                 </Link>
            )}

            {/* --- BADGE 2: STUDENT HAS HOMEWORK --- */}
            {homeworkStatus === 'pending' && (
                 <span className="flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">
                    <Clock className="w-3 h-3" /> Homework Sent
                 </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Right: Actions Toolbar */}
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => onDelete(student.id)}
          className="p-2.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
          title="Delete Student"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <Link 
          to={`/student/${student.id}`}
          className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all duration-200"
          title="View Student Profile"
        >
          <User className="w-5 h-5" />
        </Link>
        
        <button 
          onClick={() => onStartClass(student.id)} 
          className="group/btn flex items-center space-x-2 pl-4 pr-3 py-2 bg-green-50 text-green-700 rounded-full hover:bg-green-100 border border-green-100 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 active:scale-95"
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