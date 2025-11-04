'use client';
import { useAuth } from '@/hooks/use-auth';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import StudentDashboard from '@/components/dashboard/student-dashboard';

export default function DashboardPage() {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome...</h1>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
        <Card><CardContent className="p-6 h-[400px]">Loading...</CardContent></Card>
      </div>
    )
  }
  
  return (
    <>
      {user?.role === 'admin' || user?.role === 'teacher' ? <AdminDashboard /> : <StudentDashboard />}
    </>
  );
}
