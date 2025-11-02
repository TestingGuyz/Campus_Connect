'use client';

import { createContext, useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';
import { useUser as useFirebaseUser } from '@/firebase'; // Import the firebase user hook

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'teacher';
  className?: string;
  sectionName?: string;
};

export type AuthContextType = {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

function LoadingScreen() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 95) {
                    clearInterval(timer);
                    return 95;
                }
                return prev + Math.random() * 20;
            });
        }, 200);

        return () => clearInterval(timer);
    }, []);

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
          <div className="mb-8 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-50">
            <Image 
                src="https://www.mpbfoundationhsschool.com/images/logo.png" 
                alt="M.P. Birla Foundation H.S. School Logo"
                width={150}
                height={150}
                unoptimized
                priority
            />
          </div>
          <div className="w-full max-w-xs">
            <Progress value={progress} className="h-2" />
          </div>
      </div>
    );
}


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const { isUserLoading: isFirebaseUserLoading } = useFirebaseUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('campus-connect-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
      localStorage.removeItem('campus-connect-user');
    } finally {
      setIsAppLoading(false);
    }
  }, []);

  const isLoading = isAppLoading || isFirebaseUserLoading;

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
    if (!isLoading && user && pathname === '/login') {
      router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router]);


  const login = (newUser: User) => {
    localStorage.setItem('campus-connect-user', JSON.stringify(newUser));
    setUser(newUser);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('campus-connect-user');
    setUser(null);
    router.push('/login');
  };
  
  if (isLoading && pathname !== '/login') {
    return <LoadingScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
