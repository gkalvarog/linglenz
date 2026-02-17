import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Button } from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export function StudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <Button variant="secondary" onClick={() => navigate(-1)} className="mb-6" icon={ArrowLeft}>
        Back to Dashboard
      </Button>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold mb-2">Student Profile</h1>
        <p className="text-gray-500">Student ID: {id}</p>
        <div className="mt-8 p-4 bg-yellow-50 text-yellow-800 rounded-lg">
          🚧 Detailed profile statistics and history coming in v1.2
        </div>
      </div>
    </DashboardLayout>
  );
}