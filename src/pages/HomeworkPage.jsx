// Filename: src/pages/HomeworkPage.jsx
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Sparkles, Construction } from 'lucide-react';

/**
 * Placeholder for the Homework Generation module.
 * Future Scope: List of generated PDFs, email status tracking.
 */
export function HomeworkPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-indigo-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            AI Homework Generator
          </h1>
          
          <p className="text-gray-500 text-lg max-w-md mx-auto mb-8 leading-relaxed">
            We are putting the finishing touches on the automated homework engine. 
            Soon, you will be able to generate personalized exercises for your students based on their class mistakes.
          </p>

          <div className="inline-flex items-center px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600">
            <Construction className="w-4 h-4 mr-2" />
            <span>Coming in v2.0</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}