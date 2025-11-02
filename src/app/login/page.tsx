'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth, User, AuthClaims } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';

export default function LoginPage() {
  const { login } = useAuth();

  const handleLogin = (role: 'admin' | 'student' | 'teacher') => {
    let user: User;
    let claims: AuthClaims;

    switch (role) {
      case 'admin':
        user = {
          id: 'admin1',
          name: 'Dr. Evelyn Reed',
          email: 'admin@campus.com',
          role: 'admin',
        };
        claims = { role: 'admin' };
        break;
      case 'teacher':
        user = {
          id: 'teacher1',
          name: 'Mr. Davison',
          email: 'teacher.davison@campus.com',
          role: 'teacher',
        };
        claims = { role: 'teacher' };
        break;
      case 'student':
      default:
        user = {
          id: 'student1',
          name: 'Alex Johnson',
          email: 'student@campus.com',
          role: 'student',
          className: '10',
          sectionName: 'A'
        };
        claims = { role: 'student' };
        break;
    }
    login(user, claims);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Icons.logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">CampusConnect</CardTitle>
          <CardDescription>Select a role to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button className="w-full" onClick={() => handleLogin('admin')}>
            Login as Admin
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => handleLogin('teacher')}>
            Login as Teacher
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleLogin('student')}>
            Login as Student
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
