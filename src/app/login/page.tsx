'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, type User } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';

const mockUsers: Record<string, User> = {
  'admin@campus.com': { id: 'adm123', name: 'Dr. Evelyn Reed', email: 'admin@campus.com', role: 'admin' },
  'student@campus.com': { id: 'stu456', name: 'Alex Johnson', email: 'student@campus.com', role: 'student' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    if (password !== 'password') {
        setError('Invalid credentials.');
        return;
    }
    const user = mockUsers[email];
    if (user) {
      setError('');
      login(user);
    } else {
      setError('Invalid credentials.');
    }
  };

  const handleQuickLogin = (role: 'admin' | 'student') => {
    const user = role === 'admin' ? mockUsers['admin@campus.com'] : mockUsers['student@campus.com'];
    login(user);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Icons.logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">CampusConnect</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input 
              id="password" 
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button className="w-full" onClick={handleLogin}>
            Sign In
          </Button>
          <div className="text-center text-sm text-muted-foreground">
              Or quick login as... (pw: password)
          </div>
          <div className="flex w-full gap-2">
            <Button variant="secondary" className="w-full" onClick={() => handleQuickLogin('student')}>
              Student
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleQuickLogin('admin')}>
              Teacher
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
