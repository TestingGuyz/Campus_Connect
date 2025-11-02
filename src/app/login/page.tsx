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
import { useAuth } from '@/hooks/use-auth';
import { Icons } from '@/components/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDocs, query, collection, where, limit, doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { login, user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [role, setRole] = useState<'student' | 'teacher' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [error, setError] = useState('');


  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    if (!firestore) {
      setError('Database connection is not available.');
      setIsLoading(false);
      return;
    }

    try {
      let userQuery;
      if (role === 'student') {
        if(!name || !className || !section) {
            setError('Please fill in all fields for student login.');
            setIsLoading(false);
            return;
        }
        const studentsCollection = collection(firestore, `classes/${className}/sections/${section}/students`);
        userQuery = query(studentsCollection, where("name", "==", name), limit(1));
      } else if (role === 'teacher') {
         if(!name || !email) {
            setError('Please fill in all fields for teacher login.');
            setIsLoading(false);
            return;
        }
        userQuery = query(collection(firestore, "teachers"), where("name", "==", name), where("email", "==", email), limit(1));
      } else { // admin
         if(!name || !email) {
            setError('Please fill in all fields for admin login.');
            setIsLoading(false);
            return;
        }
        userQuery = query(collection(firestore, "admins"), where("name", "==", name), where("email", "==", email), limit(1));
      }

      const querySnapshot = await getDocs(userQuery);

      if (querySnapshot.empty) {
        setError("Invalid credentials or user not found.");
        setIsLoading(false);
        return;
      }

      const foundUser = querySnapshot.docs[0];
      const userData = foundUser.data();
      const userId = foundUser.id;
      
      // Associate email and password if not already present
      if (!userData.email || !userData.password) {
        let userDocRef;
        if (role === 'student') {
            userDocRef = doc(firestore, `classes/${className}/sections/${section}/students`, userId);
        } else if (role === 'teacher') {
            userDocRef = doc(firestore, 'teachers', userId);
        } else { // admin
            userDocRef = doc(firestore, 'admins', userId);
        }
        await updateDoc(userDocRef, { email, password });
      } else {
        if(userData.email !== email || userData.password !== password) {
            setError("Invalid email or password.");
            setIsLoading(false);
            return;
        }
      }

      // Mock login for now
      login({ id: userId, name: userData.name, email: email, role });
      router.push('/dashboard');

    } catch (e) {
      console.error(e);
      setError("An error occurred during login. Please try again.");
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Could not connect to the database or an unexpected error occurred."
      })
    } finally {
        setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'student') => {
     const mockUsers: Record<string, any> = {
      'admin': { id: 'adm123', name: 'Dr. Evelyn Reed', email: 'admin@campus.com', role: 'admin' },
      'student': { id: 'stu456', name: 'Alex Johnson', email: 'student@campus.com', role: 'student' },
    };
    login(mockUsers[role]);
    router.push('/dashboard');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Icons.logo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">CampusConnect</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Select onValueChange={(value) => setRole(value as any)} defaultValue="student">
                <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
            </Select>

            <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                id="name"
                placeholder="e.g., John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                />
            </div>
            
            {role === 'student' && (
                <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="class">Class</Label>
                        <Input
                        id="class"
                        placeholder="e.g., 10"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="section">Section</Label>
                        <Input
                        id="section"
                        placeholder="e.g., A"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        required
                        />
                    </div>
                </div>
                </>
            )}

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
          <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </Button>
           <div className="text-center text-sm text-muted-foreground">
              Or quick login as...
          </div>
          <div className="flex w-full gap-2">
            <Button variant="secondary" className="w-full" onClick={() => handleQuickLogin('student')}>
              Student (Demo)
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleQuickLogin('admin')}>
              Admin (Demo)
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
