'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth, User, AuthClaims } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { User as UserIcon, Shield } from 'lucide-react';
import Image from 'next/image';

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
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background">
        <div className="absolute inset-0 bg-[url(/grid.svg)] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="relative flex flex-col items-center justify-center">
            <Card className="w-full max-w-md shadow-2xl">
                <CardHeader className="text-center items-center">
                <div className="mx-auto mb-4 bg-background p-3 rounded-full border">
                    <Image src="https://www.mpbfoundationhsschool.com/images/logo.png" alt="School Logo" width={60} height={60} />
                </div>
                <CardTitle className="text-3xl font-bold">M.P. Birla Foundation</CardTitle>
                <CardDescription>H.S. School Student Portal</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 p-6">
                <Button size="lg" className="w-full" onClick={() => handleLogin('student')}>
                    <UserIcon className="mr-2 h-5 w-5" />
                    Login as Student
                </Button>
                <Button size="lg" variant="secondary" className="w-full" onClick={() => handleLogin('teacher')}>
                    Login as Teacher
                </Button>
                </CardContent>
                <CardFooter className="p-6 pt-0">
                    <Button variant="ghost" className="w-full" onClick={() => handleLogin('admin')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Administrator Access
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
