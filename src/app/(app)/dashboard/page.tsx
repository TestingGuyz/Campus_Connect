'use client';
import { useAuth } from '@/hooks/use-auth';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import StudentDashboard from '@/components/dashboard/student-dashboard';

export default function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <>
      {user?.role === 'admin' ? <AdminDashboard /> : <StudentDashboard />}
    </>
  );
}
